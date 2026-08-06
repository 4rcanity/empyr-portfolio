import { DurableObject } from 'cloudflare:workers';
import { blastCount, buildDeck, hueFor, paletteFor, shuffle } from './decks';
import {
  DEFAULT_RULES,
  DRAW_FACES,
  cardScore,
  clampRules,
  isWildFace,
  type Card,
  type Color,
  type Face,
  type FxKind,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type PlayerView,
  type RoomView,
  type Rules,
  type Side,
} from './protocol';

interface Seat {
  id: string;
  name: string;
  seat: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  hand: Card[];
  score: number;
  /** Eliminated by the No Mercy 25-card rule. */
  out: boolean;
}

export interface Env {
  UNO_ROOM: DurableObjectNamespace<UnoRoom>;
}

const GRACE_MS = 60_000;
/** How many turns in a row the clock may auto-play before the round is dropped. */
const IDLE_LIMIT = 8;
/** No Mercy knocks you out the moment your hand reaches this size. */
const MERCY_LIMIT = 25;

/** Hard cap on concurrent sockets per room so a single DO can't be flooded. */
const MAX_SOCKETS_PER_ROOM = 64;
/** Reject oversized inbound frames before they ever reach JSON.parse. */
const MAX_MESSAGE_CHARS = 4000;

export class UnoRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private rules: Rules = { ...DEFAULT_RULES };
  private seats = new Map<string, Seat>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private activeId: string | null = null;
  private direction: 1 | -1 = 1;

  private deck: Card[] = [];
  private discard: Card[] = [];
  private side: 'light' | 'dark' = 'light';
  private activeColor: Color = 'wild';

  /** Accumulated stacked draw penalty and the family it belongs to. */
  private pendingDraw = 0;
  private drewThisTurn = false;
  /** The card just drawn — the only one playable after a draw. */
  private drawnId: string | null = null;
  /** Players who have shouted UNO while sitting on one card. */
  private calledUno = new Set<string>();

  /** Consecutive turns resolved by the clock rather than by a player. */
  private idleTurns = 0;
  private dealerIndex = 0;
  private roundWinnerId: string | null = null;
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

    // Never keep a clock running for a table nobody is sitting at, and give up
    // on a table where every player has gone quiet — otherwise an abandoned
    // room re-arms its alarm on a loop forever.
    if (!this.anyoneOnline()) {
      this.turnEndsAt = null;
      return;
    }
    if (++this.idleTurns > IDLE_LIMIT) {
      this.note('abandoned', 'bad');
      this.stopRound();
      this.broadcast();
      return;
    }

    const seat = this.seats.get(this.activeId);
    if (!seat || seat.out) return;

    // Never let a missing player stall the table: take the pickup and move on.
    this.note('timeout', 'bad', { a: seat.name });
    if (this.pendingDraw > 0) {
      this.takePending(seat);
    } else {
      this.give(seat, 1);
      this.endTurn(1);
    }
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
    // Any deliberate move proves the table is still alive.
    if (msg.t === 'play' || msg.t === 'draw' || msg.t === 'pass' || msg.t === 'uno' || msg.t === 'catch') {
      this.idleTurns = 0;
    }
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
      case 'play':
        this.playCard(seat, msg.cardId, msg.color, msg.target);
        break;
      case 'draw':
        this.drawTurn(seat);
        break;
      case 'pass':
        this.passTurn(seat);
        break;
      case 'uno':
        this.callUno(seat);
        break;
      case 'catch':
        this.catchUno(seat, msg.playerId);
        break;
      case 'next':
        this.nextRound(seat);
        break;
      case 'again':
        this.resetToLobby(seat);
        break;
    }
  }

  private join(socket: WebSocket, keyRaw: string, nameRaw: string) {
    const key = String(keyRaw ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
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
      // The clock is parked while a table is empty — restart it on return.
      this.idleTurns = 0;
      if (this.phase === 'play' && !this.turnEndsAt) this.armTimer();
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
      score: 0,
      out: false,
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
    if (this.phase === 'lobby') void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
    this.broadcast();
  }

  // ------------------------------------------------------------------- lobby

  private setRules(seat: Seat, patch: Partial<Rules>) {
    this.requireHost(seat);
    if (this.phase !== 'lobby') throw new Error('Rules are locked once the deck is dealt');
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

    for (const player of roster) player.score = 0;
    this.order = roster.sort((a, b) => a.seat - b.seat).map((p) => p.id);
    this.dealerIndex = 0;
    this.winnerId = null;
    this.startRound();
  }

  private nextRound(seat: Seat) {
    this.requireHost(seat);
    if (this.phase !== 'roundOver') throw new Error('No round to advance');
    this.dealerIndex = (this.dealerIndex + 1) % Math.max(1, this.order.length);
    this.startRound();
  }

  private startRound() {
    this.deck = buildDeck(this.rules.pack);
    this.discard = [];
    this.side = 'light';
    this.pendingDraw = 0;
    this.drewThisTurn = false;
    this.drawnId = null;
    this.calledUno.clear();
    this.roundWinnerId = null;
    this.direction = 1;

    for (const id of this.order) {
      const player = this.seats.get(id);
      if (!player) continue;
      player.hand = [];
      player.out = false;
      for (let i = 0; i < this.rules.startingHand; i++) {
        const drawn = this.drawFromDeck();
        if (drawn) player.hand.push(drawn);
      }
    }

    // Turn the starter. Skip past anything that would fire an effect immediately.
    let starter = this.drawFromDeck();
    let guard = 0;
    while (starter && this.rules.pack !== 'allwild' && guard++ < 40) {
      const face = this.faceOf(starter).face;
      if (!isWildFace(face) && !DRAW_FACES[face] && face !== 'flip' && face !== 'skipAll') break;
      this.deck.push(starter);
      this.deck = shuffle(this.deck);
      starter = this.drawFromDeck();
    }
    if (starter) {
      this.discard.push(starter);
      const shown = this.faceOf(starter);
      this.activeColor = shown.color === 'wild' ? 'wild' : shown.color;
    }

    this.activeId = this.order[this.dealerIndex % this.order.length] ?? this.order[0] ?? null;
    this.phase = 'play';
    this.note('dealt', 'wild', { a: this.packName() });
    this.fx('round');
    this.armTimer();
    this.broadcast();
  }

  private resetToLobby(seat: Seat) {
    this.requireHost(seat);
    this.phase = 'lobby';
    this.order = [];
    this.activeId = null;
    this.deck = [];
    this.discard = [];
    this.pendingDraw = 0;
    this.drewThisTurn = false;
    this.drawnId = null;
    this.calledUno.clear();
    this.roundWinnerId = null;
    this.winnerId = null;
    this.turnEndsAt = null;
    this.side = 'light';
    this.activeColor = 'wild';
    for (const player of this.seats.values()) {
      player.ready = false;
      player.hand = [];
      player.score = 0;
      player.out = false;
    }
    this.log = [];
    this.note('lobby', 'info');
    this.broadcast();
  }

  // -------------------------------------------------------------------- play

  private playCard(seat: Seat, cardId: string, color?: Color, target?: string) {
    if (this.phase !== 'play') throw new Error('No round running');
    if (seat.out) throw new Error('You are out of this round');

    const index = seat.hand.findIndex((c) => c.id === cardId);
    if (index === -1) throw new Error('That card is not in your hand');
    const card = seat.hand[index];
    const shown = this.faceOf(card);

    const yourTurn = this.activeId === seat.id;
    if (!yourTurn) {
      // Jump-in: an exact duplicate of the top card can be slammed down out of turn.
      if (!this.effectiveJumpIn() || !this.isExactMatch(shown)) throw new Error('Not your turn');
      this.activeId = seat.id;
      this.drewThisTurn = false;
      this.drawnId = null;
      this.note('jumpedIn', 'wild', { a: seat.name });
    }

    if (this.drewThisTurn && this.drawnId && card.id !== this.drawnId) {
      throw new Error('You drew — play that card or pass');
    }
    if (!this.canPlay(card)) throw new Error('That card does not match');

    // Wilds need a colour, except in All Wild where colour is meaningless.
    let chosen: Color | null = null;
    if (isWildFace(shown.face) && this.rules.pack !== 'allwild') {
      const palette = paletteFor(this.side);
      if (!color || !palette.includes(color)) throw new Error('Pick a colour for that wild');
      chosen = color;
    }

    seat.hand.splice(index, 1);
    this.discard.push(card);
    this.drewThisTurn = false;
    this.drawnId = null;
    if (seat.hand.length !== 1) this.calledUno.delete(seat.id);

    this.activeColor = chosen ?? (shown.color === 'wild' ? 'wild' : shown.color);
    this.note('played', 'info', { a: seat.name, f: shown.face, c: this.activeColor });
    this.fx('play', seat.id);

    if (seat.hand.length === 0) {
      this.finishRound(seat);
      this.broadcast();
      return;
    }
    if (seat.hand.length === 1 && !this.calledUno.has(seat.id)) this.fx('uno', seat.id);

    this.applyEffect(seat, shown, target);
    this.broadcast();
  }

  /** Everything a freshly played card does to the table. */
  private applyEffect(seat: Seat, shown: Side, target?: string) {
    const face = shown.face;
    const aliveCount = this.aliveIds().length;

    if (face === 'flip') {
      this.side = this.side === 'light' ? 'dark' : 'light';
      const top = this.topSide();
      this.activeColor = top && top.color !== 'wild' ? top.color : this.activeColor;
      this.note('flipped', 'wild', { a: seat.name, s: this.side });
      this.fx('flip');
      this.endTurn(1);
      return;
    }

    if (face === 'discardAll') {
      const colorToDump = this.activeColor;
      const kept: Card[] = [];
      let dumped = 0;
      for (const held of seat.hand) {
        if (this.faceOf(held).color === colorToDump) {
          this.discard.push(held);
          dumped++;
        } else {
          kept.push(held);
        }
      }
      seat.hand = kept;
      this.note('discardedAll', 'wild', { a: seat.name, n: dumped, c: colorToDump });
      if (seat.hand.length === 0) {
        this.finishRound(seat);
        return;
      }
      this.endTurn(1);
      return;
    }

    if (face === 'blast') {
      const victimId = this.nextAliveFrom(seat.id, 1);
      const victim = this.seats.get(victimId);
      if (victim) {
        const count = blastCount();
        this.give(victim, count);
        this.note('blasted', 'bad', { a: seat.name, b: victim.name, n: count });
        this.fx('blast', victim.id);
      }
      this.endTurn(2);
      return;
    }

    const drawAmount = DRAW_FACES[face];
    if (drawAmount) {
      if (face === 'wildRev4') this.direction = this.direction === 1 ? -1 : 1;
      if (this.effectiveStacking()) {
        this.pendingDraw += drawAmount;
        this.note('stacked', 'bad', { a: seat.name, n: this.pendingDraw });
        this.endTurn(1);
      } else {
        const victimId = this.nextAliveFrom(seat.id, 1);
        const victim = this.seats.get(victimId);
        if (victim) {
          this.give(victim, drawAmount);
          this.note('forcedDraw', 'bad', { a: seat.name, b: victim.name, n: drawAmount });
        }
        this.endTurn(2);
      }
      return;
    }

    if (face === 'skip' || face === 'wildSkip') {
      const victimId = this.nextAliveFrom(seat.id, 1);
      this.note('skipped', 'wild', { a: seat.name, b: this.seats.get(victimId)?.name ?? '?' });
      this.fx('skip', victimId);
      this.endTurn(2);
      return;
    }

    if (face === 'skipAll' || face === 'wildSkipAll') {
      this.note('skippedAll', 'wild', { a: seat.name });
      this.fx('skip');
      this.endTurn(0);
      return;
    }

    if (face === 'reverse' || face === 'wildRev') {
      this.direction = this.direction === 1 ? -1 : 1;
      this.note('reversed', 'wild', { a: seat.name });
      this.fx('reverse');
      // Heads-up reverse behaves as a skip, so the player goes again.
      this.endTurn(aliveCount <= 2 ? 0 : 1);
      return;
    }

    if (this.rules.sevenZero && (face === '7' || face === '0')) {
      if (face === '7') {
        const partner = target ? this.seats.get(target) : undefined;
        if (partner && !partner.out && partner.id !== seat.id) {
          const mine = seat.hand;
          seat.hand = partner.hand;
          partner.hand = mine;
          this.calledUno.delete(seat.id);
          this.calledUno.delete(partner.id);
          this.note('swapped', 'wild', { a: seat.name, b: partner.name });
          this.fx('swap', partner.id);
        }
      } else {
        const ids = this.aliveIds();
        if (ids.length > 1) {
          const hands = ids.map((id) => this.seats.get(id)!.hand);
          for (let i = 0; i < ids.length; i++) {
            const from = this.direction === 1
              ? (i - 1 + ids.length) % ids.length
              : (i + 1) % ids.length;
            this.seats.get(ids[i])!.hand = hands[from];
            this.calledUno.delete(ids[i]);
          }
          this.note('rotated', 'wild', { a: seat.name });
          this.fx('swap');
        }
      }
    }

    this.endTurn(1);
  }

  private drawTurn(seat: Seat) {
    if (this.phase !== 'play') throw new Error('No round running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (seat.out) throw new Error('You are out of this round');

    if (this.pendingDraw > 0) {
      this.takePending(seat);
      this.broadcast();
      return;
    }
    if (this.drewThisTurn) throw new Error('You already drew — play it or pass');

    if (this.effectiveDrawToMatch()) {
      let taken = 0;
      let playable = false;
      while (taken < 30) {
        const card = this.drawFromDeck();
        if (!card) break;
        seat.hand.push(card);
        taken++;
        if (this.canPlay(card)) {
          this.drawnId = card.id;
          playable = true;
          break;
        }
      }
      this.note('drewUntil', 'info', { a: seat.name, n: taken });
      this.drewThisTurn = true;
      this.fx('draw', seat.id);
      if (!playable) {
        this.drawnId = null;
        this.endTurn(1);
      }
      this.checkMercy(seat);
      this.broadcast();
      return;
    }

    const card = this.drawFromDeck();
    if (card) {
      seat.hand.push(card);
      this.drawnId = this.canPlay(card) ? card.id : null;
    }
    this.drewThisTurn = true;
    this.calledUno.delete(seat.id);
    this.note('drew', 'info', { a: seat.name });
    this.fx('draw', seat.id);
    if (!this.drawnId) this.endTurn(1);
    this.checkMercy(seat);
    this.broadcast();
  }

  private passTurn(seat: Seat) {
    if (this.phase !== 'play') throw new Error('No round running');
    if (this.activeId !== seat.id) throw new Error('Not your turn');
    if (!this.drewThisTurn) throw new Error('Draw first');
    this.note('passed', 'info', { a: seat.name });
    this.endTurn(1);
    this.broadcast();
  }

  /** Eat the stacked pile and lose the turn. */
  private takePending(seat: Seat) {
    const owed = this.pendingDraw;
    this.pendingDraw = 0;
    this.give(seat, owed);
    this.note('atePile', 'bad', { a: seat.name, n: owed });
    this.fx('draw', seat.id);
    this.endTurn(1);
  }

  private callUno(seat: Seat) {
    if (this.phase !== 'play') throw new Error('No round running');
    if (seat.hand.length > 2) throw new Error('Too early to call UNO');
    this.calledUno.add(seat.id);
    this.note('calledUno', 'good', { a: seat.name });
    this.fx('uno', seat.id);
    this.broadcast();
  }

  private catchUno(seat: Seat, playerId: string) {
    if (this.phase !== 'play') throw new Error('No round running');
    const victim = this.seats.get(playerId);
    if (!victim || victim.out) throw new Error('Nobody to catch');
    if (victim.id === seat.id) throw new Error('You cannot catch yourself');
    if (victim.hand.length !== 1 || this.calledUno.has(victim.id)) {
      throw new Error('They are covered');
    }
    this.give(victim, 2);
    this.note('caught', 'bad', { a: seat.name, b: victim.name });
    this.fx('caught', victim.id);
    this.checkMercy(victim);
    this.broadcast();
  }

  // ------------------------------------------------------------- round close

  private finishRound(winner: Seat) {
    this.roundWinnerId = winner.id;
    let pot = 0;
    for (const id of this.order) {
      const player = this.seats.get(id);
      if (!player || player.id === winner.id) continue;
      for (const card of player.hand) pot += cardScore(this.faceOf(card).face);
    }
    winner.score += pot;
    this.note('wonRound', 'good', { a: winner.name, n: pot });
    this.fx('round', winner.id, winner.name);

    this.turnEndsAt = null;
    this.activeId = null;
    this.calledUno.clear();
    this.pendingDraw = 0;

    if (this.rules.targetScore > 0 && winner.score >= this.rules.targetScore) {
      this.declareWinner(winner);
    } else if (this.rules.targetScore === 0) {
      this.declareWinner(winner);
    } else {
      this.phase = 'roundOver';
    }
  }

  private declareWinner(winner: Seat) {
    this.winnerId = winner.id;
    this.phase = 'over';
    this.note('winner', 'good', { a: winner.name, n: winner.score });
    this.fx('win', winner.id, winner.name);
  }

  /** No Mercy: 25 cards and you are gone. Last player standing takes it. */
  private checkMercy(seat: Seat) {
    if (this.rules.pack !== 'nomercy' || seat.out) return;
    if (seat.hand.length < MERCY_LIMIT) return;

    seat.out = true;
    seat.hand = [];
    this.calledUno.delete(seat.id);
    this.note('mercyOut', 'bad', { a: seat.name, n: MERCY_LIMIT });
    this.fx('out', seat.id, seat.name);

    const left = this.aliveIds();
    if (left.length <= 1) {
      const survivor = left[0] ? this.seats.get(left[0]) : undefined;
      if (survivor) {
        this.roundWinnerId = survivor.id;
        this.turnEndsAt = null;
        this.activeId = null;
        this.declareWinner(survivor);
      }
      return;
    }
    if (this.activeId === seat.id) this.endTurn(1);
  }

  // ----------------------------------------------------------------- helpers

  /** The face currently showing on a card, honouring the Flip side. */
  private faceOf(card: Card): Side {
    return this.side === 'dark' && card.b ? card.b : card.a;
  }

  private topSide(): Side | null {
    const top = this.discard[this.discard.length - 1];
    return top ? this.faceOf(top) : null;
  }

  private isExactMatch(shown: Side): boolean {
    const top = this.topSide();
    if (!top) return false;
    return top.color === shown.color && top.face === shown.face;
  }

  private canPlay(card: Card): boolean {
    const shown = this.faceOf(card);
    // All Wild has no colours to match — everything is always legal.
    if (this.rules.pack === 'allwild') return true;

    if (this.pendingDraw > 0) {
      // Mid-stack you may only answer with another pickup card.
      return this.effectiveStacking() && Boolean(DRAW_FACES[shown.face]);
    }
    if (shown.color === 'wild') return true;
    if (this.activeColor !== 'wild' && shown.color === this.activeColor) return true;
    const top = this.topSide();
    return Boolean(top && top.face === shown.face);
  }

  private effectiveStacking(): boolean {
    return this.rules.pack === 'nomercy' ? true : this.rules.stacking;
  }

  private effectiveJumpIn(): boolean {
    return this.rules.houseRules && this.rules.jumpIn && this.rules.pack !== 'allwild';
  }

  private effectiveDrawToMatch(): boolean {
    return this.rules.houseRules && this.rules.drawToMatch;
  }

  private drawFromDeck(): Card | null {
    if (this.deck.length === 0) this.recycle();
    return this.deck.pop() ?? null;
  }

  /** Fold the discard pile (minus its top card) back into the deck. */
  private recycle() {
    if (this.discard.length <= 1) return;
    const top = this.discard.pop()!;
    this.deck = shuffle(this.discard);
    this.discard = [top];
    this.note('reshuffled', 'info');
  }

  private give(seat: Seat, count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.drawFromDeck();
      if (!card) break;
      seat.hand.push(card);
    }
    if (seat.hand.length !== 1) this.calledUno.delete(seat.id);
    this.checkMercy(seat);
  }

  private aliveIds(): string[] {
    return this.order.filter((id) => {
      const seat = this.seats.get(id);
      return seat && !seat.out;
    });
  }

  private nextAliveFrom(fromId: string, steps: number): string {
    const alive = this.aliveIds();
    if (alive.length === 0) return fromId;
    let index = alive.indexOf(fromId);
    if (index === -1) index = 0;
    const next = (index + this.direction * steps) % alive.length;
    return alive[(next + alive.length) % alive.length];
  }

  /** Hand the turn on by `steps` seats. `0` keeps it with the current player. */
  private endTurn(steps: number) {
    if (this.phase !== 'play') return;
    this.drewThisTurn = false;
    this.drawnId = null;
    if (this.activeId && steps > 0) {
      this.activeId = this.nextAliveFrom(this.activeId, steps);
    }
    this.armTimer();
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

  /** Drop a dead round back to the lobby without wiping the scoreboard. */
  private stopRound() {
    this.phase = 'lobby';
    this.activeId = null;
    this.turnEndsAt = null;
    this.idleTurns = 0;
    this.pendingDraw = 0;
    this.drewThisTurn = false;
    this.drawnId = null;
    this.calledUno.clear();
    this.deck = [];
    this.discard = [];
    this.side = 'light';
    this.activeColor = 'wild';
    for (const seat of this.seats.values()) {
      seat.ready = false;
      seat.hand = [];
      seat.out = false;
    }
  }

  private reseat() {
    let index = 0;
    for (const seat of [...this.seats.values()].sort((a, b) => a.seat - b.seat)) {
      seat.seat = index++;
    }
  }

  private packName(): string {
    return this.rules.pack;
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
    this.log = [...this.log, { id: ++this.logSeq, code, tone, args }].slice(-10);
  }

  private fx(kind: FxKind, playerId?: string, text?: string) {
    this.blast({ t: 'fx', kind, playerId, text });
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
        score: seat.score,
        out: seat.out,
        uno: this.calledUno.has(seat.id),
        exposed: seat.hand.length === 1 && !this.calledUno.has(seat.id),
      }));

    return {
      code: this.code,
      phase: this.phase,
      rules: this.rules,
      players,
      activeId: this.activeId,
      direction: this.direction,
      side: this.side,
      top: this.topSide(),
      activeColor: this.activeColor,
      deckLeft: this.deck.length,
      discardCount: this.discard.length,
      pendingDraw: this.pendingDraw,
      drewThisTurn: this.drewThisTurn,
      // Only the player who drew it needs to know which card it was.
      drawnId: viewerId && viewerId === this.activeId ? this.drawnId : null,
      turnEndsAt: this.turnEndsAt,
      now: Date.now(),
      roundWinnerId: this.roundWinnerId,
      winnerId: this.winnerId,
      log: this.log,
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

/** Exposed for the worker entry point. */
export type { Face, Color };
export { hueFor };
