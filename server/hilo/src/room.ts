import { DurableObject } from 'cloudflare:workers';
import { bonusCard, hueFor, openingHand, pick, randomInt, shuffled } from './engine';
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
  secret: number | null;
}

export interface Env {
  HILO_ROOM: DurableObjectNamespace<HiloRoom>;
}

const GRACE_MS = 60_000;

export class HiloRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private choosers: string[] = [];
  private activeId: string | null = null;
  private direction: 1 | -1 = 1;
  private low = DEFAULT_RULES.min;
  private high = DEFAULT_RULES.max;
  private probe: number | null = null;
  private bluff: Call | null = null;
  private target: number | null = null;
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
        this.openingProbe(seat, msg.value);
        break;
      case 'call':
        this.makeCall(seat, msg.call, msg.value);
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
    this.low = this.rules.min;
    this.high = this.rules.max;
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
      player.secret = null;
      player.hand = openingHand();
    }

    this.order = shuffled(roster.map((p) => p.id));
    this.choosers = this.order.slice(0, Math.min(this.rules.choosers, this.order.length - 1));
    this.direction = 1;
    this.low = this.rules.min;
    this.high = this.rules.max;
    this.probe = null;
    this.bluff = null;
    this.target = null;
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
    this.choosers = [];
    this.activeId = null;
    this.probe = null;
    this.bluff = null;
    this.target = null;
    this.winnerId = null;
    this.playedCard = null;
    this.turnEndsAt = null;
    this.rotation = 0;
    this.voteYes.clear();
    this.voteCast.clear();
    this.low = this.rules.min;
    this.high = this.rules.max;
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

  // ----------------------------------------------------------------- secrets

  private lockSecret(seat: Seat, value: number) {
    if (this.phase !== 'secrets') throw new Error('Not picking secrets');
    if (!this.choosers.includes(seat.id)) throw new Error('You are not a chooser this round');
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < this.rules.min || n > this.rules.max) {
      throw new Error(`Pick between ${this.rules.min} and ${this.rules.max}`);
    }
    seat.secret = n;
    this.note('locked', 'wild', { a: seat.name });

    const locked = this.choosers
      .map((id) => this.seats.get(id)?.secret)
      .filter((v): v is number => typeof v === 'number');

    if (locked.length >= this.choosers.length) {
      this.target = pick(locked);
      this.phase = 'turn';
      this.activeId = this.order[0] ?? null;
      this.note('live', 'good');
      this.armTimer();
    }
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
        this.bluff = bluff;
        this.note('bluffed', 'wild', { a: seat.name, d: bluff });
        this.fx('bluff', seat.id, bluff.toUpperCase());
        break;
      }
      case 'narrow': {
        const span = this.high - this.low;
        const mid = Math.floor((this.low + this.high) / 2);
        const quarter = Math.max(1, Math.floor(span / 4));
        let nextLow = mid - quarter;
        let nextHigh = mid + quarter;
        if (this.target != null) {
          nextLow = Math.min(nextLow, this.target);
          nextHigh = Math.max(nextHigh, this.target);
        }
        this.low = Math.max(this.low, nextLow);
        this.high = Math.min(this.high, nextHigh);
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

  private openingProbe(seat: Seat, value: number) {
    this.requireTurn(seat);
    if (this.probe !== null) throw new Error('The round is already open');
    const n = this.validProbe(value);
    if (this.target != null && n === this.target) {
      this.probe = n;
      this.eliminate(seat, 'exactOpen', { a: seat.name }, 'mine');
      this.broadcast();
      return;
    }
    this.probe = n;
    this.bluff = null;
    this.playedCard = null;
    this.note('opened', 'info', { a: seat.name, n });
    this.advance(seat.id);
    this.broadcast();
  }

  private makeCall(seat: Seat, call: Call, value: number) {
    this.requireTurn(seat);
    if (this.probe === null || this.target === null) throw new Error('Open the round first');
    if (call !== 'higher' && call !== 'lower') throw new Error('Call higher or lower');

    const correct = call === 'higher' ? this.target > this.probe : this.target < this.probe;
    if (!correct) {
      this.eliminate(seat, 'burned', { a: seat.name, d: call });
      this.broadcast();
      return;
    }

    if (call === 'higher') this.low = Math.min(this.high, this.probe + 1);
    else this.high = Math.max(this.low, this.probe - 1);

    const n = this.validProbe(value);
    if (n === this.target) {
      this.probe = n;
      this.eliminate(seat, 'exact', { a: seat.name }, 'mine');
      this.broadcast();
      return;
    }

    this.probe = n;
    this.bluff = null;
    this.playedCard = null;
    this.rotation += 1;
    this.note('called', 'good', { a: seat.name, d: call, n });
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
  ) {
    seat.alive = false;
    seat.hand = [];
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
    this.advance(seat.id);
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

  private validProbe(value: number): number {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) throw new Error('Enter a number');
    if (n < this.low || n > this.high) {
      throw new Error(`Stay inside ${this.low.toLocaleString()} – ${this.high.toLocaleString()}`);
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

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      seats,
      order: this.order,
      activeId: this.activeId,
      direction: this.direction,
      low: this.low,
      high: this.high,
      probe: this.probe,
      bluff: this.bluff,
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
      chooser: this.choosers.includes(seat.id),
      locked: seat.secret !== null,
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
