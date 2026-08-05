/**
 * Regression test for the idle path.
 *
 *   node scripts/afk.mjs [host]
 *
 * A game whose players both walk away must (a) park the clock immediately, so
 * nobody loses on time to an empty room and the Durable Object stops re-arming
 * alarms, and (b) drop back to the lobby once after a bounded wait instead of
 * living forever. A spectator stays connected throughout so the room can be
 * observed — spectators must not be mistaken for players holding a clock.
 *
 * Takes a little over a minute: the server abandons a player-less game after 60s.
 */

const host = process.argv[2] ?? 'localhost:8793';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const code = `afk-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BUDGET_MS = 100_000;

function connect(key, name, as) {
  const socket = new WebSocket(url);
  const peer = { socket, room: null, seat: null };
  socket.addEventListener('open', () => socket.send(JSON.stringify({ t: 'hello', key, name, as })));
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.t === 'sync') {
      peer.room = msg.room;
      peer.seat = msg.seat;
    }
  });
  return peer;
}

const send = (peer, message) => peer.socket.send(JSON.stringify(message));

const white = connect('afk-w', 'ALBA', 'play');
await sleep(500);
const black = connect('afk-b', 'NOIR', 'play');
await sleep(500);
const eyes = connect('afk-s', 'EYES', 'watch');
await sleep(700);

send(white, { t: 'rules', patch: { preset: 'custom', minutes: 10, increment: 0 } });
await sleep(300);
send(white, { t: 'ready', on: true });
send(black, { t: 'ready', on: true });
await sleep(300);
send(white, { t: 'begin' });
await sleep(700);

if (white.room?.phase !== 'play') {
  console.error(`FAIL — game never started (phase ${white.room?.phase})`);
  process.exit(1);
}
if (eyes.seat !== null) {
  console.error(`FAIL — the watcher was given the ${eyes.seat} seat`);
  process.exit(1);
}
const bankedBefore = white.room.players.find((p) => p.seat === 'w').msLeft;
console.log(`game running with a 10 minute clock; white has ${Math.round(bankedBefore / 1000)}s`);

// Both players walk away. The spectator keeps watching.
white.socket.close();
black.socket.close();
await sleep(1500);

const parked = eyes.room;
if (parked.ticking !== null || parked.turnEndsAt !== null) {
  console.error(`FAIL — the clock is still running with nobody at the board (ticking=${parked.ticking})`);
  process.exit(1);
}
console.log('clock parked as soon as both players dropped');

const banked = parked.players.find((p) => p.seat === 'w').msLeft;
if (banked < bankedBefore - 10_000) {
  console.error(`FAIL — white lost ${(bankedBefore - banked) / 1000}s to an empty room`);
  process.exit(1);
}
console.log(`white's clock banked at ${Math.round(banked / 1000)}s`);

const started = Date.now();
while (Date.now() - started < BUDGET_MS) {
  await sleep(2000);
  const room = eyes.room;
  if (room.phase === 'lobby') {
    const elapsed = Math.round((Date.now() - started) / 1000);
    console.log(`game abandoned back to the lobby after ${elapsed}s`);
    if (!room.log.some((line) => line.code === 'abandoned')) {
      console.error('FAIL — dropped to the lobby without logging the abandonment');
      process.exit(1);
    }
    if (room.turnEndsAt !== null || room.ticking !== null) {
      console.error('FAIL — a clock is still armed on an abandoned game');
      process.exit(1);
    }
    if (room.history.length !== 0) {
      console.error('FAIL — the abandoned game left its move list behind');
      process.exit(1);
    }
    console.log('PASS — idle game parked its clock and was reaped exactly once');
    eyes.socket.close();
    process.exit(0);
  }
}

console.error(`FAIL — still in phase ${eyes.room?.phase} after ${BUDGET_MS / 1000}s with nobody playing`);
process.exit(1);
