import { DurableObject } from 'cloudflare:workers';
import {
  applyMove,
  canMate,
  findKing,
  findMove,
  inCheck,
  insufficientMaterial,
  isCheckmate,
  isStalemate,
  legalMoves,
  parseFen,
  pseudoMoves,
  repetitionKey,
  squareName,
  toFen,
  toPgn,
  toSan,
  typeChar,
  START_FEN,
  type Color,
  type Move,
  type Position,
} from './engine';
import {
  DEFAULT_RULES,
  clampRules,
  humanTimeLabel,
  timeControlLabel,
  type FxKind,
  type HistoryEntry,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type PlayerView,
  type Result,
  type RoomView,
  type Rules,
  type Seat,
} from './protocol';

interface SeatRec {
  id: string;
  name: string;
  /** Playing colour, or null while spectating. */
  color: Color | null;
  host: boolean;
  ready: boolean;
  online: boolean;
  /** Banked clock in milliseconds. Only meaningful for a seated colour. */
  msLeft: number;
}

export interface Env {
  CHESS_ROOM: DurableObjectNamespace<ChessRoom>;
}

/** How long an emptied lobby waits before forgetting who was sitting there. */
const GRACE_MS = 60_000;
/** How long a game with nobody connected survives before it drops to the lobby. */
const ABANDON_MS = 60_000;
const MAX_SPECTATORS = 24;
const NAMES: Record<Color, string> = { w: 'White', b: 'Black' };

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class ChessRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, SeatRec>();
  private sockets = new Map<WebSocket, string | null>();

  private pos: Position = parseFen(START_FEN);
  private startFen = START_FEN;
  private history: HistoryEntry[] = [];
  private sans: string[] = [];
  /** One entry per position seen, including the starting one. */
  private repKeys: string[] = [];
  private lastMove: { from: number; to: number } | null = null;

  private clocks: Record<Color, number> = { w: 0, b: 0 };
  /** When the running side started thinking, or null while the clock is parked. */
  private turnStartedAt: number | null = null;
  /** When the room went quiet, so an abandoned game can be reaped. */
  private offlineSince: number | null = null;

  private result: Result | null = null;
  private drawOfferBy: Color | null = null;
  private pgn: string | null = null;
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

    this.push(server, { t: 'sync', room: this.view(null), youId: '', seat: null });
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    const now = Date.now();

    if (this.phase !== 'play') {
      this.sweep();
      return;
    }

    // An empty board must never keep re-arming a clock alarm: park the clock,
    // then reap the game once after a bounded wait.
    if (!this.anyPlayerOnline()) {
      if (this.turnStartedAt !== null) {
        this.parkClock();
        return;
      }
      const since = this.offlineSince ?? now;
      if (now - since >= ABANDON_MS - 300) {
        this.abandon();
        return;
      }
      await this.ctx.storage.setAlarm(since + ABANDON_MS);
      return;
    }

    // Somebody is sitting here, so a ticking clock is legitimate — a player
    // thinking is not an idle room.
    if (this.turnStartedAt === null) {
      this.armClock();
      this.broadcast();
      return;
    }

    const endsAt = this.turnStartedAt + this.clocks[this.pos.turn];
    if (now < endsAt - 300) {
      await this.ctx.storage.setAlarm(endsAt);
      return;
    }
    this.flag(this.pos.turn);
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
      this.join(socket, msg.key, msg.name, msg.as ?? 'play');
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
      case 'sit':
        this.sit(seat);
        break;
      case 'watch':
        this.stand(seat);
        break;
      case 'swap':
        this.swapColors(seat);
        break;
      case 'begin':
        this.begin(seat);
        break;
      case 'move':
        this.playMove(seat, msg.from, msg.to, msg.promo);
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
      case 'claimDraw':
        this.claimDraw(seat, msg.kind);
        break;
      case 'again':
        this.rematch(seat);
        break;
    }
  }

  private join(socket: WebSocket, keyRaw: string, nameRaw: string, as: 'play' | 'watch') {
    const key = String(keyRaw ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!key) throw new Error('Missing player id');
    const name = String(nameRaw ?? '').trim().slice(0, 14) || `Guest ${this.seats.size + 1}`;

    // One live socket per identity — a refresh must reclaim the seat, not clone it.
    for (const [other, seatId] of this.sockets) {
      if (other !== socket && seatId === key) this.sockets.set(other, null);
    }

    const existing = this.seats.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      this.offlineSince = null;
      if (!this.hasHost()) existing.host = true;
      // The clock is parked while the room is empty — pick it back up.
      if (this.phase === 'play' && !this.result && this.turnStartedAt === null) this.armClock();
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    const seatedColors = new Set([...this.seats.values()].map((s) => s.color).filter(Boolean));
    const free: Color | null = seatedColors.has('w') ? (seatedColors.has('b') ? null : 'b') : 'w';
    // Mid-game arrivals and overflow watch instead of playing; the board is public.
    const color = as === 'play' && this.phase === 'lobby' ? free : null;
    if (!color) {
      const watchers = [...this.seats.values()].filter((s) => !s.color).length;
      if (watchers >= MAX_SPECTATORS) throw new Error('Too many spectators here already');
    }

    this.seats.set(key, {
      id: key,
      name,
      color,
      host: this.seats.size === 0 || !this.hasHost(),
      ready: false,
      online: true,
      msLeft: this.rules.minutes * 60_000,
    });
    this.sockets.set(socket, key);
    this.offlineSince = null;
    this.note(color ? 'seated' : 'watching', color ? 'good' : 'info', { a: name });
    if (this.phase === 'play' && !this.result && this.turnStartedAt === null) this.armClock();
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

    if (seat.host) {
      // Hand the room over so the lobby is never left without a host.
      seat.host = false;
      const heir = [...this.seats.values()].find((s) => s.online) ?? null;
      if (heir) {
        heir.host = true;
        this.note('newHost', 'info', { a: heir.name });
      } else {
        seat.host = true;
      }
    }

    if (!this.anyPlayerOnline()) {
      this.offlineSince = Date.now();
      if (this.phase === 'play' && !this.result) {
        // Park the clock immediately: nobody should burn time on an empty board.
        this.parkClock();
      } else if (!this.anyoneOnline()) {
        void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
      }
    }
    this.broadcast();
  }

  // -------------------------------------------------------------------- lobby

  private setRules(seat: SeatRec, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Settings are locked once the clocks start');
    if (patch.startFen !== undefined) {
      // Validate before storing, so an unplayable FEN can never reach the board.
      const wanted = String(patch.startFen).trim() || START_FEN;
      parseFen(wanted);
      patch = { ...patch, startFen: wanted };
    }
    this.rules = clampRules(patch, this.rules);
    for (const player of this.seats.values()) player.msLeft = this.rules.minutes * 60_000;
    this.broadcast();
  }

  private setReady(seat: SeatRec, on: boolean) {
    if (this.phase !== 'lobby') throw new Error('Not in the lobby');
    if (!seat.color) throw new Error('Take a colour first');
    seat.ready = Boolean(on);
    this.broadcast();
  }

  private sit(seat: SeatRec) {
    if (this.phase !== 'lobby') throw new Error('Wait for the next game');
    if (seat.color) return;
    const taken = new Set([...this.seats.values()].map((s) => s.color).filter(Boolean));
    const free: Color | null = taken.has('w') ? (taken.has('b') ? null : 'b') : 'w';
    if (!free) throw new Error('Both colours are taken');
    seat.color = free;
    this.note('seated', 'good', { a: seat.name });
    this.broadcast();
  }

  private stand(seat: SeatRec) {
    if (this.phase === 'play' && !this.result) throw new Error('Resign before you leave the board');
    seat.color = null;
    seat.ready = false;
    this.note('watching', 'info', { a: seat.name });
    this.broadcast();
  }

  private swapColors(seat: SeatRec) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Colours are locked once the clocks start');
    for (const player of this.seats.values()) {
      if (player.color) player.color = player.color === 'w' ? 'b' : 'w';
    }
    this.note('swapped', 'info');
    this.broadcast();
  }

  private begin(seat: SeatRec) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Already running');
    const white = this.playerOf('w');
    const black = this.playerOf('b');
    if (!white || !black) throw new Error('Need a player on both colours');
    if (![white, black].every((p) => p.ready || p.host)) throw new Error('Both players must be ready');

    this.pos = parseFen(this.rules.startFen);
    this.startFen = toFen(this.pos);
    this.history = [];
    this.sans = [];
    this.repKeys = [repetitionKey(this.pos)];
    this.lastMove = null;
    this.result = null;
    this.pgn = null;
    this.drawOfferBy = null;
    this.clocks = { w: this.rules.minutes * 60_000, b: this.rules.minutes * 60_000 };
    white.msLeft = this.clocks.w;
    black.msLeft = this.clocks.b;
    this.phase = 'play';
    this.turnStartedAt = Date.now();
    this.note('begin', 'sharp', { a: white.name, b: black.name, t: humanTimeLabel(this.rules) });
    this.fx('start');
    this.armClock();
    // A crafted position can already be decided before anyone touches a piece.
    this.checkTerminal();
    this.broadcast();
  }

  private rematch(seat: SeatRec) {
    this.requireHost(seat);
    if (this.phase === 'play' && !this.result) throw new Error('Finish this game first');
    this.resetToLobby();
    // Colours change hands between games, as they should.
    for (const player of this.seats.values()) {
      if (player.color) player.color = player.color === 'w' ? 'b' : 'w';
    }
    this.note('lobby', 'info');
    this.broadcast();
  }

  /** Wipe the board back to a fresh lobby. Clears the log, so log *after* this. */
  private resetToLobby() {
    this.phase = 'lobby';
    this.pos = parseFen(this.rules.startFen);
    this.startFen = this.rules.startFen;
    this.history = [];
    this.sans = [];
    this.repKeys = [];
    this.lastMove = null;
    this.result = null;
    this.pgn = null;
    this.drawOfferBy = null;
    this.turnStartedAt = null;
    this.clocks = { w: this.rules.minutes * 60_000, b: this.rules.minutes * 60_000 };
    for (const player of this.seats.values()) {
      player.ready = false;
      player.msLeft = this.rules.minutes * 60_000;
    }
    this.log = [];
  }

  /** Give up on a game nobody came back to. */
  private abandon() {
    this.resetToLobby();
    // resetToLobby wipes the log, so the notice has to be written after it.
    this.note('abandoned', 'bad');
    this.offlineSince = null;
    this.broadcast();
  }

  private sweep() {
    let swept = false;
    for (const [id, seat] of [...this.seats]) {
      if (!seat.online) {
        this.seats.delete(id);
        swept = true;
      }
    }
    if (!swept) return;
    if (!this.hasHost()) {
      const first = [...this.seats.values()][0];
      if (first) first.host = true;
    }
    this.note('swept', 'info');
    this.broadcast();
  }

  // --------------------------------------------------------------------- play

  private playMove(seat: SeatRec, from: number, to: number, promo?: string) {
    if (!seat.color) throw new Error('Spectators cannot move the pieces');
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (seat.color !== this.pos.turn) throw new Error('Not your turn');

    const now = Date.now();
    // The clock is authoritative: a move that arrives after the flag is too late.
    if (this.turnStartedAt !== null && this.clocks[seat.color] - (now - this.turnStartedAt) <= 0) {
      this.flag(seat.color);
      this.broadcast();
      return;
    }

    const move = findMove(this.pos, from, to, promo);
    if (!move) throw new Error(this.rejectReason(from, to, promo));

    const san = toSan(this.pos, move);
    const captured = move.captured ? typeChar(move.captured) : null;
    const spent = this.turnStartedAt === null ? 0 : now - this.turnStartedAt;
    this.clocks[seat.color] = Math.max(0, this.clocks[seat.color] - spent) + this.rules.increment * 1000;
    seat.msLeft = this.clocks[seat.color];

    this.pos = applyMove(this.pos, move);
    this.repKeys.push(repetitionKey(this.pos));
    this.lastMove = { from: move.from, to: move.to };
    this.sans.push(san);
    this.history.push({
      ply: this.history.length + 1,
      san,
      fen: toFen(this.pos),
      from: move.from,
      to: move.to,
      captured,
      msLeft: this.clocks[seat.color],
    });

    if (this.drawOfferBy && this.drawOfferBy !== seat.color) {
      this.drawOfferBy = null;
      this.note('drawDeclined', 'info', { a: seat.name });
    }

    this.fx(this.fxFor(move, san));
    this.turnStartedAt = Date.now();
    if (!this.checkTerminal()) this.armClock();
    this.broadcast();
  }

  /** A precise reason a move bounced, so the client can say something useful. */
  private rejectReason(from: number, to: number, promo?: string): string {
    const shapes = pseudoMoves(this.pos).filter((m) => m.from === from && m.to === to);
    if (shapes.length === 0) return `${squareName(from)}${squareName(to)} is not a move that piece can make`;
    if (shapes.some((m) => m.promo) && !promo) return 'Pick a piece to promote to';
    const legal = shapes.some((m) => !inCheck(applyMove(this.pos, m), this.pos.turn));
    if (!legal) return 'That would leave your king in check';
    return 'That promotion piece is not allowed';
  }

  private fxFor(move: Move, san: string): FxKind {
    if (san.endsWith('#')) return 'mate';
    if (move.castle) return 'castle';
    if (move.promo) return 'promote';
    if (san.endsWith('+')) return 'check';
    if (move.captured) return 'capture';
    return 'move';
  }

  private resign(seat: SeatRec) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.color) throw new Error('Spectators have nothing to resign');
    this.finish({ winner: seat.color === 'w' ? 'b' : 'w', reason: 'resign' });
    this.broadcast();
  }

  private offerDraw(seat: SeatRec) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.color) throw new Error('Spectators cannot offer a draw');
    if (this.drawOfferBy === seat.color) return;
    if (this.drawOfferBy) {
      // Both sides want it — that is agreement.
      this.finish({ winner: null, reason: 'agreement' });
      this.broadcast();
      return;
    }
    this.drawOfferBy = seat.color;
    this.note('drawOffered', 'info', { a: seat.name });
    this.broadcast();
  }

  private answerDraw(seat: SeatRec, accept: boolean) {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.color) throw new Error('Spectators cannot answer a draw');
    if (!this.drawOfferBy || this.drawOfferBy === seat.color) throw new Error('No offer to answer');
    if (accept) {
      this.finish({ winner: null, reason: 'agreement' });
    } else {
      this.drawOfferBy = null;
      this.note('drawDeclined', 'info', { a: seat.name });
    }
    this.broadcast();
  }

  /**
   * Threefold repetition and the fifty-move rule are *claims* — either player
   * may take the draw, but play continues if nobody does. Fivefold and the
   * seventy-five move rule are handled automatically in `checkTerminal`.
   */
  private claimDraw(seat: SeatRec, kind: 'threefold' | 'fifty') {
    if (this.phase !== 'play' || this.result) throw new Error('No game running');
    if (!seat.color) throw new Error('Spectators cannot claim a draw');
    if (kind === 'threefold') {
      if (this.repeatCount() < 3) throw new Error('This position has not appeared three times');
      this.finish({ winner: null, reason: 'threefold' });
    } else {
      if (this.pos.half < 100) throw new Error('Fifty moves have not passed without a capture or a pawn move');
      this.finish({ winner: null, reason: 'fifty' });
    }
    this.broadcast();
  }

  /** A clock ran out. Mate has to still be possible for it to be a win. */
  private flag(loser: Color) {
    const winner: Color = loser === 'w' ? 'b' : 'w';
    this.clocks[loser] = 0;
    const player = this.playerOf(loser);
    if (player) player.msLeft = 0;
    this.turnStartedAt = null;
    if (!canMate(this.pos, winner)) {
      this.fx('flag');
      this.finish({ winner: null, reason: 'flagInsufficient' });
      return;
    }
    this.fx('flag');
    this.finish({ winner, reason: 'flag' });
  }

  /** Automatic endings, checked after every move. Returns true if the game ended. */
  private checkTerminal(): boolean {
    if (isCheckmate(this.pos)) {
      this.finish({ winner: this.pos.turn === 'w' ? 'b' : 'w', reason: 'checkmate' });
      return true;
    }
    if (isStalemate(this.pos)) {
      this.finish({ winner: null, reason: 'stalemate' });
      return true;
    }
    if (insufficientMaterial(this.pos)) {
      this.finish({ winner: null, reason: 'insufficient' });
      return true;
    }
    if (this.repeatCount() >= 5) {
      this.finish({ winner: null, reason: 'fivefold' });
      return true;
    }
    if (this.pos.half >= 150) {
      this.finish({ winner: null, reason: 'seventyfive' });
      return true;
    }
    return false;
  }

  private finish(partial: { winner: Color | null; reason: Result['reason'] }) {
    const score = partial.winner === 'w' ? '1-0' : partial.winner === 'b' ? '0-1' : '1/2-1/2';
    this.result = { ...partial, score };
    this.phase = 'over';
    this.turnStartedAt = null;
    this.drawOfferBy = null;

    const white = this.playerOf('w');
    const black = this.playerOf('b');
    this.pgn = toPgn(
      {
        white: white?.name ?? NAMES.w,
        black: black?.name ?? NAMES.b,
        result: score,
        timeControl: timeControlLabel(this.rules),
        termination: partial.reason,
        startFen: this.startFen,
      },
      this.sans,
    );

    if (partial.winner) {
      const victor = this.playerOf(partial.winner);
      this.note('won', 'good', { a: victor?.name ?? NAMES[partial.winner], r: partial.reason });
      this.fx(partial.reason === 'checkmate' ? 'mate' : 'move');
    } else {
      this.note('drawn', 'sharp', { r: partial.reason });
      this.fx('draw');
    }
  }

  private repeatCount(): number {
    if (this.repKeys.length === 0) return 0;
    const key = this.repKeys[this.repKeys.length - 1];
    let count = 0;
    for (const seen of this.repKeys) if (seen === key) count++;
    return count;
  }

  // ------------------------------------------------------------------ clocks

  private armClock() {
    if (this.phase !== 'play' || this.result) {
      this.turnStartedAt = null;
      return;
    }
    if (!this.anyPlayerOnline()) {
      this.parkClock();
      return;
    }
    this.offlineSince = null;
    if (this.turnStartedAt === null) this.turnStartedAt = Date.now();
    void this.ctx.storage.setAlarm(this.turnStartedAt + this.clocks[this.pos.turn]);
  }

  /** Bank the time thought so far and stop the clock for an empty room. */
  private parkClock() {
    const now = Date.now();
    // Already parked, with the reaper alarm set — nothing to do.
    if (this.turnStartedAt === null && this.offlineSince !== null) return;
    if (this.turnStartedAt !== null) {
      const side = this.pos.turn;
      this.clocks[side] = Math.max(1, this.clocks[side] - (now - this.turnStartedAt));
      const player = this.playerOf(side);
      if (player) player.msLeft = this.clocks[side];
      this.turnStartedAt = null;
    }
    this.offlineSince = this.offlineSince ?? now;
    this.note('parked', 'info');
    void this.ctx.storage.setAlarm(this.offlineSince + ABANDON_MS);
    this.broadcast();
  }

  // ----------------------------------------------------------------- helpers

  private anyoneOnline(): boolean {
    return [...this.seats.values()].some((seat) => seat.online);
  }

  /**
   * Only the two players own clocks, so a room full of spectators with both
   * players gone still counts as abandoned — while a player sitting there
   * thinking is emphatically not idle.
   */
  private anyPlayerOnline(): boolean {
    return [...this.seats.values()].some((seat) => seat.color && seat.online);
  }

  private hasHost(): boolean {
    return [...this.seats.values()].some((seat) => seat.host && seat.online);
  }

  private playerOf(color: Color): SeatRec | null {
    return [...this.seats.values()].find((seat) => seat.color === color) ?? null;
  }

  private seatOf(socket: WebSocket): SeatRec {
    const id = this.sockets.get(socket);
    const seat = id ? this.seats.get(id) : undefined;
    if (!seat) throw new Error('Say hello first');
    return seat;
  }

  private requireHost(seat: SeatRec) {
    if (!seat.host) throw new Error('Only the host can do that');
  }

  private note(code: string, tone: LogLine['tone'], args?: Record<string, string | number>) {
    this.log = [...this.log, { id: ++this.logSeq, code, tone, args }].slice(-12);
  }

  private fx(kind: FxKind, text?: string) {
    for (const socket of this.sockets.keys()) this.push(socket, { t: 'fx', kind, text });
  }

  private view(viewerId: string | null): RoomView {
    const viewer = viewerId ? this.seats.get(viewerId) : undefined;
    const now = Date.now();
    const ticking = this.phase === 'play' && !this.result && this.turnStartedAt !== null ? this.pos.turn : null;

    const players: PlayerView[] = [...this.seats.values()]
      .filter((seat) => seat.color)
      .sort((a) => (a.color === 'w' ? -1 : 1))
      .map((seat) => {
        const color = seat.color as Color;
        const banked = this.phase === 'lobby' ? this.rules.minutes * 60_000 : this.clocks[color];
        const live = ticking === color && this.turnStartedAt !== null
          ? Math.max(0, banked - (now - this.turnStartedAt))
          : banked;
        return {
          id: seat.id,
          name: seat.name,
          seat: seat.color,
          host: seat.host,
          ready: seat.ready,
          online: seat.online,
          msLeft: live,
        };
      });

    const legal: Record<number, number[]> = {};
    const promoFrom: number[] = [];
    if (this.phase === 'play' && !this.result && viewer?.color === this.pos.turn) {
      for (const move of legalMoves(this.pos)) {
        (legal[move.from] ??= []).push(move.to);
        if (move.promo && !promoFrom.includes(move.from)) promoFrom.push(move.from);
      }
    }

    const checked = inCheck(this.pos, this.pos.turn);

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      players,
      spectators: [...this.seats.values()].filter((seat) => !seat.color).length,
      fen: toFen(this.pos),
      turn: this.pos.turn,
      halfmove: this.pos.half,
      checkSquare: checked ? findKing(this.pos, this.pos.turn) : -1,
      lastMove: this.lastMove,
      legal,
      promoFrom,
      history: this.history,
      startFen: this.startFen,
      now,
      turnEndsAt:
        ticking && this.turnStartedAt !== null ? this.turnStartedAt + this.clocks[ticking] : null,
      ticking,
      result: this.result,
      drawOfferBy: this.drawOfferBy,
      claimable: {
        threefold: this.phase === 'play' && !this.result && this.repeatCount() >= 3,
        fifty: this.phase === 'play' && !this.result && this.pos.half >= 100,
      },
      repeats: this.repeatCount(),
      pgn: this.pgn,
      log: this.log,
    };
  }

  private broadcast() {
    for (const [socket, seatId] of this.sockets) {
      const seat = seatId ? this.seats.get(seatId) : undefined;
      this.push(socket, {
        t: 'sync',
        room: this.view(seatId ?? null),
        youId: seatId ?? '',
        seat: (seat?.color ?? null) as Seat,
      });
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
