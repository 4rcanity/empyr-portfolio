/**
 * Screenshot driver. Drives a real browser as White through the Astro dev server
 * while a socket bot answers as Black, so every frame is a genuine game state.
 *
 *   node scripts/shots.mjs
 *
 * Needs `npx astro dev` on 4321 and `npx wrangler dev --port 8793`.
 */

import { launch, sleep } from '../../../tools/cdp.mjs';
import { legalMoves, parseFen, toSan } from '../src/engine.ts';

const SITE = 'http://localhost:4321';
const WORKER = 'localhost:8793';
const OUT = '../../.shots/chess';

function bot(code, key, name, as = 'play') {
  const socket = new WebSocket(`ws://${WORKER}/room/${code}/socket`);
  const peer = { socket, room: null, seat: null };
  socket.addEventListener('open', () => socket.send(JSON.stringify({ t: 'hello', key, name, as })));
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.t === 'sync') {
      peer.room = msg.room;
      peer.seat = msg.seat;
    }
  });
  peer.send = (message) => socket.send(JSON.stringify(message));
  return peer;
}

async function waitFor(peer, test, what, budget = 8000) {
  const deadline = Date.now() + budget;
  while (Date.now() < deadline) {
    if (peer.room && test(peer.room)) return peer.room;
    await sleep(40);
  }
  throw new Error(`bot timed out waiting for ${what} (phase=${peer.room?.phase})`);
}

function resolve(fen, san) {
  const pos = parseFen(fen);
  for (const move of legalMoves(pos)) if (toSan(pos, move) === san) return move;
  throw new Error(`no move ${san} in ${fen}`);
}

const point = (session, square) =>
  session.run(`(() => {
    const el = document.querySelector('[data-square="${square}"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);

async function mouse(session, type, at, buttons = 0) {
  await session.send('Input.dispatchMouseEvent', {
    type,
    x: at.x,
    y: at.y,
    button: 'left',
    buttons,
    clickCount: type === 'mouseReleased' || type === 'mousePressed' ? 1 : 0,
  });
}

/** Tap the origin, then tap the target — the touch-friendly path. */
async function tapMove(session, from, to) {
  const a = await point(session, from);
  const b = await point(session, to);
  if (!a || !b) throw new Error(`missing square ${from} or ${to}`);
  await mouse(session, 'mousePressed', a, 1);
  await mouse(session, 'mouseReleased', a);
  await sleep(90);
  await mouse(session, 'mousePressed', b, 1);
  await mouse(session, 'mouseReleased', b);
  await sleep(220);
}

/** Press, travel, release — the drag path. */
async function dragMove(session, from, to) {
  const a = await point(session, from);
  const b = await point(session, to);
  await mouse(session, 'mousePressed', a, 1);
  for (let step = 1; step <= 6; step++) {
    await mouse(
      session,
      'mouseMoved',
      { x: Math.round(a.x + ((b.x - a.x) * step) / 6), y: Math.round(a.y + ((b.y - a.y) * step) / 6) },
      1,
    );
    await sleep(25);
  }
  await mouse(session, 'mouseReleased', b);
  await sleep(220);
}

async function setFen(session, fen) {
  await session.type('.cx-fen', fen);
  await session.click('Set position');
  await sleep(400);
}

/** Browser sits down as White, bot answers as Black, host starts the clocks. */
async function seatUp(session, code, { fen, preset } = {}) {
  await session.go(`${SITE}/en/minigames/chess/play?code=${code}`);
  await sleep(1400);
  await session.type('.cx-checkin input', 'ALBA');
  await session.click('Sit down');
  await sleep(900);

  const black = bot(code, `shot-b-${code}`, 'NOIR');
  await waitFor(black, (r) => r.players.length === 2, 'both seats filled');

  if (preset) {
    await session.click(preset);
    await sleep(250);
  }
  if (fen) await setFen(session, fen);

  black.send({ t: 'ready', on: true });
  await session.click('Ready');
  await sleep(350);
  await session.click('Start the clocks');
  await waitFor(black, (r) => r.phase === 'play', 'the game to start');
  await sleep(500);
  return black;
}

const shots = [];
const page = await launch({ width: 1440, height: 1000 });

try {
  // 1 — landing page
  await page.go(`${SITE}/en/minigames/chess`);
  await sleep(1600);
  shots.push(await page.shot(`${OUT}/01-landing.png`));

  // 2 — lobby with both seats filled
  const lobbyCode = `shot${Math.random().toString(36).slice(2, 6)}`;
  await page.go(`${SITE}/en/minigames/chess/play?code=${lobbyCode}`);
  await sleep(1400);
  await page.type('.cx-checkin input', 'ALBA');
  await page.click('Sit down');
  await sleep(900);
  const lobbyBot = bot(lobbyCode, `shot-b-${lobbyCode}`, 'NOIR');
  await waitFor(lobbyBot, (r) => r.players.length === 2, 'both seats');
  lobbyBot.send({ t: 'ready', on: true });
  await page.click('3+2 blitz');
  await sleep(500);
  shots.push(await page.shot(`${OUT}/02-lobby.png`));
  lobbyBot.socket.close();

  // 3 — the opening position, White to move
  const gameCode = `shot${Math.random().toString(36).slice(2, 6)}`;
  const black = await seatUp(page, gameCode, { preset: '10+0 rapid' });
  shots.push(await page.shot(`${OUT}/03-opening.png`));

  // 4 — a real middlegame: captures on the board and Black sitting in check
  const line = [
    'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5',
    'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5',
    'Bxb5+',
  ];
  for (let i = 0; i < line.length; i++) {
    const san = line[i];
    if (i % 2 === 0) {
      const move = resolve(black.room.fen, san);
      // Alternate the two input paths so both are exercised for real.
      const from = `${'abcdefgh'[move.from & 7]}${(move.from >> 3) + 1}`;
      const to = `${'abcdefgh'[move.to & 7]}${(move.to >> 3) + 1}`;
      if (i % 4 === 0) await dragMove(page, from, to);
      else await tapMove(page, from, to);
      await waitFor(black, (r) => r.history.length === i + 1, `white ${san}`);
    } else {
      const move = resolve(black.room.fen, san);
      black.send({ t: 'move', from: move.from, to: move.to, promo: move.promo });
      await waitFor(black, (r) => r.history.length === i + 1, `black ${san}`);
    }
  }
  await sleep(700);
  shots.push(await page.shot(`${OUT}/04-midgame-check.png`));
  black.socket.close();

  // 5 — the promotion chooser, mid-decision
  const promoCode = `shot${Math.random().toString(36).slice(2, 6)}`;
  const promoBot = await seatUp(page, promoCode, {
    fen: '2q1k3/P7/8/8/8/8/8/4K3 w - - 0 1',
    preset: 'Custom',
  });
  await tapMove(page, 'a7', 'a8');
  await sleep(500);
  shots.push(await page.shot(`${OUT}/05-promotion.png`));
  await page.click('Knight');
  await sleep(500);
  promoBot.socket.close();

  // 6 — a finished game: mate, result banner, PGN
  const mateCode = `shot${Math.random().toString(36).slice(2, 6)}`;
  const mateBot = await seatUp(page, mateCode, {
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    preset: 'Custom',
  });
  await tapMove(page, 'a1', 'a8');
  await waitFor(mateBot, (r) => Boolean(r.result), 'the mate');
  await sleep(700);
  shots.push(await page.shot(`${OUT}/06-finished.png`));

  // 7 — a close look at the pieces themselves, at twice the pixel density
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 760,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
  const zoomCode = `shot${Math.random().toString(36).slice(2, 6)}`;
  const zoomBot = await seatUp(page, zoomCode, {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
    preset: 'Custom',
  });
  await sleep(600);
  shots.push(await page.shot(`${OUT}/08-pieces.png`));
  zoomBot.socket.close();
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const problems = page.problems();
  const overflow = await page.run('document.documentElement.scrollWidth - window.innerWidth');
  console.log(`\nconsole: ${problems.length === 0 ? 'clean' : problems.join(' | ')}`);
  console.log(`desktop overflow: ${overflow}px`);
  mateBot.socket.close();
} finally {
  page.close();
}

// 7 — 390px phone, mid-game
const phone = await launch({ width: 390, height: 844 });
try {
  const code = `shot${Math.random().toString(36).slice(2, 6)}`;
  const black = await seatUp(phone, code, { preset: '5+0 blitz' });
  for (const [index, san] of ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'd4', 'exd4'].entries()) {
    const move = resolve(black.room.fen, san);
    if (index % 2 === 0) {
      const from = `${'abcdefgh'[move.from & 7]}${(move.from >> 3) + 1}`;
      const to = `${'abcdefgh'[move.to & 7]}${(move.to >> 3) + 1}`;
      await tapMove(phone, from, to);
    } else {
      black.send({ t: 'move', from: move.from, to: move.to, promo: move.promo });
    }
    await waitFor(black, (r) => r.history.length === index + 1, `phone ${san}`);
  }
  await sleep(600);
  shots.push(await phone.shot(`${OUT}/07-phone-390.png`));

  const overflow = await phone.run('document.documentElement.scrollWidth - window.innerWidth');
  const problems = phone.problems();
  console.log(`phone overflow: ${overflow}px`);
  console.log(`phone console: ${problems.length === 0 ? 'clean' : problems.join(' | ')}`);
  if (overflow > 0) console.error('OVERFLOW — the phone layout scrolls sideways');
  black.socket.close();
} finally {
  phone.close();
}

console.log(`\n${shots.length} shots:`);
for (const shot of shots) console.log(`  ${shot}`);
process.exit(0);
