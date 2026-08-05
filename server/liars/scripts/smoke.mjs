/**
 * Headless bots playing Liar's Deck against a running worker.
 *   node scripts/smoke.mjs [host]
 *
 * Tables of bots play full games to a single survivor, over and over, while the
 * harness watches every showdown for the moments that make the game what it is:
 *
 *   - a truthful claim challenged, and the challenger having to pull
 *   - a bluff caught, and the liar having to pull
 *   - a joker standing in for the table card
 *   - a click that lets somebody live
 *   - a live round that kills and eliminates a player
 *   - a round where every hand emptied and nobody pulled at all
 *   - one player's odds escalating across repeated pulls
 *   - a game reaching a single survivor
 *
 * It also enforces the secrecy rule the whole game rests on: no sync frame may
 * ever contain another player's cards, the faces under a face-down claim, or
 * the chamber a bullet is sitting in.
 */

const host = process.argv[2] ?? 'localhost:8795';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const NAMES = ['CROW', 'HARE', 'BOAR', 'MOTH', 'STAG', 'WOLF'];
const MAX_GAMES = 14;

const log = (...parts) => console.log(...parts);

/** Everything the run must witness before it is allowed to pass. */
const WANTED = {
  honestChallenge: 'a truthful claim challenged — challenger pulled',
  bluffCaught: 'a bluff caught — the liar pulled',
  joker: 'a joker counting as the table card',
  click: 'a survived click',
  fatal: 'a fatal shot with elimination',
  quiet: 'a round where every hand emptied with no challenge',
  escalation: 'escalating odds across one player’s repeated pulls',
  survivor: 'a game reaching a single survivor',
};

const seen = new Set();
const tally = { games: 0, showdowns: 0, quiet: 0, pulls: 0, deaths: 0, autoPlays: 0, claims: 0 };
/** oddsIn for every pull of the current game, per player, in order. */
let oddsByPlayer = new Map();
const ladders = [];

/** Fail loudly if a frame carries information the viewer is not entitled to. */
function frisk(node, path, fail) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => frisk(item, `${path}[${index}]`, fail));
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    const here = `${path}.${key}`;
    if (key === 'rank' || key === 'live' || key === 'hand') {
      fail(`leaked "${key}" at ${here}`);
      return;
    }
    // PlayerView.cards is a count; an array here would be a hand on the wire.
    if (key === 'cards' && typeof value !== 'number') {
      fail(`leaked a card list at ${here}`);
      return;
    }
    frisk(value, here, fail);
  }
}

class Bot {
  constructor(run, index) {
    this.run = run;
    this.index = index;
    this.name = NAMES[index];
    this.key = `liarbot${index}`;
    this.id = '';
    this.room = null;
    this.hand = [];
    this.began = false;
    this.busy = false;
    this.ackedStage = 0;
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

    frisk(message.room, 'room', (why) => this.run.die(why));
    this.room = message.room;
    this.hand = message.hand ?? [];
    this.id = message.youId;
    if (this.index === 0) this.run.watch(message.room);
    this.act();
  }

  /** Cards that really are the table card (or a joker standing in for it). */
  truths() {
    const table = this.room.table;
    return this.hand.filter((card) => card.rank === table || card.rank === 'joker');
  }

  lies() {
    const table = this.room.table;
    return this.hand.filter((card) => card.rank !== table && card.rank !== 'joker');
  }

  act() {
    const room = this.room;
    const me = room.players.find((player) => player.id === this.id);
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
        room.players.every((player) => player.ready || player.host)
      ) {
        this.began = true;
        setTimeout(() => this.send({ t: 'begin' }), 120);
      }
      return;
    }

    if (room.phase === 'showdown') {
      // Bots have no patience for drama; every seat asking skips the wait.
      if (room.stage && this.ackedStage !== room.stage.id) {
        this.ackedStage = room.stage.id;
        setTimeout(() => this.send({ t: 'onward' }), 10);
      }
      return;
    }

    if (room.phase === 'over') {
      this.run.finish(room);
      return;
    }
    if (room.phase !== 'play') return;
    if (room.activeId !== this.id || me.dead || me.done || this.busy) return;

    this.busy = true;
    setTimeout(() => {
      this.busy = false;
      const live = this.room;
      if (!live || live.phase !== 'play' || live.activeId !== this.id) return;
      this.move(live);
    }, 8);
  }

  move(room) {
    const temper = this.run.temper;
    if (room.claim && room.claim.playerId !== this.id && Math.random() < temper.challenge) {
      this.send({ t: 'liar' });
      return;
    }

    const max = room.rules.maxPlay;
    const truths = this.truths();
    const lies = this.lies();
    // Honest claims are what let a challenger be wrong, so bots must make them.
    const honest = truths.length > 0 && (lies.length === 0 || Math.random() < temper.honesty);
    const pool = honest ? truths : lies.length > 0 ? lies : truths;
    if (pool.length === 0) return;

    const count = 1 + Math.floor(Math.random() * Math.min(max, pool.length));
    // Lead with the joker when telling the truth so it gets its moment.
    const sorted = honest
      ? [...pool].sort((a, b) => (a.rank === 'joker' ? -1 : 0) - (b.rank === 'joker' ? -1 : 0))
      : pool;
    this.send({ t: 'play', cardIds: sorted.slice(0, count).map((card) => card.id) });
  }
}

class Run {
  constructor(label, rules, temper, seats) {
    this.label = label;
    this.rules = rules;
    this.temper = temper;
    this.seats = seats;
    this.code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
    this.bots = [];
    this.nopes = [];
    this.done = false;
    this.lastStage = 0;
    this.lastClaim = 0;
    // Player keys repeat between games, so escalation is judged per game.
    oddsByPlayer = new Map();
  }

  rulesApplied(live) {
    return Object.entries(this.rules).every(([key, want]) => live[key] === want);
  }

  /** Inspect every stage the table passes through. */
  watch(room) {
    if (room.claim && room.claim.turn !== this.lastClaim) {
      this.lastClaim = room.claim.turn;
      tally.claims++;
      if (room.claim.auto) tally.autoPlays++;
      if (room.claim.count < 1 || room.claim.count > room.rules.maxPlay) {
        this.die(`claim of ${room.claim.count} cards breaks the ${room.rules.maxPlay} limit`);
      }
    }

    const stage = room.stage;
    if (!stage || stage.id === this.lastStage) return;
    this.lastStage = stage.id;

    if (!stage.showdown) {
      tally.quiet++;
      seen.add('quiet');
      const holding = room.players.filter((player) => !player.dead && player.cards > 0);
      if (holding.length > 0) {
        this.die(
          `quiet round ended while ${holding.map((p) => `${p.name}:${p.cards}`).join(' ')} still held cards`,
        );
      }
      return;
    }

    const show = stage.showdown;
    tally.showdowns++;
    tally.pulls++;

    // The verdict must follow from the cards that were turned over.
    const bad = show.revealed.filter((rank) => rank !== show.table && rank !== 'joker');
    if (show.honest !== (bad.length === 0)) {
      this.die(`showdown ${show.id} calls ${show.revealed.join('/')} honest=${show.honest} on ${show.table}`);
      return;
    }
    if (show.revealed.length !== show.count) {
      this.die(`showdown ${show.id} claimed ${show.count} but revealed ${show.revealed.length}`);
      return;
    }
    const shouldShoot = show.honest ? show.challengerId : show.accusedId;
    if (show.shooterId !== shouldShoot) {
      this.die(`showdown ${show.id} sent the wrong player to the revolver`);
      return;
    }

    if (show.honest) seen.add('honestChallenge');
    else seen.add('bluffCaught');
    if (show.honest && show.revealed.includes('joker')) seen.add('joker');
    if (show.fatal) {
      seen.add('fatal');
      tally.deaths++;
      const corpse = room.players.find((player) => player.id === show.shooterId);
      if (!corpse?.dead) this.die(`a fatal shot left ${show.shooterName} standing`);
    } else {
      seen.add('click');
    }

    const history = oddsByPlayer.get(show.shooterId) ?? [];
    history.push(show.oddsIn);
    oddsByPlayer.set(show.shooterId, history);
    for (let i = 1; i < history.length; i++) {
      if (history[i] < history[i - 1]) seen.add('escalation');
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      for (let i = 0; i < this.seats; i++) {
        setTimeout(() => {
          if (!this.done) this.bots.push(new Bot(this, i));
        }, i * 130);
      }
      this.timer = setTimeout(() => this.die('game never resolved (75s timeout)'), 75_000);
    });
  }

  finish(room) {
    if (this.done) return;
    this.done = true;
    clearTimeout(this.timer);
    for (const bot of this.bots) bot.socket.close();

    const winner = room.players.find((player) => player.id === room.winnerId);
    const standing = room.players.filter((player) => !player.dead);
    const ruleNopes = this.nopes.filter(
      (line) => !/Not your turn|Only the host|Nothing has been played|out of the game/i.test(line),
    );

    if (!winner) return this.reject(new Error(`${this.label}: no winner`));
    if (standing.length !== 1 || standing[0].id !== winner.id) {
      return this.reject(
        new Error(`${this.label}: ${standing.length} players left standing at the end`),
      );
    }
    if (ruleNopes.length > 0) {
      return this.reject(
        new Error(`${this.label}: server rejected legal moves → ${ruleNopes.slice(0, 4).join(' | ')}`),
      );
    }
    seen.add('survivor');
    tally.games++;
    for (const list of oddsByPlayer.values()) if (list.length > 1) ladders.push(list.join('→'));
    log(
      `  ${this.label.padEnd(16)} survivor ${winner.name.padEnd(5)} after ${String(room.round).padStart(2)} rounds` +
        `   graves: ${room.players.filter((p) => p.dead).map((p) => p.name).join(',') || '—'}`,
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
        `${this.label}: ${reason}\n  phase=${room?.phase} round=${room?.round} table=${room?.table}` +
          `\n  seats=${room?.players
            .map((p) => `${p.name}:${p.cards}c/${p.spent}x${p.dead ? '†' : ''}`)
            .join(' ')}`,
      ),
    );
  }
}

const CLASSIC = {
  chambers: 6,
  bullets: 1,
  handSize: 5,
  maxPlay: 3,
  jokers: true,
  fixedTable: false,
  turnSeconds: 20,
  capacity: 4,
};

/** Every knob the lobby exposes, bent at least once. */
const HOUSE = {
  ...CLASSIC,
  chambers: 4,
  bullets: 2,
  handSize: 4,
  maxPlay: 2,
  jokers: false,
  fixedTable: true,
  capacity: 6,
};

/** Trigger-happy tables produce showdowns; patient ones empty their hands. */
const TRIGGER_HAPPY = { challenge: 0.4, honesty: 0.55 };
const PATIENT = { challenge: 0.04, honesty: 0.5 };

log(`Liar's Bar smoke @ ${host}\n`);

let failed = false;
for (let game = 1; game <= MAX_GAMES; game++) {
  const patient = game % 3 === 0;
  const house = game === 2;
  const label = `${house ? 'house' : 'classic'} ${patient ? 'patient' : 'jumpy'} #${game}`;
  try {
    await new Run(
      label,
      house ? HOUSE : CLASSIC,
      patient ? PATIENT : TRIGGER_HAPPY,
      house ? 6 : 4,
    ).start();
  } catch (error) {
    failed = true;
    console.error(`\nFAIL — ${error.message}\n`);
    break;
  }
  const missing = Object.keys(WANTED).filter((key) => !seen.has(key));
  if (missing.length === 0) break;
  await new Promise((resolve) => setTimeout(resolve, 200));
}

const missing = Object.keys(WANTED).filter((key) => !seen.has(key));
log(
  `\n${tally.games} games — ${tally.claims} claims, ${tally.showdowns} showdowns,` +
    ` ${tally.quiet} quiet rounds, ${tally.pulls} pulls, ${tally.deaths} deaths,` +
    ` ${tally.autoPlays} clock plays`,
);

if (ladders.length > 0) {
  log(`odds ladders (one in N, per player per game): ${ladders.slice(0, 6).join('   ')}`);
}

if (missing.length > 0) {
  console.error('\nnever observed:');
  for (const key of missing) console.error(`  - ${WANTED[key]}`);
  failed = true;
}

if (failed) {
  console.error('\nSMOKE FAILED');
  process.exit(1);
}
log(`PASS — every moment under test happened:\n  ${Object.values(WANTED).join('\n  ')}`);
process.exit(0);
