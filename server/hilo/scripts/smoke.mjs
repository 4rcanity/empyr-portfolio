/**
 * Headless three-player run against a HI/LO worker.
 *   node scripts/smoke.mjs [host]
 *
 * The bots share the secret inside this process (single chooser), so they can
 * survive on purpose and drive the full loop: cards → full rotation → reshuffle
 * vote → deliberate wrong calls → eliminations → winner.
 */

const host = process.argv[2] ?? 'empyr-hilo.arcanearthenden.workers.dev';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const code = `smoke-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`;

const NAMES = ['ALFA', 'BRAVO', 'CHARLIE'];
const bots = [];

const seen = { target: null, votes: 0, cards: [], fx: [], finished: false };

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
        seen.fx.push(message.kind);
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

  act() {
    const room = this.room;
    const me = room.seats.find((seat) => seat.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (me.host && room.rules.choosers !== 1) {
        this.send({ t: 'rules', patch: { min: 1, max: 1000, choosers: 1, turnSeconds: 60 } });
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
      if (me.chooser && !me.locked && seen.target === null) {
        seen.target = 400 + Math.floor(Math.random() * 200);
        this.send({ t: 'secret', value: seen.target });
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
      log(`reshuffle votes: ${seen.votes}`);
      for (const bot of bots) bot.socket.close();

      if (seen.votes < 1) die('reshuffle vote never triggered');
      if (seen.cards.length < 3) die('cards were never played');
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
    const target = seen.target;

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

    // Pick a number inside a window, never landing on the target.
    const safe = (low, high) => {
      let value = Math.floor((low + high) / 2);
      if (value === target) value = value < high ? value + 1 : value - 1;
      return Math.max(low, Math.min(high, value));
    };

    if (room.probe === null) {
      this.send({ t: 'probe', value: safe(room.low, room.high) });
      return;
    }

    // After one reshuffle vote, start calling wrong on purpose to burn the table.
    const truth = target > room.probe ? 'higher' : 'lower';
    const call = seen.votes >= 1 ? (truth === 'higher' ? 'lower' : 'higher') : truth;

    // The server narrows before validating, so mirror that here.
    const low = call === 'higher' ? Math.min(room.high, room.probe + 1) : room.low;
    const high = call === 'lower' ? Math.max(room.low, room.probe - 1) : room.high;
    this.send({ t: 'call', call, value: safe(low, high) });
  }
}

log(`room ${code} @ ${url}\n`);
for (let i = 0; i < 3; i++) bots.push(new Bot(i));

setTimeout(() => die('round never resolved (30s timeout)'), 30_000);
