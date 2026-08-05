/**
 * Regression test: a board where everyone is connected but nobody touches the
 * die must eventually give up and drop back to the lobby, rather than letting
 * the turn clock auto-play forever and keep the Durable Object alive.
 *
 *   node scripts/afk.mjs [host]
 *
 * Takes roughly two minutes — the server allows 8 clock-resolved turn steps at
 * the 15 second minimum before it abandons the game.
 */

const host = process.argv[2] ?? 'localhost:8792';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const room = `afk-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${room}/socket`;
const TURN_SECONDS = 15;
const BUDGET_MS = TURN_SECONDS * 1000 * 12;
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

const a = connect('afk-a', 'ALPHA');
const b = connect('afk-b', 'BETA');
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
console.log('game running; both players will now stare at the die…');

const started = Date.now();
const deadline = started + BUDGET_MS;
while (Date.now() < deadline) {
  await sleep(2000);
  if (a.room.phase === 'lobby') {
    const dropped = a.room.log.some((line) => line.code === 'abandoned');
    console.log(`board dropped back to the lobby after ${Math.round((Date.now() - started) / 1000)}s`);
    if (!dropped) {
      console.error('FAIL — returned to the lobby without logging the abandonment');
      process.exit(1);
    }
    if (a.room.turnEndsAt !== null) {
      console.error('FAIL — the turn clock is still armed on an abandoned board');
      process.exit(1);
    }
    console.log('PASS — the idle game was abandoned instead of looping forever');
    a.socket.close();
    b.socket.close();
    process.exit(0);
  }
}

console.error(`FAIL — still in phase ${a.room.phase} after ${BUDGET_MS / 1000}s of nobody moving`);
process.exit(1);
