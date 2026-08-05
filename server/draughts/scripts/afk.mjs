/**
 * Regression test for the idle path.
 *   node scripts/afk.mjs [host]
 *
 * Two things have to hold, and they are not the same thing:
 *
 *   1. A player thinking with the clock running is legitimate — the server must
 *      keep the clock armed and not touch the game.
 *   2. Once nobody is connected, the clock is parked (so a disconnected player
 *      is not flagged for time they never had) and the room drops back to the
 *      lobby after a bounded wait, instead of re-arming its alarm forever and
 *      keeping the Durable Object alive.
 *
 * Takes a little under two minutes: the abandon window is 90 seconds.
 */

const host = process.argv[2] ?? 'localhost:8794';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const room = `afk-${Math.random().toString(36).slice(2, 7)}`;
const url = `${secure ? 'wss' : 'ws'}://${host}/room/${room}/socket`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(key, name) {
  const socket = new WebSocket(url);
  const peer = { socket, room: null, you: null };
  socket.addEventListener('open', () => socket.send(JSON.stringify({ t: 'hello', key, name })));
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.t === 'sync') {
      peer.room = msg.room;
      peer.you = msg.you;
    }
  });
  return peer;
}

const send = (peer, message) => peer.socket.send(JSON.stringify(message));

async function until(peer, test, label, budget = 8000) {
  const deadline = Date.now() + budget;
  while (Date.now() < deadline) {
    if (peer.room && test(peer.room)) return peer.room;
    await sleep(50);
  }
  throw new Error(`timed out waiting for ${label} (phase=${peer.room?.phase})`);
}

const die = (message) => {
  console.error(`FAIL — ${message}`);
  process.exit(1);
};

const white = connect(`${room}-w`, 'WIT');
await until(white, (r) => r.players.length === 1, 'white seated');
const black = connect(`${room}-b`, 'ZWART');
await until(white, (r) => r.players.length === 2, 'black seated');

send(white, { t: 'rules', patch: { clock: true, minutes: 20, increment: 0 } });
await until(white, (r) => r.rules.minutes === 20, 'clock configured');
send(white, { t: 'ready', on: true });
send(black, { t: 'ready', on: true });
await until(white, (r) => r.players.every((p) => p.ready), 'both ready');
send(white, { t: 'begin' });
await until(white, (r) => r.phase === 'play', 'game running');

/* 1 — a player is thinking, which is not the same as an idle table. */

console.log('white is thinking with both players connected…');
await sleep(6000);
if (white.room.phase !== 'play') die(`the game was dropped while a player was thinking (${white.room.phase})`);
if (white.room.turnEndsAt === null) die('the clock was parked while both players were connected');
// The server only broadcasts on events, so read the burn off the deadline it set
// rather than off the banked figure in the last sync.
const burned = 20 * 60_000 - (white.room.turnEndsAt - Date.now());
if (burned < 4000) die(`white's clock barely moved (${burned}ms) — it is not actually running`);
console.log(`  clock still armed, white has burned ${Math.round(burned / 1000)}s — correct`);

/* 2 — everybody leaves. */

const bankedWhite = white.room.turnEndsAt - Date.now();
white.socket.close();
black.socket.close();
console.log('both players disconnected; waiting for the room to park and give up…');

const started = Date.now();
// A fresh spectator so we can watch the room without seating anybody.
await sleep(2000);
const watcher = connect(`${room}-watch`, 'KIJKER');
await until(watcher, (r) => r.phase === 'play' || r.phase === 'lobby', 'a first sync');

if (watcher.room.phase === 'play') {
  if (watcher.room.turnEndsAt !== null) die('the clock is still armed with nobody seated online');
  const drift = watcher.room.clock.w - bankedWhite;
  if (drift > 1500) die('parking the clock handed time back');
  // Nobody has been connected for a couple of seconds; if the clock were still
  // running that time would have come off white.
  if (drift < -2500) die(`white kept burning time while offline (${-drift}ms)`);
  console.log(`  clock parked with white on ${Math.round(watcher.room.clock.w / 1000)}s banked — correct`);
} else {
  console.log('  room had already dropped to the lobby');
}

const deadline = started + 150_000;
while (Date.now() < deadline) {
  await sleep(2500);
  if (watcher.room.phase !== 'lobby') continue;

  const elapsed = Math.round((Date.now() - started) / 1000);
  console.log(`room dropped back to the lobby after ${elapsed}s`);
  if (!watcher.room.log.some((line) => line.code === 'abandoned')) {
    die('returned to the lobby without logging the abandonment');
  }
  if (watcher.room.turnEndsAt !== null) die('the clock is still armed on an abandoned room');
  if (watcher.room.history.length !== 0) die('the abandoned game left its history behind');
  console.log('PASS — the clock parked, the room was abandoned, and the notice survived the reset');
  watcher.socket.close();
  process.exit(0);
}

die(`still in phase ${watcher.room.phase} after 150s with nobody playing`);
