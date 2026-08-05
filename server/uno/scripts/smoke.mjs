/**
 * Headless multi-bot run against an EMPYR UNO worker.
 *   node scripts/smoke.mjs [host]
 *
 * Plays a full round with every deck pack (classic, flip, no mercy, all wild,
 * attack) plus a House Rules run, asserting each one reaches a winner without
 * the table ever stalling or the server rejecting a move the bots believed was
 * legal. Bots mirror the server's legality rules locally, so any "nope" reply
 * about matching is a real desync and fails the run.
 */

const host = process.argv[2] ?? 'localhost:8788';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const NAMES = ['ARI', 'BEX', 'CYD', 'DOV'];
const LIGHT = ['red', 'yellow', 'green', 'blue'];
const DARK = ['pink', 'teal', 'orange', 'purple'];
const DRAW_FACES = { draw1: 1, draw2: 2, wild2: 2, wild4: 4, wildRev4: 4, draw5: 5, draw6: 6, draw10: 10 };
const WILD_FACES = new Set([
  'wild', 'wild2', 'wild4', 'wildColor', 'wildRev4', 'wildSkip', 'wildRev', 'wildSkipAll', 'blast',
]);

const log = (...parts) => console.log(...parts);

function faceOf(card, side) {
  return side === 'dark' && card.b ? card.b : card.a;
}

function stackingOn(room) {
  return room.rules.pack === 'nomercy' ? true : room.rules.stacking;
}

function canPlay(card, room) {
  const shown = faceOf(card, room.side);
  if (room.rules.pack === 'allwild') return true;
  if (room.pendingDraw > 0) return stackingOn(room) && Boolean(DRAW_FACES[shown.face]);
  if (shown.color === 'wild') return true;
  if (room.activeColor !== 'wild' && shown.color === room.activeColor) return true;
  return Boolean(room.top && room.top.face === shown.face);
}

class Bot {
  constructor(run, index) {
    this.run = run;
    this.index = index;
    this.name = NAMES[index];
    this.key = `unobot${index}`;
    this.id = '';
    this.room = null;
    this.hand = [];
    this.began = false;
    this.acting = false;
    const url = `${secure ? 'wss' : 'ws'}://${host}/room/${run.code}/socket`;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => this.send({ t: 'hello', key: this.key, name: this.name }));
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
      // Bots only ever send moves they verified locally, so rule rejections are bugs.
      this.run.nopes.push(`${this.name}: ${message.msg}`);
      return;
    }
    if (message.t === 'fx') {
      if (this.index === 0) this.run.fx.add(message.kind);
      return;
    }
    if (message.t !== 'sync') return;

    this.room = message.room;
    this.hand = message.hand;
    this.id = message.youId;
    this.act();
  }

  act() {
    const room = this.room;
    const me = room.players.find((p) => p.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      // The host must land the pack settings before anyone is allowed to deal.
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

    if (room.phase === 'roundOver') {
      if (me.host) setTimeout(() => this.send({ t: 'next' }), 80);
      return;
    }

    if (room.phase === 'over') {
      this.run.finish(room);
      return;
    }

    if (room.phase !== 'play') return;

    // Opportunistically punish anyone sitting on one card without calling.
    const victim = room.players.find((p) => p.exposed && p.id !== this.id && !p.out);
    if (victim && Math.random() < 0.5) this.send({ t: 'catch', playerId: victim.id });

    if (room.activeId !== this.id || me.out) return;
    if (this.acting) return;
    this.acting = true;
    setTimeout(() => {
      this.acting = false;
      this.takeTurn();
    }, 12);
  }

  takeTurn() {
    const room = this.room;
    if (!room || room.phase !== 'play' || room.activeId !== this.id) return;

    const playable = this.hand.filter((card) => canPlay(card, room));

    if (room.pendingDraw > 0) {
      if (playable.length > 0 && Math.random() < 0.6) return this.throwCard(playable[0], room);
      return this.send({ t: 'draw' });
    }

    if (playable.length === 0) {
      if (room.drewThisTurn) return this.send({ t: 'pass' });
      return this.send({ t: 'draw' });
    }

    // After drawing, only the drawn card is legal; the server enforces it too.
    this.throwCard(playable[Math.floor(Math.random() * playable.length)], room);
  }

  throwCard(card, room) {
    const shown = faceOf(card, room.side);
    const msg = { t: 'play', cardId: card.id };

    if (WILD_FACES.has(shown.face) && room.rules.pack !== 'allwild') {
      const palette = room.side === 'dark' ? DARK : LIGHT;
      msg.color = palette[Math.floor(Math.random() * palette.length)];
    }
    if (room.rules.sevenZero && shown.face === '7') {
      const other = room.players.find((p) => p.id !== this.id && !p.out);
      if (other) msg.target = other.id;
    }
    this.send(msg);
    // Exactly two in hand means this play leaves one — shout it. Calling on the
    // last card would land after the round has already closed.
    if (this.hand.length === 2) this.send({ t: 'uno' });
  }
}

class Run {
  constructor(label, rules) {
    this.label = label;
    this.rules = rules;
    this.code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
    this.bots = [];
    this.nopes = [];
    this.fx = new Set();
    this.done = false;
  }

  /** Have the host's requested settings actually taken effect yet? */
  rulesApplied(live) {
    return Object.entries(this.rules).every(([key, want]) => live[key] === want);
  }

  start() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      // Stagger the dials — a burst of simultaneous upgrades against the live
      // edge occasionally gets refused.
      for (let i = 0; i < NAMES.length; i++) {
        setTimeout(() => {
          if (!this.done) this.bots.push(new Bot(this, i));
        }, i * 220);
      }
      this.timer = setTimeout(() => this.die('round never resolved (40s timeout)'), 40_000);
    });
  }

  finish(room) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    for (const bot of this.bots) bot.socket.close();

    const winner = room.players.find((p) => p.id === room.winnerId);
    const ruleNopes = this.nopes.filter((n) => !/Not your turn|already drew|Too early|covered|catch|Nobody/i.test(n));

    if (!winner) return this.reject(new Error(`${this.label}: no winner`));
    if (ruleNopes.length > 0) {
      return this.reject(new Error(`${this.label}: server rejected legal moves → ${ruleNopes.slice(0, 4).join(' | ')}`));
    }
    log(`  ${this.label.padEnd(12)} winner ${winner.name} (${winner.score} pts)  fx: ${[...this.fx].join(',')}`);
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
        `${this.label}: ${reason}\n  phase=${room?.phase} active=${room?.activeId} pending=${room?.pendingDraw}` +
          `\n  hands=${room?.players.map((p) => `${p.name}:${p.cards}`).join(' ')}`,
      ),
    );
  }
}

const SUITES = [
  ['classic', { pack: 'classic', targetScore: 0, turnSeconds: 20 }],
  ['flip', { pack: 'flip', targetScore: 0, turnSeconds: 20 }],
  ['no mercy', { pack: 'nomercy', targetScore: 0, turnSeconds: 20 }],
  ['all wild', { pack: 'allwild', targetScore: 0, turnSeconds: 20 }],
  ['attack', { pack: 'attack', targetScore: 0, turnSeconds: 20 }],
  [
    'house rules',
    {
      pack: 'classic',
      houseRules: true,
      sevenZero: true,
      jumpIn: true,
      stacking: true,
      drawToMatch: true,
      targetScore: 0,
      turnSeconds: 20,
    },
  ],
  // A real score target so the round-over → next-round handoff gets exercised.
  ['multi-round', { pack: 'classic', targetScore: 300, turnSeconds: 20 }],
];

log(`EMPYR UNO smoke @ ${host}\n`);
let failed = false;
for (const [label, rules] of SUITES) {
  try {
    await new Run(label, rules).start();
    await new Promise((r) => setTimeout(r, 700));
  } catch (error) {
    failed = true;
    console.error(`\nFAIL — ${error.message}\n`);
  }
}

if (failed) {
  console.error('\nSMOKE FAILED');
  process.exit(1);
}
log('\nPASS — every pack reached a winner');
process.exit(0);
