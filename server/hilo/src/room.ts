import { DurableObject } from 'cloudflare:workers';
import { bonusCard, hueFor, openingHand, shuffled } from './engine';
import {
  DEFAULT_RULES,
  clampRules,
  type Call,
  type Card,
  type FxKind,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type RoomView,
  type Rules,
  type SeatView,
} from './protocol';

interface Seat {
  id: string;
  name: string;
  hue: number;
  host: boolean;
  ready: boolean;
  alive: boolean;
  online: boolean;
  hand: Card[];
  blind: number;
  /** The player's own hidden number for this round. */
  secret: number | null;
}

/** Every player's job is to crack the number of whoever is next-in-line for them.
 *  Hunts persist across a player's non-consecutive turns, but reset whenever their
 *  ring-neighbor changes (elimination, reverse) since the underlying secret differs. */
interface Hunt {
  targetId: string;
  low: number;
  high: number;
  probe: number | null;
  bluff: Call | null;
  /** A committed call awaiting its number — bounds are already narrowed to the true window. */
  pendingCall: Call | null;
  pendingCorrect: boolean;
}

export interface Env {
  HILO_ROOM: DurableObjectNamespace<HiloRoom>;
}

const GRACE_MS = 60_000;

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class HiloRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private activeId: string | null = null;
  private direction: 1 | -1 = 1;
  private hunts = new Map<string, Hunt>();
  private winnerId: string | null = null;
  private turnEndsAt: number | null = null;
  private playedCard: Card | null = null;
  private rotation = 0;
  private voteYes = new Set<string>();
  private voteCast = new Set<string>();
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

    server.addEventListener('message', (event: MessageEvent) => {
      this.receive(server, event.data);
    });
    const drop = () => this.disconnect(server);
    server.addEventListener('close', drop);
    server.addEventListener('error', drop);

    this.push(server, { t: 'sync', room: this.view(null), hand: [], youId: '' });

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
        if (!this.hasHost()) {
          const first = [...this.seats.values()][0];
          if (first) first.host = true;
        }
        this.note('swept', 'info');
        this.broadcast();
      }
      return;
    }

    if (this.phase !== 'turn' || !this.activeId || !this.turnEndsAt) return;
    if (Date.now() < this.turnEndsAt - 400) {
      await this.ctx.storage.setAlarm(this.turnEndsAt);
      return;
    }
    const seat = this.seats.get(this.activeId);
    if (!seat || !seat.alive) return;

    if (this.playedCard === 'shield') {
      this.note('shieldClock', 'wild', { a: seat.name });
      this.playedCard = null;
      this.advance(seat.id);
      this.broadcast();
      return;
    }
    this.eliminate(seat, 'timeout', { a: seat.name });
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
      case 'secret':
        this.lockSecret(seat, msg.value);
        break;
      case 'card':
        this.playCard(seat, msg.card, msg.target, msg.bluff);
        break;
      case 'probe':
        this.submitProbe(seat, msg.value);
        break;
      case 'call':
        this.commitCall(seat, msg.call);
        break;
      case 'pass':
        this.shieldPass(seat);
        break;
      case 'vote':
        this.castVote(seat, msg.yes);
        break;
      case 'again':
        this.resetToLobby(seat);
        break;
    }
  }

  private join(socket: WebSocket, keyRaw: string, nameRaw: string) {
    const key = String(keyRaw ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!key) throw new Error('Missing player id');
    const name = String(nameRaw ?? '').trim().slice(0, 16) || `Player ${this.seats.size + 1}`;

    // Drop any older socket bound to this same seat.
    for (const [other, seatId] of this.sockets) {
      if (other !== socket && seatId === key) this.sockets.set(other, null);
    }

    const existing = this.seats.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    if (this.phase !== 'lobby') throw new Error('Round already running — wait for the next lobby');
    if (this.seats.size >= this.rules.capacity) throw new Error('Table is full');

    const seat: Seat = {
      id: key,
      name,
      hue: hueFor(this.seats.size),
      host: this.seats.size === 0 || !this.hasHost(),
      ready: false,
      alive: true,
      online: true,
      hand: [],
      blind: 0,
      secret: null,
    };
    this.seats.set(key, seat);
    this.sockets.set(socket, key);
    this.note('seated', 'good', { a: name });
    this.broadcast();
  }

  private disconnect(socket: WebSocket) {
    const seatId = this.sockets.get(socket) ?? null;
    this.sockets.delete(socket);
    if (!seatId) return;

    const stillLinked = [...this.sockets.values()].includes(seatId);
    if (stillLinked) return;

    const seat = this.seats.get(seatId);
    if (!seat) return;
    seat.online = false;
    this.note('dropped', 'bad', { a: seat.name });

    // Seats survive short reconnects; the grace alarm sweeps abandoned lobby seats.
    if (this.phase === 'lobby') {
      void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
    }
    this.broadcast();
  }

  // ------------------------------------------------------------------- lobby

  private setRules(seat: Seat, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Rules are locked mid-round');
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

    const roster = [...this.seats.values()];
    if (roster.length < 3) throw new Error('Need at least 3 players');
    if (!roster.every((p) => p.ready || p.host)) throw new Error('Everyone must be ready');

    for (const player of roster) {
      player.alive = true;
      player.ready = false;
      player.blind = 0;
      player.hand = openingHand();
      player.secret = null;
    }

    this.order = shuffled(roster.map((p) => p.id));
    this.direction = 1;
    this.hunts.clear();
    this.winnerId = null;
    this.playedCard = null;
    this.rotation = 0;
    this.activeId = null;
    this.turnEndsAt = null;
    this.voteYes.clear();
    this.voteCast.clear();
    this.phase = 'secrets';

    this.note('dealt', 'wild');
    this.fx('deal');
    this.broadcast();
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.phase = 'lobby';
    this.order = [];
    this.activeId = null;
    this.hunts.clear();
    this.winnerId = null;
    this.playedCard = null;
    this.turnEndsAt = null;
    this.rotation = 0;
    this.voteYes.clear();
    this.voteCast.clear();
    for (const player of this.seats.values()) {
      player.ready = false;
      player.alive = true;
      player.hand = [];
      player.blind = 0;
      player.secret = null;
    }
    this.log = [];
    this.note('lobby', 'info');
    this.broadcast();
  }

  // ---------------------------------------------------------------- secrets

  private lockSecret(seat: Seat, value: number) {
    if (this.phase !== 'secrets') throw new Error('Not the secrets phase');
    if (!seat.alive) throw new Error('You are out of this round');
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < this.rules.min || n > this.rules.max) {
      throw new Error(`Pick a number between ${this.rules.min.toLocaleString()} and ${this.rules.max.toLocaleString()}`);
    }
    seat.secret = n;
    this.note('locked', 'info', { a: seat.name });

    const alive = this.aliveIds();
    if (alive.length > 0 && alive.every((id) => this.seats.get(id)?.secret != null)) {
      this.startTurns();
      return;
    }
    this.broadcast();
  }

  private startTurns() {
    this.hunts.clear();
    this.activeId = this.order[0] ?? null;
    this.phase = 'turn';
    this.note('turnsBegin', 'wild');
    this.armTimer();
    this.broadcast();
  }

  // -------------------------------------------------------------------- turn

  private playCard(seat: Seat, card: Card, targetId?: string, bluff?: Call) {
    this.requireTurn(seat);
    if (this.playedCard) throw new Error('One card per turn');
    const index = seat.hand.indexOf(card);
    if (index === -1) throw new Error('That card is not in your hand');
    seat.hand.splice(index, 1);
    this.playedCard = card;

    switch (card) {
      case 'reverse': {
        this.direction = this.direction === 1 ? -1 : 1;
        this.note('reversed', 'wild', { a: seat.name });
        this.fx('reverse', seat.id);
        break;
      }
      case 'skip': {
        const skipped = this.nextAlive(seat.id);
        const skippedSeat = this.seats.get(skipped);
        this.note('skipped', 'wild', { a: seat.name, b: skippedSeat?.name ?? '?' });
        this.fx('skip', skipped);
        this.playedCard = null;
        this.activeId = this.nextAlive(skipped);
        this.armTimer();
        break;
      }
      case 'shield': {
        this.note('shielded', 'wild', { a: seat.name });
        this.fx('shield', seat.id);
        break;
      }
      case 'bluff': {
        if (bluff !== 'higher' && bluff !== 'lower') throw new Error('Choose a bluff direction');
        const hunt = this.loadHunt(seat.id);
        hunt.bluff = bluff;
        this.note('bluffed', 'wild', { a: seat.name, d: bluff });
        this.fx('bluff', seat.id, bluff.toUpperCase());
        break;
      }
      case 'narrow': {
        const hunt = this.loadHunt(seat.id);
        const target = this.seats.get(hunt.targetId);
        const span = hunt.high - hunt.low;
        const mid = Math.floor((hunt.low + hunt.high) / 2);
        const quarter = Math.max(1, Math.floor(span / 4));
        let nextLow = mid - quarter;
        let nextHigh = mid + quarter;
        if (target?.secret != null) {
          nextLow = Math.min(nextLow, target.secret);
          nextHigh = Math.max(nextHigh, target.secret);
        }
        hunt.low = Math.max(hunt.low, nextLow);
        hunt.high = Math.min(hunt.high, nextHigh);
        this.note('narrowed', 'wild', { a: seat.name });
        this.fx('narrow', seat.id);
        break;
      }
      case 'blindfold': {
        const victim = targetId ? this.seats.get(targetId) : undefined;
        if (!victim || !victim.alive || victim.id === seat.id) throw new Error('Pick a living opponent');
        victim.blind = Math.max(victim.blind, 2);
        this.note('blindfolded', 'wild', { a: seat.name, b: victim.name });
        this.fx('blindfold', victim.id);
        break;
      }
    }

    this.broadcast();
  }

  /** Commits to higher/lower. Narrows the hunt window toward the truth immediately
   *  so the number step that follows always targets a window the player can trust —
   *  regardless of whether the call itself turns out to be right or wrong. */
  private commitCall(seat: Seat, call: Call) {
    this.requireTurn(seat);
    const hunt = this.loadHunt(seat.id);
    const target = this.seats.get(hunt.targetId);
    if (hunt.probe === null || !target) throw new Error('Open the hunt first');
    if (hunt.pendingCall) throw new Error('Already called — submit your number');
    if (call !== 'higher' && call !== 'lower') throw new Error('Call higher or lower');

    hunt.pendingCorrect = call === 'higher' ? target.secret! > hunt.probe : target.secret! < hunt.probe;
    if (target.secret! > hunt.probe) hunt.low = Math.min(hunt.high, hunt.probe + 1);
    else if (target.secret! < hunt.probe) hunt.high = Math.max(hunt.low, hunt.probe - 1);
    hunt.pendingCall = call;
    this.broadcast();
  }

  private submitProbe(seat: Seat, value: number) {
    this.requireTurn(seat);
    const hunt = this.loadHunt(seat.id);
    const target = this.seats.get(hunt.targetId);
    if (!target) throw new Error('No target to hunt');

    if (hunt.probe === null) {
      const n = this.validProbe(value, hunt.low, hunt.high);
      if (n === target.secret) {
        hunt.probe = n;
        this.eliminate(target, 'targetOutOpen', { a: seat.name, b: target.name }, 'mine', seat.id);
        this.broadcast();
        return;
      }
      hunt.probe = n;
      hunt.bluff = null;
      this.playedCard = null;
      this.note('opened', 'info', { a: seat.name, n });
      this.advance(seat.id);
      this.broadcast();
      return;
    }

    if (!hunt.pendingCall) throw new Error('Call higher or lower first');
    const call = hunt.pendingCall;
    const correct = hunt.pendingCorrect;

    const n = this.validProbe(value, hunt.low, hunt.high);
    if (n === target.secret) {
      hunt.probe = n;
      hunt.pendingCall = null;
      this.eliminate(target, 'targetOut', { a: seat.name, b: target.name }, 'mine', seat.id);
      this.broadcast();
      return;
    }

    hunt.probe = n;
    hunt.pendingCall = null;
    hunt.bluff = null;
    this.playedCard = null;
    this.rotation += 1;
    this.note(correct ? 'called' : 'missed', correct ? 'good' : 'info', { a: seat.name, d: call, n });
    this.afterTurn(seat.id);
    this.broadcast();
  }

  private shieldPass(seat: Seat) {
    this.requireTurn(seat);
    if (this.playedCard !== 'shield') throw new Error('Only a Shield lets you pass');
    this.playedCard = null;
    this.rotation += 1;
    this.note('passed', 'wild', { a: seat.name });
    this.afterTurn(seat.id);
    this.broadcast();
  }

  private afterTurn(fromId: string) {
    const alive = this.aliveIds();
    if (this.rotation >= alive.length && alive.length > 0) {
      this.rotation = 0;
      for (const id of alive) {
        const seat = this.seats.get(id);
        if (seat && seat.blind > 0) seat.blind -= 1;
      }
      if (this.rules.shuffleVotes && alive.length > 2) {
        this.phase = 'vote';
        this.voteYes.clear();
        this.voteCast.clear();
        this.turnEndsAt = null;
        this.note('rotation', 'wild');
        this.broadcast();
        return;
      }
    }
    this.advance(fromId);
  }

  private castVote(seat: Seat, yes: boolean) {
    if (this.phase !== 'vote') throw new Error('No vote running');
    if (!seat.alive) throw new Error('You are out');
    if (this.voteCast.has(seat.id)) throw new Error('You already voted');
    this.voteCast.add(seat.id);
    if (yes) this.voteYes.add(seat.id);

    const alive = this.aliveIds();
    if (this.voteCast.size >= alive.length) {
      if (this.voteYes.size === alive.length) {
        this.order = shuffled(alive);
        this.activeId = this.order[0];
        this.hunts.clear();
        this.note('shuffled', 'wild');
        this.fx('shuffle');
      } else {
        this.note('voteFailed', 'info');
        if (!this.activeId || !alive.includes(this.activeId)) this.activeId = alive[0];
        else this.activeId = this.nextAlive(this.activeId);
      }
      this.phase = 'turn';
      this.voteYes.clear();
      this.voteCast.clear();
      this.armTimer();
    }
    this.broadcast();
  }

  private eliminate(
    seat: Seat,
    code: string,
    args: Record<string, string | number>,
    kind: FxKind = 'out',
    pivotId: string = seat.id,
  ) {
    seat.alive = false;
    seat.hand = [];
    seat.secret = null;
    this.hunts.delete(seat.id);
    if (pivotId !== seat.id) this.hunts.delete(pivotId);
    this.playedCard = null;
    this.note(code, 'bad', args);
    this.fx(kind, seat.id, seat.name);

    const alive = this.aliveIds();
    for (const id of alive) {
      const survivor = this.seats.get(id);
      if (survivor) survivor.hand.push(bonusCard());
    }
    if (alive.length > 0) this.fx('deal');

    if (alive.length <= 1) {
      this.winnerId = alive[0] ?? null;
      this.phase = 'over';
      this.activeId = null;
      this.turnEndsAt = null;
      const champ = this.winnerId ? this.seats.get(this.winnerId)?.name : null;
      this.note(champ ? 'winner' : 'nosurvivor', 'good', champ ? { a: champ } : undefined);
      this.fx('win', this.winnerId ?? undefined, champ ?? undefined);
      return;
    }

    this.rotation = 0;
    this.advance(pivotId);
  }

  private advance(fromId: string) {
    this.activeId = this.nextAlive(fromId);
    this.armTimer();
  }

  private armTimer() {
    if (this.phase !== 'turn' || !this.activeId) {
      this.turnEndsAt = null;
      return;
    }
    this.turnEndsAt = Date.now() + this.rules.turnSeconds * 1000;
    void this.ctx.storage.setAlarm(this.turnEndsAt);
  }

  // ------------------------------------------------------------------ helpers

  /** Loads (or freshly starts) the hunt for `playerId` against their current ring-neighbor. */
  private loadHunt(playerId: string): Hunt {
    const targetId = this.nextAlive(playerId);
    const existing = this.hunts.get(playerId);
    if (existing && existing.targetId === targetId) return existing;
    const fresh: Hunt = {
      targetId,
      low: this.rules.min,
      high: this.rules.max,
      probe: null,
      bluff: null,
      pendingCall: null,
      pendingCorrect: false,
    };
    this.hunts.set(playerId, fresh);
    return fresh;
  }

  private validProbe(value: number, low: number, high: number): number {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) throw new Error('Enter a number');
    if (n < low || n > high) {
      throw new Error(`Stay inside ${low.toLocaleString()} – ${high.toLocaleString()}`);
    }
    return n;
  }

  private aliveIds(): string[] {
    return this.order.filter((id) => this.seats.get(id)?.alive);
  }

  private nextAlive(fromId: string): string {
    const alive = this.aliveIds();
    if (alive.length === 0) return fromId;
    const index = alive.indexOf(fromId);
    if (index === -1) return alive[0];
    const next = (index + this.direction + alive.length) % alive.length;
    return alive[next];
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

  private requireTurn(seat: Seat) {
    if (this.phase !== 'turn') throw new Error('Not the action phase');
    if (!seat.alive) throw new Error('You are out of this round');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
  }

  private note(code: string, tone: LogLine['tone'], args?: Record<string, string | number>) {
    this.log = [...this.log, { id: ++this.logSeq, code, tone, args }].slice(-8);
  }

  private fx(kind: FxKind, seatId?: string, text?: string) {
    this.blast({ t: 'fx', kind, seatId, text });
  }

  private view(viewerId: string | null): RoomView {
    const seats: SeatView[] = this.order.length
      ? (this.order
          .map((id) => this.seats.get(id))
          .filter(Boolean) as Seat[])
          .concat([...this.seats.values()].filter((s) => !this.order.includes(s.id)))
          .map((seat) => this.seatView(seat))
      : [...this.seats.values()].map((seat) => this.seatView(seat));

    const hunt = this.activeId && this.phase === 'turn' ? this.loadHunt(this.activeId) : null;

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      seats,
      order: this.order,
      activeId: this.activeId,
      targetId: hunt?.targetId ?? null,
      direction: this.direction,
      low: hunt?.low ?? this.rules.min,
      high: hunt?.high ?? this.rules.max,
      probe: hunt?.probe ?? null,
      bluff: hunt?.bluff ?? null,
      calling: hunt?.pendingCall ?? null,
      shielded: this.playedCard === 'shield',
      winnerId: this.winnerId,
      turnEndsAt: this.turnEndsAt,
      now: Date.now(),
      voteYes: this.voteYes.size,
      voteCast: this.voteCast.size,
      voteNeeded: this.aliveIds().length,
      youVoted: viewerId ? this.voteCast.has(viewerId) : false,
      log: this.log,
    };
  }

  private seatView(seat: Seat): SeatView {
    return {
      id: seat.id,
      name: seat.name,
      hue: seat.hue,
      host: seat.host,
      ready: seat.ready,
      alive: seat.alive,
      online: seat.online,
      cards: seat.hand.length,
      blind: seat.blind,
      locked: seat.secret != null,
    };
  }

  private broadcast() {
    for (const [socket, seatId] of this.sockets) {
      const seat = seatId ? this.seats.get(seatId) : undefined;
      this.push(socket, {
        t: 'sync',
        room: this.view(seatId ?? null),
        hand: seat?.hand ?? [],
        youId: seatId ?? '',
      });
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
