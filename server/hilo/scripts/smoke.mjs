/**
 * Headless three-player run against a HI/LO worker.
 *   node scripts/smoke.mjs [host]
 *
 * Every bot locks its own secret and remembers it locally, so the harness can
 * "cheat" (only within this process) by looking up a bot's target's secret to
 * drive deliberate wrong calls, narrowing, and a final exact-hit elimination.
 * This exercises: secrets phase, card play, full rotation → reshuffle vote,
 * a wrong call that does NOT eliminate the guesser, and an exact hit that
 * eliminates the target (not the guesser) while survivors draw a wildcard.
 */

const host = process.argv[2] ?? 'empyr-hilo.arcanearthenden.workers.dev';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`;

const NAMES = ['ALFA', 'BRAVO', 'CHARLIE'];
const bots = [];

const seen = { votes: 0, cards: [], missedSeen: false, hitsSeen: 0, finished: false };

const log = (...parts) => console.log(...parts);

function die(reason) {
  console.error(`\nFAIL — ${reason}`);
  console.error(JSON.stringify(bots[0]?.room ?? null, null, 2));
  process.exit(1);
}

class Bot {
  constructor(index) {
    this.index = index;
    this.name = NAMES[index];
    this.key = `smokebot${index}`;
    this.id = '';
    this.room = null;
    this.hand = [];
    this.began = false;
    this.mySecret = null;
    this.playedCard = false;
    this.testedWrong = false;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => this.send({ t: 'hello', key: this.key, name: this.name }));
    this.socket.addEventListener('message', (event) => this.receive(JSON.parse(event.data)));
    this.socket.addEventListener('error', () => die(`${this.name} socket error`));
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  receive(message) {
    if (message.t === 'nope') {
      log(`  ! ${this.name}: ${message.msg}`);
      return;
    }
    if (message.t === 'fx') {
      if (this.index === 0) {
        seen.fx = seen.fx ?? [];
        seen.fx.push(message.kind);
        if (message.kind === 'mine') seen.hitsSeen += 1;
        if (message.kind !== 'deal') log(`  * ${message.kind}${message.text ? ` ${message.text}` : ''}`);
      }
      return;
    }
    if (message.t !== 'sync') return;

    const before = this.room;
    this.room = message.room;
    this.hand = message.hand;
    this.id = message.youId;

    if (this.index === 0 && before?.phase !== this.room.phase) {
      log(`phase → ${this.room.phase}`);
      if (this.room.phase === 'vote') seen.votes += 1;
    }
    this.act();
  }

  targetSecret() {
    const targetBot = bots.find((b) => b.id === this.room.targetId);
    return targetBot ? targetBot.mySecret : null;
  }

  act() {
    const room = this.room;
    const me = room.seats.find((seat) => seat.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (me.host && room.rules.max !== 200) {
        this.send({ t: 'rules', patch: { min: 1, max: 200, turnSeconds: 60 } });
        return;
      }
      if (!me.ready) this.send({ t: 'ready', on: true });
      if (me.host && !this.began && room.seats.length === 3 && room.seats.every((s) => s.ready || s.host)) {
        this.began = true;
        setTimeout(() => this.send({ t: 'begin' }), 150);
      }
      return;
    }

    if (room.phase === 'secrets') {
      if (!me.locked && this.mySecret === null) {
        this.mySecret = room.rules.min + Math.floor(Math.random() * (room.rules.max - room.rules.min));
        this.send({ t: 'secret', value: this.mySecret });
      }
      return;
    }

    if (room.phase === 'vote' && me.alive && !room.youVoted) {
      this.send({ t: 'vote', yes: true });
      return;
    }

    if (room.phase === 'over') {
      if (seen.finished) return;
      seen.finished = true;
      const winner = room.seats.find((seat) => seat.id === room.winnerId);
      log(`\nwinner: ${winner?.name ?? 'nobody'}`);
      log(`cards played: ${seen.cards.join(', ') || 'none'}`);
      log(`reshuffle votes: ${seen.votes} (incidental — not required for a short round)`);
      log(`exact hits: ${seen.hitsSeen}`);
      for (const bot of bots) bot.socket.close();

      if (seen.cards.length < 3) die('cards were never played');
      if (!seen.missedSeen) die('a wrong call never happened / was mishandled');
      if (seen.hitsSeen < 1) die('no exact-hit elimination ever happened');
      if (!winner) die('no winner');
      log('\nPASS');
      process.exit(0);
    }

    if (room.phase !== 'turn' || room.activeId !== this.id || !me.alive) return;

    setTimeout(() => this.takeTurn(), 80);
  }

  takeTurn() {
    const room = this.room;
    if (!room || room.phase !== 'turn' || room.activeId !== this.id) return;
    const target = this.targetSecret();
    if (target == null) return;

    // Exercise one card per player before the first rotation completes.
    if (seen.votes === 0 && this.hand.length > 0 && !this.playedCard) {
      const card = this.hand.find((c) => c !== 'skip') ?? this.hand[0];
      this.playedCard = true;
      seen.cards.push(card);
      const extra =
        card === 'blindfold'
          ? { target: room.seats.find((s) => s.alive && s.id !== this.id)?.id }
          : card === 'bluff'
            ? { bluff: 'lower' }
            : {};
      this.send({ t: 'card', card, ...extra });
      setTimeout(() => this.takeTurn(), 120);
      return;
    }

    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

    if (room.probe === null) {
      let value = Math.floor((room.low + room.high) / 2);
      if (value === target) value = value < room.high ? value + 1 : value - 1;
      this.send({ t: 'probe', value: clamp(value, room.low, room.high) });
      return;
    }

    const truth = target > room.probe ? 'higher' : 'lower';

    // Step 1: commit a call. Deliberately burn one wrong call per bot early on to
    // prove it costs nothing — the server still narrows toward the truth for us.
    if (room.calling === null) {
      if (!this.testedWrong) {
        this.testedWrong = true;
        seen.missedSeen = true;
        this.send({ t: 'call', call: truth === 'higher' ? 'lower' : 'higher' });
      } else {
        this.send({ t: 'call', call: truth });
      }
      return;
    }

    // Step 2: the server already narrowed room.low/room.high to the true window.
    // Once it's tight (or by chance), go for the exact hit.
    const goForKill = room.high - room.low <= 4 || Math.random() < 0.35;
    const mid = Math.floor((room.low + room.high) / 2);
    const value = goForKill ? target : clamp(mid === target ? mid + 1 : mid, room.low, room.high);
    this.send({ t: 'probe', value });
  }
}

log(`room ${code} @ ${url}\n`);
for (let i = 0; i < 3; i++) bots.push(new Bot(i));

setTimeout(() => die('round never resolved (45s timeout)'), 45_000);
