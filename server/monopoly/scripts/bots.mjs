/**
 * Fill a table with practice bots so you can test a room solo.
 *   node scripts/bots.mjs <roomCode> [count] [host]
 *
 * Bots ready up, buy what they can comfortably afford, bid sensibly in auctions,
 * build on completed colour groups, mortgage their way out of trouble and fold
 * when they truly cannot pay. They play slowly enough to watch.
 */

import { GROUPS, OWNABLE, TILES } from './board.mjs';

const code = process.argv[2];
const count = Number(process.argv[3] ?? 2);
const host = process.argv[4] ?? 'localhost:8789';

if (!code) {
  console.error('usage: node scripts/bots.mjs <roomCode> [count] [host]');
  process.exit(1);
}

const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${encodeURIComponent(code)}/socket`;
const NAMES = ['MARLOWE', 'PENROSE', 'QUILL', 'SABLE', 'THORNE', 'VESPER', 'WREN'];

const wait = (min, span) => min + Math.random() * span;

class Bot {
  constructor(index) {
    this.name = NAMES[index % NAMES.length];
    this.key = `practice-${code}-${index}`;
    this.id = '';
    this.room = null;
    this.serial = 0;
    this.doneFor = -1;
    this.failed = new Set();
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      console.log(`${this.name} joined`);
      this.send({ t: 'hello', key: this.key, name: this.name });
    });
    this.socket.addEventListener('message', (event) => this.receive(JSON.parse(event.data)));
    this.socket.addEventListener('close', () => console.log(`${this.name} left`));
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  later(message, min = 900, span = 900) {
    setTimeout(() => this.send(message), wait(min, span));
  }

  receive(message) {
    if (message.t === 'nope') {
      this.recover();
      return;
    }
    if (message.t !== 'sync') return;
    this.room = message.room;
    this.id = message.youId;
    this.act();
  }

  me() {
    return this.room?.players.find((p) => p.id === this.id) ?? null;
  }

  mine() {
    return OWNABLE.filter((tile) => this.room.deeds[tile]?.owner === this.id);
  }

  recover() {
    const room = this.room;
    if (!room || room.phase !== 'play') return;
    if (room.auction?.liveIds.includes(this.id)) {
      this.send({ t: 'passBid' });
      return;
    }
    if (room.activeId !== this.id) return;
    if (room.stage === 'debt') this.act();
    else if (room.stage === 'buy') this.send({ t: 'decline' });
    else if (room.stage === 'manage') this.send({ t: 'endTurn' });
  }

  act() {
    const room = this.room;
    const me = this.me();
    if (!me || room.phase === 'over') return;

    if (room.phase === 'lobby') {
      if (!me.ready) {
        this.later({ t: 'ready', on: true }, 500, 700);
        return;
      }
      // If no human grabbed the host seat, a bot opens the books once everyone is set.
      if (me.host && !this.opening && room.players.length >= 2 && room.players.every((p) => p.ready || p.host)) {
        this.opening = true;
        setTimeout(() => {
          this.opening = false;
          this.send({ t: 'begin' });
        }, 3000);
      }
      return;
    }

    if (room.auction) {
      this.bidStep();
      return;
    }

    if (room.trade && room.trade.toId === this.id) {
      const fair = room.trade.give.cash + room.trade.give.tiles.length * 120;
      const cost = room.trade.want.cash + room.trade.want.tiles.length * 120;
      this.later({ t: 'tradeRespond', accept: fair >= cost }, 1200, 1200);
      return;
    }

    if (room.activeId !== this.id || me.bankrupt) return;

    switch (room.stage) {
      case 'jail':
        this.serial += 1;
        if (me.jailCards > 0) this.later({ t: 'jail', how: 'card' });
        else if (me.cash >= 250) this.later({ t: 'jail', how: 'pay' });
        else this.later({ t: 'jail', how: 'roll' });
        return;
      case 'roll':
        this.serial += 1;
        this.failed.clear();
        this.later({ t: 'roll' }, 1100, 1200);
        return;
      case 'buy': {
        const price = TILES[room.offerTile]?.price ?? 0;
        this.later(me.cash >= price + 120 ? { t: 'buy' } : { t: 'decline' }, 900, 900);
        return;
      }
      case 'debt':
        this.debtStep();
        return;
      default:
        this.manageStep();
    }
  }

  bidStep() {
    const auction = this.room.auction;
    const me = this.me();
    if (!auction.liveIds.includes(this.id) || auction.leaderId === this.id) return;
    const price = TILES[auction.tile].price;
    const ceiling = Math.min(me.cash, Math.floor(price * (0.55 + Math.random() * 0.35)));
    const next = auction.bid + 10;
    this.later(next <= ceiling ? { t: 'bid', amount: next } : { t: 'passBid' }, 700, 900);
  }

  debtStep() {
    const room = this.room;
    const me = this.me();
    if (me.cash >= (room.debt?.amount ?? 0)) {
      this.send({ t: 'endTurn' });
      return;
    }
    const built = this.tallestBuilt();
    if (built !== null && !this.failed.has(`s${built}`)) {
      this.failed.add(`s${built}`);
      this.later({ t: 'sell', tile: built }, 500, 400);
      return;
    }
    const open = this.mine().find((t) => !room.deeds[t].mortgaged && !this.failed.has(`m${t}`));
    if (open !== undefined) {
      this.failed.add(`m${open}`);
      this.later({ t: 'mortgage', tile: open }, 500, 400);
      return;
    }
    this.later({ t: 'bankrupt' }, 800, 400);
  }

  tallestBuilt() {
    const room = this.room;
    for (const tile of this.mine()) {
      const deed = room.deeds[tile];
      if (!deed || deed.houses === 0) continue;
      const peak = Math.max(...GROUPS[TILES[tile].group].map((i) => room.deeds[i]?.houses ?? 0));
      if (deed.houses === peak) return tile;
    }
    return null;
  }

  manageStep() {
    if (this.room.trade?.fromId === this.id) return;
    if (this.doneFor !== this.serial) {
      this.doneFor = this.serial;
      const target = this.buildTarget();
      const me = this.me();
      if (target !== null && me.cash >= TILES[target].houseCost + 350) {
        this.later({ t: 'build', tile: target }, 700, 600);
        return;
      }
    }
    this.later({ t: 'endTurn' }, 700, 700);
  }

  buildTarget() {
    const room = this.room;
    let pick = null;
    let lowest = 5;
    for (const [group, tiles] of Object.entries(GROUPS)) {
      if (group === 'rail' || group === 'util') continue;
      if (!tiles.every((tile) => room.deeds[tile]?.owner === this.id)) continue;
      if (tiles.some((tile) => room.deeds[tile].mortgaged)) continue;
      for (const tile of tiles) {
        const houses = room.deeds[tile].houses;
        if (houses < lowest && houses < 5) {
          lowest = houses;
          pick = tile;
        }
      }
    }
    return pick;
  }
}

console.log(`${count} bots → ${url}`);
for (let i = 0; i < count; i++) new Bot(i);
