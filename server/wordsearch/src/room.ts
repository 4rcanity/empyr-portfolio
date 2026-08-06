import { DurableObject } from 'cloudflare:workers';
import { buildGrid, readTrace, reverse, type Placed } from './grid';
import {
  DEFAULT_RULES,
  claimScore,
  clampRules,
  type FxKind,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type PlayerView,
  type RoomView,
  type Rules,
  type WordView,
} from './protocol';

interface Seat {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  score: number;
  round: number;
  found: number;
}

interface Word extends Placed {
  by: string | null;
  points: number;
  /** The trace that won it — may run either way along the placement. */
  claimPath: number[] | null;
}

export interface Env {
  WORDSEARCH_ROOM: DurableObjectNamespace<WordsearchRoom>;
}

const GRACE_MS = 60_000;
/** Seconds of results screen before the next grid drops. */
const INTERMISSION_MS = 8_000;
/**
 * How many rounds in a row the clock may run out with nobody finding a single
 * word before the room gives up. Without this an abandoned room re-arms its
 * alarm on a loop forever and the Durable Object never sleeps.
 */
const IDLE_LIMIT = 2;

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class WordsearchRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];

  private cells = '';
  private words: Word[] = [];
  private seed = 0;
  private round = 0;
  private roundTotalMs = 0;
  private roundEndsAt: number | null = null;
  private nextAt: number | null = null;
  /** Clock left on the shelf while the room is empty. */
  private parkedRoundMs: number | null = null;
  private parkedNextMs: number | null = null;

  /** Consecutive rounds the clock resolved with nothing found at all. */
  private idleRounds = 0;
  private winnerId: string | null = null;
  private log: LogLine[] = [];
  private logSeq = 0;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (code) this.code = code;

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    if (this.sockets.size >= MAX_SOCKETS_PER_ROOM) {
      return new Response('Room is at capacity', { status: 429 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.sockets.set(server, null);

    server.addEventListener('message', (event: MessageEvent) => this.receive(server, event.data));
    const drop = () => this.disconnect(server);
    server.addEventListener('close', drop);
    server.addEventListener('error', drop);

    this.push(server, { t: 'sync', room: this.view(), youId: '' });
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    if (this.phase === 'lobby') {
      this.sweep();
      return;
    }

    if (this.phase === 'roundOver') {
      if (!this.nextAt) return;
      if (Date.now() < this.nextAt - 400) {
        await this.ctx.storage.setAlarm(this.nextAt);
        return;
      }
      // Never roll a new grid for a room nobody is looking at.
      if (!this.anyoneOnline()) {
        this.park();
        return;
      }
      this.advance();
      this.broadcast();
      return;
    }

    if (this.phase !== 'play' || !this.roundEndsAt) return;
    if (Date.now() < this.roundEndsAt - 400) {
      await this.ctx.storage.setAlarm(this.roundEndsAt);
      return;
    }
    if (!this.anyoneOnline()) {
      this.park();
      return;
    }

    // A round the clock had to end with nobody finding anything is a room that
    // has been walked away from. A couple of those and we let it die.
    if (this.words.every((word) => !word.by)) {
      if (++this.idleRounds > IDLE_LIMIT) {
        this.stopRound();
        // The reset wipes the feed, so the notice has to be written after it.
        this.note('abandoned', 'bad');
        this.broadcast();
        return;
      }
    } else {
      this.idleRounds = 0;
    }

    this.note('timeUp', 'bad');
    this.closeRound();
    this.broadcast();
  }

  // ---------------------------------------------------------------- messaging

  private receive(socket: WebSocket, raw: unknown) {
    if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_CHARS) return;
    let msg: Inbound;
    try {
      msg = JSON.parse(raw) as Inbound;
    } catch {
      return;
    }
    try {
      this.route(socket, msg);
    } catch (error) {
      this.push(socket, {
        t: 'nope',
        msg: error instanceof Error ? error.message : 'That did not land',
      });
    }
  }

  private route(socket: WebSocket, msg: Inbound) {
    if (msg.t === 'hello') {
      this.join(socket, msg.key, msg.name);
      return;
    }
    const seat = this.seatOf(socket);
    switch (msg.t) {
      case 'rules':
        this.setRules(seat, msg.patch);
        break;
      case 'ready':
        this.setReady(seat, msg.on);
        break;
      case 'begin':
        this.begin(seat);
        break;
      case 'claim':
        this.claim(socket, seat, msg.r1, msg.c1, msg.r2, msg.c2);
        break;
      case 'next':
        this.skipIntermission(seat);
        break;
      case 'again':
        this.resetToLobby(seat);
        break;
    }
  }

  private join(socket: WebSocket, keyRaw: string, nameRaw: string) {
    const key = String(keyRaw ?? '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 64);
    if (!key) throw new Error('Missing player id');
    const name = String(nameRaw ?? '').trim().slice(0, 14) || `Player ${this.seats.size + 1}`;

    // One live socket per identity — a refresh must not leave a ghost behind.
    for (const [other, seatId] of this.sockets) {
      if (other !== socket && seatId === key) this.sockets.set(other, null);
    }

    const existing = this.seats.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      this.idleRounds = 0;
      // The clocks are parked while the room is empty — wind them back up.
      this.resume();
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    if (this.phase !== 'lobby') throw new Error('Round already running — wait for the next lobby');
    if (this.seats.size >= this.rules.capacity) throw new Error('Room is full');

    this.seats.set(key, {
      id: key,
      name,
      seat: this.seats.size,
      host: this.seats.size === 0 || !this.hasHost(),
      ready: false,
      online: true,
      score: 0,
      round: 0,
      found: 0,
    });
    this.sockets.set(socket, key);
    this.note('seated', 'good', { a: name });
    this.broadcast();
  }

  private disconnect(socket: WebSocket) {
    const seatId = this.sockets.get(socket) ?? null;
    this.sockets.delete(socket);
    if (!seatId) return;
    if ([...this.sockets.values()].includes(seatId)) return;

    const seat = this.seats.get(seatId);
    if (!seat) return;
    seat.online = false;
    this.note('dropped', 'bad', { a: seat.name });

    // The host walking out must not freeze the room for everyone else.
    if (seat.host) {
      seat.host = false;
      const heir = [...this.seats.values()].sort((a, b) => a.seat - b.seat).find((p) => p.online);
      if (heir) {
        heir.host = true;
        this.note('newHost', 'info', { a: heir.name });
      } else {
        seat.host = true;
      }
    }

    if (this.phase === 'lobby') void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
    if (!this.anyoneOnline()) this.park();
    this.broadcast();
  }

  /** Drop players who never came back, on the lobby grace timer. */
  private sweep() {
    let swept = false;
    for (const [id, seat] of [...this.seats]) {
      if (!seat.online) {
        this.seats.delete(id);
        swept = true;
      }
    }
    if (!swept) return;
    this.reseat();
    if (!this.hasHost()) {
      const first = [...this.seats.values()][0];
      if (first) first.host = true;
    }
    this.note('swept', 'info');
    this.broadcast();
  }

  // ------------------------------------------------------------------- lobby

  private setRules(seat: Seat, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Settings are locked once the grid is printed');
    this.rules = clampRules(patch, this.rules);
    this.broadcast();
  }

  private setReady(seat: Seat, on: boolean) {
    if (this.phase !== 'lobby') throw new Error('Not in the lobby');
    seat.ready = Boolean(on);
    this.broadcast();
  }

  private begin(seat: Seat) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Already running');

    for (const [id, other] of [...this.seats]) {
      if (!other.online) this.seats.delete(id);
    }
    this.reseat();

    const roster = [...this.seats.values()];
    if (roster.length < 2) throw new Error('Need at least 2 players');
    if (!roster.every((p) => p.ready || p.host)) throw new Error('Everyone must be ready');

    for (const player of roster) {
      player.score = 0;
      player.round = 0;
      player.found = 0;
    }
    this.order = roster.sort((a, b) => a.seat - b.seat).map((p) => p.id);
    this.round = 0;
    this.winnerId = null;
    this.idleRounds = 0;
    this.startRound();
    this.broadcast();
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.stopRound();
    this.note('lobby', 'info');
    this.broadcast();
  }

  // -------------------------------------------------------------------- play

  private startRound() {
    this.round += 1;
    this.seed = (Math.floor(Math.random() * 0xffffffff) ^ (Date.now() & 0xffffffff)) >>> 0;

    const grid = buildGrid({
      size: this.rules.size,
      count: this.rules.words,
      bank: this.rules.bank,
      category: this.rules.category,
      seed: this.seed,
    });
    this.cells = grid.cells;
    this.words = grid.words.map((placed) => ({ ...placed, by: null, points: 0, claimPath: null }));

    for (const seat of this.seats.values()) {
      seat.round = 0;
      seat.found = 0;
    }

    this.phase = 'play';
    this.roundTotalMs = this.rules.roundSeconds * 1000;
    this.nextAt = null;
    this.parkedNextMs = null;
    this.parkedRoundMs = this.roundTotalMs;
    this.roundEndsAt = null;
    this.note('printed', 'hot', { n: this.round, w: this.words.length });
    this.fx('round');
    this.resume();
  }

  private claim(socket: WebSocket, seat: Seat, r1: number, c1: number, r2: number, c2: number) {
    if (this.phase !== 'play') throw new Error('No round running');

    const trace = readTrace(this.cells, this.rules.size, Number(r1), Number(c1), Number(r2), Number(c2));
    if (!trace) throw new Error('Trace a straight line of three letters or more');

    const forward = trace.letters;
    const backward = reverse(forward);
    const match = (word: Word) => word.word === forward || word.word === backward;

    const open = this.words.find((word) => !word.by && match(word));
    if (!open) {
      const gone = this.words.find((word) => word.by && match(word));
      if (gone) {
        // Two players raced for it and this one lost. The Durable Object handles
        // one message at a time, so exactly one claim can ever be the first.
        const owner = gone.by ? this.seats.get(gone.by) : undefined;
        this.push(socket, { t: 'fx', kind: 'steal', playerId: gone.by ?? undefined, word: gone.word });
        throw new Error(`${gone.word} already went to ${owner?.name ?? 'someone else'}`);
      }
      this.push(socket, { t: 'fx', kind: 'miss' });
      throw new Error('Those letters are not on the list');
    }

    const left = this.roundEndsAt ? this.roundEndsAt - Date.now() : this.parkedRoundMs ?? 0;
    const points = claimScore(open.word.length, left, this.roundTotalMs);
    open.by = seat.id;
    open.points = points;
    open.claimPath = trace.path;
    seat.round += points;
    seat.score += points;
    seat.found += 1;
    this.idleRounds = 0;

    this.note('claimed', 'good', { a: seat.name, w: open.word, n: points });
    this.fx('claim', seat.id, seat.name, open.word);

    if (this.words.every((word) => word.by)) {
      this.note('cleared', 'hot', { a: seat.name });
      this.closeRound();
    }
    this.broadcast();
  }

  private skipIntermission(seat: Seat) {
    this.requireHost(seat);
    if (this.phase !== 'roundOver') throw new Error('No results on screen');
    this.advance();
    this.broadcast();
  }

  /** Round over: either the grid was cleared or the clock ran out. */
  private closeRound() {
    this.roundEndsAt = null;
    this.parkedRoundMs = null;
    this.phase = 'roundOver';
    if (this.round >= this.rules.rounds) {
      this.declareWinner();
      return;
    }
    this.parkedNextMs = INTERMISSION_MS;
    this.nextAt = null;
    this.resume();
  }

  private advance() {
    if (this.round >= this.rules.rounds) {
      this.declareWinner();
      return;
    }
    this.startRound();
  }

  private declareWinner() {
    const best = [...this.seats.values()]
      .sort((a, b) => b.score - a.score || a.seat - b.seat)[0];
    this.winnerId = best?.id ?? null;
    this.phase = 'over';
    this.roundEndsAt = null;
    this.nextAt = null;
    this.parkedRoundMs = null;
    this.parkedNextMs = null;
    if (best) {
      this.note('winner', 'good', { a: best.name, n: best.score });
      this.fx('win', best.id, best.name);
    }
  }

  /** Tear a dead round down and go back to the lobby. Clears the feed. */
  private stopRound() {
    this.phase = 'lobby';
    this.cells = '';
    this.words = [];
    this.round = 0;
    this.order = [];
    this.roundEndsAt = null;
    this.nextAt = null;
    this.parkedRoundMs = null;
    this.parkedNextMs = null;
    this.idleRounds = 0;
    this.winnerId = null;
    for (const seat of this.seats.values()) {
      seat.ready = false;
      seat.round = 0;
      seat.found = 0;
      seat.score = 0;
    }
    this.log = [];
  }

  // ------------------------------------------------------------------ clocks

  /** Shelve both clocks so an empty room stops re-arming its alarm. */
  private park() {
    const now = Date.now();
    if (this.roundEndsAt) this.parkedRoundMs = Math.max(1000, this.roundEndsAt - now);
    if (this.nextAt) this.parkedNextMs = Math.max(500, this.nextAt - now);
    this.roundEndsAt = null;
    this.nextAt = null;
  }

  private resume() {
    if (!this.anyoneOnline()) return;
    const now = Date.now();
    if (this.phase === 'play' && !this.roundEndsAt) {
      this.roundEndsAt = now + (this.parkedRoundMs ?? this.roundTotalMs);
      void this.ctx.storage.setAlarm(this.roundEndsAt);
      return;
    }
    if (this.phase === 'roundOver' && !this.nextAt && this.round < this.rules.rounds) {
      this.nextAt = now + (this.parkedNextMs ?? INTERMISSION_MS);
      void this.ctx.storage.setAlarm(this.nextAt);
    }
  }

  // ----------------------------------------------------------------- helpers

  private anyoneOnline(): boolean {
    return [...this.seats.values()].some((seat) => seat.online);
  }

  private hasHost(): boolean {
    return [...this.seats.values()].some((seat) => seat.host);
  }

  private reseat() {
    let index = 0;
    for (const seat of [...this.seats.values()].sort((a, b) => a.seat - b.seat)) {
      seat.seat = index++;
    }
  }

  private seatOf(socket: WebSocket): Seat {
    const id = this.sockets.get(socket);
    const seat = id ? this.seats.get(id) : undefined;
    if (!seat) throw new Error('Take a seat first');
    return seat;
  }

  private requireHost(seat: Seat) {
    if (!seat.host) throw new Error('Only the host can do that');
  }

  private note(code: string, tone: LogLine['tone'], args?: Record<string, string | number>) {
    this.log = [...this.log, { id: ++this.logSeq, code, tone, args }].slice(-12);
  }

  private fx(kind: FxKind, playerId?: string, text?: string, word?: string) {
    this.blast({ t: 'fx', kind, playerId, text, word });
  }

  private view(): RoomView {
    const players: PlayerView[] = [...this.seats.values()]
      .sort((a, b) => a.seat - b.seat)
      .map((seat) => ({
        id: seat.id,
        name: seat.name,
        seat: seat.seat,
        host: seat.host,
        ready: seat.ready,
        online: seat.online,
        score: seat.score,
        round: seat.round,
        found: seat.found,
      }));

    // Paths stay secret while the round is live and are revealed on the results
    // screen, so players can see what they missed.
    const reveal = this.phase !== 'play';
    const words: WordView[] = this.words.map((word, i) => ({
      i,
      word: word.word,
      by: word.by,
      points: word.points,
      path: word.claimPath ?? (reveal ? word.path : null),
    }));

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      players,
      cells: this.cells,
      words,
      seed: this.seed,
      round: this.round,
      roundEndsAt: this.roundEndsAt,
      nextAt: this.nextAt,
      now: Date.now(),
      winnerId: this.winnerId,
      log: this.log,
    };
  }

  private broadcast() {
    const room = this.view();
    for (const [socket, seatId] of this.sockets) {
      this.push(socket, { t: 'sync', room, youId: seatId ?? '' });
    }
  }

  private blast(message: Outbound) {
    for (const socket of this.sockets.keys()) this.push(socket, message);
  }

  private push(socket: WebSocket, message: Outbound) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      this.sockets.delete(socket);
    }
  }
}
