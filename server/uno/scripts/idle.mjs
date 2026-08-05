/**
 * Regression test: an abandoned in-progress table must park its turn clock
 * instead of auto-playing on a loop forever, and must resume when someone
 * comes back.
 *
 *   node scripts/idle.mjs [host]
 */

const host = process.argv[2] ?? 'localhost:8788';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const room = `idle-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${room}/socket`;
const TURN_SECONDS = 15;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(key, name) {
  const socket = new WebSocket(url);
  const state = { socket, room: null, hand: [], id: '' };
  socket.addEventListener('open', () => socket.send(JSON.stringify({ t: 'hello', key, name })));
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.t === 'sync') {
      state.room = msg.room;
      state.hand = msg.hand;
      state.id = msg.youId;
    }
  });
  return state;
}

const send = (peer, message) => peer.socket.send(JSON.stringify(message));
const cards = (peer) => peer.room.players.map((p) => p.cards).join(',');

const a = connect('idle-a', 'ALPHA');
const b = connect('idle-b', 'BETA');
await sleep(1200);

// Whichever socket landed first holds the host seat.
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
const before = cards(a);
console.log(`round running, hands ${before}`);

a.socket.close();
b.socket.close();
console.log('both players disconnected — waiting out 3 turn clocks…');
await sleep(TURN_SECONDS * 3000 + 5000);

const back = connect('idle-a', 'ALPHA');
await sleep(1500);

if (!back.room) {
  console.error('FAIL — could not reconnect');
  process.exit(1);
}
const after = cards(back);
console.log(`reconnected, phase ${back.room.phase}, hands ${after}`);

// Two outcomes are both correct here. If the Durable Object stayed warm the
// round is still there untouched; if it was evicted while empty (all state is
// in memory) we get a clean lobby. What must never happen is the clock having
// auto-played its way through an empty table.
if (back.room.phase === 'play') {
  if (after !== before) {
    console.error(`FAIL — clock kept auto-playing while the table was empty: ${before} → ${after}`);
    process.exit(1);
  }
  if (!back.room.turnEndsAt) {
    console.error('FAIL — clock did not restart on reconnect');
    process.exit(1);
  }
  console.log('PASS — round held, clock parked while empty and restarted on return');
} else if (back.room.phase === 'lobby') {
  console.log('PASS — room was evicted while empty and came back as a clean lobby');
} else {
  console.error(`FAIL — unexpected phase ${back.room.phase}`);
  process.exit(1);
}
back.socket.close();
process.exit(0);
