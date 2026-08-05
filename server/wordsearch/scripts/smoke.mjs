/**
 * Headless multi-bot run against an EMPYR WORDSEARCH worker.
 *   node scripts/smoke.mjs [host]
 *
 * Four bots share one grid and race for the same words. The run asserts real
 * gameplay rather than just "the socket opened":
 *
 *   1. every word the server put on the list is actually findable in the grid
 *   2. a round starts and words get claimed by more than one player
 *   3. a word four bots claim in the same breath goes to exactly one of them
 *   4. illegal claims — a bent line, a run of filler letters, a two-letter
 *      trace and an out-of-bounds trace — are all refused
 *   5. the round ends and every scoreboard total matches the sum of the points
 *      printed against that player's claimed words
 *   6. the game ends after the configured number of rounds with the top scorer
 *      declared the winner
 */

const host = process.argv[2] ?? 'localhost:8790';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const NAMES = ['ARI', 'BEX', 'CYD', 'DOV'];
const DIRS = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
];

const log = (...parts) => console.log(...parts);
const reverse = (text) => [...text].reverse().join('');

/** Where a word sits in the grid, as trace endpoints. */
function locate(cells, size, word) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of DIRS) {
        const er = r + dr * (word.length - 1);
        const ec = c + dc * (word.length - 1);
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        let ok = true;
        for (let i = 0; i < word.length; i++) {
          if (cells[(r + dr * i) * size + (c + dc * i)] !== word[i]) {
            ok = false;
            break;
          }
        }
        if (ok) return { r1: r, c1: c, r2: er, c2: ec };
      }
    }
  }
  return null;
}

/** A straight three-letter run that spells nothing on the list. */
function findGibberish(room) {
  const size = room.rules.size;
  const listed = new Set(room.words.map((w) => w.word));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c + 2 < size; c++) {
      const letters = room.cells[r * size + c] + room.cells[r * size + c + 1] + room.cells[r * size + c + 2];
      if (!listed.has(letters) && !listed.has(reverse(letters))) {
        return { r1: r, c1: c, r2: r, c2: c + 2 };
      }
    }
  }
  return null;
}

class Bot {
  constructor(run, index) {
    this.run = run;
    this.index = index;
    this.name = NAMES[index];
    this.key = `wsbot${index}`;
    this.id = '';
    this.room = null;
    this.began = false;
    this.contested = false;
    this.probed = false;
    this.pending = false;
    this.claimed = new Map();
    const url = `${secure ? 'wss' : 'ws'}://${host}/room/${run.code}/socket`;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () =>
      this.send({ t: 'hello', key: this.key, name: this.name }),
    );
    this.socket.addEventListener('message', (event) => this.receive(JSON.parse(event.data)));
    this.socket.addEventListener('error', (event) =>
      run.die(`${this.name} socket error: ${event.message ?? event.error?.message ?? 'unknown'}`),
    );
    this.socket.addEventListener('close', (event) => {
      if (!run.done && event.code !== 1000 && event.code !== 1005) {
        run.die(`${this.name} socket closed ${event.code} ${event.reason || ''}`);
      }
    });
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  receive(message) {
    if (message.t === 'nope') {
      this.run.nopes.push(message.msg);
      this.pending = false;
      return;
    }
    if (message.t === 'fx') {
      this.run.fx.add(message.kind);
      return;
    }
    if (message.t !== 'sync') return;
    this.room = message.room;
    this.id = message.youId;
    this.act();
  }

  act() {
    const room = this.room;
    const me = room.players.find((p) => p.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (me.host && !this.run.rulesApplied(room.rules)) return this.send({ t: 'rules', patch: this.run.rules });
      if (!me.ready) this.send({ t: 'ready', on: true });
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

    if (room.phase === 'roundOver') {
      this.run.checkRound(room);
      this.contested = true;
      if (me.host) setTimeout(() => this.send({ t: 'next' }), 120);
      return;
    }

    if (room.phase === 'over') {
      // The last round never passes through `roundOver` — it closes straight
      // into the final standings, so its tally is checked from here.
      this.run.checkRound(room);
      this.run.finish(room);
      return;
    }
    if (room.phase !== 'play') return;

    if (this.round !== room.round) {
      this.round = room.round;
      // Only the opening round stages the pile-on, so the refusal count is exact.
      this.contested = room.round !== 1;
      this.probed = room.round !== 1;
      this.pending = false;
      this.run.checkGrid(room);
    }

    // Round one opens with all four bots lunging at the same word.
    if (!this.contested) {
      this.contested = true;
      const first = room.words[0];
      const spot = locate(room.cells, room.rules.size, first.word);
      if (spot) {
        this.run.contestWord = first.word;
        this.run.contestants += 1;
        this.send({ t: 'claim', ...spot });
      }
      return;
    }

    // One bot probes the validator with four kinds of nonsense.
    if (this.index === 0 && !this.probed && room.words.some((w) => w.by)) {
      this.probed = true;
      this.run.probe(this, room);
      return;
    }

    if (this.pending) return;
    const mine = room.words.filter((w) => !w.by && w.i % NAMES.length === this.index);
    const stragglers = room.words.filter((w) => !w.by);
    const target = mine[0] ?? (this.run.mopUp ? stragglers[0] : null);
    if (!target) return;

    const spot = locate(room.cells, room.rules.size, target.word);
    if (!spot) return this.run.die(`${target.word} is on the list but not in the grid`);
    this.pending = true;
    // Half the claims run backwards along the word, so reverse matching is exercised.
    const backwards = target.i % 2 === 1;
    const trace = backwards
      ? { r1: spot.r2, c1: spot.c2, r2: spot.r1, c2: spot.c1 }
      : spot;
    setTimeout(() => {
      this.pending = false;
      this.send({ t: 'claim', ...trace });
    }, 60 + this.index * 30);
  }
}

class Run {
  constructor(label, rules) {
    this.label = label;
    this.rules = rules;
    this.code = `ws-${Math.random().toString(36).slice(2, 7)}`;
    this.bots = [];
    this.nopes = [];
    this.fx = new Set();
    this.done = false;
    this.contestants = 0;
    this.contestWord = null;
    this.mopUp = false;
    this.rounds = [];
    this.gridsChecked = 0;
    this.probes = 0;
  }

  rulesApplied(live) {
    return Object.entries(this.rules).every(([key, want]) => live[key] === want);
  }

  /** Every listed word must really be in the grid. */
  checkGrid(room) {
    this.gridsChecked += 1;
    if (room.words.length < 6) this.die(`round ${room.round} only produced ${room.words.length} words`);
    for (const entry of room.words) {
      if (!locate(room.cells, room.rules.size, entry.word)) {
        this.die(`round ${room.round}: ${entry.word} is listed but not placed (seed ${room.seed})`);
        return;
      }
      if (entry.path) this.die(`round ${room.round}: ${entry.word} leaked its coordinates before being claimed`);
    }
  }

  probe(bot, room) {
    const size = room.rules.size;
    const bent = { r1: 0, c1: 0, r2: 2, c2: 5 };
    const short = { r1: 0, c1: 0, r2: 0, c2: 1 };
    const outside = { r1: 0, c1: 0, r2: 0, c2: size + 3 };
    const gibberish = findGibberish(room);
    const attempts = [bent, short, outside, gibberish].filter(Boolean);
    this.probes += attempts.length;
    for (const attempt of attempts) bot.send({ t: 'claim', ...attempt });
  }

  /** The round's word points must add up to the round's scoreboard, exactly. */
  checkRound(room) {
    if (this.rounds.some((r) => r.round === room.round)) return;

    const tally = new Map();
    for (const word of room.words) {
      if (!word.by) continue;
      if (word.points <= 0) this.die(`${word.word} was claimed for ${word.points} points`);
      if (!word.path) this.die(`${word.word} was claimed without a revealed path`);
      tally.set(word.by, (tally.get(word.by) ?? 0) + word.points);
    }

    for (const player of room.players) {
      const want = tally.get(player.id) ?? 0;
      if (player.round !== want) {
        this.die(`${player.name} shows ${player.round} for round ${room.round} but their words total ${want}`);
        return;
      }
    }

    const claimants = new Set([...tally.keys()]);
    if (claimants.size < 2) {
      this.die(`round ${room.round} was claimed by only ${claimants.size} player(s) — no race happened`);
      return;
    }
    if (room.words.some((w) => !w.by)) {
      this.die(`round ${room.round} ended with unclaimed words`);
      return;
    }

    this.rounds.push({
      round: room.round,
      totals: Object.fromEntries([...tally]),
      claimants: claimants.size,
    });
  }

  start() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      for (let i = 0; i < NAMES.length; i++) {
        setTimeout(() => {
          if (!this.done) this.bots.push(new Bot(this, i));
        }, i * 200);
      }
      // If a bot ever stalls, let the others finish the grid off.
      this.mop = setTimeout(() => {
        this.mopUp = true;
        for (const bot of this.bots) bot.act?.();
      }, 9000);
      this.timer = setTimeout(() => this.die('game never resolved (70s timeout)'), 70_000);
    });
  }

  finish(room) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    clearTimeout(this.mop);
    for (const bot of this.bots) bot.socket.close();

    const fails = [];

    // Exactly one of the four simultaneous claims may land.
    const lost = this.nopes.filter(
      (msg) => this.contestWord && msg.includes(this.contestWord) && /already went to/i.test(msg),
    );
    if (this.contestants < 2) fails.push(`only ${this.contestants} bots contested a word`);
    if (lost.length !== this.contestants - 1) {
      fails.push(`${this.contestants} bots raced for ${this.contestWord} but ${lost.length} were refused`);
    }

    const refused = this.nopes.filter((msg) =>
      /straight line|not on the list/i.test(msg),
    );
    if (refused.length !== this.probes) {
      fails.push(`${this.probes} illegal claims sent, ${refused.length} refused`);
    }

    // A trace posted a heartbeat after the grid was cleared is a fair refusal.
    const unexpected = this.nopes.filter(
      (msg) => !/already went to|straight line|not on the list|No round running/i.test(msg),
    );
    if (unexpected.length > 0) fails.push(`unexpected refusals → ${unexpected.slice(0, 3).join(' | ')}`);

    if (this.rounds.length !== this.rules.rounds) {
      fails.push(`played ${this.rounds.length} rounds, expected ${this.rules.rounds}`);
    }

    // Final scoreboard must be the sum of every round's tally.
    for (const player of room.players) {
      const want = this.rounds.reduce((sum, r) => sum + (r.totals[player.id] ?? 0), 0);
      if (player.score !== want) fails.push(`${player.name} finished on ${player.score}, rounds add to ${want}`);
    }

    const top = [...room.players].sort((a, b) => b.score - a.score)[0];
    const winner = room.players.find((p) => p.id === room.winnerId);
    if (!winner) fails.push('no winner declared');
    else if (winner.score !== top.score) fails.push(`winner ${winner.name} is not the top scorer`);

    if (fails.length > 0) {
      return this.reject(new Error(`${this.label}:\n    - ${fails.join('\n    - ')}`));
    }

    const board = room.players
      .map((p) => `${p.name}:${p.score}`)
      .join(' ');
    log(
      `  ${this.label.padEnd(16)} winner ${winner.name.padEnd(4)} ${board}` +
        `  grids:${this.gridsChecked} contested:${this.contestants} refused:${refused.length}` +
        `  fx:${[...this.fx].join(',')}`,
    );
    this.resolve();
  }

  die(reason) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    clearTimeout(this.mop);
    for (const bot of this.bots) bot.socket.close();
    const room = this.bots[0]?.room;
    this.reject(
      new Error(
        `${this.label}: ${reason}\n  phase=${room?.phase} round=${room?.round} seed=${room?.seed}` +
          `\n  words=${room?.words.map((w) => `${w.word}${w.by ? '*' : ''}`).join(' ')}`,
      ),
    );
  }
}

const SUITES = [
  ['english mixed', { size: 12, words: 10, roundSeconds: 45, rounds: 2, category: 'mixed', bank: 'en', capacity: 6 }],
  ['dutch animals', { size: 14, words: 12, roundSeconds: 45, rounds: 1, category: 'animals', bank: 'nl', capacity: 6 }],
  ['tiny grid', { size: 10, words: 8, roundSeconds: 45, rounds: 1, category: 'food', bank: 'en', capacity: 6 }],
  ['big grid', { size: 20, words: 20, roundSeconds: 45, rounds: 1, category: 'countries', bank: 'nl', capacity: 6 }],
];

log(`EMPYR WORDSEARCH smoke @ ${host}\n`);
let failed = false;
for (const [label, rules] of SUITES) {
  try {
    await new Run(label, rules).start();
    await new Promise((r) => setTimeout(r, 500));
  } catch (error) {
    failed = true;
    console.error(`\nFAIL — ${error.message}\n`);
  }
}

if (failed) {
  console.error('\nSMOKE FAILED');
  process.exit(1);
}
log('\nPASS — grids verified, races resolved, illegal claims refused, scoreboards balanced');
process.exit(0);
