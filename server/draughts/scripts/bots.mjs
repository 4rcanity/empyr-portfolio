/**
 * Longer soak: several tables at once, each with two greedy bots, all moves
 * taken from the server's own move list.
 *
 *   node scripts/bots.mjs [host] [tables]
 *
 * Where smoke.mjs proves specific rules, this one hunts for the rare stuff — a
 * shattered position, a runaway king chain, a draw counter firing — and fails if
 * any table stalls, desyncs, or gets a move it offered rejected.
 */

const host = process.argv[2] ?? 'localhost:8794';
const tables = Math.min(12, Math.max(1, Number(process.argv[3]) || 4));
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tally = {
  games: 0,
  plies: 0,
  wins: 0,
  draws: 0,
  captures: 0,
  biggest: 0,
  promotions: 0,
  kingChains: 0,
  reasons: new Map(),
};

class Bot {
  constructor(game, key, name) {
    this.game = game;
    this.name = name;
    this.room = null;
    this.you = null;
    this.acting = false;
    this.started = false;
    this.socket = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}/room/${game.code}/socket`);
    this.socket.addEventListener('open', () =>
      this.socket.send(JSON.stringify({ t: 'hello', key, name })),
    );
    this.socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.t === 'nope') {
        // Seat races are expected; anything about the rules is a real bug.
        if (!/seat is taken/i.test(msg.msg)) game.nopes.push(`${name}: ${msg.msg}`);
        return;
      }
      if (msg.t !== 'sync') return;
      this.room = msg.room;
      this.you = msg.you;
      this.step();
    });
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  step() {
    const room = this.room;
    if (room.phase === 'lobby') {
      // Whichever socket opened first took white; take whatever is left rather
      // than insisting on a colour, or both bots sit there waiting forever.
      if (this.you === null) {
        const free = ['w', 'b'].find((side) => !room.players.some((p) => p.side === side));
        // Ask once per free seat: both bots can spot the same gap at the same
        // moment, and losing that race is not an error worth shouting about.
        if (free && this.asked !== free) {
          this.asked = free;
          this.send({ t: 'sit', side: free });
        }
        return;
      }
      const me = room.players.find((p) => p.side === this.you);
      if (me && !me.ready) this.send({ t: 'ready', on: true });
      const seated = room.players.filter((p) => p.side);
      if (me?.host && !this.started && seated.length === 2 && seated.every((p) => p.ready || p.host)) {
        this.started = true;
        setTimeout(() => this.send({ t: 'begin' }), 120);
      }
      return;
    }
    if (room.phase === 'over' || room.result) {
      this.game.finish(room);
      return;
    }
    if (room.turn !== this.you || this.acting) return;
    this.acting = true;
    setTimeout(() => {
      this.acting = false;
      this.play();
    }, 6);
  }

  play() {
    const room = this.room;
    if (!room || room.phase !== 'play' || room.turn !== this.you || room.result) return;
    const options = room.options;
    if (options.length === 0) return;
    // Greedy with a dash of chaos, so games do not all run down one line.
    const pick =
      Math.random() < 0.75
        ? options[Math.floor(Math.random() * options.length)]
        : options.reduce((a, b) => (b.to > a.to ? b : a));
    this.game.observe(room, pick);
    this.send({ t: 'move', from: pick.from, to: pick.to, path: pick.path });
  }
}

class Game {
  constructor(index) {
    this.code = `soak-${index}-${Math.random().toString(36).slice(2, 6)}`;
    this.nopes = [];
    this.done = false;
    this.plies = 0;
  }

  observe(room, pick) {
    this.plies++;
    if (pick.captures.length > 0) {
      tally.captures++;
      tally.biggest = Math.max(tally.biggest, pick.captures.length);
      if (['2', '4'].includes(room.board[pick.from - 1])) tally.kingChains++;
    }
    if (pick.promote) tally.promotions++;
  }

  finish(room) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    tally.games++;
    tally.plies += room.history.length;
    if (room.result?.winner) tally.wins++;
    else tally.draws++;
    const reason = room.result?.reason ?? 'unknown';
    tally.reasons.set(reason, (tally.reasons.get(reason) ?? 0) + 1);
    const verdict = room.result?.winner ? `${room.result.winner} wins` : 'draw';
    console.log(
      `  ${this.code.padEnd(18)} ${String(room.history.length).padStart(3)} plies  ${verdict} (${reason})`,
    );
    for (const bot of this.bots) bot.socket.close();
    this.resolve();
  }

  run() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.bots = [new Bot(this, `${this.code}-a`, 'WIT'), new Bot(this, `${this.code}-b`, 'ZWART')];
      this.timer = setTimeout(() => {
        if (this.done) return;
        this.done = true;
        for (const bot of this.bots) bot.socket.close();
        const room = this.bots[0].room;
        reject(
          new Error(
            `${this.code} stalled: phase=${room?.phase} turn=${room?.turn} ` +
              `plies=${room?.history.length} options=${room?.options.length}`,
          ),
        );
      }, 60_000);
    });
  }
}

console.log(`DAMCAFE soak @ ${host} — ${tables} tables\n`);
let failures = 0;
const games = [];
for (let i = 0; i < tables; i++) {
  games.push(new Game(i));
  await sleep(180);
}
const results = await Promise.allSettled(games.map((game) => game.run()));
for (const result of results) {
  if (result.status === 'rejected') {
    failures++;
    console.error(`  FAIL ${result.reason.message}`);
  }
}
const nopes = games.flatMap((game) => game.nopes);
if (nopes.length > 0) {
  failures++;
  console.error(`  FAIL server rejected moves it had offered: ${nopes.slice(0, 3).join(' | ')}`);
}

console.log(
  `\n${tally.games} games, ${tally.plies} plies, ${tally.wins} decisive, ${tally.draws} drawn` +
    `\ncaptures ${tally.captures} (biggest ${tally.biggest} pieces, ${tally.kingChains} by kings)` +
    `, ${tally.promotions} promotions` +
    `\nendings: ${[...tally.reasons].map(([k, v]) => `${k} x${v}`).join(', ')}`,
);

if (failures > 0) {
  console.error('\nSOAK FAILED');
  process.exit(1);
}
console.log('\nPASS — every table played out cleanly');
process.exit(0);
