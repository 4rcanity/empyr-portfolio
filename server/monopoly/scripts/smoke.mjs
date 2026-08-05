/**
 * Headless three-bot run against an EMPYR LEDGER worker.
 *   node scripts/smoke.mjs [host]      # default localhost:8789
 *
 * Plays a whole game and asserts that every headline mechanic actually fired:
 * lobby → ready → start, a property purchase, a rent payment, an auction that a
 * bot wins, a house built on a completed colour group, an accepted trade, a jail
 * stint, and finally a single solvent winner.
 *
 * Once the mechanics are harvested the bots switch to concede mode: they sell up
 * and trade their whole portfolio to the leader, which drives the endgame to a
 * winner in bounded time instead of relying on a random walk.
 */

import { GROUPS, OWNABLE, TILES } from './board.mjs';

const host = process.argv[2] ?? 'localhost:8789';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${encodeURIComponent(code)}/socket`;

const NAMES = ['ASHWORTH', 'BELLAMY', 'CORVIN'];
const CONCEDE_AFTER = 260;
const TIMEOUT_MS = 120_000;

const bots = [];
const seen = {
  codes: new Set(),
  lastLogId: 0,
  rolls: 0,
  jail: false,
  declined: false,
  auctionWon: false,
  built: false,
  traded: false,
  finished: false,
};

const log = (...parts) => console.log(...parts);

function die(reason) {
  console.error(`\nFAIL — ${reason}`);
  const room = bots[0]?.room;
  if (room) {
    console.error(
      JSON.stringify(
        {
          phase: room.phase,
          stage: room.stage,
          activeId: room.activeId,
          debt: room.debt,
          auction: room.auction,
          players: room.players.map((p) => ({ n: p.name, cash: p.cash, pos: p.pos, jail: p.jail, out: p.bankrupt })),
          log: room.log,
        },
        null,
        2,
      ),
    );
  }
  process.exit(1);
}

const leaderOf = (room) => {
  const live = room.players.filter((p) => !p.bankrupt);
  return live.slice().sort((a, b) => b.netWorth - a.netWorth)[0] ?? null;
};

class Bot {
  constructor(index) {
    this.index = index;
    this.name = NAMES[index];
    this.key = `smokebot${index}`;
    this.id = '';
    this.room = null;
    this.began = false;
    this.serial = 0;
    this.doneFor = -1;
    this.hunts = 0;
    this.failed = new Set();
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () =>
      this.send({ t: 'hello', key: this.key, name: this.name }),
    );
    this.socket.addEventListener('message', (event) => this.receive(JSON.parse(event.data)));
    this.socket.addEventListener('error', () => die(`${this.name} socket error`));
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  receive(message) {
    if (message.t === 'nope') {
      this.recover(message.msg);
      return;
    }
    if (message.t !== 'sync') return;

    const before = this.room;
    this.room = message.room;
    this.id = message.youId;

    if (this.index === 0) {
      this.harvest(before);
    }
    this.act();
  }

  harvest(before) {
    const room = this.room;
    for (const line of room.log) {
      if (line.id <= seen.lastLogId) continue;
      seen.lastLogId = line.id;
      seen.codes.add(line.code);
      if (line.code === 'roll') seen.rolls += 1;
      if (line.code === 'auctionWon') seen.auctionWon = true;
      if (line.code === 'build' || line.code === 'hotel') seen.built = true;
      if (line.code === 'tradeAccept') seen.traded = true;
    }
    if (room.players.some((p) => p.jail !== null)) seen.jail = true;
    if (before?.phase !== room.phase) log(`phase → ${room.phase}`);
  }

  me() {
    return this.room?.players.find((p) => p.id === this.id) ?? null;
  }

  mine() {
    const room = this.room;
    return OWNABLE.filter((tile) => room.deeds[tile]?.owner === this.id);
  }

  /** A failed action never produces a sync, so nudge ourselves along by hand. */
  recover(msg) {
    const room = this.room;
    if (!room || room.phase !== 'play') return;
    if (room.auction && room.auction.liveIds.includes(this.id)) {
      this.send({ t: 'passBid' });
      return;
    }
    if (room.activeId !== this.id) return;
    if (room.stage === 'debt') {
      this.act();
      return;
    }
    if (room.stage === 'buy') {
      this.send({ t: 'decline' });
      return;
    }
    if (room.stage === 'manage') {
      this.send({ t: 'endTurn' });
      return;
    }
    void msg;
  }

  act() {
    const room = this.room;
    const me = this.me();
    if (!me) return;

    if (room.phase === 'lobby') {
      if (me.host && room.settings.startCash !== 1800) {
        this.send({
          t: 'settings',
          patch: {
            startCash: 1800,
            salary: 200,
            turnSeconds: 300,
            auctionSeconds: 10,
            auctions: true,
            evenBuild: true,
            vacationCash: false,
          },
        });
        return;
      }
      if (!me.ready) {
        this.send({ t: 'ready', on: true });
        return;
      }
      if (
        me.host &&
        !this.began &&
        room.players.length === NAMES.length &&
        room.players.every((p) => p.ready || p.host)
      ) {
        this.began = true;
        setTimeout(() => this.send({ t: 'begin' }), 120);
      }
      return;
    }

    if (room.phase === 'over') {
      this.finish();
      return;
    }

    if (room.auction) {
      this.bidStep();
      return;
    }

    if (room.trade && room.trade.toId === this.id) {
      this.send({ t: 'tradeRespond', accept: true });
      return;
    }

    if (room.activeId !== this.id || me.bankrupt) return;

    switch (room.stage) {
      case 'jail':
        this.serial += 1;
        if (me.jailCards > 0) this.send({ t: 'jail', how: 'card' });
        else if (me.cash >= 150) this.send({ t: 'jail', how: 'pay' });
        else this.send({ t: 'jail', how: 'roll' });
        return;
      case 'roll':
        this.serial += 1;
        this.failed.clear();
        this.send({ t: 'roll' });
        return;
      case 'buy':
        this.buyStep();
        return;
      case 'debt':
        this.debtStep();
        return;
      default:
        this.manageStep();
    }
  }

  bidStep() {
    const room = this.room;
    const auction = room.auction;
    const me = this.me();
    if (!auction.liveIds.includes(this.id)) return;
    if (auction.leaderId === this.id) return;

    const price = TILES[auction.tile].price;
    const ceiling = Math.min(me.cash, Math.floor(price * 0.7));
    const next = auction.bid + 10;
    if (next <= ceiling) this.send({ t: 'bid', amount: next });
    else this.send({ t: 'passBid' });
  }

  buyStep() {
    const room = this.room;
    const me = this.me();
    const tile = room.offerTile;
    const price = TILES[tile]?.price ?? 0;

    // Burn exactly one purchase to force an auction into the game.
    if (!seen.declined) {
      seen.declined = true;
      this.send({ t: 'decline' });
      return;
    }
    if (price > 0 && me.cash >= price + 60) this.send({ t: 'buy' });
    else this.send({ t: 'decline' });
  }

  debtStep() {
    const room = this.room;
    const owed = room.debt?.amount ?? 0;
    const me = this.me();
    if (me.cash >= owed) {
      // The server settles automatically; nothing left to raise.
      this.send({ t: 'endTurn' });
      return;
    }

    const built = this.tallestBuilt();
    if (built !== null && !this.failed.has(`s${built}`)) {
      this.failed.add(`s${built}`);
      this.send({ t: 'sell', tile: built });
      return;
    }
    const open = this.mine().find(
      (tile) => !room.deeds[tile].mortgaged && !this.failed.has(`m${tile}`),
    );
    if (open !== undefined) {
      this.failed.add(`m${open}`);
      this.send({ t: 'mortgage', tile: open });
      return;
    }
    this.send({ t: 'bankrupt' });
  }

  tallestBuilt() {
    const room = this.room;
    let best = null;
    for (const tile of this.mine()) {
      const deed = room.deeds[tile];
      if (!deed || deed.houses === 0) continue;
      const group = TILES[tile].group;
      const peak = Math.max(...GROUPS[group].map((i) => room.deeds[i]?.houses ?? 0));
      if (deed.houses === peak) return tile;
      best ??= tile;
    }
    return best;
  }

  manageStep() {
    const room = this.room;
    if (room.trade && room.trade.fromId === this.id) return; // waiting on an answer

    if (seen.rolls > CONCEDE_AFTER) {
      if (this.concede()) return;
    }

    if (this.doneFor !== this.serial) {
      this.doneFor = this.serial;
      const extra = this.extraAction();
      if (extra) {
        this.send(extra);
        return;
      }
    }
    this.send({ t: 'endTurn' });
  }

  /** One optional improvement per roll: chase a colour group, then raise houses. */
  extraAction() {
    const room = this.room;
    const me = this.me();

    if (!room.trade) {
      const hunt = this.monopolyHunt();
      if (hunt) return hunt;
      if (!seen.traded) {
        const offer = this.tradeOffer();
        if (offer) return offer;
      }
    }

    const target = this.buildTarget();
    if (target !== null && me.cash >= TILES[target].houseCost + 120) {
      return { t: 'build', tile: target };
    }
    return null;
  }

  /** Buy the one missing deed of a nearly-complete group off whoever holds it. */
  monopolyHunt() {
    const room = this.room;
    const me = this.me();
    if (this.hunts >= 3 || me.cash < 450) return null;

    for (const [group, tiles] of Object.entries(GROUPS)) {
      if (group === 'rail' || group === 'util') continue;
      const owners = tiles.map((tile) => room.deeds[tile].owner);
      if (owners.filter((owner) => owner === this.id).length !== tiles.length - 1) continue;

      const gap = owners.findIndex((owner) => owner !== this.id);
      const tile = tiles[gap];
      const holder = owners[gap];
      if (!holder || room.deeds[tile].houses > 0) continue;
      const seat = room.players.find((p) => p.id === holder);
      if (!seat || seat.bankrupt) continue;

      const offer = Math.min(me.cash - 250, TILES[tile].price * 2);
      if (offer < 50) continue;
      this.hunts += 1;
      return {
        t: 'trade',
        to: holder,
        give: { cash: offer, tiles: [], jailCards: 0 },
        want: { cash: 0, tiles: [tile], jailCards: 0 },
      };
    }
    return null;
  }

  /** Cash for a single deed a rival holds — small, always legal, always tempting. */
  tradeOffer() {
    const room = this.room;
    const me = this.me();
    if (me.cash < 300) return null;
    const rival = room.players.find((p) => !p.bankrupt && p.id !== this.id);
    if (!rival) return null;
    const wanted = OWNABLE.find(
      (tile) => room.deeds[tile]?.owner === rival.id && room.deeds[tile].houses === 0,
    );
    if (wanted === undefined) return null;
    return {
      t: 'trade',
      to: rival.id,
      give: { cash: 120, tiles: [], jailCards: 0 },
      want: { cash: 0, tiles: [wanted], jailCards: 0 },
    };
  }

  /** Lowest-built street inside a colour group we hold outright. */
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

  /** Endgame: hand the whole portfolio to the leader so the game actually ends. */
  concede() {
    const room = this.room;
    const me = this.me();
    const leader = leaderOf(room);
    if (!leader || leader.id === this.id) return false;
    if (room.trade) return false;

    const built = this.tallestBuilt();
    if (built !== null) {
      this.send({ t: 'sell', tile: built });
      return true;
    }
    const tiles = this.mine();
    if (tiles.length === 0 && me.cash === 0) return false;
    this.send({
      t: 'trade',
      to: leader.id,
      give: { cash: me.cash, tiles, jailCards: me.jailCards },
      want: { cash: 0, tiles: [], jailCards: 0 },
    });
    return true;
  }

  finish() {
    if (seen.finished) return;
    seen.finished = true;
    const room = this.room;
    const winner = room.players.find((p) => p.id === room.winnerId);

    log('');
    log(`rolls          : ${seen.rolls}`);
    log(`purchases      : ${seen.codes.has('buy') ? 'yes' : 'no'}`);
    log(`rent paid      : ${seen.codes.has('rent') ? 'yes' : 'no'}`);
    log(`auction run    : ${seen.codes.has('auctionStart') ? 'yes' : 'no'} (won: ${seen.auctionWon})`);
    log(`houses built   : ${seen.built ? 'yes' : 'no'}`);
    log(`trade accepted : ${seen.traded ? 'yes' : 'no'}`);
    log(`jail visited   : ${seen.jail ? 'yes' : 'no'}`);
    log(`bankruptcies   : ${room.players.filter((p) => p.bankrupt).length}`);
    log(`winner         : ${winner?.name ?? 'nobody'}`);

    for (const bot of bots) bot.socket.close();

    if (!seen.codes.has('begin')) die('the game never started');
    if (!seen.codes.has('buy')) die('nobody ever bought a property');
    if (!seen.codes.has('rent')) die('rent was never paid');
    if (!seen.codes.has('auctionStart')) die('no auction ever ran');
    if (!seen.auctionWon) die('an auction ran but nobody ever won one');
    if (!seen.built) die('no house was ever built');
    if (!seen.traded) die('no trade was ever accepted');
    if (!seen.jail) die('nobody ever went to jail');
    if (!winner) die('the game ended without a winner');

    log('\nPASS');
    process.exit(0);
  }
}

log(`room ${code} @ ${url}\n`);
for (let i = 0; i < NAMES.length; i++) bots.push(new Bot(i));

setTimeout(() => {
  const room = bots[0]?.room;
  die(
    `game never resolved within ${TIMEOUT_MS / 1000}s ` +
      `(rolls=${seen.rolls}, phase=${room?.phase}, stage=${room?.stage})`,
  );
}, TIMEOUT_MS);
