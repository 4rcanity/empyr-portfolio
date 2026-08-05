/** Scratch probe: force one challenge and watch the stage clock. */

const host = process.argv[2] ?? 'localhost:8795';
const room = `probe-${Math.random().toString(36).slice(2, 7)}`;
const url = `ws://${host}/room/${room}/socket`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(key, name) {
  const socket = new WebSocket(url);
  const state = { socket, room: null, hand: [], id: '' };
  socket.addEventListener('open', () => socket.send(JSON.stringify({ t: 'hello', key, name })));
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.t === 'nope') console.log(`${name} nope: ${msg.msg}`);
    if (msg.t === 'sync' && msg.room.phase !== state.room?.phase) {
      console.log(`${name} phase → ${msg.room.phase}`);
    }
    if (msg.t === 'sync') {
      state.room = msg.room;
      state.hand = msg.hand;
      state.id = msg.youId;
    }
  });
  return state;
}

const send = (peer, message) => peer.socket.send(JSON.stringify(message));

const a = connect('probe-a', 'AAA');
const b = connect('probe-b', 'BBB');
await sleep(900);
const boss = a.room.players.find((p) => p.id === a.id)?.host ? a : b;
send(a, { t: 'ready', on: true });
send(b, { t: 'ready', on: true });
await sleep(300);
send(boss, { t: 'begin' });
await sleep(600);

console.log('phase', a.room.phase, 'hands', a.hand.length, b.hand.length, 'log', a.room.log.map((l) => l.code));
const active = a.room.activeId === a.id ? a : b;
const other = active === a ? b : a;
send(active, { t: 'play', cardIds: [active.hand[0].id] });
await sleep(400);
console.log('after play:', other.room.phase, 'claim', other.room.claim);
send(other, { t: 'liar' });
await sleep(300);
console.log('after liar:', a.room.phase, 'stage', JSON.stringify(a.room.stage));

for (let i = 0; i < 16; i++) {
  await sleep(1000);
  console.log(`t+${i + 1}s phase=${a.room.phase} round=${a.room.round} stage=${a.room.stage?.id ?? '-'}`);
  if (a.room.phase === 'play' && a.room.round > 1) {
    console.log('PASS — stage advanced on the alarm alone');
    process.exit(0);
  }
}
console.log('FAIL — stage never advanced');
process.exit(1);
