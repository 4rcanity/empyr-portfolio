/**
 * Headless play-through against a DAMCAFÉ draughts worker.
 *   node scripts/smoke.mjs [host]
 *
 * Two halves. First, random-legal bot games driven purely off the server's own
 * move list, until one reaches a decisive result. Second, crafted positions for
 * the rules a random game will not reach in a hurry: compulsory capture,
 * maximum capture, a five-piece chain, a flying king, promotion, a man crossing
 * the promotion row mid-chain, tied routes offered as a choice, and outright
 * illegal moves. Every one of these must be observed or the run fails.
 */

const host = process.argv[2] ?? 'localhost:8794';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...parts) => console.log(...parts);

const seen = {
  decisive: false,
  compulsory: false,
  maximum: false,
  chain3: false,
  chain5: false,
  flyingKing: false,
  promotion: false,
  midChainNoPromotion: false,
  tiedRoutes: false,
  tiedLandings: false,
  illegal: false,
  resign: false,
  drawAgreed: false,
  spectator: false,
  rejoin: false,
};

let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`  FAIL  ${message}`);
};
const ok = (message) => log(`  ok    ${message}`);

class Client {
  constructor(code, key, name, spectate = false) {
    this.name = name;
    this.key = key;
    this.room = null;
    this.you = null;
    this.youId = '';
    this.nopes = [];
    this.closed = false;
    this.socket = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`);
    this.socket.addEventListener('open', () =>
      this.socket.send(JSON.stringify({ t: 'hello', key, name, spectate })),
    );
    this.socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.t === 'nope') {
        this.nopes.push(msg.msg);
        return;
      }
      if (msg.t !== 'sync') return;
      this.room = msg.room;
      this.you = msg.you;
      this.youId = msg.youId;
      if (this.onSync) this.onSync(msg.room);
    });
    this.socket.addEventListener('close', () => {
      this.closed = true;
    });
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  close() {
    this.socket.close();
  }

  /** Wait until the room satisfies `test`, or blow up with a readable dump. */
  async until(test, label, budget = 8000) {
    const deadline = Date.now() + budget;
    while (Date.now() < deadline) {
      if (this.room && test(this.room)) return this.room;
      await sleep(25);
    }
    throw new Error(
      `${this.name}: timed out waiting for ${label} (phase=${this.room?.phase} turn=${this.room?.turn} ` +
        `result=${JSON.stringify(this.room?.result)} nopes=${this.nopes.slice(-2).join(' | ')})`,
    );
  }

  /** Send something illegal and demand a rejection that matches `pattern`. */
  async expectNope(message, pattern, budget = 3000) {
    this.nopes.length = 0;
    this.send(message);
    const deadline = Date.now() + budget;
    while (Date.now() < deadline) {
      const hit = this.nopes.find((line) => pattern.test(line));
      if (hit) return hit;
      await sleep(25);
    }
    throw new Error(
      `${this.name}: expected a rejection matching ${pattern} but got ${JSON.stringify(this.nopes)}`,
    );
  }
}

/** Seat two clients, apply settings and a position, and start the game. */
async function table(label, { fen = null, clock = false, minutes = 5, increment = 0 } = {}) {
  const code = `smk-${Math.random().toString(36).slice(2, 7)}`;
  const white = new Client(code, `${code}-w`, 'WIT');
  await white.until((room) => room.players.some((p) => p.id === white.youId), 'white seated');
  const black = new Client(code, `${code}-b`, 'ZWART');
  await black.until((room) => room.players.length === 2, 'black seated');
  await white.until((room) => room.players.length === 2, 'both seated');

  if (white.you !== 'w' || black.you !== 'b') {
    throw new Error(`${label}: seating went wrong (${white.you}/${black.you})`);
  }

  white.send({ t: 'rules', patch: { clock, minutes, increment } });
  await white.until((room) => room.rules.clock === clock, 'rules applied');
  if (fen) {
    white.send({ t: 'setup', fen });
    await white.until((room) => room.log.some((line) => line.code === 'position'), 'position loaded');
  }
  white.send({ t: 'ready', on: true });
  black.send({ t: 'ready', on: true });
  await white.until((room) => room.players.every((p) => p.ready), 'both ready');
  white.send({ t: 'begin' });
  await white.until((room) => room.phase === 'play', 'game started');
  await black.until((room) => room.phase === 'play', 'game started (black)');
  return { code, white, black };
}

const clientFor = (t, side) => (side === 'w' ? t.white : t.black);

/** Play one legal move for whoever is on the move, chosen at random. */
async function randomMove(t, watch) {
  const room = t.white.room;
  const me = clientFor(t, room.turn);
  const options = room.options;
  if (options.length === 0) throw new Error('no options while the game is still running');
  const pick = options[Math.floor(Math.random() * options.length)];
  const wasKing = ['2', '4'].includes(room.board[pick.from - 1]);
  const before = room.history.length;
  me.send({ t: 'move', from: pick.from, to: pick.to, path: pick.path });
  await t.white.until(
    (next) => next.history.length > before || next.result !== null,
    `move ${pick.from}-${pick.to} to land`,
  );
  const played = t.white.room.history[before];
  if (played) watch(played, wasKing, room);
}

/* -------------------------------------------------------------- random games */

log(`DAMCAFE smoke @ ${host}\n`);
log('random-legal bot games');

for (let attempt = 1; attempt <= 5 && !seen.decisive; attempt++) {
  const t = await table(`random ${attempt}`, { clock: true, minutes: 5, increment: 0 });
  let plies = 0;
  const watch = (entry, wasKing) => {
    if (entry.captures.length >= 3) seen.chain3 = true;
    if (entry.captures.length >= 5) seen.chain5 = true;
    if (wasKing && entry.captures.length > 0) seen.flyingKing = true;
    if (entry.promote) seen.promotion = true;
  };
  try {
    while (t.white.room.result === null && plies < 400) {
      await randomMove(t, watch);
      plies++;
    }
    const room = t.white.room;
    if (!room.result) {
      fail(`game ${attempt} never finished (${plies} plies)`);
    } else {
      const verdict = room.result.winner
        ? `${room.result.winner === 'w' ? 'WIT' : 'ZWART'} wins (${room.result.reason})`
        : `draw (${room.result.reason})`;
      log(`  game ${attempt}: ${plies} plies, ${verdict}`);
      if (room.result.winner) seen.decisive = true;
      if (room.clock === null) fail('clocks were requested but never reported');
      else if (room.clock.w <= 0 || room.clock.b <= 0) fail('a clock ran out during bot play');
    }
    const nopes = [...t.white.nopes, ...t.black.nopes];
    if (nopes.length > 0) fail(`server rejected a move it had offered: ${nopes[0]}`);
  } catch (error) {
    fail(`game ${attempt}: ${error.message}`);
  }
  t.white.close();
  t.black.close();
  await sleep(150);
}
if (seen.decisive) ok('a bot game reached a decisive result');
else fail('no bot game ever produced a winner');

/* ------------------------------------------------------------ crafted checks */

log('\ncompulsory capture');
try {
  // 28 can take 23; every quiet move on the board is therefore illegal.
  const t = await table('compulsory', { fen: 'W:W28,50:B1,2,23' });
  if (!t.white.room.mustCapture) fail('server did not flag the position as a forced capture');
  else ok('the position is flagged as a forced capture');
  const quiet = await t.white.expectNope({ t: 'move', from: 50, to: 45 }, /compulsor/i);
  seen.compulsory = true;
  ok(`quiet move 50-45 refused: "${quiet}"`);
  await t.white.expectNope({ t: 'move', from: 28, to: 22 }, /compulsor/i);
  ok('the capturing piece may not step quietly either');
  t.white.send({ t: 'move', from: 28, to: 19, path: [19] });
  await t.white.until((room) => room.history.length === 1, 'the capture to land');
  ok('28x19 accepted');
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`compulsory capture: ${error.message}`);
}

log('\nmaximum capture');
try {
  // From 28: one piece via 17, or three via 19-30-39. Only three is legal.
  const t = await table('maximum', { fen: 'W:W28,50:B1,22,23,24,34' });
  const refused = await t.white.expectNope({ t: 'move', from: 28, to: 17 }, /maximum/i);
  seen.maximum = true;
  ok(`the one-piece capture was refused: "${refused}"`);
  const best = t.white.room.options;
  if (!best.every((move) => move.captures.length === 3)) {
    fail(`server offered non-maximal routes: ${best.map((m) => m.captures.length).join(',')}`);
  } else ok(`${best.length} route(s) offered, all taking 3 pieces`);
  t.white.send({ t: 'move', from: 28, to: 39, path: [19, 30, 39] });
  await t.white.until((room) => room.history.length === 1, 'the three-piece chain');
  const entry = t.white.room.history[0];
  if (entry.captures.length !== 3) fail(`chain took ${entry.captures.length} pieces, expected 3`);
  else {
    seen.chain3 = true;
    ok(`28x19x30x39 removed ${entry.captures.join(', ')}`);
  }
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`maximum capture: ${error.message}`);
}

log('\nfive-piece chain');
try {
  // A zig-zag of five black men for a single white man to run down:
  // 46x37x28x19x30x39 taking 41, 32, 23, 24 and 34.
  const t = await table('five', { fen: 'W:W46,50:B1,23,24,32,34,41' });
  const best = t.white.room.options;
  const top = Math.max(...best.map((m) => m.captures.length));
  if (top !== 5) fail(`expected a five-piece chain, best on offer was ${top}`);
  else {
    const route = best.find((m) => m.captures.length === 5);
    t.white.send({ t: 'move', from: route.from, to: route.to, path: route.path });
    await t.white.until((room) => room.history.length === 1, 'the five-piece chain');
    const entry = t.white.room.history[0];
    if (entry.captures.length !== 5) fail(`chain took ${entry.captures.length}`);
    else {
      seen.chain5 = true;
      seen.chain3 = true;
      ok(`${entry.from}x${entry.path.join('x')} removed five men: ${entry.captures.join(', ')}`);
    }
  }
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`five-piece chain: ${error.message}`);
}

log('\nflying king');
try {
  // K41 flies over 23 to 19, then 24, 40 and 39 — four pieces, and several
  // landing squares are on offer at the end of the chain.
  const t = await table('king', { fen: 'W:WK41,50:B1,23,24,39,40' });
  const best = t.white.room.options;
  const top = Math.max(...best.map((m) => m.captures.length));
  if (top !== 4) fail(`flying king chain took ${top}, expected 4`);
  else ok(`${best.length} tied king routes at 4 pieces`);
  const landings = [...new Set(best.map((m) => m.to))];
  if (landings.length < 2) fail('the king was offered only one landing square');
  else {
    seen.tiedLandings = true;
    ok(`landing squares on offer: ${landings.sort((a, b) => a - b).join(', ')}`);
  }
  const route = best[0];
  t.white.send({ t: 'move', from: route.from, to: route.to, path: route.path });
  await t.white.until((room) => room.history.length === 1, 'the king chain');
  const entry = t.white.room.history[0];
  if (entry.captures.length !== 4) fail(`king took ${entry.captures.length}`);
  else {
    seen.flyingKing = true;
    ok(`${entry.from}x${entry.path.join('x')} took ${entry.captures.length} pieces`);
  }
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`flying king: ${error.message}`);
}

log('\ntied routes over the same pieces');
try {
  // Black men on 23, 24, 33 and 34 ring square 28: the white man there can loop
  // either way for the same four pieces, finishing back where it started.
  const t = await table('tie', { fen: 'W:W28,50:B1,23,24,33,34' });
  const best = t.white.room.options.filter((m) => m.captures.length === 4);
  const routes = new Set(best.map((m) => m.path.join('.')));
  const hauls = new Set(best.map((m) => m.captures.join('.')));
  if (routes.size < 2 || hauls.size !== 1) {
    fail(`expected two routes over one haul, got ${routes.size} routes / ${hauls.size} hauls`);
  } else {
    seen.tiedRoutes = true;
    ok(`two routes, identical haul: ${[...routes].join('  |  ')}`);
  }
  const ambiguous = await t.white.expectNope({ t: 'move', from: 28, to: 28 }, /route/i);
  ok(`an unqualified move was refused as ambiguous: "${ambiguous}"`);
  const chosen = best[1] ?? best[0];
  t.white.send({ t: 'move', from: 28, to: 28, path: chosen.path });
  await t.white.until((room) => room.history.length === 1, 'the chosen route');
  const entry = t.white.room.history[0];
  if (entry.path.join('.') !== chosen.path.join('.')) fail('the server played a different route');
  else ok(`the chosen route was honoured: 28x${entry.path.join('x')}`);
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`tied routes: ${error.message}`);
}

log('\npromotion');
try {
  const t = await table('promote', { fen: 'W:W13,50:B1,8' });
  t.white.send({ t: 'move', from: 13, to: 2, path: [2] });
  await t.white.until((room) => room.history.length === 1, 'the promoting capture');
  const entry = t.white.room.history[0];
  if (!entry.promote) fail('the move was not marked as a promotion');
  else if (t.white.room.board[1] !== '2') fail(`square 2 holds "${t.white.room.board[1]}", not a white king`);
  else {
    seen.promotion = true;
    ok('13x2 finished on the far row and was crowned');
  }
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`promotion: ${error.message}`);
}

log('\nno promotion mid-chain');
try {
  const t = await table('midchain', { fen: 'W:W13,50:B1,7,8' });
  t.white.send({ t: 'move', from: 13, to: 11, path: [2, 11] });
  await t.white.until((room) => room.history.length === 1, 'the chain through the far row');
  const entry = t.white.room.history[0];
  if (entry.path[0] !== 2) fail(`the chain did not step onto square 2: ${entry.path.join(',')}`);
  else if (entry.promote) fail('the man promoted mid-chain');
  else if (t.white.room.board[10] !== '1') fail(`square 11 holds "${t.white.room.board[10]}", not a white man`);
  else {
    seen.midChainNoPromotion = true;
    ok('13x2x11 crossed the promotion row and stayed a man');
  }
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`mid-chain promotion: ${error.message}`);
}

log('\nillegal moves');
try {
  const t = await table('illegal', { clock: false });
  await t.white.expectNope({ t: 'move', from: 26, to: 21 }, /piece of yours|legal/i);
  await t.white.expectNope({ t: 'move', from: 16, to: 21 }, /piece of yours/i);
  await t.white.expectNope({ t: 'move', from: 31, to: 22 }, /legal/i);
  await t.black.expectNope({ t: 'move', from: 20, to: 25 }, /not your move/i);
  await t.white.expectNope({ t: 'move', from: 99, to: 4 }, /square|legal/i);
  seen.illegal = true;
  ok('empty squares, enemy pieces, impossible hops and out-of-turn moves all refused');
  if (t.white.room.history.length !== 0) fail('an illegal move changed the board');
  else ok('the board was untouched');
  t.white.close();
  t.black.close();
} catch (error) {
  fail(`illegal moves: ${error.message}`);
}

log('\nresignation, draw offers, spectators and rejoining');
try {
  const t = await table('social', { clock: true, minutes: 3, increment: 2 });
  const watcher = new Client(t.code, `${t.code}-s`, 'KIJKER', true);
  await watcher.until((room) => room.spectators === 1, 'spectator counted');
  if (watcher.you !== null) fail('the spectator was given a seat');
  else {
    seen.spectator = true;
    ok('a third connection watches without taking a seat');
  }
  await watcher.expectNope({ t: 'move', from: 31, to: 26 }, /watching/i);
  ok('spectators cannot move');

  t.white.send({ t: 'offerDraw' });
  await t.black.until((room) => room.drawOfferFrom === 'w', 'the draw offer');
  t.black.send({ t: 'answerDraw', accept: false });
  await t.white.until((room) => room.drawOfferFrom === null, 'the declined offer');
  ok('a draw offer can be declined');

  // A refreshed tab must land back in the same seat with the same clock.
  const clockBefore = t.white.room.clock.w;
  t.white.close();
  await sleep(300);
  const again = new Client(t.code, `${t.code}-w`, 'WIT');
  await again.until((room) => room.phase === 'play', 'rejoined game');
  if (again.you !== 'w') fail(`rejoining put the player on ${again.you} instead of white`);
  else if (again.room.clock.w > clockBefore + 1000) fail('rejoining refilled the clock');
  else {
    seen.rejoin = true;
    ok('a reconnect returns to the same seat and clock');
  }

  again.send({ t: 'offerDraw' });
  await t.black.until((room) => room.drawOfferFrom === 'w', 'the second offer');
  t.black.send({ t: 'answerDraw', accept: true });
  await again.until((room) => room.result !== null, 'the agreed draw');
  if (again.room.result.reason !== 'agreement' || again.room.result.winner !== null) {
    fail(`agreed draw recorded as ${JSON.stringify(again.room.result)}`);
  } else {
    seen.drawAgreed = true;
    ok('the game ended in a draw by agreement');
  }
  again.close();
  t.black.close();
  watcher.close();

  const r = await table('resign', { clock: false });
  r.black.send({ t: 'resign' });
  await r.white.until((room) => room.result !== null, 'the resignation');
  if (r.white.room.result.winner !== 'w' || r.white.room.result.reason !== 'resign') {
    fail(`resignation recorded as ${JSON.stringify(r.white.room.result)}`);
  } else {
    seen.resign = true;
    ok('black resigned and white was given the win');
  }
  r.white.close();
  r.black.close();
} catch (error) {
  fail(`social features: ${error.message}`);
}

/* ------------------------------------------------------------------ verdict */

log('\nobservations');
for (const [key, hit] of Object.entries(seen)) {
  log(`  ${hit ? 'seen ' : 'MISS '} ${key}`);
  if (!hit) failures++;
}

if (failures > 0) {
  console.error(`\nSMOKE FAILED — ${failures} problem(s)`);
  process.exit(1);
}
log('\nPASS — every required rule and interaction was observed');
process.exit(0);
