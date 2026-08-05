/**
 * Headless multi-bot run against a Ganzenbord worker.
 *   node scripts/smoke.mjs [host]
 *
 * Six bots play full games to a winner, over and over, while the harness watches
 * every resolved turn for the rules that actually matter:
 *
 *   - a goose chain (two or more goose flights inside one throw)
 *   - the bridge on 6 jumping to 12
 *   - a rescue out of the well on 31 or the prison on 52
 *   - death on 58 sending a pawn back to the nest
 *   - an exact-63 overshoot bouncing back
 *   - the traditional opening nine (3+6 to 26, 4+5 to 53)
 *
 * The run fails loudly if any of those never happen, if a game never reaches a
 * winner, or if the server ever rejects a roll a bot was entitled to make.
 */

const host = process.argv[2] ?? 'localhost:8791';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const NAMES = ['ANJA', 'BRAM', 'CATO', 'DIRK', 'ELS', 'FRED'];
const MAX_GAMES = 24;
const MIN_GAMES = 3;

const log = (...parts) => console.log(...parts);

/** Everything the run must witness before it is allowed to pass. */
const WANTED = {
  gooseChain: 'goose chain (2+ flights in one throw)',
  bridge: 'bridge on 6 → 12',
  rescue: 'well/prison rescue',
  death: 'death on 58 → nest',
  bounce: 'exact 63 bounce-back',
  opening: 'opening nine (3+6 / 4+5)',
};

const seen = new Set();
const tally = { games: 0, turns: 0, inn: 0, maze: 0, held: 0, autoRolls: 0 };

class Bot {
  constructor(run, index) {
    this.run = run;
    this.index = index;
    this.name = NAMES[index];
    this.key = `goosebot${index}`;
    this.id = '';
    this.room = null;
    this.began = false;
    this.busy = false;
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
      this.run.nopes.push(`${this.name}: ${message.msg}`);
      return;
    }
    if (message.t !== 'sync') return;

    this.room = message.room;
    this.id = message.youId;
    if (this.index === 0) this.run.watch(message.room);
    this.act();
  }

  act() {
    const room = this.room;
    const me = room.players.find((p) => p.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (me.host && !this.run.rulesApplied(room.rules)) {
        this.send({ t: 'rules', patch: this.run.rules });
        return;
      }
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

    if (room.phase === 'over') {
      this.run.finish(room);
      return;
    }
    if (room.phase !== 'play') return;
    if (room.activeId !== this.id || me.stuck || this.busy) return;

    this.busy = true;
    setTimeout(() => {
      this.busy = false;
      if (this.room?.phase === 'play' && this.room.activeId === this.id) this.send({ t: 'roll' });
    }, 8);
  }
}

class Run {
  constructor(label, rules) {
    this.label = label;
    this.rules = rules;
    this.code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
    this.bots = [];
    this.nopes = [];
    this.done = false;
    this.lastTurnId = 0;
    this.positions = new Map();
  }

  rulesApplied(live) {
    return Object.entries(this.rules).every(([key, want]) => live[key] === want);
  }

  /** Inspect every freshly resolved turn for the rules under test. */
  watch(room) {
    const turn = room.lastTurn;
    if (!turn || turn.id === this.lastTurnId) return;
    this.lastTurnId = turn.id;
    tally.turns++;
    if (turn.auto) tally.autoRolls++;

    if (turn.gooseHops >= 2) seen.add('gooseChain');
    if (turn.hops.some((hop) => hop.why === 'bridge')) seen.add('bridge');
    if (turn.hops.some((hop) => hop.why === 'opening')) seen.add('opening');
    if (turn.bounced) seen.add('bounce');
    if (turn.rescue) seen.add('rescue');
    if (turn.punishment?.kind === 'death') seen.add('death');
    if (turn.punishment?.kind === 'inn') tally.inn++;
    if (turn.punishment?.kind === 'maze') tally.maze++;
    if (turn.punishment?.kind === 'well' || turn.punishment?.kind === 'prison') tally.held++;

    // The hop chain must be continuous and land where the report says it does.
    for (let i = 1; i < turn.hops.length; i++) {
      if (turn.hops[i].from !== turn.hops[i - 1].to) {
        this.die(`broken hop chain on turn ${turn.id}: ${JSON.stringify(turn.hops)}`);
        return;
      }
    }
    const last = turn.hops[turn.hops.length - 1];
    if (last && last.to !== turn.final && !turn.win) {
      this.die(`turn ${turn.id} says final ${turn.final} but last hop ends on ${last.to}`);
      return;
    }
    const mover = room.players.find((p) => p.id === turn.playerId);
    if (mover && !turn.win && mover.pos !== turn.final && !turn.swap) {
      this.die(`turn ${turn.id}: ${mover.name} sits on ${mover.pos}, report says ${turn.final}`);
      return;
    }
    for (const player of room.players) {
      if (player.pos < 0 || player.pos > 63) {
        this.die(`${player.name} is off the board on ${player.pos}`);
        return;
      }
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      for (let i = 0; i < NAMES.length; i++) {
        setTimeout(() => {
          if (!this.done) this.bots.push(new Bot(this, i));
        }, i * 140);
      }
      this.timer = setTimeout(() => this.die('game never resolved (60s timeout)'), 60_000);
    });
  }

  finish(room) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    for (const bot of this.bots) bot.socket.close();

    const winner = room.players.find((p) => p.id === room.winnerId);
    const ruleNopes = this.nopes.filter((n) => !/Not your turn|still held|Only the host/i.test(n));

    if (!winner) return this.reject(new Error(`${this.label}: no winner`));
    if (winner.pos !== 63) {
      return this.reject(new Error(`${this.label}: winner sits on ${winner.pos}, not 63`));
    }
    if (ruleNopes.length > 0) {
      return this.reject(
        new Error(`${this.label}: server rejected legal moves → ${ruleNopes.slice(0, 4).join(' | ')}`),
      );
    }
    tally.games++;
    log(
      `  ${this.label.padEnd(14)} winner ${winner.name.padEnd(5)} in ${String(winner.rolls).padStart(2)} throws` +
        `   seen: ${[...seen].sort().join(',') || '—'}`,
    );
    this.resolve();
  }

  die(reason) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    for (const bot of this.bots) bot.socket.close();
    const room = this.bots[0]?.room;
    this.reject(
      new Error(
        `${this.label}: ${reason}\n  phase=${room?.phase} active=${room?.activeId}` +
          `\n  pawns=${room?.players.map((p) => `${p.name}:${p.pos}${p.stuck ? '*' : ''}`).join(' ')}`,
      ),
    );
  }
}

const TRADITIONAL = {
  openingNines: true,
  innTurns: 2,
  mazeBack: 39,
  deathTo: 0,
  wellFreesAll: true,
  exactFinish: true,
  swapOnLanding: false,
  turnSeconds: 25,
  capacity: 6,
};

/** Every rule the lobby can bend, exercised at least once. */
const HOUSE = {
  ...TRADITIONAL,
  innTurns: 3,
  mazeBack: 30,
  deathTo: 1,
  wellFreesAll: false,
  swapOnLanding: true,
};

log(`Ganzenbord smoke @ ${host}\n`);

let failed = false;
for (let game = 1; game <= MAX_GAMES; game++) {
  const house = game === 2;
  const label = house ? `house #${game}` : `traditional #${game}`;
  try {
    await new Run(label, house ? HOUSE : TRADITIONAL).start();
  } catch (error) {
    failed = true;
    console.error(`\nFAIL — ${error.message}\n`);
    break;
  }
  const missing = Object.keys(WANTED).filter((key) => !seen.has(key));
  if (missing.length === 0 && game >= MIN_GAMES) break;
  await new Promise((r) => setTimeout(r, 250));
}

const missing = Object.keys(WANTED).filter((key) => !seen.has(key));
log(
  `\n${tally.games} games, ${tally.turns} turns — inn ${tally.inn}, maze ${tally.maze},` +
    ` held ${tally.held}, clock rolls ${tally.autoRolls}`,
);

if (missing.length > 0) {
  console.error('\nnever observed:');
  for (const key of missing) console.error(`  - ${WANTED[key]}`);
  failed = true;
}

if (failed) {
  console.error('\nSMOKE FAILED');
  process.exit(1);
}
log(`PASS — every rule under test fired:\n  ${Object.values(WANTED).join('\n  ')}`);
process.exit(0);
