import { DurableObject } from 'cloudflare:workers';
import { buildDeck, countLies, loadCylinder, pullTrigger, rollTable } from './table';
import {
  CLASSIC_RULES,
  DEFAULT_RULES,
  clampRules,
  matchesTable,
  oddsIn,
  variantOf,
  type Card,
  type Claim,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type PlayerView,
  type Rank,
  type RoomView,
  type Rules,
  type Showdown,
  type Stage,
  type TableCard,
} from './protocol';

interface Seat {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  hand: Card[];
  /** Out of cards for this round. */
  done: boolean;
  /** Chambers already turned on their own revolver. */
  spent: number;
  /** Which chambers hold a live round. Never leaves the server. */
  live: number[];
  dead: boolean;
  diedRound: number;
  clicks: number;
  caught: number;
  misfires: number;
}

/** The face-down pile, cards and all. Only the count ever goes on the wire. */
interface Pile {
  playerId: string;
  playerName: string;
  cards: Card[];
  turn: number;
  auto: boolean;
}

export interface Env {
  LIARS_ROOM: DurableObjectNamespace<LiarsRoom>;
}

const GRACE_MS = 60_000;
/** How many turns in a row the clock may play before the table is abandoned. */
const IDLE_LIMIT = 8;
/** A stage may only be cut short once the verdict has had a moment to land. */
const SKIP_FLOOR_MS = 400;

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class LiarsRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private activeId: string | null = null;

  private deck: Card[] = [];
  private table: TableCard = 'king';
  private claim: Pile | null = null;
  /** Cards played earlier this round that can no longer be challenged. */
  private buried = 0;

  private round = 0;
  private turn = 0;
  private turnSeq = 0;
  private starterId: string | null = null;
  private stage: Stage | null = null;
  /** Players who asked to move past the current stage. */
  private acks = new Set<string>();
  private stageSeq = 0;
  private winnerId: string | null = null;
  private turnEndsAt: number | null = null;
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

    this.push(server, { t: 'sync', room: this.view(null), hand: [], youId: '' });
    return new Response(null, { status: 101, webSocket: client });
  }

  async alarm(): Promise<void> {
    if (this.phase === 'lobby') {
      this.sweep();
      return;
    }

    if (this.phase === 'showdown' && this.stage) {
      // A table with nobody left watching does not deserve another deal.
      if (!this.anyoneOnline()) {
        this.stopGame();
        this.note('abandoned', 'bad');
        this.broadcast();
        return;
      }
      if (Date.now() < this.stage.endsAt - 400) {
        await this.ctx.storage.setAlarm(this.stage.endsAt);
        return;
      }
      this.leaveStage();
      this.broadcast();
      return;
    }

    if (this.phase !== 'play' || !this.activeId || !this.turnEndsAt) return;
    if (Date.now() < this.turnEndsAt - 400) {
      await this.ctx.storage.setAlarm(this.turnEndsAt);
      return;
    }

    // Never keep a clock running for a table nobody is sitting at, and give up
    // on a table where everybody has gone quiet — otherwise an abandoned room
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

    const seat = this.activeId ? this.seats.get(this.activeId) : undefined;
    if (!seat) return;
    this.autoPlay(seat);
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
    // Any deliberate move proves the table is still awake.
    if (
      msg.t === 'play' ||
      msg.t === 'liar' ||
      msg.t === 'ready' ||
      msg.t === 'begin' ||
      msg.t === 'onward'
    ) {
      this.idleTurns = 0;
    }
    switch (msg.t) {
      case 'rules':
        this.setRules(seat, msg.patch);
        break;
      case 'preset':
        this.setRules(seat, CLASSIC_RULES);
        break;
      case 'ready':
        this.setReady(seat, msg.on);
        break;
      case 'begin':
        this.begin(seat);
        break;
      case 'play':
        this.playCards(seat, msg.cardIds);
        break;
      case 'liar':
        this.callLiar(seat);
        break;
      case 'onward':
        this.ackStage(seat);
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

    for (const [other, seatId] of this.sockets) {
      if (other !== socket && seatId === key) this.sockets.set(other, null);
    }

    const existing = this.seats.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      // The clock is parked while the table is empty — restart it on return.
      this.idleTurns = 0;
      if (this.phase === 'play' && !this.turnEndsAt) this.armTimer();
      if (this.phase === 'showdown' && this.stage) void this.ctx.storage.setAlarm(this.stage.endsAt);
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    if (this.phase !== 'lobby') throw new Error('Game already running — wait for the next lobby');
    if (this.seats.size >= this.rules.capacity) throw new Error('Table is full');

    this.seats.set(key, {
      id: key,
      name,
      seat: this.seats.size,
      host: this.seats.size === 0 || !this.hasHost(),
      ready: false,
      online: true,
      hand: [],
      done: false,
      spent: 0,
      live: [],
      dead: false,
      diedRound: 0,
      clicks: 0,
      caught: 0,
      misfires: 0,
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
    this.acks.delete(seat.id);
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
    if (this.phase !== 'lobby') throw new Error('The house rules are set once the cards are out');
    this.rules = clampRules(patch, this.rules);
    this.broadcast();
  }

  private setReady(seat: Seat, on: boolean) {
    // Between rounds the same button means "get on with it".
    if (this.phase === 'showdown') {
      this.ackStage(seat);
      return;
    }
    if (this.phase !== 'lobby') throw new Error('Not in the lobby');
    seat.ready = Boolean(on);
    this.broadcast();
  }

  private begin(seat: Seat) {
    this.requireHost(seat);
    if (this.phase === 'showdown') {
      this.ackStage(seat);
      return;
    }
    if (this.phase !== 'lobby') throw new Error('Already running');

    for (const [id, other] of [...this.seats]) {
      if (!other.online) this.seats.delete(id);
    }
    this.reseat();

    const roster = [...this.seats.values()];
    if (roster.length < 2) throw new Error('Need at least 2 players');
    if (!roster.every((player) => player.ready || player.host)) {
      throw new Error('Everyone must be ready');
    }

    for (const player of roster) {
      player.hand = [];
      player.done = false;
      player.spent = 0;
      player.live = loadCylinder(this.rules.chambers, this.rules.bullets);
      player.dead = false;
      player.diedRound = 0;
      player.clicks = 0;
      player.caught = 0;
      player.misfires = 0;
    }

    this.order = roster.sort((a, b) => a.seat - b.seat).map((player) => player.id);
    this.winnerId = null;
    this.round = 0;
    this.stage = null;
    this.acks.clear();
    this.idleTurns = 0;
    this.table = rollTable();
    this.note('opened', 'good', { a: variantOf(this.rules) });
    this.startRound(this.order[0] ?? null);
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.stopGame();
    this.note('lobby', 'info');
    this.broadcast();
  }

  // ------------------------------------------------------------------ rounds

  private startRound(starterId: string | null) {
    const alive = this.aliveIds();
    if (alive.length <= 1) {
      this.declareWinner(alive[0] ?? null);
      return;
    }

    if (!this.rules.fixedTable || this.round === 0) this.table = rollTable();
    this.round++;
    this.turn = 0;
    this.claim = null;
    this.buried = 0;
    this.stage = null;
    this.acks.clear();
    this.deck = buildDeck(this.rules, alive.length);

    for (const id of alive) {
      const seat = this.seats.get(id);
      if (!seat) continue;
      seat.hand = this.deck.splice(0, this.rules.handSize);
      seat.done = seat.hand.length === 0;
    }

    const from = starterId && alive.includes(starterId) ? starterId : alive[0];
    this.starterId = from;
    this.activeId = from;
    this.phase = 'play';
    this.note('dealt', 'info', { a: this.table, n: this.round });
    this.armTimer();
    this.broadcast();
  }

  /** Hand the turn on, or close the round if every hand is empty. */
  private advance(fromId: string) {
    const alive = this.aliveIds();
    const start = alive.indexOf(fromId);
    for (let step = 1; step <= alive.length; step++) {
      const seat = this.seats.get(alive[(Math.max(0, start) + step) % alive.length]);
      if (seat && !seat.done) {
        this.activeId = seat.id;
        this.armTimer();
        return;
      }
    }
    // Nobody is holding cards any more and nobody called it: the round dies quiet.
    this.enterStage(null, false);
  }

  // -------------------------------------------------------------------- play

  private playCards(seat: Seat, cardIdsRaw: string[]) {
    if (this.phase !== 'play') throw new Error('No round running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (seat.dead) throw new Error('You are out of the game');

    const ids = [...new Set((cardIdsRaw ?? []).map((id) => String(id)))];
    if (ids.length === 0) throw new Error('Pick at least one card');
    if (ids.length > this.rules.maxPlay) {
      throw new Error(`At most ${this.rules.maxPlay} cards in one claim`);
    }
    const cards: Card[] = [];
    for (const id of ids) {
      const found = seat.hand.find((card) => card.id === id);
      if (!found) throw new Error('That card is not in your hand');
      cards.push(found);
    }

    this.commitPlay(seat, cards, false);
    this.broadcast();
  }

  /** The clock plays a single random card rather than risking somebody's life. */
  private autoPlay(seat: Seat) {
    if (seat.hand.length === 0) {
      seat.done = true;
      this.advance(seat.id);
      return;
    }
    const card = seat.hand[Math.floor(Math.random() * seat.hand.length)];
    this.note('timeout', 'bad', { a: seat.name });
    this.commitPlay(seat, [card], true);
  }

  private commitPlay(seat: Seat, cards: Card[], auto: boolean) {
    const ids = new Set(cards.map((card) => card.id));
    seat.hand = seat.hand.filter((card) => !ids.has(card.id));

    // The previous claim survived unchallenged, so it can never be opened.
    if (this.claim) this.buried += this.claim.cards.length;
    this.turn++;
    this.claim = {
      playerId: seat.id,
      playerName: seat.name,
      cards,
      turn: this.turn,
      auto,
    };
    if (seat.hand.length === 0) seat.done = true;
    this.note('played', 'info', { a: seat.name, n: cards.length, c: this.table });
    this.advance(seat.id);
  }

  private callLiar(seat: Seat) {
    if (this.phase !== 'play') throw new Error('No round running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (seat.dead) throw new Error('You are out of the game');
    const pile = this.claim;
    if (!pile) throw new Error('Nothing has been played yet');
    if (pile.playerId === seat.id) throw new Error('You cannot call yourself a liar');
    this.resolveChallenge(seat, pile, false);
    this.broadcast();
  }

  /** Turn the cards over, name the loser, and make them pull. */
  private resolveChallenge(challenger: Seat, pile: Pile, auto: boolean) {
    const accused = this.seats.get(pile.playerId);
    if (!accused) throw new Error('That player has left the table');

    const revealed: Rank[] = pile.cards.map((card) => card.rank);
    const lies = countLies(revealed, this.table);
    const honest = lies === 0;
    const shooter = honest ? challenger : accused;

    this.note('challenged', 'bad', { a: challenger.name, b: accused.name });
    if (honest) {
      challenger.misfires++;
      this.note('honest', 'good', { a: accused.name, b: challenger.name, c: this.table });
    } else {
      accused.caught++;
      this.note('lied', 'bad', { a: accused.name, n: lies });
    }

    const before = oddsIn(this.rules.chambers, shooter.spent, this.bulletsLeft(shooter));
    const pull = pullTrigger(shooter.live, shooter.spent, this.rules.chambers);
    shooter.spent = Math.min(this.rules.chambers, shooter.spent + 1);

    if (pull.fatal) {
      shooter.dead = true;
      shooter.diedRound = this.round;
      shooter.hand = [];
      shooter.done = true;
      this.note('bang', 'shot', { a: shooter.name });
      this.note('eliminated', 'shot', { a: shooter.name, n: this.round });
    } else {
      shooter.clicks++;
      this.note('click', 'good', { a: shooter.name, n: before });
    }

    const showdown: Showdown = {
      id: ++this.turnSeq,
      table: this.table,
      accusedId: accused.id,
      accusedName: accused.name,
      challengerId: challenger.id,
      challengerName: challenger.name,
      count: pile.cards.length,
      revealed,
      honest,
      shooterId: shooter.id,
      shooterName: shooter.name,
      chamber: pull.chamber,
      chambersTotal: this.rules.chambers,
      oddsIn: before,
      fatal: pull.fatal,
      auto,
    };

    // The round is over either way: hands go in the bin and the deck is reshuffled.
    this.claim = null;
    const survivors = this.aliveIds();
    this.enterStage(showdown, survivors.length <= 1);
  }

  // ------------------------------------------------------------------- stage

  private enterStage(showdown: Showdown | null, final: boolean) {
    const now = Date.now();
    const span = showdown ? 4600 + showdown.count * 750 : 3000;
    this.phase = 'showdown';
    this.activeId = null;
    this.turnEndsAt = null;
    this.claim = null;
    this.acks.clear();
    this.stage = {
      id: ++this.stageSeq,
      showdown,
      startedAt: now,
      endsAt: now + span,
      final,
    };
    if (!showdown) this.note('quiet', 'info');
    void this.ctx.storage.setAlarm(this.stage.endsAt);
  }

  /**
   * Everybody at the table can agree to skip the wait. One impatient player
   * must never cut the gunshot short for the rest of the room, so the stage
   * only ends early once every online seat has asked for it.
   */
  private ackStage(seat: Seat) {
    if (this.phase !== 'showdown' || !this.stage) return;
    this.acks.add(seat.id);
    const online = [...this.seats.values()].filter((other) => other.online);
    const ready = online.length > 0 && online.every((other) => this.acks.has(other.id));
    if (ready && Date.now() - this.stage.startedAt >= SKIP_FLOOR_MS) this.leaveStage();
    this.broadcast();
  }

  private leaveStage() {
    const stage = this.stage;
    this.stage = null;
    this.acks.clear();
    const alive = this.aliveIds();
    if (alive.length <= 1) {
      this.declareWinner(alive[0] ?? null);
      return;
    }
    // The survivor of a shot opens the next round; a quiet round passes it on.
    const shooterId = stage?.showdown?.shooterId ?? null;
    const shooter = shooterId ? this.seats.get(shooterId) : undefined;
    const next =
      shooter && !shooter.dead
        ? shooter.id
        : this.nextAliveAfter(shooterId ?? this.starterId ?? alive[0]);
    this.startRound(next);
  }

  private declareWinner(id: string | null) {
    this.phase = 'over';
    this.activeId = null;
    this.turnEndsAt = null;
    this.claim = null;
    this.stage = null;
    this.acks.clear();
    this.winnerId = id;
    const seat = id ? this.seats.get(id) : undefined;
    if (seat) this.note('winner', 'good', { a: seat.name, n: seat.clicks });
    this.broadcast();
  }

  // ----------------------------------------------------------------- helpers

  private aliveIds(): string[] {
    return this.order.filter((id) => {
      const seat = this.seats.get(id);
      return Boolean(seat && !seat.dead);
    });
  }

  private nextAliveAfter(fromId: string): string {
    const alive = this.aliveIds();
    if (alive.length === 0) return fromId;
    const index = this.order.indexOf(fromId);
    for (let step = 1; step <= this.order.length; step++) {
      const candidate = this.order[(Math.max(0, index) + step) % this.order.length];
      if (alive.includes(candidate)) return candidate;
    }
    return alive[0];
  }

  private bulletsLeft(seat: Seat): number {
    return seat.live.filter((chamber) => chamber >= seat.spent).length;
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
    this.claim = null;
    this.stage = null;
    this.acks.clear();
    this.deck = [];
    this.buried = 0;
    this.round = 0;
    this.turn = 0;
    this.idleTurns = 0;
    for (const seat of this.seats.values()) {
      seat.ready = false;
      seat.hand = [];
      seat.done = false;
      seat.spent = 0;
      seat.live = [];
      seat.dead = false;
      seat.diedRound = 0;
      seat.clicks = 0;
      seat.caught = 0;
      seat.misfires = 0;
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

  private view(viewerId: string | null): RoomView {
    const players: PlayerView[] = [...this.seats.values()]
      .sort((a, b) => a.seat - b.seat)
      .map((seat) => ({
        id: seat.id,
        name: seat.name,
        seat: seat.seat,
        host: seat.host,
        ready: seat.ready,
        online: seat.online,
        cards: seat.hand.length,
        done: seat.done,
        spent: seat.spent,
        chambers: this.rules.chambers,
        bullets: this.bulletsLeft(seat),
        dead: seat.dead,
        diedRound: seat.diedRound,
        clicks: seat.clicks,
        caught: seat.caught,
        misfires: seat.misfires,
      }));

    // The pile goes out as a count and a name. Its faces stay on the server
    // until a challenge makes them public.
    const claim: Claim | null = this.claim
      ? {
          playerId: this.claim.playerId,
          playerName: this.claim.playerName,
          count: this.claim.cards.length,
          turn: this.claim.turn,
          auto: this.claim.auto,
        }
      : null;

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      variant: variantOf(this.rules),
      players,
      activeId: this.activeId,
      round: this.round,
      turn: this.turn,
      table: this.table,
      claim,
      buried: this.buried,
      deckLeft: this.deck.length,
      turnEndsAt: this.turnEndsAt,
      now: Date.now(),
      stage: this.stage,
      winnerId: this.winnerId,
      log: this.log,
      waiting: this.stage ? this.acks.size : 0,
      seated: [...this.seats.values()].filter((seat) => seat.online).length,
      youWaiting: Boolean(viewerId && this.acks.has(viewerId)),
    };
  }

  private broadcast() {
    for (const [socket, seatId] of this.sockets) {
      const seat = seatId ? this.seats.get(seatId) : undefined;
      this.push(socket, {
        t: 'sync',
        room: this.view(seatId ?? null),
        // A hand only ever travels to the connection that owns it.
        hand: seat?.hand ?? [],
        youId: seatId ?? '',
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

/** Exposed alongside the worker entry point. */
export { matchesTable };
