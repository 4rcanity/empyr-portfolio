/**
 * Fill a table with practice bots so you can test a room solo.
 *   node scripts/bots.mjs <roomCode> [count] [host]
 *
 * Bots ready up, lock secrets when chosen, and play the odds (they never see the
 * target). They never start the round — that stays with the human host.
 */

const code = process.argv[2];
const count = Number(process.argv[3] ?? 2);
const host = process.argv[4] ?? 'empyr-hilo.arcanearthenden.workers.dev';

if (!code) {
  console.error('usage: node scripts/bots.mjs <roomCode> [count] [host]');
  process.exit(1);
}

const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${encodeURIComponent(code)}/socket`;
const NAMES = ['NOVA', 'RUST', 'PIXEL', 'ECHO', 'ONYX', 'ZERO', 'FLUX', 'MOTH', 'VEX'];

class Bot {
  constructor(index) {
    this.name = NAMES[index % NAMES.length];
    this.key = `practice-${code}-${index}`;
    this.id = '';
    this.room = null;
    this.hand = [];
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      console.log(`${this.name} joined`);
      this.socket.send(JSON.stringify({ t: 'hello', key: this.key, name: this.name }));
    });
    this.socket.addEventListener('message', (event) => this.receive(JSON.parse(event.data)));
    this.socket.addEventListener('close', () => console.log(`${this.name} left`));
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  receive(message) {
    if (message.t === 'nope') return;
    if (message.t !== 'sync') return;
    this.room = message.room;
    this.hand = message.hand;
    this.id = message.youId;
    this.act();
  }

  act() {
    const room = this.room;
    const me = room.seats.find((seat) => seat.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (!me.ready) {
        this.send({ t: 'ready', on: true });
        return;
      }
      // If no human grabbed the host seat, a bot deals once everyone is ready.
      if (me.host && !this.dealing && room.seats.length >= 3 && room.seats.every((s) => s.ready || s.host)) {
        this.dealing = true;
        setTimeout(() => {
          this.dealing = false;
          this.send({ t: 'begin' });
        }, 2000);
      }
      return;
    }

    if (room.phase === 'secrets' && me.chooser && !me.locked) {
      const value = room.rules.min + Math.floor(Math.random() * (room.rules.max - room.rules.min));
      setTimeout(() => this.send({ t: 'secret', value }), 700 + Math.random() * 1200);
      return;
    }

    if (room.phase === 'vote' && me.alive && !room.youVoted) {
      setTimeout(() => this.send({ t: 'vote', yes: Math.random() < 0.7 }), 900);
      return;
    }

    if (room.phase === 'turn' && room.activeId === this.id && me.alive) {
      setTimeout(() => this.takeTurn(), 1200 + Math.random() * 1600);
    }
  }

  takeTurn() {
    const room = this.room;
    if (!room || room.phase !== 'turn' || room.activeId !== this.id) return;

    if (room.probe === null) {
      this.send({ t: 'probe', value: Math.floor((room.low + room.high) / 2) });
      return;
    }

    if (this.hand.length > 0 && Math.random() < 0.25) {
      const card = this.hand[Math.floor(Math.random() * this.hand.length)];
      const extra =
        card === 'blindfold'
          ? { target: room.seats.find((s) => s.alive && s.id !== this.id)?.id }
          : card === 'bluff'
            ? { bluff: Math.random() < 0.5 ? 'higher' : 'lower' }
            : {};
      if (card !== 'blindfold' || extra.target) {
        this.send({ t: 'card', card, ...extra });
        setTimeout(() => this.takeTurn(), 900);
        return;
      }
    }

    // No knowledge of the target: bet on whichever side of the window is bigger.
    const room_ = room;
    const call = room_.probe - room_.low > room_.high - room_.probe ? 'lower' : 'higher';
    const low = call === 'higher' ? Math.min(room_.high, room_.probe + 1) : room_.low;
    const high = call === 'lower' ? Math.max(room_.low, room_.probe - 1) : room_.high;
    this.send({ t: 'call', call, value: Math.floor((low + high) / 2) });
  }
}

console.log(`${count} bots → ${url}`);
for (let i = 0; i < count; i++) new Bot(i);
