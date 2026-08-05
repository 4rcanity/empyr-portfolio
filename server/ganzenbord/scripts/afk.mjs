/**
 * Regression test for idle protection: a board where everybody is connected but
 * nobody throws must eventually give up and drop back to the lobby instead of
 * letting the turn clock roll for it forever and keeping the Durable Object
 * awake.
 *
 *   node scripts/afk.mjs [host]
 *
 * Takes a bit over a minute and a half — the server allows 8 clock-resolved
 * turns, and the lobby is held to a 10 second minimum clock.
 */

const host = process.argv[2] ?? 'localhost:8791';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const room = `afk-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${room}/socket`;
const TURN_SECONDS = 10;
const BUDGET_MS = TURN_SECONDS * 1000 * 13;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(key, name) {
  const socket = new WebSocket(url);
  const state = { socket, room: null, id: '' };
  socket.addEventListener('open', () => socket.send(JSON.stringify({ t: 'hello', key, name })));
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.t === 'sync') {
      state.room = msg.room;
      state.id = msg.youId;
    }
  });
  return state;
}

const send = (peer, message) => peer.socket.send(JSON.stringify(message));

const a = connect('afk-a', 'ANJA');
const b = connect('afk-b', 'BRAM');
await sleep(1200);

const boss = a.room?.players.find((p) => p.id === a.id)?.host ? a : b;
send(boss, { t: 'rules', patch: { turnSeconds: TURN_SECONDS } });
await sleep(300);
send(a, { t: 'ready', on: true });
send(b, { t: 'ready', on: true });
await sleep(400);
send(boss, { t: 'begin' });
await sleep(800);

if (a.room.phase !== 'play') {
  console.error(`FAIL — game never started (phase ${a.room.phase})`);
  process.exit(1);
}
console.log('game running; both players will now stare at the dice…');

const started = Date.now();
while (Date.now() - started < BUDGET_MS) {
  await sleep(2000);
  const view = a.room;

  if (view.phase === 'over') {
    console.error('FAIL — the clock rolled the game all the way to a winner instead of giving up');
    process.exit(1);
  }

  if (view.phase === 'lobby') {
    const dropped = view.log.some((line) => line.code === 'abandoned');
    console.log(`board dropped back to the lobby after ${Math.round((Date.now() - started) / 1000)}s`);
    if (!dropped) {
      console.error('FAIL — returned to the lobby without logging the abandonment');
      process.exit(1);
    }
    if (view.players.some((p) => p.pos !== 0 || p.stuck || p.skips > 0)) {
      console.error('FAIL — pawns were left on the board after the reset');
      process.exit(1);
    }
    console.log('PASS — idle game was abandoned instead of looping forever');
    a.socket.close();
    b.socket.close();
    process.exit(0);
  }
}

console.error(`FAIL — still in phase ${a.room.phase} after ${BUDGET_MS / 1000}s of nobody throwing`);
process.exit(1);
