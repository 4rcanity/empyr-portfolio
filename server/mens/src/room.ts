import { DurableObject } from 'cloudflare:workers';
import { allHome, bestMove, countHome, countYard, legalMoves, type Racer } from './board';
import {
  CORNER_COLORS,
  DEFAULT_RULES,
  PAWNS,
  RING,
  SIX_CEILING,
  clampRules,
  cornersFor,
  type Color,
  type Fx,
  type FxKind,
  type Inbound,
  type LogLine,
  type MoveOption,
  type Outbound,
  type Phase,
  type PlayerView,
  type RoomView,
  type Rules,
  type TurnState,
} from './protocol';

interface Seat {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Board corner, assigned when the game starts. */
  corner: number;
  pawns: number[];
  hits: number;
  hurt: number;
}

export interface Env {
  MENS_ROOM: DurableObjectNamespace<MensRoom>;
}

const GRACE_MS = 60_000;
/** How many turn steps in a row the clock may resolve before the game is dropped. */
const IDLE_LIMIT = 8;

function freshPawns(): number[] {
  return Array.from({ length: PAWNS }, () => -1);
}

export class MensRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private corners: number[] = [];
  private activeId: string | null = null;

  private turnState: TurnState = 'roll';
  private dice: number | null = null;
  private options: MoveOption[] = [];
  /** Consecutive sixes rolled by the active player this turn. */
  private sixes = 0;
  /** Rolls left this turn while every pawn is still in the yard. */
  private triesLeft = 1;

  /** Consecutive turn steps resolved by the clock rather than by a player. */
  private idleTurns = 0;
  private winnerId: string | null = null;
  private turnEndsAt: number | null = null;
  private log: LogLine[] = [];
  private logSeq = 0;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (code) this.code = code;

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
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
      let swept = false;
      for (const [id, seat] of [...this.seats]) {
        if (!seat.online) {
          this.seats.delete(id);
          swept = true;
        }
      }
      if (swept) {
        this.reseat();
        this.ensureHost();
        this.note('swept', 'info');
        this.broadcast();
      }
      return;
    }

    if (this.phase !== 'play' || !this.activeId || !this.turnEndsAt) return;
    if (Date.now() < this.turnEndsAt - 400) {
      await this.ctx.storage.setAlarm(this.turnEndsAt);
      return;
    }

    // Never keep a clock running for a board nobody is sitting at, and give up
    // on a board where everybody has gone quiet — otherwise an abandoned room
    // re-arms its alarm on a loop forever and the object never sleeps.
    if (!this.anyoneOnline()) {
      this.turnEndsAt = null;
      return;
    }
    if (++this.idleTurns > IDLE_LIMIT) {
      // The reset wipes the feed, so the notice has to be written afterwards.
      this.stopGame();
      this.note('abandoned', 'bad');
      this.broadcast();
      return;
    }

    const seat = this.seats.get(this.activeId);
    if (!seat) return;
    this.note('timeout', 'bad', { a: seat.name });
    this.fx('timeout', { playerId: seat.id });

    if (this.turnState === 'move' && this.options.length > 0) {
      this.applyMove(seat, bestMove(this.options));
    } else {
      this.rollFor(seat);
    }
    this.broadcast();
  }

  // ---------------------------------------------------------------- messaging

  private receive(socket: WebSocket, raw: unknown) {
    if (typeof raw !== 'string') return;
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
        msg: error instanceof Error ? error.message : 'That move is not allowed',
      });
    }
  }

  private route(socket: WebSocket, msg: Inbound) {
    if (msg.t === 'hello') {
      this.join(socket, msg.key, msg.name);
      return;
    }
    const seat = this.seatOf(socket);
    // Any deliberate move proves the board is still alive.
    if (msg.t === 'roll' || msg.t === 'move') this.idleTurns = 0;
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
      case 'roll':
        this.roll(seat);
        break;
      case 'move':
        this.chooseMove(seat, msg.pawn, msg.to);
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
    const name = String(nameRaw ?? '').trim().slice(0, 14) || `Speler ${this.seats.size + 1}`;

    for (const [other, seatId] of this.sockets) {
      if (other !== socket && seatId === key) this.sockets.set(other, null);
    }

    const existing = this.seats.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      // The clock is parked while the board is empty — restart it on return.
      this.idleTurns = 0;
      if (this.phase === 'play' && !this.turnEndsAt) this.armTimer();
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    if (this.phase !== 'lobby') throw new Error('Game already running — wait for the next lobby');
    if (this.seats.size >= this.rules.capacity) throw new Error('Board is full');

    this.seats.set(key, {
      id: key,
      name,
      seat: this.seats.size,
      host: this.seats.size === 0 || !this.hasHost(),
      ready: false,
      online: true,
      corner: -1,
      pawns: freshPawns(),
      hits: 0,
      hurt: 0,
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

    // Hand the host badge on rather than leaving the board unable to start.
    if (seat.host) {
      seat.host = false;
      const heir = [...this.seats.values()].sort((a, b) => a.seat - b.seat).find((s) => s.online);
      if (heir) {
        heir.host = true;
        this.note('newHost', 'info', { a: heir.name });
      } else {
        seat.host = true;
      }
    }

    if (this.phase === 'lobby') void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
    this.broadcast();
  }

  // ------------------------------------------------------------------- lobby

  private setRules(seat: Seat, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Settings are locked once the game starts');
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

    const roster = [...this.seats.values()].sort((a, b) => a.seat - b.seat);
    if (roster.length < 2) throw new Error('Need at least 2 players');
    if (!roster.every((p) => p.ready || p.host)) throw new Error('Everyone must be ready');

    this.corners = cornersFor(roster.length);
    roster.forEach((player, index) => {
      player.corner = this.corners[index];
      player.pawns = freshPawns();
      player.hits = 0;
      player.hurt = 0;
    });

    this.order = roster.map((p) => p.id);
    this.winnerId = null;
    this.phase = 'play';
    this.log = [];
    this.note('start', 'wild', { n: roster.length });
    this.startTurn(this.order[0]);
    this.broadcast();
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.stopGame();
    this.note('lobby', 'info');
    this.broadcast();
  }

  // -------------------------------------------------------------------- play

  private roll(seat: Seat) {
    if (this.phase !== 'play') throw new Error('No game running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (this.turnState !== 'roll') throw new Error('Pick a pawn first');
    this.rollFor(seat);
    this.broadcast();
  }

  /** Roll the die and resolve everything that needs no decision. */
  private rollFor(seat: Seat) {
    const dice = 1 + Math.floor(Math.random() * 6);
    this.dice = dice;
    this.triesLeft = Math.max(0, this.triesLeft - 1);
    if (dice === 6) this.sixes += 1;

    this.note('rolled', dice === 6 ? 'good' : 'info', { a: seat.name, n: dice });
    this.fx(dice === 6 ? 'six' : 'roll', { playerId: seat.id, dice });

    this.options = legalMoves(this.racerOf(seat), this.racers(), dice, this.rules);

    if (this.options.length === 0) {
      this.fx('stuck', { playerId: seat.id, dice });
      if (this.canRollAgain()) {
        this.note('sixAgain', 'good', { a: seat.name });
        this.turnState = 'roll';
        this.armTimer();
        return;
      }
      if (this.triesLeft > 0) {
        this.note('tryAgain', 'info', { a: seat.name, n: this.triesLeft });
        this.turnState = 'roll';
        this.armTimer();
        return;
      }
      this.note('noMove', 'bad', { a: seat.name, n: dice });
      this.endTurn();
      return;
    }

    // A single legal option is played for you — there is nothing to decide.
    if (this.options.length === 1 && this.rules.autoSingle) {
      this.note('forced', 'info', { a: seat.name });
      this.applyMove(seat, this.options[0]);
      return;
    }

    this.turnState = 'move';
    this.armTimer();
  }

  private chooseMove(seat: Seat, pawnRaw: number, toRaw: number) {
    if (this.phase !== 'play') throw new Error('No game running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (this.turnState !== 'move') throw new Error('Roll the die first');

    const pawn = Math.floor(Number(pawnRaw));
    const to = Math.floor(Number(toRaw));
    const move = this.options.find((option) => option.pawn === pawn && option.to === to);
    if (!move) throw new Error('That pawn cannot make that move');

    this.applyMove(seat, move);
    this.broadcast();
  }

  private applyMove(seat: Seat, move: MoveOption) {
    if (move.capture) {
      const victim = this.seats.get(move.capture.playerId);
      if (victim) {
        victim.pawns[move.capture.pawn] = -1;
        victim.hurt += 1;
        seat.hits += 1;
        this.note('captured', 'bad', { a: seat.name, b: victim.name });
        this.fx('capture', {
          playerId: seat.id,
          pawn: move.pawn,
          from: move.from,
          to: move.to,
          victimId: victim.id,
          victimPawn: move.capture.pawn,
        });
      }
    }

    seat.pawns[move.pawn] = move.to;

    const kind: FxKind = move.kind === 'enter' ? 'enter' : move.to >= RING ? 'homed' : 'hop';
    this.fx(kind, { playerId: seat.id, pawn: move.pawn, from: move.from, to: move.to });

    if (move.kind === 'enter') this.note('entered', 'good', { a: seat.name });
    else if (move.to >= RING) this.note('homed', 'good', { a: seat.name, n: countHome(seat.pawns) });
    else this.note('moved', 'info', { a: seat.name, n: move.to - move.from });

    if (allHome(seat.pawns)) {
      this.winnerId = seat.id;
      this.phase = 'over';
      this.activeId = null;
      this.turnEndsAt = null;
      this.options = [];
      this.note('winner', 'good', { a: seat.name });
      this.fx('win', { playerId: seat.id, text: seat.name });
      return;
    }

    if (this.canRollAgain()) {
      this.note('sixAgain', 'good', { a: seat.name });
      this.turnState = 'roll';
      this.options = [];
      this.armTimer();
      return;
    }

    this.endTurn();
  }

  /** Does the active player earn another roll off the six they just made? */
  private canRollAgain(): boolean {
    if (this.dice !== 6) return false;
    const cap = this.rules.sixLimit === 0 ? SIX_CEILING : this.rules.sixLimit;
    return this.sixes < cap;
  }

  private endTurn() {
    if (this.phase !== 'play' || !this.activeId) return;
    const index = this.order.indexOf(this.activeId);
    const next = this.order[(index + 1) % this.order.length] ?? this.order[0];
    this.startTurn(next);
  }

  private startTurn(id: string | null) {
    this.activeId = id;
    this.turnState = 'roll';
    this.dice = null;
    this.options = [];
    this.sixes = 0;

    const seat = id ? this.seats.get(id) : undefined;
    // Everything still in the yard buys you the traditional extra attempts.
    const stuck = seat ? countYard(seat.pawns) === PAWNS : false;
    this.triesLeft = stuck ? this.rules.yardTries : 1;
    this.armTimer();
  }

  // ----------------------------------------------------------------- helpers

  private racerOf(seat: Seat): Racer {
    return { id: seat.id, corner: seat.corner, pawns: seat.pawns };
  }

  private racers(): Racer[] {
    return this.order
      .map((id) => this.seats.get(id))
      .filter((seat): seat is Seat => Boolean(seat))
      .map((seat) => this.racerOf(seat));
  }

  private armTimer() {
    if (this.phase !== 'play' || !this.activeId || !this.anyoneOnline()) {
      this.turnEndsAt = null;
      return;
    }
    this.turnEndsAt = Date.now() + this.rules.turnSeconds * 1000;
    void this.ctx.storage.setAlarm(this.turnEndsAt);
  }

  private anyoneOnline(): boolean {
    return [...this.seats.values()].some((seat) => seat.online);
  }

  /** Drop a dead game back to a clean lobby. */
  private stopGame() {
    this.phase = 'lobby';
    this.order = [];
    this.corners = [];
    this.activeId = null;
    this.turnState = 'roll';
    this.dice = null;
    this.options = [];
    this.sixes = 0;
    this.triesLeft = 1;
    this.idleTurns = 0;
    this.winnerId = null;
    this.turnEndsAt = null;
    for (const seat of this.seats.values()) {
      seat.ready = false;
      seat.corner = -1;
      seat.pawns = freshPawns();
      seat.hits = 0;
      seat.hurt = 0;
    }
    this.log = [];
  }

  private reseat() {
    let index = 0;
    for (const seat of [...this.seats.values()].sort((a, b) => a.seat - b.seat)) {
      seat.seat = index++;
    }
  }

  private hasHost(): boolean {
    return [...this.seats.values()].some((seat) => seat.host);
  }

  private ensureHost() {
    if (this.hasHost()) return;
    const first = [...this.seats.values()].sort((a, b) => a.seat - b.seat)[0];
    if (first) first.host = true;
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

  private fx(kind: FxKind, extra: Omit<Fx, 't' | 'kind'> = {}) {
    this.blast({ t: 'fx', kind, ...extra });
  }

  private view(): RoomView {
    const roster = [...this.seats.values()].sort((a, b) => a.seat - b.seat);
    // Before the start the lobby previews the corners this headcount would use.
    const preview = cornersFor(Math.max(2, roster.length));

    const players: PlayerView[] = roster.map((seat) => {
      const corner = seat.corner >= 0 ? seat.corner : (preview[seat.seat] ?? 0);
      const color: Color = CORNER_COLORS[corner] ?? 'red';
      return {
        id: seat.id,
        name: seat.name,
        seat: seat.seat,
        corner,
        color,
        host: seat.host,
        ready: seat.ready,
        online: seat.online,
        pawns: [...seat.pawns],
        home: countHome(seat.pawns),
        yard: countYard(seat.pawns),
        hits: seat.hits,
        hurt: seat.hurt,
      };
    });

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      players,
      corners: this.phase === 'lobby' ? preview.slice(0, Math.max(2, roster.length)) : this.corners,
      activeId: this.activeId,
      turnState: this.turnState,
      dice: this.dice,
      options: this.options,
      sixes: this.sixes,
      triesLeft: this.triesLeft,
      turnEndsAt: this.turnEndsAt,
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
