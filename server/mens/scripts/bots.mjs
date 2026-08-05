/**
 * Fill a room with bots so a human can play — or so a screenshot run has a
 * board with pawns of several colours actually in play.
 *
 *   node scripts/bots.mjs <room-code> [count=3] [host=localhost:8792]
 *
 * Bots take a seat, mark themselves ready, and play their own turns at a
 * watchable pace. They never claim the host badge unless nobody else is there,
 * and they leave every decision the human makes alone.
 */

const code = process.argv[2];
const count = Math.min(3, Math.max(1, Number(process.argv[3]) || 3));
const host = process.argv[4] ?? 'localhost:8792';

if (!code) {
  console.error('usage: node scripts/bots.mjs <room-code> [count] [host]');
  process.exit(1);
}

const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${code.toLowerCase()}/socket`;
const NAMES = ['PIET', 'SANNE', 'JOOST'];
/** Long enough that a human can watch a pawn walk before the next roll. */
const PACE = 900;
const RING = 40;

class Bot {
  constructor(index) {
    this.name = NAMES[index];
    this.key = `bot-${code}-${index}`;
    this.id = '';
    this.room = null;
    this.busy = false;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () => {
      console.log(`${this.name} joining ${code}`);
      this.send({ t: 'hello', key: this.key, name: this.name });
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
    this.act();
  }

  act() {
    const room = this.room;
    const me = room.players.find((p) => p.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (!me.ready) this.send({ t: 'ready', on: true });
      return;
    }
    if (room.phase !== 'play' || room.activeId !== this.id || this.busy) return;

    this.busy = true;
    setTimeout(() => {
      this.busy = false;
      this.turn();
    }, PACE);
  }

  turn() {
    const room = this.room;
    if (!room || room.phase !== 'play' || room.activeId !== this.id) return;
    if (room.turnState === 'roll') {
      this.send({ t: 'roll' });
      return;
    }
    const options = room.options ?? [];
    if (options.length === 0) return;
    const pick =
      options.find((option) => option.capture) ??
      options.find((option) => option.to >= RING) ??
      options[Math.floor(Math.random() * options.length)];
    this.send({ t: 'move', pawn: pick.pawn, to: pick.to });
  }
}

for (let i = 0; i < count; i++) setTimeout(() => new Bot(i), i * 250);
console.log(`filling ${code} with ${count} bot(s) via ${host}`);
