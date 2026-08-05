/**
 * Regression test: a table where everyone is connected but nobody moves must
 * eventually give up and drop back to the lobby, rather than letting the turn
 * clock auto-play forever.
 *
 *   node scripts/afk.mjs [host]
 *
 * Takes roughly two and a half minutes — the server allows 8 clock-resolved
 * turns at the 15 second minimum before abandoning the round.
 */

const host = process.argv[2] ?? 'localhost:8788';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const room = `afk-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${room}/socket`;
const TURN_SECONDS = 15;
const BUDGET_MS = TURN_SECONDS * 1000 * 11;
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
send(boss, { t: 'rules', patch: { turnSeconds: TURN_SECONDS, targetScore: 0 } });
await sleep(300);
send(a, { t: 'ready', on: true });
send(b, { t: 'ready', on: true });
await sleep(400);
send(boss, { t: 'begin' });
await sleep(800);

if (a.room.phase !== 'play') {
  console.error(`FAIL — round never started (phase ${a.room.phase})`);
  process.exit(1);
}
console.log('round running; both players will now sit on their hands…');

const deadline = Date.now() + BUDGET_MS;
while (Date.now() < deadline) {
  await sleep(2000);
  if (a.room.phase === 'lobby') {
    const dropped = a.room.log.some((line) => line.code === 'abandoned');
    console.log(`table dropped back to the lobby after ${Math.round((BUDGET_MS - (deadline - Date.now())) / 1000)}s`);
    if (!dropped) {
      console.error('FAIL — returned to lobby without logging the abandonment');
      process.exit(1);
    }
    console.log('PASS — idle round was abandoned instead of looping forever');
    a.socket.close();
    b.socket.close();
    process.exit(0);
  }
}

console.error(`FAIL — still in phase ${a.room.phase} after ${BUDGET_MS / 1000}s of nobody moving`);
process.exit(1);
