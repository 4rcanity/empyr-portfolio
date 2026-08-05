/**
 * Fill an UNO table with practice bots so you can test a room solo.
 *   node scripts/bots.mjs <roomCode> [count] [host]
 *
 * Bots ready up and play at a human-ish pace. They only deal the cards
 * themselves if no human claimed the host seat.
 */

const code = process.argv[2];
const count = Number(process.argv[3] ?? 2);
const host = process.argv[4] ?? 'localhost:8788';

if (!code) {
  console.error('usage: node scripts/bots.mjs <roomCode> [count] [host]');
  process.exit(1);
}

const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${encodeURIComponent(code)}/socket`;
const NAMES = ['NOVA', 'RUST', 'PIXEL', 'ECHO', 'ONYX', 'ZERO', 'FLUX', 'MOTH', 'VEX'];
const LIGHT = ['red', 'yellow', 'green', 'blue'];
const DARK = ['pink', 'teal', 'orange', 'purple'];
const DRAW_FACES = { draw1: 1, draw2: 2, wild2: 2, wild4: 4, wildRev4: 4, draw5: 5, draw6: 6, draw10: 10 };
const WILD_FACES = new Set([
  'wild', 'wild2', 'wild4', 'wildColor', 'wildRev4', 'wildSkip', 'wildRev', 'wildSkipAll', 'blast',
]);

const faceOf = (card, side) => (side === 'dark' && card.b ? card.b : card.a);
const stackingOn = (room) => (room.rules.pack === 'nomercy' ? true : room.rules.stacking);

function canPlay(card, room) {
  const shown = faceOf(card, room.side);
  if (room.rules.pack === 'allwild') return true;
  if (room.pendingDraw > 0) return stackingOn(room) && Boolean(DRAW_FACES[shown.face]);
  if (shown.color === 'wild') return true;
  if (room.activeColor !== 'wild' && shown.color === room.activeColor) return true;
  return Boolean(room.top && room.top.face === shown.face);
}

class Bot {
  constructor(index) {
    this.name = NAMES[index % NAMES.length];
    this.key = `practice-${code}-${index}`;
    this.id = '';
    this.room = null;
    this.hand = [];
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
      if (!me.ready) {
        this.send({ t: 'ready', on: true });
        return;
      }
      if (me.host && !this.dealing && room.players.length >= 2 && room.players.every((p) => p.ready || p.host)) {
        this.dealing = true;
        setTimeout(() => {
          this.dealing = false;
          this.send({ t: 'begin' });
        }, 2500);
      }
      return;
    }

    if (room.phase === 'roundOver' && me.host) {
      setTimeout(() => this.send({ t: 'next' }), 3000);
      return;
    }
    if (room.phase !== 'play') return;

    // Catch a human who forgot to hit the UNO button.
    const victim = room.players.find((p) => p.exposed && p.id !== this.id && !p.out);
    if (victim && Math.random() < 0.4) {
      setTimeout(() => this.send({ t: 'catch', playerId: victim.id }), 1200);
    }

    if (room.activeId !== this.id || me.out || this.busy) return;
    this.busy = true;
    setTimeout(() => {
      this.busy = false;
      this.takeTurn();
    }, 1100 + Math.random() * 1400);
  }

  takeTurn() {
    const room = this.room;
    if (!room || room.phase !== 'play' || room.activeId !== this.id) return;
    const playable = this.hand.filter((card) => canPlay(card, room));

    if (room.pendingDraw > 0) {
      if (playable.length > 0 && Math.random() < 0.7) return this.throwCard(playable[0], room);
      return this.send({ t: 'draw' });
    }
    if (playable.length === 0) {
      return this.send({ t: room.drewThisTurn ? 'pass' : 'draw' });
    }
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
    // Bots are only human — sometimes they forget to call it.
    if (this.hand.length === 2 && Math.random() < 0.75) {
      setTimeout(() => this.send({ t: 'uno' }), 300);
    }
  }
}

console.log(`${count} bots → ${url}`);
for (let i = 0; i < count; i++) new Bot(i);
