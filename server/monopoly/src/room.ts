import { DurableObject } from 'cloudflare:workers';
import {
  BOARD,
  CARD_BY_ID,
  FORTUNE,
  GROUPS,
  JAIL_TILE,
  LEDGER,
  OWNABLE,
  RAIL_TILES,
  UTIL_TILES,
  type CardDef,
} from './board';
import {
  countBuildings,
  drawCard,
  groupComplete,
  groupHasBuildings,
  groupHasMortgage,
  makeDeck,
  nearest,
  netWorth,
  rentFor,
  rollPair,
  shuffled,
  tokenFor,
  withInterest,
  type Deed,
} from './engine';
import {
  DEFAULT_SETTINGS,
  clampSettings,
  type AuctionView,
  type DeedView,
  type FxKind,
  type Inbound,
  type LogLine,
  type Outbound,
  type Phase,
  type PlayerView,
  type RoomView,
  type Settings,
  type Stage,
  type TradeBundle,
  type TradeView,
} from './protocol';

interface Player {
  id: string;
  name: string;
  token: number;
  host: boolean;
  ready: boolean;
  online: boolean;
  cash: number;
  pos: number;
  /** Failed escape attempts served; null when free. */
  jail: number | null;
  jailCardIds: string[];
  bankrupt: boolean;
}

interface Auction {
  tile: number;
  bid: number;
  leaderId: string | null;
  endsAt: number;
  liveIds: string[];
}

interface Trade {
  id: number;
  fromId: string;
  toId: string;
  give: TradeBundle;
  want: TradeBundle;
}

interface Debt {
  playerId: string;
  amount: number;
  toId: string | null;
  /** Where the turn resumes once the bill is settled. */
  resume: Stage;
  /** Set when the bill is "pay every rival" — settlement fans the cash out. */
  spread: string[] | null;
}

export interface Env {
  MONOPOLY_ROOM: DurableObjectNamespace<MonopolyRoom>;
}

const GRACE_MS = 90_000;
const BID_WINDOW_MS = 12_000;
/** How many turns in a row the clock may drive before the table is abandoned. */
const IDLE_LIMIT = 8;

export class MonopolyRoom extends DurableObject<Env> {
  private code = 'room';
  private phase: Phase = 'lobby';
  private stage: Stage = 'roll';
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private players = new Map<string, Player>();
  private sockets = new Map<WebSocket, string | null>();
  private order: string[] = [];
  private activeId: string | null = null;
  private dice: [number, number] | null = null;
  private doubles = 0;
  private rollAgain = false;
  private deeds: (Deed | null)[] = new Array(40).fill(null);
  private offerTile: number | null = null;
  private auction: Auction | null = null;
  private trade: Trade | null = null;
  private tradeSeq = 0;
  private debt: Debt | null = null;
  private vacationPot = 0;
  private housesLeft = DEFAULT_SETTINGS.maxHouses;
  private hotelsLeft = DEFAULT_SETTINGS.maxHotels;
  private fortunePile: string[] = [];
  private ledgerPile: string[] = [];
  private lastCard: string | null = null;
  private turnEndsAt: number | null = null;
  /** Consecutive turns resolved by the clock rather than by a player. */
  private idleTurns = 0;
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

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.sockets.set(server, null);

    server.addEventListener('message', (event: MessageEvent) => this.receive(server, event.data));
    const drop = () => this.disconnect(server);
    server.addEventListener('close', drop);
    server.addEventListener('error', drop);

    this.push(server, { t: 'sync', room: this.view(null), youId: '' });

    return new Response(null, { status: 101, webSocket: client });
  }

  // ------------------------------------------------------------------- alarms

  async alarm(): Promise<void> {
    if (this.phase === 'lobby') {
      let swept = false;
      for (const [id, player] of [...this.players]) {
        if (!player.online) {
          this.players.delete(id);
          swept = true;
        }
      }
      if (swept) {
        this.ensureHost();
        this.note('swept', 'info');
        this.broadcast();
      }
      return;
    }

    if (this.phase !== 'play') return;
    const now = Date.now();

    // Never keep a clock running for a table nobody is sitting at, and give up
    // on one where every player has gone quiet — otherwise an abandoned game
    // re-arms its alarm on a loop and keeps this object alive indefinitely.
    if (!this.anyoneOnline()) {
      this.turnEndsAt = null;
      return;
    }
    if (++this.idleTurns > IDLE_LIMIT) {
      // The reset clears the log, so the notice has to be written after it.
      this.resetToLobby(null);
      this.note('abandoned', 'bad');
      this.broadcast();
      return;
    }

    if (this.auction && now >= this.auction.endsAt - 400) {
      this.resolveAuction();
      this.broadcast();
      this.armAlarm();
      return;
    }

    if (!this.auction && this.turnEndsAt && now >= this.turnEndsAt - 400) {
      const who = this.activeId ? this.players.get(this.activeId) : null;
      if (who) this.note('timeout', 'bad', { a: who.name });
      this.autoTurn();
      this.broadcast();
    }

    this.armAlarm();
  }

  private armAlarm() {
    const stamps: number[] = [];
    if (this.auction) stamps.push(this.auction.endsAt);
    if (this.turnEndsAt && !this.auction) stamps.push(this.turnEndsAt);
    if (stamps.length === 0) return;
    void this.ctx.storage.setAlarm(Math.min(...stamps));
  }

  private armTurn() {
    this.turnEndsAt = Date.now() + this.settings.turnSeconds * 1000;
    this.armAlarm();
  }

  /** Drives the active seat forward when its clock runs out, so nothing ever stalls. */
  private autoTurn() {
    for (let guard = 0; guard < 10; guard++) {
      if (this.phase !== 'play' || !this.activeId || this.auction) break;
      const player = this.players.get(this.activeId);
      if (!player || player.bankrupt) break;

      if (this.stage === 'jail') {
        this.jailMove(player, player.jailCardIds.length > 0 ? 'card' : player.cash >= 50 ? 'pay' : 'roll');
        continue;
      }
      if (this.stage === 'roll') {
        this.doRoll(player);
        continue;
      }
      if (this.stage === 'buy') {
        this.decline(player);
        continue;
      }
      if (this.stage === 'debt') {
        this.autoLiquidate(player);
        continue;
      }
      this.endTurn(player);
      break;
    }
    if (this.phase === 'play' && !this.auction && this.turnEndsAt) this.armTurn();
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

    const player = this.playerOf(socket);
    // Any deliberate move proves the table is still alive.
    if (msg.t !== 'ready' && msg.t !== 'settings') this.idleTurns = 0;
    switch (msg.t) {
      case 'settings':
        this.setSettings(player, msg.patch);
        break;
      case 'ready':
        this.setReady(player, msg.on);
        break;
      case 'begin':
        this.begin(player);
        break;
      case 'roll':
        this.requireTurn(player, 'roll');
        this.doRoll(player);
        break;
      case 'jail':
        this.requireTurn(player, 'jail');
        this.jailMove(player, msg.how);
        break;
      case 'buy':
        this.requireTurn(player, 'buy');
        this.buy(player);
        break;
      case 'decline':
        this.requireTurn(player, 'buy');
        this.decline(player);
        break;
      case 'build':
        this.build(player, msg.tile);
        break;
      case 'sell':
        this.sellHouse(player, msg.tile);
        break;
      case 'mortgage':
        this.mortgage(player, msg.tile);
        break;
      case 'unmortgage':
        this.unmortgage(player, msg.tile);
        break;
      case 'bid':
        this.placeBid(player, msg.amount);
        break;
      case 'passBid':
        this.passBid(player);
        break;
      case 'trade':
        this.proposeTrade(player, msg.to, msg.give, msg.want);
        break;
      case 'tradeRespond':
        this.respondTrade(player, msg.accept);
        break;
      case 'tradeCancel':
        this.cancelTrade(player);
        break;
      case 'bankrupt':
        this.declareBankrupt(player);
        break;
      case 'endTurn':
        this.requireTurn(player, 'manage');
        this.endTurn(player);
        break;
      case 'again':
        this.resetToLobby(player);
        break;
    }
    this.broadcast();
  }

  private join(socket: WebSocket, keyRaw: string, nameRaw: string) {
    const key = String(keyRaw ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (!key) throw new Error('Missing player id');
    const name = String(nameRaw ?? '').trim().slice(0, 14) || `Player ${this.players.size + 1}`;

    for (const [other, boundId] of this.sockets) {
      if (other !== socket && boundId === key) this.sockets.set(other, null);
    }

    const existing = this.players.get(key);
    if (existing) {
      existing.name = name;
      existing.online = true;
      this.sockets.set(socket, key);
      // The clock is parked while a table is empty — restart it on return.
      this.idleTurns = 0;
      if (this.phase === 'play' && !this.auction && !this.turnEndsAt) this.armTurn();
      this.note('rejoined', 'info', { a: name });
      this.broadcast();
      return;
    }

    if (this.phase !== 'lobby') throw new Error('Game already running — wait for the next table');
    if (this.players.size >= this.settings.capacity) throw new Error('Table is full');

    this.players.set(key, {
      id: key,
      name,
      token: tokenFor(this.players.size),
      host: this.players.size === 0 || !this.hasHost(),
      ready: false,
      online: true,
      cash: this.settings.startCash,
      pos: 0,
      jail: null,
      jailCardIds: [],
      bankrupt: false,
    });
    this.sockets.set(socket, key);
    this.note('seated', 'good', { a: name });
    this.broadcast();
  }

  private disconnect(socket: WebSocket) {
    const id = this.sockets.get(socket) ?? null;
    this.sockets.delete(socket);
    if (!id) return;
    if ([...this.sockets.values()].includes(id)) return;

    const player = this.players.get(id);
    if (!player) return;
    player.online = false;
    this.note('dropped', 'bad', { a: player.name });

    if (this.phase === 'lobby') void this.ctx.storage.setAlarm(Date.now() + GRACE_MS);
    this.broadcast();
  }

  // -------------------------------------------------------------------- lobby

  private setSettings(player: Player, patch: Partial<Settings>) {
    this.requireHost(player);
    if (this.phase !== 'lobby') throw new Error('Settings are locked once the game starts');
    this.settings = clampSettings(patch, this.settings);
    this.housesLeft = this.settings.maxHouses;
    this.hotelsLeft = this.settings.maxHotels;
    for (const seat of this.players.values()) seat.cash = this.settings.startCash;
  }

  private setReady(player: Player, on: boolean) {
    if (this.phase !== 'lobby') throw new Error('Not in the lobby');
    player.ready = Boolean(on);
  }

  private begin(player: Player) {
    this.requireHost(player);
    if (this.phase !== 'lobby') throw new Error('Already running');

    for (const [id, seat] of [...this.players]) {
      if (!seat.online) this.players.delete(id);
    }

    const roster = [...this.players.values()];
    if (roster.length < 2) throw new Error('Need at least 2 players');
    if (!roster.every((seat) => seat.ready || seat.host)) throw new Error('Everyone must be ready');

    this.deeds = new Array(40).fill(null);
    for (const tile of OWNABLE) this.deeds[tile] = { owner: null, houses: 0, mortgaged: false };

    for (const seat of roster) {
      seat.cash = this.settings.startCash;
      seat.pos = 0;
      seat.jail = null;
      seat.jailCardIds = [];
      seat.bankrupt = false;
      seat.ready = false;
    }

    this.order = shuffled(roster.map((seat) => seat.id));
    this.activeId = this.order[0];
    this.phase = 'play';
    this.stage = 'roll';
    this.dice = null;
    this.doubles = 0;
    this.rollAgain = false;
    this.offerTile = null;
    this.auction = null;
    this.trade = null;
    this.debt = null;
    this.vacationPot = 0;
    this.housesLeft = this.settings.maxHouses;
    this.hotelsLeft = this.settings.maxHotels;
    this.fortunePile = makeDeck(FORTUNE);
    this.ledgerPile = makeDeck(LEDGER);
    this.lastCard = null;
    this.winnerId = null;
    this.log = [];

    this.note('begin', 'good');
    this.armTurn();
  }

  /** `player` is null when the server itself abandons a dead table. */
  private resetToLobby(player: Player | null) {
    if (player) this.requireHost(player);
    this.idleTurns = 0;
    this.phase = 'lobby';
    this.stage = 'roll';
    this.order = [];
    this.activeId = null;
    this.dice = null;
    this.doubles = 0;
    this.rollAgain = false;
    this.deeds = new Array(40).fill(null);
    this.offerTile = null;
    this.auction = null;
    this.trade = null;
    this.debt = null;
    this.vacationPot = 0;
    this.lastCard = null;
    this.turnEndsAt = null;
    this.winnerId = null;
    this.housesLeft = this.settings.maxHouses;
    this.hotelsLeft = this.settings.maxHotels;
    for (const seat of this.players.values()) {
      seat.ready = false;
      seat.bankrupt = false;
      seat.cash = this.settings.startCash;
      seat.pos = 0;
      seat.jail = null;
      seat.jailCardIds = [];
    }
    this.log = [];
    this.note('lobby', 'info');
  }

  // --------------------------------------------------------------- turn cycle

  private doRoll(player: Player) {
    if (this.auction) throw new Error('An auction is running');
    if (player.jail !== null) throw new Error('You are locked up — settle that first');

    const dice = rollPair();
    this.dice = dice;
    const total = dice[0] + dice[1];
    this.fx('dice', player.id, `${dice[0]}-${dice[1]}`);
    this.note('roll', 'info', { a: player.name, n: total, x: dice[0], y: dice[1] });

    if (dice[0] === dice[1]) {
      this.doubles += 1;
      if (this.doubles >= 3) {
        this.note('tripleJail', 'bad', { a: player.name });
        this.sendToJail(player);
        return;
      }
      this.rollAgain = true;
    } else {
      this.rollAgain = false;
    }

    this.stage = 'manage';
    this.step(player, total);
  }

  private jailMove(player: Player, how: 'pay' | 'card' | 'roll') {
    if (this.auction) throw new Error('An auction is running');
    if (player.jail === null) throw new Error('You are not locked up');

    if (how === 'card') {
      const card = player.jailCardIds.shift();
      if (!card) throw new Error('You have no release card');
      this.returnJailCard(card);
      player.jail = null;
      this.stage = 'roll';
      this.note('jailCard', 'good', { a: player.name });
      return;
    }

    if (how === 'pay') {
      this.note('jailPay', 'info', { a: player.name, n: 50 });
      if (!this.charge(player, 50, null, true, 'jail')) return;
      player.jail = null;
      this.stage = 'roll';
      return;
    }

    const dice = rollPair();
    this.dice = dice;
    this.fx('dice', player.id, `${dice[0]}-${dice[1]}`);
    if (dice[0] === dice[1]) {
      player.jail = null;
      this.doubles = 0;
      this.rollAgain = false;
      this.stage = 'manage';
      this.note('jailOut', 'good', { a: player.name, n: dice[0] + dice[1] });
      this.step(player, dice[0] + dice[1]);
      return;
    }

    player.jail += 1;
    if (player.jail >= 3) {
      this.note('jailForced', 'bad', { a: player.name, n: 50 });
      this.stage = 'manage';
      if (!this.charge(player, 50, null, true, 'manage')) return;
      player.jail = null;
      this.rollAgain = false;
      this.step(player, dice[0] + dice[1]);
      return;
    }

    this.stage = 'manage';
    this.rollAgain = false;
    this.note('jailStay', 'info', { a: player.name, n: 3 - player.jail });
  }

  private endTurn(player: Player) {
    if (this.auction) throw new Error('Finish the auction first');
    if (this.debt) throw new Error('Settle your debt first');
    if (this.rollAgain && player.jail === null) {
      this.rollAgain = false;
      this.stage = 'roll';
      this.armTurn();
      return;
    }
    this.nextPlayer();
  }

  private nextPlayer() {
    this.doubles = 0;
    this.rollAgain = false;
    this.offerTile = null;
    this.trade = null;
    this.lastCard = null;
    this.debt = null;

    const solvent = this.solventIds();
    if (solvent.length <= 1) {
      this.finish();
      return;
    }

    const from = this.activeId;
    const index = from ? this.order.indexOf(from) : -1;
    let nextId = solvent[0];
    for (let step = 1; step <= this.order.length; step++) {
      const candidate = this.order[(index + step + this.order.length) % this.order.length];
      const seat = this.players.get(candidate);
      if (seat && !seat.bankrupt) {
        nextId = candidate;
        break;
      }
    }

    this.activeId = nextId;
    this.dice = null;
    const seat = this.players.get(nextId);
    this.stage = seat && seat.jail !== null ? 'jail' : 'roll';
    this.armTurn();
  }

  /** Moves `steps` forward, banking the salary on every pass of the start square. */
  private step(player: Player, steps: number) {
    const before = player.pos;
    const raw = before + steps;
    player.pos = ((raw % 40) + 40) % 40;
    if (steps > 0 && raw >= 40) this.salary(player);
    this.land(player);
  }

  private jumpTo(player: Player, tile: number, salary: boolean) {
    const passed = tile < player.pos;
    player.pos = tile;
    if (salary && passed) this.salary(player);
    this.land(player);
  }

  private salary(player: Player) {
    if (this.settings.salary <= 0) return;
    player.cash += this.settings.salary;
    this.note('salary', 'good', { a: player.name, n: this.settings.salary });
  }

  private land(player: Player) {
    const tile = BOARD[player.pos];
    const total = this.dice ? this.dice[0] + this.dice[1] : 0;

    switch (tile.kind) {
      case 'street':
      case 'rail':
      case 'util': {
        const deed = this.deeds[player.pos];
        if (!deed) break;
        if (!deed.owner) {
          this.offerTile = player.pos;
          this.stage = 'buy';
          return;
        }
        if (deed.owner === player.id) break;
        const owner = this.players.get(deed.owner);
        if (!owner || owner.bankrupt) break;
        const rent = rentFor(player.pos, this.deeds, total, this.settings, owner.jail !== null);
        if (rent <= 0) break;
        this.note('rent', 'bad', { a: player.name, b: owner.name, n: rent, i: player.pos });
        this.fx('rent', player.id, String(rent));
        this.charge(player, rent, owner.id, false, 'manage');
        break;
      }
      case 'tax': {
        const amount = tile.tax ?? 0;
        this.note('tax', 'bad', { a: player.name, n: amount, i: player.pos });
        this.charge(player, amount, null, true, 'manage');
        break;
      }
      case 'vacation': {
        if (!this.settings.vacationCash) break;
        if (this.vacationPot <= 0) {
          this.note('vacationEmpty', 'info', { a: player.name });
          break;
        }
        player.cash += this.vacationPot;
        this.note('vacationPot', 'good', { a: player.name, n: this.vacationPot });
        this.vacationPot = 0;
        break;
      }
      case 'arrest': {
        this.sendToJail(player);
        break;
      }
      case 'fortune':
        this.drawFor(player, 'fortune');
        break;
      case 'ledger':
        this.drawFor(player, 'ledger');
        break;
      default:
        break;
    }
  }

  private sendToJail(player: Player) {
    player.pos = JAIL_TILE;
    player.jail = 0;
    this.doubles = 0;
    this.rollAgain = false;
    this.stage = 'manage';
    this.note('jailed', 'bad', { a: player.name });
    this.fx('jail', player.id);
  }

  // --------------------------------------------------------------------- cards

  private drawFor(player: Player, deck: 'fortune' | 'ledger') {
    const defs: CardDef[] = deck === 'fortune' ? FORTUNE : LEDGER;
    const pile = deck === 'fortune' ? this.fortunePile : this.ledgerPile;
    const drawn = drawCard(pile, defs);
    if (deck === 'fortune') this.fortunePile = drawn.pile;
    else this.ledgerPile = drawn.pile;

    this.lastCard = drawn.id;
    this.note('card', 'deal', { a: player.name, c: drawn.id });
    this.fx('card', player.id, drawn.id);
    this.applyCard(player, CARD_BY_ID[drawn.id]);
  }

  private applyCard(player: Player, card: CardDef | undefined) {
    if (!card) return;
    const effect = card.effect;

    switch (effect.k) {
      case 'money': {
        if (effect.amount >= 0) {
          player.cash += effect.amount;
          this.note('collect', 'good', { a: player.name, n: effect.amount });
        } else {
          this.charge(player, -effect.amount, null, true, 'manage');
        }
        break;
      }
      case 'moveTo':
        this.jumpTo(player, effect.tile, effect.salary);
        break;
      case 'moveBy': {
        const target = ((player.pos + effect.steps) % 40 + 40) % 40;
        player.pos = target;
        this.land(player);
        break;
      }
      case 'nearest': {
        const tiles = effect.kind === 'rail' ? RAIL_TILES : UTIL_TILES;
        const target = nearest(player.pos, tiles);
        const passed = target < player.pos;
        player.pos = target;
        if (passed) this.salary(player);
        this.land(player);
        break;
      }
      case 'jail':
        this.sendToJail(player);
        break;
      case 'freedom':
        player.jailCardIds.push(card.id);
        break;
      case 'repairs': {
        const { houses, hotels } = countBuildings(player.id, this.deeds);
        const bill = houses * effect.house + hotels * effect.hotel;
        if (bill <= 0) break;
        this.note('repairs', 'bad', { a: player.name, n: bill });
        this.charge(player, bill, null, true, 'manage');
        break;
      }
      case 'each': {
        const rivals = this.solventIds().filter((id) => id !== player.id);
        if (rivals.length === 0) break;
        if (effect.amount >= 0) {
          let taken = 0;
          for (const id of rivals) {
            const rival = this.players.get(id);
            if (!rival) continue;
            const due = Math.min(rival.cash, effect.amount);
            rival.cash -= due;
            taken += due;
          }
          player.cash += taken;
          this.note('collect', 'good', { a: player.name, n: taken });
        } else {
          const per = -effect.amount;
          const total = per * rivals.length;
          if (player.cash >= total) {
            player.cash -= total;
            for (const id of rivals) {
              const rival = this.players.get(id);
              if (rival) rival.cash += per;
            }
            this.note('payAll', 'bad', { a: player.name, n: total });
          } else {
            this.openDebt(player, total, null, 'manage', rivals);
          }
        }
        break;
      }
    }
  }

  private returnJailCard(id: string) {
    if (id.startsWith('f.')) this.fortunePile.push(id);
    else this.ledgerPile.push(id);
  }

  // ------------------------------------------------------------------ payments

  /** Returns true when the bill was settled outright. Otherwise a debt is opened. */
  private charge(
    player: Player,
    amount: number,
    toId: string | null,
    toPot: boolean,
    resume: Stage,
  ): boolean {
    if (amount <= 0) return true;
    if (player.cash < amount) {
      this.openDebt(player, amount, toId, resume, null);
      return false;
    }
    player.cash -= amount;
    this.settleInto(amount, toId, toPot);
    return true;
  }

  private settleInto(amount: number, toId: string | null, toPot: boolean) {
    if (toId) {
      const creditor = this.players.get(toId);
      if (creditor) creditor.cash += amount;
      return;
    }
    if (toPot && this.settings.vacationCash) this.vacationPot += amount;
  }

  private openDebt(
    player: Player,
    amount: number,
    toId: string | null,
    resume: Stage,
    spread: string[] | null,
  ) {
    this.debt = { playerId: player.id, amount, toId, resume, spread };
    this.stage = 'debt';
    this.note('debt', 'bad', { a: player.name, n: amount });
  }

  /** Called after any cash-raising move; clears the outstanding bill if it can now be met. */
  private trySettle(id: string) {
    const debt = this.debt;
    if (!debt || debt.playerId !== id) return;
    const player = this.players.get(id);
    if (!player || player.cash < debt.amount) return;

    player.cash -= debt.amount;
    if (debt.spread && debt.spread.length > 0) {
      const per = Math.floor(debt.amount / debt.spread.length);
      for (const rival of debt.spread) {
        const seat = this.players.get(rival);
        if (seat) seat.cash += per;
      }
    } else {
      this.settleInto(debt.amount, debt.toId, true);
    }
    this.debt = null;
    this.stage = debt.resume;
    this.note('settled', 'good', { a: player.name, n: debt.amount });
  }

  /** Timer fallback: strip the portfolio down, then fold if it still is not enough. */
  private autoLiquidate(player: Player) {
    const debt = this.debt;
    if (!debt || debt.playerId !== player.id) {
      this.stage = 'manage';
      return;
    }

    for (let guard = 0; guard < 120 && player.cash < debt.amount; guard++) {
      const built = this.tilesOf(player.id).find((tile) => (this.deeds[tile]?.houses ?? 0) > 0);
      if (built !== undefined) {
        try {
          this.sellHouse(player, built);
          continue;
        } catch {
          /* fall through to mortgaging */
        }
      }
      const open = this.tilesOf(player.id).find((tile) => this.deeds[tile] && !this.deeds[tile]!.mortgaged);
      if (open === undefined) break;
      try {
        this.mortgage(player, open);
      } catch {
        break;
      }
    }

    if (this.debt) this.declareBankrupt(player);
  }

  // ------------------------------------------------------------------ property

  private buy(player: Player) {
    const tile = this.offerTile;
    if (tile === null) throw new Error('Nothing on offer');
    const def = BOARD[tile];
    const deed = this.deeds[tile];
    const price = def.price ?? 0;
    if (!deed || deed.owner) throw new Error('That deed is already taken');
    if (player.cash < price) throw new Error('Not enough cash — decline and raise funds');

    player.cash -= price;
    deed.owner = player.id;
    this.offerTile = null;
    this.stage = 'manage';
    this.note('buy', 'good', { a: player.name, i: tile, n: price });
    this.fx('buy', player.id, def.name);
  }

  private decline(player: Player) {
    const tile = this.offerTile;
    if (tile === null) throw new Error('Nothing on offer');
    this.offerTile = null;
    this.stage = 'manage';
    if (!this.settings.auctions) {
      this.note('declined', 'info', { a: player.name, i: tile });
      return;
    }
    this.startAuction(tile);
  }

  private build(player: Player, tile: number) {
    const deed = this.requireOwn(player, tile);
    const def = BOARD[tile];
    if (def.kind !== 'street' || !def.group) throw new Error('Only streets take buildings');
    if (this.debt && this.debt.playerId === player.id) throw new Error('Clear your debt first');
    if (!groupComplete(this.deeds, def.group, player.id)) throw new Error('You need the whole colour group');
    if (groupHasMortgage(this.deeds, def.group)) throw new Error('Lift the mortgages in that group first');
    if (deed.houses >= 5) throw new Error('That street is fully built');

    if (this.settings.evenBuild) {
      const lowest = Math.min(...GROUPS[def.group].map((i) => this.deeds[i]?.houses ?? 0));
      if (deed.houses > lowest) throw new Error('Even build: raise the lower streets first');
    }

    const toHotel = deed.houses === 4;
    if (toHotel) {
      if (this.hotelsLeft <= 0) throw new Error('The bank is out of hotels');
    } else if (this.housesLeft <= 0) {
      throw new Error('The bank is out of houses');
    }

    const cost = def.houseCost ?? 0;
    if (player.cash < cost) throw new Error('Not enough cash');
    player.cash -= cost;

    if (toHotel) {
      this.hotelsLeft -= 1;
      this.housesLeft += 4;
      deed.houses = 5;
      this.note('hotel', 'good', { a: player.name, i: tile, n: cost });
    } else {
      this.housesLeft -= 1;
      deed.houses += 1;
      this.note('build', 'good', { a: player.name, i: tile, n: deed.houses });
    }
    this.fx('build', player.id, def.name);
  }

  private sellHouse(player: Player, tile: number) {
    const deed = this.requireOwn(player, tile);
    const def = BOARD[tile];
    if (!def.group || deed.houses <= 0) throw new Error('Nothing to sell there');

    if (this.settings.evenBuild) {
      const highest = Math.max(...GROUPS[def.group].map((i) => this.deeds[i]?.houses ?? 0));
      if (deed.houses < highest) throw new Error('Even build: sell from the tallest streets first');
    }

    if (deed.houses === 5) {
      if (this.housesLeft < 4) throw new Error('The bank has no houses to break the hotel into');
      this.hotelsLeft += 1;
      this.housesLeft -= 4;
      deed.houses = 4;
    } else {
      this.housesLeft += 1;
      deed.houses -= 1;
    }

    const refund = Math.floor((def.houseCost ?? 0) / 2);
    player.cash += refund;
    this.note('sell', 'info', { a: player.name, i: tile, n: refund });
    this.trySettle(player.id);
  }

  private mortgage(player: Player, tile: number) {
    const deed = this.requireOwn(player, tile);
    const def = BOARD[tile];
    if (deed.mortgaged) throw new Error('Already mortgaged');
    if (def.group && groupHasBuildings(this.deeds, def.group)) {
      throw new Error('Sell the buildings in that group first');
    }
    deed.mortgaged = true;
    const value = def.mortgage ?? 0;
    player.cash += value;
    this.note('mortgage', 'info', { a: player.name, i: tile, n: value });
    this.trySettle(player.id);
  }

  private unmortgage(player: Player, tile: number) {
    const deed = this.requireOwn(player, tile);
    const def = BOARD[tile];
    if (!deed.mortgaged) throw new Error('That deed is not mortgaged');
    if (this.debt && this.debt.playerId === player.id) throw new Error('Clear your debt first');
    const owed = withInterest(def.mortgage ?? 0, this.settings.mortgageInterest);
    if (player.cash < owed) throw new Error('Not enough cash');
    player.cash -= owed;
    deed.mortgaged = false;
    this.note('unmortgage', 'good', { a: player.name, i: tile, n: owed });
  }

  // ------------------------------------------------------------------ auctions

  private startAuction(tile: number) {
    const live = this.solventIds();
    if (live.length === 0) return;
    this.auction = {
      tile,
      bid: 0,
      leaderId: null,
      endsAt: Date.now() + this.settings.auctionSeconds * 1000,
      liveIds: live,
    };
    this.note('auctionStart', 'deal', { i: tile });
    this.fx('auction', undefined, BOARD[tile].name);
    this.armAlarm();
  }

  private placeBid(player: Player, amountRaw: number) {
    const auction = this.auction;
    if (!auction) throw new Error('No auction is running');
    if (!auction.liveIds.includes(player.id)) throw new Error('You already passed');
    const amount = Math.floor(Number(amountRaw));
    if (!Number.isFinite(amount) || amount <= auction.bid) throw new Error('Bid higher than the standing bid');
    if (amount > player.cash) throw new Error('You cannot cover that bid');

    auction.bid = amount;
    auction.leaderId = player.id;
    auction.endsAt = Date.now() + Math.min(this.settings.auctionSeconds * 1000, BID_WINDOW_MS);
    this.note('bid', 'deal', { a: player.name, n: amount });
    this.armAlarm();

    if (auction.liveIds.length === 1) this.resolveAuction();
  }

  private passBid(player: Player) {
    const auction = this.auction;
    if (!auction) throw new Error('No auction is running');
    if (!auction.liveIds.includes(player.id)) throw new Error('You already passed');
    auction.liveIds = auction.liveIds.filter((id) => id !== player.id);
    this.note('pass', 'info', { a: player.name });

    if (auction.liveIds.length === 0) {
      this.resolveAuction();
      return;
    }
    if (auction.leaderId && auction.liveIds.length === 1 && auction.liveIds[0] === auction.leaderId) {
      this.resolveAuction();
    }
  }

  private resolveAuction() {
    const auction = this.auction;
    if (!auction) return;
    this.auction = null;

    const winner = auction.leaderId ? this.players.get(auction.leaderId) : null;
    const deed = this.deeds[auction.tile];
    if (winner && deed && !deed.owner && auction.bid > 0 && winner.cash >= auction.bid) {
      winner.cash -= auction.bid;
      deed.owner = winner.id;
      this.note('auctionWon', 'deal', { a: winner.name, i: auction.tile, n: auction.bid });
      this.fx('auction', winner.id, BOARD[auction.tile].name);
    } else {
      this.note('auctionNone', 'info', { i: auction.tile });
    }

    if (this.phase === 'play' && this.stage !== 'debt') this.stage = 'manage';
    this.armTurn();
  }

  // -------------------------------------------------------------------- trades

  private cleanBundle(bundle: TradeBundle | undefined): TradeBundle {
    return {
      cash: Math.max(0, Math.floor(Number(bundle?.cash) || 0)),
      tiles: [...new Set((bundle?.tiles ?? []).map((n) => Math.floor(Number(n))))].filter(
        (n) => Number.isInteger(n) && n >= 0 && n < 40,
      ),
      jailCards: Math.max(0, Math.floor(Number(bundle?.jailCards) || 0)),
    };
  }

  private validateSide(owner: Player, bundle: TradeBundle) {
    if (owner.cash < bundle.cash) throw new Error(`${owner.name} cannot cover that cash`);
    if (owner.jailCardIds.length < bundle.jailCards) throw new Error(`${owner.name} lacks release cards`);
    for (const tile of bundle.tiles) {
      const deed = this.deeds[tile];
      if (!deed || deed.owner !== owner.id) throw new Error(`${owner.name} does not hold ${BOARD[tile].name}`);
      if (deed.houses > 0) throw new Error(`Sell the buildings on ${BOARD[tile].name} first`);
    }
  }

  private proposeTrade(player: Player, toId: string, giveRaw: TradeBundle, wantRaw: TradeBundle) {
    if (this.phase !== 'play') throw new Error('No game running');
    if (this.auction) throw new Error('An auction is running');
    if (this.trade) throw new Error('A trade is already on the table');
    const target = this.players.get(String(toId));
    if (!target || target.bankrupt || target.id === player.id) throw new Error('Pick a live opponent');

    const give = this.cleanBundle(giveRaw);
    const want = this.cleanBundle(wantRaw);
    if (give.cash + give.tiles.length + give.jailCards + want.cash + want.tiles.length + want.jailCards === 0) {
      throw new Error('An empty trade is not a trade');
    }
    this.validateSide(player, give);
    this.validateSide(target, want);

    this.trade = { id: ++this.tradeSeq, fromId: player.id, toId: target.id, give, want };
    this.note('tradeOffer', 'deal', { a: player.name, b: target.name });
    this.fx('trade', player.id);
  }

  private respondTrade(player: Player, accept: boolean) {
    const trade = this.trade;
    if (!trade) throw new Error('No trade on the table');
    if (trade.toId !== player.id) throw new Error('That offer is not yours to answer');
    const from = this.players.get(trade.fromId);
    if (!from) {
      this.trade = null;
      return;
    }

    if (!accept) {
      this.trade = null;
      this.note('tradeDecline', 'info', { a: player.name, b: from.name });
      return;
    }

    this.validateSide(from, trade.give);
    this.validateSide(player, trade.want);

    from.cash -= trade.give.cash;
    player.cash += trade.give.cash;
    player.cash -= trade.want.cash;
    from.cash += trade.want.cash;

    for (const tile of trade.give.tiles) this.deeds[tile]!.owner = player.id;
    for (const tile of trade.want.tiles) this.deeds[tile]!.owner = from.id;

    for (let i = 0; i < trade.give.jailCards; i++) {
      const card = from.jailCardIds.shift();
      if (card) player.jailCardIds.push(card);
    }
    for (let i = 0; i < trade.want.jailCards; i++) {
      const card = player.jailCardIds.shift();
      if (card) from.jailCardIds.push(card);
    }

    this.trade = null;
    this.note('tradeAccept', 'deal', { a: player.name, b: from.name });
    this.fx('trade', player.id);
    this.trySettle(from.id);
    this.trySettle(player.id);
  }

  private cancelTrade(player: Player) {
    const trade = this.trade;
    if (!trade) return;
    if (trade.fromId !== player.id && trade.toId !== player.id) throw new Error('Not your trade');
    this.trade = null;
    this.note('tradeCancel', 'info', { a: player.name });
  }

  // --------------------------------------------------------------- bankruptcy

  private declareBankrupt(player: Player) {
    if (this.phase !== 'play') throw new Error('No game running');
    if (player.bankrupt) throw new Error('You are already out');
    const debt = this.debt && this.debt.playerId === player.id ? this.debt : null;
    if (!debt) throw new Error('You only fold when a bill cannot be paid');

    const creditor = debt.toId ? this.players.get(debt.toId) ?? null : null;

    if (creditor) {
      creditor.cash += player.cash;
      for (const tile of this.tilesOf(player.id)) {
        const deed = this.deeds[tile]!;
        if (deed.houses > 0) {
          creditor.cash += Math.floor((deed.houses * (BOARD[tile].houseCost ?? 0)) / 2);
          this.returnBuildings(deed);
        }
        deed.owner = creditor.id;
      }
      creditor.jailCardIds.push(...player.jailCardIds);
      this.note('bankruptTo', 'bad', { a: player.name, b: creditor.name });
    } else {
      for (const tile of this.tilesOf(player.id)) {
        const deed = this.deeds[tile]!;
        this.returnBuildings(deed);
        deed.owner = null;
        deed.mortgaged = false;
      }
      for (const card of player.jailCardIds) this.returnJailCard(card);
      this.note('bankruptBank', 'bad', { a: player.name });
    }

    player.cash = 0;
    player.jailCardIds = [];
    player.jail = null;
    player.bankrupt = true;
    this.debt = null;
    this.fx('bust', player.id, player.name);

    if (this.auction) {
      this.auction.liveIds = this.auction.liveIds.filter((id) => id !== player.id);
      if (this.auction.liveIds.length === 0) this.resolveAuction();
    }

    if (this.solventIds().length <= 1) {
      this.finish();
      return;
    }
    if (this.activeId === player.id) this.nextPlayer();
    else this.stage = 'manage';
  }

  private returnBuildings(deed: Deed) {
    if (deed.houses === 5) {
      this.hotelsLeft += 1;
    } else {
      this.housesLeft += deed.houses;
    }
    deed.houses = 0;
  }

  private finish() {
    const solvent = this.solventIds();
    this.winnerId = solvent[0] ?? null;
    this.phase = 'over';
    this.stage = 'manage';
    this.activeId = null;
    this.turnEndsAt = null;
    this.auction = null;
    this.trade = null;
    this.debt = null;
    const champ = this.winnerId ? this.players.get(this.winnerId)?.name : null;
    this.note(champ ? 'winner' : 'nowinner', 'good', champ ? { a: champ } : undefined);
    this.fx('win', this.winnerId ?? undefined, champ ?? undefined);
  }

  // ------------------------------------------------------------------- helpers

  private tilesOf(id: string): number[] {
    return OWNABLE.filter((tile) => this.deeds[tile]?.owner === id);
  }

  private solventIds(): string[] {
    return this.order.filter((id) => {
      const seat = this.players.get(id);
      return seat && !seat.bankrupt;
    });
  }

  private hasHost(): boolean {
    return [...this.players.values()].some((seat) => seat.host);
  }

  private anyoneOnline(): boolean {
    return [...this.players.values()].some((seat) => seat.online);
  }

  private ensureHost() {
    if (this.hasHost()) return;
    const first = [...this.players.values()][0];
    if (first) first.host = true;
  }

  private playerOf(socket: WebSocket): Player {
    const id = this.sockets.get(socket);
    const player = id ? this.players.get(id) : undefined;
    if (!player) throw new Error('Take a seat first');
    return player;
  }

  private requireHost(player: Player) {
    if (!player.host) throw new Error('Only the host can do that');
  }

  private requireTurn(player: Player, stage: Stage) {
    if (this.phase !== 'play') throw new Error('No game running');
    if (this.activeId !== player.id) throw new Error('Not your turn');
    if (player.bankrupt) throw new Error('You are out of the game');
    if (this.stage !== stage) throw new Error('Not right now');
  }

  private requireOwn(player: Player, tileRaw: number): Deed {
    if (this.phase !== 'play') throw new Error('No game running');
    const tile = Math.floor(Number(tileRaw));
    const deed = this.deeds[tile];
    if (!deed) throw new Error('That square has no deed');
    if (deed.owner !== player.id) throw new Error('You do not own that deed');
    return deed;
  }

  private note(code: string, tone: LogLine['tone'], args?: Record<string, string | number>) {
    this.log = [...this.log, { id: ++this.logSeq, code, tone, args }].slice(-12);
  }

  private fx(kind: FxKind, playerId?: string, text?: string) {
    this.blast({ t: 'fx', kind, playerId, text });
  }

  // --------------------------------------------------------------------- views

  private view(viewerId: string | null): RoomView {
    void viewerId;
    const seats = this.order.length
      ? this.order
          .map((id) => this.players.get(id))
          .filter((seat): seat is Player => Boolean(seat))
          .concat([...this.players.values()].filter((seat) => !this.order.includes(seat.id)))
      : [...this.players.values()];

    const players: PlayerView[] = seats.map((seat) => ({
      id: seat.id,
      name: seat.name,
      token: seat.token,
      host: seat.host,
      ready: seat.ready,
      online: seat.online,
      cash: seat.cash,
      pos: seat.pos,
      jail: seat.jail,
      jailCards: seat.jailCardIds.length,
      bankrupt: seat.bankrupt,
      netWorth: netWorth(seat.id, seat.cash, this.deeds),
    }));

    const deeds: (DeedView | null)[] = this.deeds.map((deed) =>
      deed ? { owner: deed.owner, houses: deed.houses, mortgaged: deed.mortgaged } : null,
    );

    const auction: AuctionView | null = this.auction
      ? {
          tile: this.auction.tile,
          bid: this.auction.bid,
          leaderId: this.auction.leaderId,
          endsAt: this.auction.endsAt,
          liveIds: [...this.auction.liveIds],
        }
      : null;

    const trade: TradeView | null = this.trade
      ? {
          id: this.trade.id,
          fromId: this.trade.fromId,
          toId: this.trade.toId,
          give: this.trade.give,
          want: this.trade.want,
        }
      : null;

    return {
      code: this.code,
      phase: this.phase,
      stage: this.stage,
      settings: this.settings,
      players,
      order: this.order,
      activeId: this.activeId,
      dice: this.dice,
      doubles: this.doubles,
      deeds,
      offerTile: this.offerTile,
      auction,
      trade,
      debt: this.debt
        ? { playerId: this.debt.playerId, amount: this.debt.amount, toId: this.debt.toId }
        : null,
      vacationPot: this.vacationPot,
      housesLeft: this.housesLeft,
      hotelsLeft: this.hotelsLeft,
      lastCard: this.lastCard,
      turnEndsAt: this.turnEndsAt,
      now: Date.now(),
      winnerId: this.winnerId,
      log: this.log,
    };
  }

  private broadcast() {
    for (const [socket, id] of this.sockets) {
      this.push(socket, { t: 'sync', room: this.view(id ?? null), youId: id ?? '' });
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