/**
 * Idle-protection regression test.
 *   node scripts/afk.mjs [host]
 *
 * A room where everybody is still connected but nobody is finding anything must
 * eventually give the round up and fall back to the lobby. Without that, the
 * round clock expires, the results screen arms another alarm, the next grid is
 * printed, and an abandoned Durable Object stays awake forever.
 *
 * Two players join, start a three-round game on the shortest legal clock, and
 * then stare at the wall. Takes roughly a minute and a half.
 */

const host = process.argv[2] ?? 'localhost:8790';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const room = `afk-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${room}/socket`;
const ROUND_SECONDS = 20;
/** Three idle rounds plus their results screens, with room to spare. */
const BUDGET_MS = ROUND_SECONDS * 1000 * 6;
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
send(boss, { t: 'rules', patch: { roundSeconds: ROUND_SECONDS, rounds: 3, size: 10, words: 8 } });
await sleep(300);
send(a, { t: 'ready', on: true });
send(b, { t: 'ready', on: true });
await sleep(400);
send(boss, { t: 'begin' });
await sleep(900);

if (a.room.phase !== 'play') {
  console.error(`FAIL — round never started (phase ${a.room.phase})`);
  process.exit(1);
}
console.log(`round running on a ${ROUND_SECONDS}s clock; both players will now sit on their hands…`);

const started = Date.now();
let sawSecondGrid = false;
while (Date.now() - started < BUDGET_MS) {
  await sleep(2000);
  if (a.room.round > 1) sawSecondGrid = true;

  if (a.room.phase === 'lobby') {
    const elapsed = Math.round((Date.now() - started) / 1000);
    console.log(`room fell back to the lobby after ${elapsed}s (reached round ${sawSecondGrid ? '2+' : '1'})`);

    if (!a.room.log.some((line) => line.code === 'abandoned')) {
      console.error('FAIL — returned to the lobby without logging the abandonment');
      process.exit(1);
    }
    if (a.room.roundEndsAt !== null || a.room.nextAt !== null) {
      console.error('FAIL — a clock is still running after the room was abandoned');
      process.exit(1);
    }
    if (a.room.cells !== '' || a.room.words.length !== 0) {
      console.error('FAIL — the abandoned grid was left on the table');
      process.exit(1);
    }
    console.log('PASS — an idle room gives up instead of printing grids forever');
    a.socket.close();
    b.socket.close();
    process.exit(0);
  }
}

console.error(
  `FAIL — still in phase ${a.room.phase} (round ${a.room.round}) after ${BUDGET_MS / 1000}s of nobody claiming anything`,
);
process.exit(1);
