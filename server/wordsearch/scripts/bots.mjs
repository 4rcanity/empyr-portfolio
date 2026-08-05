/**
 * Fills a real room with practice bots so one human can test the UI.
 *   node scripts/bots.mjs <roomCode> [count] [host]
 *
 * They ready up, hunt at human pace, sometimes stare at a word for a few
 * seconds before tracing it, and only start the game themselves if no human
 * took the host seat.
 */

const code = process.argv[2];
const count = Math.min(7, Math.max(1, Number(process.argv[3]) || 3));
const host = process.argv[4] ?? 'localhost:8790';

if (!code) {
  console.error('usage: node scripts/bots.mjs <roomCode> [count] [host]');
  process.exit(1);
}

const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`;
const NAMES = ['NIX', 'ORLA', 'PIP', 'QUIN', 'ROSS', 'SASHA', 'TEO'];
const DIRS = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [-1, -1], [1, -1], [-1, 1],
];

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

class Bot {
  constructor(index) {
    this.name = NAMES[index % NAMES.length];
    this.key = `practice-${code}-${index}`;
    this.id = '';
    this.room = null;
    this.hunting = false;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('open', () =>
      this.send({ t: 'hello', key: this.key, name: this.name }),
    );
    this.socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.t === 'nope') return console.log(`${this.name} ← ${msg.msg}`);
      if (msg.t !== 'sync') return;
      this.room = msg.room;
      this.id = msg.youId;
      this.act();
    });
    this.socket.addEventListener('close', () => console.log(`${this.name} left`));
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  act() {
    const room = this.room;
    const me = room.players.find((p) => p.id === this.id);
    if (!me) return;

    if (room.phase === 'lobby') {
      if (!me.ready) this.send({ t: 'ready', on: true });
      // Only take charge if a human never showed up.
      if (me.host && room.players.length >= 2 && room.players.every((p) => p.ready || p.host)) {
        setTimeout(() => this.send({ t: 'begin' }), 3000);
      }
      return;
    }

    if (room.phase !== 'play' || this.hunting) return;

    const open = room.words.filter((word) => !word.by);
    if (open.length === 0) return;

    this.hunting = true;
    const target = open[Math.floor(Math.random() * open.length)];
    // Human-ish: a few seconds of scanning, longer for longer words.
    const think = 1800 + target.word.length * 350 + Math.random() * 4000;
    setTimeout(() => {
      this.hunting = false;
      const live = this.room;
      if (!live || live.phase !== 'play') return;
      const still = live.words.find((word) => word.i === target.i);
      if (!still || still.by) return this.act();
      const spot = locate(live.cells, live.rules.size, target.word);
      if (spot) this.send({ t: 'claim', ...spot });
    }, think);
  }
}

console.log(`sending ${count} bot(s) into ${code} @ ${host}`);
for (let i = 0; i < count; i++) {
  setTimeout(() => new Bot(i), i * 400);
}
