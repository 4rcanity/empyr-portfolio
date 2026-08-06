import { DurableObject } from 'cloudflare:workers';
import {
  apply,
  captureMoves,
  distinctMoves,
  generate,
  material,
  parseFen,
  quietMoves,
} from './engine.ts';
import {
  DEFAULT_RULES,
  clampRules,
  encodeBoard,
  isKing,
  notation,
  other,
  sideOf,
  startBoard,
  type Cell,
  type Counters,
  type HistoryEntry,
  type Inbound,
  type LogLine,
  type MoveOption,
  type Outbound,
  type Phase,
  type PlayerView,
  type Result,
  type RoomView,
  type Rules,
  type Side,
} from './protocol.ts';

interface Seat {
  id: string;
  name: string;
  /** `null` means watching from the stands. */
  side: Side | null;
  host: boolean;
  ready: boolean;
  online: boolean;
  wins: number;
}

export interface Env {
  DRAUGHTS_ROOM: DurableObjectNamespace<DraughtsRoom>;
}

/** How long an empty lobby is kept before offline seats are swept. */
const GRACE_MS = 60_000;
/** With nobody seated online, the game is dropped after this long. */
const ABANDON_MS = 90_000;
/** Clockless games still have to end: this long without a move is abandonment. */
const THINK_LIMIT_MS = 10 * 60_000;
/** Above this many tied routes, only one route per distinct move is published. */
const ROUTE_CAP = 600;

/** Draw thresholds, in plies (so 50 = 25 moves each). */
const KING_IDLE_PLIES = 50;
const ENDGAME_LIMITS = { k16: 32, k5: 10 } as const;

type EndgameKind = 'k16' | 'k5';

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class DraughtsRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();

  private board: Cell[] = startBoard();
  private opening = encodeBoard(startBoard());
  private turn: Side = 'w';
  private options: MoveOption[] = [];
  private history: HistoryEntry[] = [];
  private result: Result | null = null;
  private drawOfferFrom: Side | null = null;
  /** Position set up by the host in the lobby, used by the next `begin`. */
  private pending: { board: Cell[]; turn: Side } | null = null;

  private clockMs: { w: number; b: number } = { w: 0, b: 0 };
  private clockRunning = false;
  private turnStartedAt = 0;
  private turnEndsAt: number | null = null;

  private reps = new Map<string, number>();
  private kingIdle = 0;
  private endgameKind: EndgameKind | null = null;
  private endgamePlies = 0;

  private lastActionAt = Date.now();
  /** Wall-clock deadline for giving up on a room nobody is sitting at. */
  private abandonAt: number | null = null;
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

    this.refresh();
    this.push(server, { t: 'sync', room: this.view(), youId: '', you: null });
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    if (this.phase === 'lobby') {
      this.sweepLobby();
      return;
    }
    if (this.phase !== 'play') return;

    const now = Date.now();

    // Nobody at the table: park the clock so an absent player is not flagged,
    // then give the game a bounded window to come back before dropping it. The
    // alarm is re-armed at most once here, so an abandoned room cannot loop.
    if (!this.playersOnline()) {
      this.parkClock();
      // The deadline is a fixed instant, not a rolling window, so watching the
      // room from the outside cannot keep pushing it back.
      this.abandonAt ??= now + ABANDON_MS;
      if (now >= this.abandonAt) {
        this.stopGame();
        // The reset wipes the log, so the notice has to be written afterwards.
        this.note('abandoned', 'bad');
        this.broadcast();
      } else {
        await this.ctx.storage.setAlarm(this.abandonAt);
      }
      return;
    }
    this.abandonAt = null;

    if (this.rules.clock && this.turnEndsAt !== null) {
      if (now < this.turnEndsAt - 400) {
        await this.ctx.storage.setAlarm(this.turnEndsAt);
        return;
      }
      this.clockMs[this.turn] = 0;
      const winner = other(this.turn);
      this.note('flagged', 'bad', { a: this.nameOf(this.turn) });
      this.finish({ winner, reason: 'time' });
      this.broadcast();
      return;
    }

    // No clock, but somebody is sitting there: still bound the object's life.
    if (now - this.lastActionAt >= THINK_LIMIT_MS) {
      this.stopGame();
      this.note('abandoned', 'bad');
      this.broadcast();
      return;
    }
    await this.ctx.storage.setAlarm(this.lastActionAt + THINK_LIMIT_MS);
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
      this.join(socket, msg.key, msg.name, Boolean(msg.spectate));
      return;
    }
    const seat = this.seatOf(socket);
    switch (msg.t) {
      case 'sit':
        this.sit(seat, msg.side);
        break;
      case 'stand':
        this.stand(seat);
        break;
      case 'ready':
        this.setReady(seat, msg.on);
        break;
      case 'rules':
        this.setRules(seat, msg.patch);
        break;
      case 'begin':
        this.begin(seat);
        break;
      case 'setup':
        this.setup(seat, msg.fen);
        break;
      case 'move':
        this.doMove(seat, msg.from, msg.to, msg.path);
        break;
      case 'resign':
        this.resign(seat);
        break;
      case 'offerDraw':
        this.offerDraw(seat);
        break;
      case 'answerDraw':
        this.answerDraw(seat, msg.accept);
        break;
      case 'again':
        this.resetToLobby(seat);
        break;
    }
  }

  private join(socket: WebSocket, keyRaw: string, nameRaw: string, spectate: boolean) {
    const key = String(keyRaw ?? '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 64);
    if (!key) throw new Error('Missing player id');
    const name = String(nameRaw ?? '').trim().slice(0, 14) || `Player ${this.seats.size + 1}`;

    // One socket per identity — a refreshed tab replaces the stale connection.
    for (const [other_, seatId] of this.sockets) {
      if (other_ !== socket && seatId === key) this.sockets.set(other_, null);
    }

    const existing = this.seats.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      // Only a *seated* player returning revives the room: a spectator arriving
      // must not extend the life of a table both players walked away from.
      if (existing.side !== null) {
        this.abandonAt = null;
        // The clock is parked while the table is empty — restart it on return.
        if (this.phase === 'play' && !this.clockRunning) this.resumeClock();
      }
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    const taken = new Set(
      [...this.seats.values()].map((seat) => seat.side).filter((side): side is Side => side !== null),
    );
    let side: Side | null = null;
    if (!spectate && this.phase === 'lobby') {
      if (!taken.has('w')) side = 'w';
      else if (!taken.has('b')) side = 'b';
    }

    this.seats.set(key, {
      id: key,
      name,
      side,
      host: this.seats.size === 0 || !this.hasHost(),
      ready: false,
      online: true,
      wins: 0,
    });
    this.sockets.set(socket, key);
    if (side !== null) this.abandonAt = null;
    this.note(side ? 'seated' : 'watching', side ? 'good' : 'info', { a: name });
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
    seat.ready = false;
    this.note('dropped', 'bad', { a: seat.name });

    if (this.phase === 'lobby') void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);

    if (this.phase === 'play' && !this.playersOnline()) {
      this.abandonAt = Date.now() + ABANDON_MS;
      this.parkClock();
      void this.ctx.storage.setAlarm(this.abandonAt);
    }
    if (seat.host) this.reassignHost();
    this.broadcast();
  }

  private sweepLobby() {
    let swept = false;
    for (const [id, seat] of [...this.seats]) {
      if (!seat.online) {
        this.seats.delete(id);
        swept = true;
      }
    }
    if (!swept) return;
    this.reassignHost();
    this.note('swept', 'info');
    this.broadcast();
  }

  // ------------------------------------------------------------------- lobby

  private sit(seat: Seat, side: Side) {
    if (this.phase !== 'lobby') throw new Error('Seats are locked once the game starts');
    if (side !== 'w' && side !== 'b') throw new Error('No such seat');
    const holder = [...this.seats.values()].find((other_) => other_.side === side);
    if (holder && holder.id !== seat.id) throw new Error('That seat is taken');
    seat.side = side;
    seat.ready = false;
    this.note('sat', 'good', { a: seat.name, s: side });
    this.broadcast();
  }

  private stand(seat: Seat) {
    if (this.phase !== 'lobby') throw new Error('You cannot leave your seat mid-game');
    seat.side = null;
    seat.ready = false;
    this.note('stood', 'info', { a: seat.name });
    this.broadcast();
  }

  private setReady(seat: Seat, on: boolean) {
    if (this.phase !== 'lobby') throw new Error('Not in the lobby');
    if (!seat.side) throw new Error('Take a seat first');
    seat.ready = Boolean(on);
    this.broadcast();
  }

  private setRules(seat: Seat, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Settings are locked once the game starts');
    this.rules = clampRules(patch, this.rules);
    this.broadcast();
  }

  private setup(seat: Seat, fen: string) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Positions can only be loaded in the lobby');
    const parsed = parseFen(fen);
    if (material(parsed.board, 'w').total === 0 || material(parsed.board, 'b').total === 0) {
      throw new Error('Both sides need at least one piece');
    }
    this.pending = parsed;
    this.note('position', 'warm');
    this.broadcast();
  }

  private begin(seat: Seat) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Already running');

    const players = [...this.seats.values()].filter((other_) => other_.side && other_.online);
    if (players.length < 2) throw new Error('Both seats have to be filled');
    if (!players.every((other_) => other_.ready || other_.host)) throw new Error('Both players must be ready');

    const start = this.pending ?? { board: startBoard(), turn: 'w' as Side };
    this.board = start.board.slice();
    this.turn = start.turn;
    this.opening = encodeBoard(this.board);
    this.history = [];
    this.result = null;
    this.drawOfferFrom = null;
    this.reps.clear();
    this.kingIdle = 0;
    this.endgameKind = null;
    this.endgamePlies = 0;
    this.phase = 'play';
    this.pending = null;

    const budget = this.rules.clock ? this.rules.minutes * 60_000 : 0;
    this.clockMs = { w: budget, b: budget };
    this.countRepetition();
    this.refresh();
    this.note('started', 'good');
    this.lastActionAt = Date.now();
    this.resumeClock();
    this.broadcast();
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.stopGame();
    this.note('lobby', 'info');
    this.broadcast();
  }

  /** Drop the game back to the lobby. Wipes the log — write notices after. */
  private stopGame() {
    this.phase = 'lobby';
    this.board = startBoard();
    this.opening = encodeBoard(this.board);
    this.turn = 'w';
    this.history = [];
    this.result = null;
    this.drawOfferFrom = null;
    this.pending = null;
    this.reps.clear();
    this.kingIdle = 0;
    this.endgameKind = null;
    this.endgamePlies = 0;
    this.clockRunning = false;
    this.turnEndsAt = null;
    this.clockMs = { w: 0, b: 0 };
    this.abandonAt = null;
    this.lastActionAt = Date.now();
    for (const seat of this.seats.values()) seat.ready = false;
    this.log = [];
    this.refresh();
  }

  // -------------------------------------------------------------------- play

  private doMove(seat: Seat, fromRaw: number, toRaw: number, pathRaw?: number[]) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.side) throw new Error('You are watching, not playing');
    if (seat.side !== this.turn) throw new Error('Not your move');

    const from = Math.floor(Number(fromRaw));
    const to = Math.floor(Number(toRaw));
    const path = Array.isArray(pathRaw) ? pathRaw.map((n) => Math.floor(Number(n))) : null;

    let candidates = this.options.filter((move) => move.from === from && move.to === to);
    if (path && path.length > 0) {
      candidates = candidates.filter((move) => move.path.join('.') === path.join('.'));
    }
    if (candidates.length === 0) throw new Error(this.explain(from, to));
    if (candidates.length > 1) throw new Error('Several routes end there — pick one');

    const move = candidates[0];
    const wasKing = isKing(this.board[from - 1]);
    this.board = apply(this.board, move);
    this.history = [
      ...this.history,
      {
        ply: this.history.length,
        side: this.turn,
        from: move.from,
        to: move.to,
        captures: move.captures,
        path: move.path,
        promote: move.promote,
        after: encodeBoard(this.board),
      },
    ];

    this.chargeClock();
    this.drawOfferFrom = null;
    this.lastActionAt = Date.now();

    this.note('moved', move.captures.length > 0 ? 'warm' : 'info', {
      a: seat.name,
      m: notation(move),
      n: move.captures.length,
    });
    if (move.promote) this.note('crowned', 'good', { a: seat.name, q: move.to });

    // Idle-king counter: a king shuffle that takes nothing.
    if (wasKing && move.captures.length === 0) this.kingIdle++;
    else this.kingIdle = 0;

    this.turn = other(this.turn);
    this.refresh();
    this.countRepetition();
    this.trackEndgame();

    const verdict = this.verdict();
    if (verdict) {
      this.finish(verdict);
    } else {
      this.resumeClock();
    }
    this.broadcast();
  }

  /** Why the requested move is not on the list. */
  private explain(from: number, to: number): string {
    if (from < 1 || from > 50 || to < 1 || to > 50) return 'That is not a square';
    const cell = this.board[from - 1];
    if (sideOf(cell) !== this.turn) return 'No piece of yours there';

    const caps = captureMoves(this.board, this.turn);
    if (caps.length > 0) {
      let best = 0;
      for (const move of caps) best = Math.max(best, move.captures.length);
      const quiet = quietMoves(this.board, this.turn).some(
        (move) => move.from === from && move.to === to,
      );
      if (quiet) return 'Capturing is compulsory';
      const smaller = caps.find((move) => move.from === from && move.to === to);
      if (smaller) {
        return `You must take the maximum: ${best} pieces, not ${smaller.captures.length}`;
      }
      return `Capturing is compulsory — ${best} pieces is the maximum`;
    }
    return 'That is not a legal move';
  }

  private resign(seat: Seat) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.side) throw new Error('You are watching, not playing');
    this.note('resigned', 'bad', { a: seat.name });
    this.finish({ winner: other(seat.side), reason: 'resign' });
    this.broadcast();
  }

  private offerDraw(seat: Seat) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.side) throw new Error('You are watching, not playing');
    if (this.drawOfferFrom === seat.side) throw new Error('Your offer is already on the table');
    if (this.drawOfferFrom) {
      // Answering an outstanding offer with one of your own accepts it.
      this.answerDraw(seat, true);
      return;
    }
    this.drawOfferFrom = seat.side;
    this.note('offered', 'info', { a: seat.name });
    this.broadcast();
  }

  private answerDraw(seat: Seat, accept: boolean) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.side) throw new Error('You are watching, not playing');
    if (!this.drawOfferFrom) throw new Error('No draw was offered');
    if (this.drawOfferFrom === seat.side) throw new Error('That is your own offer');
    if (!accept) {
      this.drawOfferFrom = null;
      this.note('declined', 'info', { a: seat.name });
      this.broadcast();
      return;
    }
    this.drawOfferFrom = null;
    this.finish({ winner: null, reason: 'agreement' });
    this.broadcast();
  }

  // --------------------------------------------------------------- outcomes

  /** Has the position just ended the game? */
  private verdict(): Result | null {
    if (this.options.length === 0) {
      const reason = material(this.board, this.turn).total === 0 ? 'captured' : 'blocked';
      return { winner: other(this.turn), reason };
    }
    const key = this.positionKey();
    if ((this.reps.get(key) ?? 0) >= 3) return { winner: null, reason: 'repetition' };
    if (this.kingIdle >= KING_IDLE_PLIES) return { winner: null, reason: 'kingIdle' };
    if (this.endgameKind && this.endgamePlies >= ENDGAME_LIMITS[this.endgameKind]) {
      return { winner: null, reason: this.endgameKind === 'k16' ? 'endgame16' : 'endgame5' };
    }
    return null;
  }

  private finish(result: Result) {
    this.result = result;
    this.phase = 'over';
    this.parkClock();
    this.turnEndsAt = null;
    if (result.winner) {
      const seat = [...this.seats.values()].find((other_) => other_.side === result.winner);
      if (seat) seat.wins++;
      this.note('won', 'good', { a: this.nameOf(result.winner), r: result.reason });
    } else {
      this.note('drawn', 'warm', { r: result.reason });
    }
  }

  private positionKey(): string {
    return `${encodeBoard(this.board)}${this.turn}`;
  }

  private countRepetition() {
    const key = this.positionKey();
    this.reps.set(key, (this.reps.get(key) ?? 0) + 1);
  }

  /**
   * FMJD reduced-material count-downs: three pieces against a lone king is a
   * draw after 16 moves each, two against a lone king after 5.
   */
  private trackEndgame() {
    const w = material(this.board, 'w');
    const b = material(this.board, 'b');
    const lone = w.total === 1 && w.kings === 1 ? 'w' : b.total === 1 && b.kings === 1 ? 'b' : null;
    let kind: EndgameKind | null = null;
    if (lone) {
      const strong = lone === 'w' ? b : w;
      if (strong.total === 3) kind = 'k16';
      else if (strong.total === 2) kind = 'k5';
    }
    if (kind !== this.endgameKind) {
      this.endgameKind = kind;
      this.endgamePlies = kind ? 1 : 0;
      return;
    }
    if (kind) this.endgamePlies++;
  }

  // ------------------------------------------------------------------ clocks

  private resumeClock() {
    if (this.phase !== 'play' || this.result) {
      this.turnEndsAt = null;
      return;
    }
    if (!this.playersOnline()) {
      this.turnEndsAt = null;
      this.clockRunning = false;
      return;
    }
    this.clockRunning = true;
    this.turnStartedAt = Date.now();
    this.turnEndsAt = this.rules.clock ? this.turnStartedAt + this.clockMs[this.turn] : null;
    const wake = this.turnEndsAt ?? this.lastActionAt + THINK_LIMIT_MS;
    void this.ctx.storage.setAlarm(wake);
  }

  /** Bank the time spent so far and stop counting. */
  private parkClock() {
    if (!this.clockRunning) {
      this.turnEndsAt = null;
      return;
    }
    if (this.rules.clock) {
      const spent = Date.now() - this.turnStartedAt;
      this.clockMs[this.turn] = Math.max(0, this.clockMs[this.turn] - spent);
    }
    this.clockRunning = false;
    this.turnEndsAt = null;
  }

  /** Deduct the mover's thinking time and pay the increment. */
  private chargeClock() {
    if (!this.rules.clock) return;
    const spent = this.clockRunning ? Date.now() - this.turnStartedAt : 0;
    this.clockMs[this.turn] = Math.max(0, this.clockMs[this.turn] - spent) + this.rules.increment * 1000;
    this.clockRunning = false;
  }

  // ----------------------------------------------------------------- helpers

  private refresh() {
    const routes = generate(this.board, this.turn);
    // A position with an absurd number of tied king routes would otherwise blow
    // up the sync payload; fall back to one route per distinct move.
    this.options = routes.length > ROUTE_CAP ? distinctMoves(routes) : routes;
  }

  private playersOnline(): boolean {
    return [...this.seats.values()].some((seat) => seat.side !== null && seat.online);
  }

  private hasHost(): boolean {
    return [...this.seats.values()].some((seat) => seat.host && seat.online);
  }

  private reassignHost() {
    if (this.hasHost()) return;
    const next =
      [...this.seats.values()].find((seat) => seat.online && seat.side) ??
      [...this.seats.values()].find((seat) => seat.online);
    for (const seat of this.seats.values()) seat.host = false;
    if (next) {
      next.host = true;
      this.note('host', 'info', { a: next.name });
    }
  }

  private nameOf(side: Side): string {
    return [...this.seats.values()].find((seat) => seat.side === side)?.name ?? (side === 'w' ? 'White' : 'Black');
  }

  private seatOf(socket: WebSocket): Seat {
    const id = this.sockets.get(socket);
    const seat = id ? this.seats.get(id) : undefined;
    if (!seat) throw new Error('Say hello first');
    return seat;
  }

  private requireHost(seat: Seat) {
    if (!seat.host) throw new Error('Only the host can do that');
  }

  private note(code: string, tone: LogLine['tone'], args?: Record<string, string | number>) {
    this.log = [...this.log, { id: ++this.logSeq, code, tone, args }].slice(-12);
  }

  private counters(): Counters {
    return {
      kingIdle: this.kingIdle,
      endgame: this.endgameKind
        ? {
            kind: this.endgameKind,
            plies: this.endgamePlies,
            limit: ENDGAME_LIMITS[this.endgameKind],
          }
        : null,
    };
  }

  private view(): RoomView {
    const players: PlayerView[] = [...this.seats.values()].map((seat) => ({
      id: seat.id,
      name: seat.name,
      side: seat.side,
      host: seat.host,
      ready: seat.ready,
      online: seat.online,
      wins: seat.wins,
    }));

    // Live clocks: subtract the time the mover has burned since their turn began.
    let clock: { w: number; b: number } | null = null;
    if (this.rules.clock) {
      clock = { ...this.clockMs };
      if (this.clockRunning && this.phase === 'play' && !this.result) {
        const spent = Date.now() - this.turnStartedAt;
        clock[this.turn] = Math.max(0, clock[this.turn] - spent);
      }
    }

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      players,
      spectators: players.filter((p) => p.side === null && p.online).length,
      board: encodeBoard(this.board),
      opening: this.opening,
      turn: this.turn,
      options: this.phase === 'play' && !this.result ? this.options : [],
      mustCapture:
        this.phase === 'play' && !this.result && this.options.some((move) => move.captures.length > 0),
      history: this.history,
      clock,
      turnEndsAt: this.turnEndsAt,
      now: Date.now(),
      result: this.result,
      drawOfferFrom: this.drawOfferFrom,
      counters: this.counters(),
      log: this.log,
    };
  }

  private broadcast() {
    const room = this.view();
    for (const [socket, seatId] of this.sockets) {
      const seat = seatId ? this.seats.get(seatId) : undefined;
      this.push(socket, { t: 'sync', room, youId: seatId ?? '', you: seat?.side ?? null });
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
