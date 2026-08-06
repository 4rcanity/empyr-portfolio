import { DurableObject } from 'cloudflare:workers';
import { resolveMove, roll2, type Occupant } from './board';
import {
  DEFAULT_RULES,
  GOAL,
  TRADITIONAL_RULES,
  clampRules,
  squareKind,
  variantOf,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type PlayerView,
  type RoomView,
  type Rules,
  type TurnReport,
} from './protocol';

interface Seat {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  pos: number;
  /** Held by the well or the prison until somebody else lands there. */
  stuck: boolean;
  /** When the hold started, so a fully-jammed table can be broken fairly. */
  stuckAt: number;
  /** Turns still owed to the inn. */
  skips: number;
  rolls: number;
  finished: boolean;
}

export interface Env {
  GOOSE_ROOM: DurableObjectNamespace<GooseRoom>;
}

const GRACE_MS = 60_000;
/** How many turns in a row the clock may roll before the game is dropped. */
const IDLE_LIMIT = 8;

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class GooseRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private activeId: string | null = null;
  private round = 0;
  private winnerId: string | null = null;
  private turnEndsAt: number | null = null;
  private lastTurn: TurnReport | null = null;
  private turnSeq = 0;
  /** Consecutive turns resolved by the clock rather than by a player. */
  private idleTurns = 0;
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
      let swept = false;
      for (const [id, seat] of [...this.seats]) {
        if (!seat.online) {
          this.seats.delete(id);
          swept = true;
        }
      }
      if (swept) {
        this.reseat();
        if (!this.hasHost()) {
          const first = [...this.seats.values()][0];
          if (first) first.host = true;
        }
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
      // stopGame() wipes the log, so the notice has to be written after it.
      this.stopGame();
      this.note('abandoned', 'bad');
      this.broadcast();
      return;
    }

    const seat = this.seats.get(this.activeId);
    if (!seat) return;
    this.throwDice(seat, true);
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
        msg: error instanceof Error ? error.message : 'That move did not land',
      });
    }
  }

  private route(socket: WebSocket, msg: Inbound) {
    if (msg.t === 'hello') {
      this.join(socket, msg.key, msg.name);
      return;
    }
    const seat = this.seatOf(socket);
    // A deliberate move proves the table is still awake.
    if (msg.t === 'roll') this.idleTurns = 0;
    switch (msg.t) {
      case 'rules':
        this.setRules(seat, msg.patch);
        break;
      case 'preset':
        this.setRules(seat, TRADITIONAL_RULES);
        break;
      case 'ready':
        this.setReady(seat, msg.on);
        break;
      case 'begin':
        this.begin(seat);
        break;
      case 'roll':
        this.playerRoll(seat);
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
      pos: 0,
      stuck: false,
      stuckAt: 0,
      skips: 0,
      rolls: 0,
      finished: false,
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
    // Losing the host must not lock the lobby.
    if (seat.host) {
      seat.host = false;
      const heir = [...this.seats.values()].find((other) => other.online && other.id !== seat.id);
      if (heir) {
        heir.host = true;
        this.note('newHost', 'info', { a: heir.name });
      } else {
        seat.host = true;
      }
    }
    this.note('dropped', 'bad', { a: seat.name });
    if (this.phase === 'lobby') void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
    if (this.phase === 'play' && !this.anyoneOnline()) this.turnEndsAt = null;
    this.broadcast();
  }

  // ------------------------------------------------------------------- lobby

  private setRules(seat: Seat, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Rules are locked once the dice are out');
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
      player.pos = 0;
      player.stuck = false;
      player.stuckAt = 0;
      player.skips = 0;
      player.rolls = 0;
      player.finished = false;
    }

    this.order = roster.sort((a, b) => a.seat - b.seat).map((p) => p.id);
    this.activeId = this.order[0] ?? null;
    this.winnerId = null;
    this.lastTurn = null;
    this.round = 1;
    this.idleTurns = 0;
    this.phase = 'play';
    this.note('opened', 'gold', { a: variantOf(this.rules) });
    this.armTimer();
    this.broadcast();
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.stopGame();
    this.note('lobby', 'info');
    this.broadcast();
  }

  // -------------------------------------------------------------------- play

  private playerRoll(seat: Seat) {
    if (this.phase !== 'play') throw new Error('No game running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (seat.stuck) throw new Error('You are still held — wait for a rescue');
    this.throwDice(seat, false);
    this.broadcast();
  }

  /** The whole turn: dice, board resolution, bookkeeping, hand-off. */
  private throwDice(seat: Seat, auto: boolean) {
    const dice = roll2();
    const others = this.occupants(seat.id);
    const firstThrow = seat.rolls === 0;
    const from = seat.pos;
    const result = resolveMove(this.rules, seat, dice, others, firstThrow);

    seat.rolls++;
    seat.pos = result.final;
    seat.skips = result.skips;
    if (result.stuck) {
      seat.stuck = true;
      seat.stuckAt = Date.now();
    }

    if (result.rescue) {
      const held = others.filter((other) => other.stuck && other.pos === result.rescue!.square);
      const freed = this.rules.wellFreesAll ? held : held.slice(0, 1);
      for (const one of freed) {
        const target = this.seats.get(one.id);
        if (target) {
          target.stuck = false;
          target.stuckAt = 0;
        }
      }
    }

    if (result.swap) {
      const partner = this.seats.get(result.swap.playerId);
      if (partner) partner.pos = result.swap.to;
    }

    const report: TurnReport = {
      id: ++this.turnSeq,
      playerId: seat.id,
      playerName: seat.name,
      dice,
      total: dice[0] + dice[1],
      hops: result.hops,
      from,
      final: result.final,
      gooseHops: result.gooseHops,
      bounced: result.bounced,
      punishment: result.punishment,
      rescue: result.rescue,
      swap: result.swap,
      auto,
      win: result.win,
    };
    this.lastTurn = report;

    if (auto) this.note('timeout', 'bad', { a: seat.name });
    this.narrate(report);

    if (result.win) {
      seat.finished = true;
      seat.pos = GOAL;
      this.winnerId = seat.id;
      this.phase = 'over';
      this.activeId = null;
      this.turnEndsAt = null;
      this.note('winner', 'gold', { a: seat.name, n: seat.rolls });
      return;
    }

    this.advance(seat.id);
    this.armTimer();
  }

  /** Turn a resolved throw into readable log lines. */
  private narrate(report: TurnReport) {
    const who = report.playerName;
    this.note('threw', 'info', {
      a: who,
      x: report.dice[0],
      y: report.dice[1],
      n: report.total,
    });

    if (report.hops.some((hop) => hop.why === 'opening')) {
      this.note('opening', 'gold', { a: who, n: report.final });
      return;
    }
    if (report.gooseHops > 0) {
      this.note('goose', 'good', { a: who, n: report.gooseHops, m: report.final });
    }
    if (report.hops.some((hop) => hop.why === 'bridge')) {
      this.note('bridge', 'good', { a: who, n: report.final });
    }
    if (report.bounced) {
      this.note('bounced', 'bad', { a: who, n: report.final });
    }
    if (report.rescue) {
      this.note('rescued', 'good', { a: who, b: report.rescue.freed.join(', '), n: report.rescue.square });
    }
    if (report.swap) {
      this.note('swapped', 'info', { a: who, b: report.swap.name, n: report.swap.to });
    }

    const punish = report.punishment;
    if (!punish) {
      if (report.gooseHops === 0 && !report.bounced) {
        this.note('moved', 'info', { a: who, n: report.final });
      }
      return;
    }
    switch (punish.kind) {
      case 'inn':
        this.note('inn', 'bad', { a: who, n: punish.turns ?? 1 });
        break;
      case 'well':
        this.note('well', 'bad', { a: who });
        break;
      case 'prison':
        this.note('prison', 'bad', { a: who });
        break;
      case 'maze':
        this.note('maze', 'bad', { a: who, n: punish.landsOn });
        break;
      case 'death':
        this.note('death', 'bad', { a: who, n: punish.landsOn });
        break;
    }
  }

  /**
   * Hand the dice on. Inn waiters burn a turn as we pass them, held pawns are
   * stepped over, and a board where every pawn is held springs the one that has
   * been waiting longest rather than deadlocking.
   */
  private advance(fromId: string | null) {
    if (this.order.length === 0) {
      this.activeId = null;
      return;
    }
    const start = fromId ? this.order.indexOf(fromId) : -1;
    for (let step = 1; step <= this.order.length * 4; step++) {
      const seat = this.seats.get(this.order[(start + step) % this.order.length]);
      if (!seat) continue;
      if (seat.stuck) continue;
      if (seat.skips > 0) {
        seat.skips--;
        this.note('waits', 'bad', { a: seat.name, n: seat.skips });
        continue;
      }
      this.activeId = seat.id;
      this.round++;
      return;
    }

    const held = [...this.seats.values()].filter((s) => s.stuck).sort((a, b) => a.stuckAt - b.stuckAt);
    const lucky = held[0];
    if (lucky) {
      lucky.stuck = false;
      lucky.stuckAt = 0;
      this.note('deadlock', 'gold', { a: lucky.name, n: lucky.pos });
      this.activeId = lucky.id;
      this.round++;
      return;
    }
    this.activeId = this.order[0] ?? null;
  }

  // ----------------------------------------------------------------- helpers

  private occupants(exceptId: string): Occupant[] {
    return [...this.seats.values()]
      .filter((seat) => seat.id !== exceptId)
      .map((seat) => ({ id: seat.id, name: seat.name, pos: seat.pos, stuck: seat.stuck }));
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

  /** Drop a dead game back to the lobby. Wipes the log, so log afterwards. */
  private stopGame() {
    this.phase = 'lobby';
    this.order = [];
    this.activeId = null;
    this.turnEndsAt = null;
    this.winnerId = null;
    this.lastTurn = null;
    this.round = 0;
    this.idleTurns = 0;
    for (const seat of this.seats.values()) {
      seat.ready = false;
      seat.pos = 0;
      seat.stuck = false;
      seat.stuckAt = 0;
      seat.skips = 0;
      seat.rolls = 0;
      seat.finished = false;
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
        pos: seat.pos,
        stuck: seat.stuck,
        skips: seat.skips,
        rolls: seat.rolls,
        finished: seat.finished,
      }));

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      variant: variantOf(this.rules),
      players,
      activeId: this.activeId,
      round: this.round,
      turnEndsAt: this.turnEndsAt,
      now: Date.now(),
      winnerId: this.winnerId,
      lastTurn: this.lastTurn,
      log: this.log,
    };
  }

  private broadcast() {
    const room = this.view();
    for (const [socket, seatId] of this.sockets) {
      this.push(socket, { t: 'sync', room, youId: seatId ?? '' });
    }
  }

  private push(socket: WebSocket, message: Outbound) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      this.sockets.delete(socket);
    }
  }
}

/** Exposed for convenience alongside the worker entry point. */
export { squareKind };
