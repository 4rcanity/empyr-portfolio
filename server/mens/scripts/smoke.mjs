/**
 * Headless multi-bot run against an EMPYR MENS worker.
 *   node scripts/smoke.mjs [host]
 *
 * Plays complete games with 4, 3 and 2 players plus the rule variants, and
 * refuses to pass unless it has personally witnessed every rule that matters:
 * a pawn entering on a six, the extra roll a six buys, a capture sending a pawn
 * back to its yard, an illegal move being rejected, an exact entry into the
 * home column, and a turn passing because no legal move existed.
 */

const host = process.argv[2] ?? 'localhost:8792';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const NAMES = ['ARI', 'BEX', 'CYD', 'DOV'];
const RING = 40;

const log = (...parts) => console.log(...parts);

class Bot {
  constructor(run, index) {
    this.run = run;
    this.index = index;
    this.name = NAMES[index];
    this.key = `mensbot${index}`;
    this.id = '';
    this.room = null;
    this.began = false;
    this.acting = false;
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
      if (/cannot make that move/i.test(message.msg)) this.run.saw.illegalRejected = true;
      else this.run.nopes.push(`${this.name}: ${message.msg}`);
      return;
    }
    if (message.t === 'fx') {
      if (this.index === 0) this.run.noteFx(message);
      return;
    }
    if (message.t !== 'sync') return;

    this.room = message.room;
    this.id = message.youId;
    if (this.index === 0) this.run.noteRoom(message.room);
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
        room.players.length === this.run.seats &&
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
    if (room.phase !== 'play' || room.activeId !== this.id) return;
    if (this.acting) return;

    this.acting = true;
    setTimeout(() => {
      this.acting = false;
      this.takeTurn();
    }, 6);
  }

  takeTurn() {
    const room = this.room;
    if (!room || room.phase !== 'play' || room.activeId !== this.id) return;

    if (room.turnState === 'roll') {
      this.send({ t: 'roll' });
      return;
    }

    const options = room.options;
    if (!options || options.length === 0) return;
    if (options.length > 1) this.run.saw.choice = true;

    // Once per run, poke the server with something it must refuse.
    if (!this.run.probed) {
      this.run.probed = true;
      this.send({ t: 'move', pawn: options[0].pawn, to: 999 });
    }

    // Grab a capture when offered, otherwise push the furthest pawn along.
    const pick =
      options.find((option) => option.capture) ??
      options.find((option) => option.to >= RING) ??
      options[Math.floor(Math.random() * options.length)];
    this.send({ t: 'move', pawn: pick.pawn, to: pick.to });
  }
}

class Run {
  constructor(label, seats, rules) {
    this.label = label;
    this.seats = seats;
    this.rules = rules;
    this.code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
    this.bots = [];
    this.nopes = [];
    this.probed = false;
    this.done = false;
    this.rolls = 0;
    this.seenLog = new Set();
    this.saw = {
      entered: false,
      extraRoll: false,
      capture: false,
      homed: false,
      noMove: false,
      choice: false,
      illegalRejected: false,
    };
  }

  rulesApplied(live) {
    return Object.entries(this.rules).every(([key, want]) => live[key] === want);
  }

  noteFx(message) {
    if (message.kind === 'enter') this.saw.entered = true;
    if (message.kind === 'capture') this.saw.capture = true;
    if (message.kind === 'homed' && message.to >= RING) this.saw.homed = true;
    if (message.kind === 'roll' || message.kind === 'six') this.rolls += 1;
  }

  noteRoom(room) {
    for (const line of room.log) {
      if (this.seenLog.has(line.id)) continue;
      this.seenLog.add(line.id);
      if (line.code === 'sixAgain') this.saw.extraRoll = true;
      if (line.code === 'noMove') this.saw.noMove = true;
      if (line.code === 'entered') this.saw.entered = true;
      if (line.code === 'captured') this.saw.capture = true;
      if (line.code === 'homed') this.saw.homed = true;
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      for (let i = 0; i < this.seats; i++) {
        setTimeout(() => {
          if (!this.done) this.bots.push(new Bot(this, i));
        }, i * 180);
      }
      this.timer = setTimeout(() => this.die('game never resolved (90s timeout)'), 90_000);
    });
  }

  finish(room) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    for (const bot of this.bots) bot.socket.close();

    const winner = room.players.find((p) => p.id === room.winnerId);
    if (!winner) return this.reject(new Error(`${this.label}: no winner`));
    if (this.nopes.length > 0) {
      return this.reject(
        new Error(`${this.label}: server refused legal traffic → ${this.nopes.slice(0, 4).join(' | ')}`),
      );
    }
    if (winner.home !== 4) {
      return this.reject(new Error(`${this.label}: winner declared on ${winner.home} pawns home`));
    }
    log(
      `  ${this.label.padEnd(14)} winner ${winner.name.padEnd(4)} ${this.rolls
        .toString()
        .padStart(4)} rolls  hits ${room.players.map((p) => p.hits).join('/')}`,
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
        `${this.label}: ${reason}\n  phase=${room?.phase} active=${room?.activeId} state=${room?.turnState}` +
          ` dice=${room?.dice} options=${room?.options?.length}` +
          `\n  home=${room?.players.map((p) => `${p.name}:${p.home}`).join(' ')}`,
      ),
    );
  }
}

const SUITES = [
  ['4p classic', 4, { turnSeconds: 60, sixLimit: 3, blockOnStart: true, mustCapture: false, autoSingle: true }],
  ['4p must-hit', 4, { turnSeconds: 60, sixLimit: 3, blockOnStart: false, mustCapture: true, autoSingle: true }],
  ['4p pick-always', 4, { turnSeconds: 60, sixLimit: 2, blockOnStart: true, mustCapture: false, autoSingle: false }],
  ['3p closed arm', 3, { turnSeconds: 60, sixLimit: 3, blockOnStart: true, mustCapture: false, autoSingle: true }],
  ['2p duel', 2, { turnSeconds: 60, sixLimit: 0, blockOnStart: true, mustCapture: false, autoSingle: true }],
];

log(`EMPYR MENS smoke @ ${host}\n`);
let failed = false;
/** Rules we must witness at least once across the whole suite. */
const total = {
  entered: false,
  extraRoll: false,
  capture: false,
  homed: false,
  noMove: false,
  choice: false,
  illegalRejected: false,
};

for (const [label, seats, rules] of SUITES) {
  const run = new Run(label, seats, rules);
  try {
    await run.start();
    for (const key of Object.keys(total)) total[key] ||= run.saw[key];
    await new Promise((r) => setTimeout(r, 500));
  } catch (error) {
    failed = true;
    console.error(`\nFAIL — ${error.message}\n`);
  }
}

const LABELS = {
  entered: 'a pawn entered the board on a six',
  extraRoll: 'a six bought another roll',
  capture: 'a capture sent a pawn back to its yard',
  homed: 'a pawn entered the home column on an exact roll',
  noMove: 'a turn passed because no legal move existed',
  choice: 'a roll produced more than one legal move',
  illegalRejected: 'an illegal move was rejected',
};

log('\nrules observed:');
for (const [key, text] of Object.entries(LABELS)) {
  log(`  ${total[key] ? 'yes' : 'NO '}  ${text}`);
  if (!total[key]) failed = true;
}

if (failed) {
  console.error('\nSMOKE FAILED');
  process.exit(1);
}
log('\nPASS — every board reached a winner and every rule was observed');
process.exit(0);
