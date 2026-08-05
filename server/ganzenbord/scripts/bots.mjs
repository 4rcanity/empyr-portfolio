/**
 * Fill a Ganzenbord board with practice pawns so a room can be tested solo.
 *   node scripts/bots.mjs <roomCode> [count] [host]
 *
 * Bots ready up and throw at a human-ish pace. They only start the game
 * themselves if no human claimed the host seat.
 */

const code = process.argv[2];
const count = Number(process.argv[3] ?? 2);
const host = process.argv[4] ?? 'localhost:8791';

if (!code) {
  console.error('usage: node scripts/bots.mjs <roomCode> [count] [host]');
  process.exit(1);
}

const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${encodeURIComponent(code)}/socket`;
const NAMES = ['ANJA', 'BRAM', 'CATO', 'DIRK', 'ELS', 'FRED', 'GIJS', 'HANNA'];

class Bot {
  constructor(index) {
    this.name = NAMES[index % NAMES.length];
    this.key = `practice-${code}-${index}`;
    this.id = '';
    this.room = null;
    this.busy = false;
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
    if (message.t === 'nope') {
      console.log(`${this.name} refused: ${message.msg}`);
      return;
    }
    if (message.t !== 'sync') return;
    this.room = message.room;
    this.id = message.youId;

    const me = this.room.players.find((p) => p.id === this.id);
    if (!me) return;

    if (this.room.phase === 'lobby') {
      if (!me.ready) this.send({ t: 'ready', on: true });
      // Only take charge if every seat at the table is a bot.
      const allBots = this.room.players.every((p) => p.name && NAMES.includes(p.name));
      if (me.host && allBots && this.room.players.length >= 2) {
        setTimeout(() => this.send({ t: 'begin' }), 1200);
      }
      return;
    }

    if (this.room.phase !== 'play') return;
    if (this.room.activeId !== this.id || me.stuck || this.busy) return;

    this.busy = true;
    setTimeout(() => {
      this.busy = false;
      if (this.room?.phase === 'play' && this.room.activeId === this.id) {
        this.send({ t: 'roll' });
      }
    }, 900 + Math.random() * 900);
  }
}

for (let i = 0; i < Math.max(1, Math.min(5, count)); i++) {
  setTimeout(() => new Bot(i), i * 400);
}

console.log(`practice pawns joining room "${code}" on ${host} — ctrl-c to stop`);
