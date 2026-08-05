/**
 * Headless end-to-end run against an Empyr Gambit worker.
 *
 *   node scripts/smoke.mjs [host]
 *
 * Every rule that matters is driven deliberately rather than hoped for: crafted
 * FEN setups reach castling, en passant, promotion, mate, stalemate, all three
 * draw claims, illegal-move rejection and both flavours of clock flag, and a
 * complete recorded game is replayed move for move to prove notation and legal
 * play from the standard start. The run fails loudly if any of them never fire.
 */

import { legalMoves, parseFen, toSan } from '../src/engine.ts';

const host = process.argv[2] ?? 'localhost:8793';
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seen = new Set();
const failures = [];

function ok(label) {
  seen.add(label);
  console.log(`  ok    ${label}`);
}

function bad(label, detail) {
  failures.push(`${label}: ${detail}`);
  console.error(`  FAIL  ${label} — ${detail}`);
}

class Peer {
  constructor(code, key, name, as) {
    this.name = name;
    this.key = key;
    this.room = null;
    this.seat = null;
    this.id = '';
    this.nopes = [];
    this.fx = [];
    this.code = code;
    this.as = as;
    this.socket = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`);
    this.socket.addEventListener('open', () =>
      this.send({ t: 'hello', key, name, as: as ?? 'play' }),
    );
    this.socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.t === 'sync') {
        this.room = msg.room;
        this.seat = msg.seat;
        this.id = msg.youId;
      } else if (msg.t === 'nope') {
        this.nopes.push(msg.msg);
      } else if (msg.t === 'fx') {
        this.fx.push(msg.kind);
      }
    });
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  close() {
    this.socket.close();
  }

  /** Wait until `test(room)` holds, or blow up with a useful dump. */
  async until(test, what, budget = 8000) {
    const deadline = Date.now() + budget;
    while (Date.now() < deadline) {
      if (this.room && test(this.room)) return this.room;
      await sleep(25);
    }
    throw new Error(
      `${this.name} timed out waiting for ${what} ` +
        `(phase=${this.room?.phase} turn=${this.room?.turn} plies=${this.room?.history.length} ` +
        `result=${this.room?.result?.reason ?? 'none'} nopes=${this.nopes.slice(-2).join('/')})`,
    );
  }

  lastNope() {
    return this.nopes[this.nopes.length - 1] ?? '';
  }
}

/** Open a room with two players (plus a spectator) and start a game. */
async function table(label, { startFen, minutes = 5, increment = 0, spectator = false } = {}) {
  const code = `sm${Math.random().toString(36).slice(2, 7)}`;
  const white = new Peer(code, `w-${code}`, 'ALBA', 'play');
  await white.until((r) => r.players.some((p) => p.seat === 'w'), 'white seated');
  const black = new Peer(code, `b-${code}`, 'NOIR', 'play');
  await black.until((r) => r.players.length === 2, 'black seated');

  const patch = { preset: 'custom', minutes, increment };
  if (startFen) patch.startFen = startFen;
  white.send({ t: 'rules', patch });
  await white.until(
    (r) => r.rules.minutes === minutes && (!startFen || r.rules.startFen === startFen),
    'rules applied',
  );

  const watcher = spectator ? new Peer(code, `s-${code}`, 'EYES', 'watch') : null;
  if (watcher) await watcher.until((r) => r.spectators === 1, 'spectator counted');

  white.send({ t: 'ready', on: true });
  black.send({ t: 'ready', on: true });
  await white.until((r) => r.players.every((p) => p.ready), 'both ready');
  white.send({ t: 'begin' });
  await white.until((r) => r.phase !== 'lobby', 'game started');

  console.log(`\n${label}`);
  return { code, white, black, watcher, peers: [white, black, watcher].filter(Boolean) };
}

function closeAll(game) {
  for (const peer of game.peers) peer.close();
}

/** Translate SAN into the from/to pair the wire expects. */
function resolve(fen, san) {
  const pos = parseFen(fen);
  for (const move of legalMoves(pos)) {
    if (toSan(pos, move) === san) return move;
  }
  throw new Error(`no legal move matching ${san} in ${fen}`);
}

/** Play one move by SAN and wait for the server to record it. */
async function play(game, san) {
  const mover = game.white.room.turn === 'w' ? game.white : game.black;
  const before = mover.room.history.length;
  const move = resolve(mover.room.fen, san);
  mover.send({ t: 'move', from: move.from, to: move.to, promo: move.promo });
  const room = await mover.until(
    (r) => r.history.length > before || r.result,
    `${san} to land`,
  );
  const entry = room.history[room.history.length - 1];
  if (!entry || entry.san !== san) {
    throw new Error(`server recorded ${entry?.san ?? 'nothing'} where ${san} was played`);
  }
  return room;
}

// --------------------------------------------------------------- scenarios

/** A real recorded game, replayed to checkmate from the standard start. */
async function operaGame() {
  const moves = [
    'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5',
    'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5',
    'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7',
    'Qb8+', 'Nxb8', 'Rd8#',
  ];
  const game = await table('full game — Morphy–Duke of Brunswick, Paris 1858', { spectator: true });
  try {
    for (const san of moves) await play(game, san);
    const room = await game.white.until((r) => r.result, 'a result');
    if (room.result.reason === 'checkmate' && room.result.winner === 'w') {
      ok('full game to a decisive result (checkmate)');
      ok('checkmate detected');
    } else {
      bad('full game', `ended as ${room.result.reason} / ${room.result.winner}`);
    }
    if (room.history.length !== moves.length) {
      bad('full game', `${room.history.length} plies recorded, expected ${moves.length}`);
    }
    if (room.history.some((h) => h.san === 'O-O-O')) ok('castling (long, from real play)');
    else bad('castling', 'the queenside castle never appeared in the move list');
    if (room.pgn && room.pgn.includes('1-0') && room.pgn.includes('17. Rd8#')) {
      ok('PGN export of the finished game');
    } else {
      bad('PGN', `unexpected export: ${String(room.pgn).slice(0, 120)}`);
    }
    // The spectator watched the whole thing without ever taking a seat.
    if (game.watcher.room.history.length === moves.length && game.watcher.seat === null) {
      ok('spectator followed the game without a seat');
    } else {
      bad('spectator', `seat=${game.watcher.seat} plies=${game.watcher.room?.history.length}`);
    }
    game.watcher.send({ t: 'move', from: 12, to: 28 });
    await sleep(250);
    if (/spectator/i.test(game.watcher.lastNope())) ok('spectators cannot move the pieces');
    else bad('spectator move', `expected a refusal, got "${game.watcher.lastNope()}"`);
  } finally {
    closeAll(game);
  }
}

/** Both wings, both colours, plus the through-check refusal. */
async function castling() {
  const game = await table('castling — every condition', {
    startFen: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',
  });
  try {
    await play(game, 'O-O');
    await play(game, 'O-O-O');
    const room = game.white.room;
    if (room.history[0].san === 'O-O' && room.history[1].san === 'O-O-O') {
      ok('castling both wings (white short, black long)');
      seen.add('castle');
    }

    // A king may not cross an attacked square.
    const blocked = await table('castling — through check refused', {
      startFen: 'r3k2r/8/8/8/8/8/5q2/R3K2R w KQkq - 0 1',
    });
    try {
      const attempt = { t: 'move', from: 4, to: 6 };
      blocked.white.send(attempt);
      await sleep(250);
      const legalToG1 = (blocked.white.room.legal[4] ?? []).includes(6);
      if (!legalToG1 && blocked.white.lastNope()) {
        ok('castling through an attacked square refused');
      } else {
        bad('castling through check', `server offered g1 (legal=${legalToG1})`);
      }
    } finally {
      closeAll(blocked);
    }
  } finally {
    closeAll(game);
  }
}

async function enPassant() {
  const game = await table('en passant — capture and expiry', {
    startFen: '4k3/8/8/8/4p3/8/3P4/4K3 w - - 0 1',
  });
  try {
    await play(game, 'd4');
    const room = await play(game, 'exd3');
    if (room.fen.startsWith('4k3/8/8/8/8/3p4/8/4K3')) {
      ok('en passant capture removes the passed pawn');
      seen.add('ep');
    } else {
      bad('en passant', `board reads ${room.fen}`);
    }
  } finally {
    closeAll(game);
  }

  // The right lasts exactly one ply: skip it and the square is gone.
  const late = await table('en passant — right expires', {
    startFen: '4k3/8/8/8/4p3/8/3P4/4K3 w - - 0 1',
  });
  try {
    await play(late, 'd4');
    await play(late, 'Kd8');
    await play(late, 'Ke2');
    // e4xd3 would have been the en-passant capture, one move too late.
    late.black.send({ t: 'move', from: 28, to: 19 });
    await sleep(250);
    if (/not a move that piece can make/i.test(late.black.lastNope())) {
      ok('en passant right expires after one move');
    } else {
      bad('en passant expiry', `got "${late.black.lastNope()}"`);
    }
  } finally {
    closeAll(late);
  }
}

async function promotion() {
  const game = await table('promotion — the player chooses', {
    startFen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
  });
  try {
    // a7a8 with no piece named must bounce rather than silently queening.
    game.white.send({ t: 'move', from: 48, to: 56 });
    await sleep(250);
    if (/promote/i.test(game.white.lastNope())) ok('promotion requires an explicit choice');
    else bad('promotion prompt', `got "${game.white.lastNope()}"`);

    game.white.send({ t: 'move', from: 48, to: 56, promo: 'n' });
    const room = await game.white.until((r) => r.history.length === 1, 'the promotion to land');
    if (room.history[0].san === 'a8=N' && room.fen.startsWith('N3k3')) {
      ok('promotion to a knight (not auto-queened)');
      seen.add('promotion');
    } else {
      bad('promotion', `san=${room.history[0].san} fen=${room.fen}`);
    }
  } finally {
    closeAll(game);
  }
}

async function stalemate() {
  const game = await table('stalemate', { startFen: '7k/8/8/8/8/6Q1/8/K7 w - - 0 1' });
  try {
    await play(game, 'Qg6');
    const room = await game.white.until((r) => r.result, 'a result');
    if (room.result.reason === 'stalemate' && room.result.winner === null) {
      ok('stalemate is an automatic draw');
      seen.add('stalemate');
    } else {
      bad('stalemate', `got ${room.result.reason}`);
    }
  } finally {
    closeAll(game);
  }
}

async function threefold() {
  const game = await table('threefold repetition — claimed', {
    startFen: '4k2r/8/8/8/8/8/8/4K2R w Kk - 0 1',
  });
  try {
    for (let i = 0; i < 3; i++) {
      await play(game, 'Rg1');
      await play(game, 'Rg8');
      await play(game, 'Rh1');
      await play(game, 'Rh8');
    }
    const room = await game.white.until((r) => r.claimable.threefold, 'the claim to open');
    if (room.result) return bad('threefold', 'the game ended before the claim');
    game.white.send({ t: 'claimDraw', kind: 'threefold' });
    const done = await game.white.until((r) => r.result, 'the claimed draw');
    if (done.result.reason === 'threefold' && done.result.winner === null) {
      ok(`threefold repetition claimed (position seen ${room.repeats}x)`);
      seen.add('threefold');
    } else {
      bad('threefold', `got ${done.result.reason}`);
    }
  } finally {
    closeAll(game);
  }
}

async function fiftyMove() {
  const game = await table('fifty-move rule — claimed', {
    startFen: '4k3/8/8/8/8/8/8/4K2R w K - 98 60',
  });
  try {
    await play(game, 'Rh2');
    await play(game, 'Kd8');
    const room = await game.white.until((r) => r.claimable.fifty, 'the claim to open');
    game.white.send({ t: 'claimDraw', kind: 'fifty' });
    const done = await game.white.until((r) => r.result, 'the claimed draw');
    if (done.result.reason === 'fifty' && done.result.winner === null) {
      ok(`fifty-move rule claimed (halfmove clock ${room.halfmove})`);
      seen.add('fifty');
    } else {
      bad('fifty-move', `got ${done.result.reason}`);
    }
  } finally {
    closeAll(game);
  }
}

async function insufficient() {
  // Two knights is still mateable material, so the game runs; taking one of
  // them leaves king versus king and knight, which is not.
  const game = await table('insufficient material — automatic', {
    startFen: '4k3/8/8/8/8/8/3nn3/4K3 w - - 0 1',
  });
  try {
    await play(game, 'Kxd2');
    const room = await game.white.until((r) => r.result, 'a result');
    if (room.result.reason === 'insufficient' && room.result.winner === null) {
      ok('insufficient material is an automatic draw');
      seen.add('insufficient');
    } else {
      bad('insufficient material', `got ${room.result.reason}`);
    }
  } finally {
    closeAll(game);
  }
}

async function rejections() {
  const game = await table('illegal moves', { startFen: '4k3/4r3/8/8/8/8/4R3/4K3 w - - 0 1' });
  try {
    // A rook cannot leap; nothing about check involved.
    game.white.send({ t: 'move', from: 12, to: 45 });
    await sleep(250);
    if (/not a move that piece can make/i.test(game.white.lastNope())) {
      ok('shape-illegal move rejected');
      seen.add('illegal');
    } else {
      bad('illegal move', `got "${game.white.lastNope()}"`);
    }

    // The e-file rook is pinned by the black rook on e7.
    game.white.send({ t: 'move', from: 12, to: 11 });
    await sleep(250);
    if (/leave your king in check/i.test(game.white.lastNope())) {
      ok('move that would expose the king rejected');
      seen.add('pinned');
    } else {
      bad('pinned move', `got "${game.white.lastNope()}"`);
    }

    // Out-of-turn moves are refused too.
    game.black.send({ t: 'move', from: 52, to: 44 });
    await sleep(250);
    if (/not your turn/i.test(game.black.lastNope())) ok('out-of-turn move rejected');
    else bad('turn order', `got "${game.black.lastNope()}"`);
  } finally {
    closeAll(game);
  }
}

async function flagging() {
  const game = await table('clock — flag decides the game', {
    startFen: '3qk3/8/8/8/8/8/8/3QK3 w - - 0 1',
    minutes: 0.1,
  });
  try {
    const room = await game.white.until((r) => r.result, 'the flag', 12_000);
    if (room.result.reason === 'flag' && room.result.winner === 'b') {
      ok('clock flag ends the game for the side that ran out');
      seen.add('flag');
    } else {
      bad('flag', `got ${room.result.reason} / ${room.result.winner}`);
    }
    const loser = room.players.find((p) => p.seat === 'w');
    if (loser.msLeft === 0) ok('flagged clock reads zero');
    else bad('flag clock', `white still shows ${loser.msLeft}ms`);
  } finally {
    closeAll(game);
  }

  // Same flag, but the beneficiary has nothing to mate with.
  const bare = await table('clock — flag with no mating material is a draw', {
    startFen: '3qk3/8/8/8/8/8/8/4K3 b - - 0 1',
    minutes: 0.1,
  });
  try {
    const room = await bare.black.until((r) => r.result, 'the flag', 12_000);
    if (room.result.reason === 'flagInsufficient' && room.result.winner === null) {
      ok('flag against a lone king is a draw, not a win');
      seen.add('flagDraw');
    } else {
      bad('flag draw', `got ${room.result.reason} / ${room.result.winner}`);
    }
  } finally {
    closeAll(bare);
  }
}

async function resignAndDraw() {
  const game = await table('resignation and draw offers');
  try {
    await play(game, 'e4');
    game.black.send({ t: 'offerDraw' });
    await game.white.until((r) => r.drawOfferBy === 'b', 'the offer to show');
    game.white.send({ t: 'answerDraw', accept: false });
    await game.white.until((r) => r.drawOfferBy === null, 'the decline');
    ok('draw offer can be declined');

    game.black.send({ t: 'offerDraw' });
    await game.white.until((r) => r.drawOfferBy === 'b', 'the second offer');
    game.white.send({ t: 'answerDraw', accept: true });
    const drawn = await game.white.until((r) => r.result, 'the agreed draw');
    if (drawn.result.reason === 'agreement') ok('draw by agreement');
    else bad('draw agreement', `got ${drawn.result.reason}`);
  } finally {
    closeAll(game);
  }

  const second = await table('resignation');
  try {
    await play(second, 'd4');
    second.black.send({ t: 'resign' });
    const room = await second.black.until((r) => r.result, 'the resignation');
    if (room.result.reason === 'resign' && room.result.winner === 'w') ok('resignation');
    else bad('resignation', `got ${room.result.reason} / ${room.result.winner}`);
  } finally {
    closeAll(second);
  }
}

/** A refresh has to come back to the same colour with the same clock. */
async function reconnect() {
  const game = await table('reconnect keeps the seat and the clock', { minutes: 3 });
  try {
    await play(game, 'e4');
    const before = game.black.room.players.find((p) => p.seat === 'b').msLeft;
    game.black.close();
    await sleep(400);
    const again = new Peer(game.code, game.black.key, 'NOIR', 'play');
    const room = await again.until((r) => r.phase === 'play', 'the board again');
    if (again.seat !== 'b') return bad('reconnect', `came back as ${again.seat}`);
    const after = room.players.find((p) => p.seat === 'b').msLeft;
    if (Math.abs(after - before) < 4000 && room.history.length === 1) {
      ok('reconnect returns to the same seat, clock intact');
      seen.add('reconnect');
    } else {
      bad('reconnect', `clock ${before} → ${after}`);
    }
    again.close();
  } finally {
    closeAll(game);
  }
}

/** Bots trading random legal moves until an automatic ending shows up. */
async function randomGame() {
  const game = await table('random legal play until the rules end it', { minutes: 5, increment: 1 });
  try {
    let plies = 0;
    while (plies < 600) {
      const mover = game.white.room.turn === 'w' ? game.white : game.black;
      const room = mover.room;
      if (room.result) break;
      const froms = Object.keys(room.legal);
      if (froms.length === 0) {
        await sleep(30);
        continue;
      }
      const from = Number(froms[Math.floor(Math.random() * froms.length)]);
      const tos = room.legal[from];
      const to = tos[Math.floor(Math.random() * tos.length)];
      const promo = room.promoFrom.includes(from) ? 'qrbn'[Math.floor(Math.random() * 4)] : undefined;
      const before = room.history.length;
      mover.send({ t: 'move', from, to, promo });
      await mover.until((r) => r.history.length > before || r.result, 'the bot move to land');
      plies++;
    }
    const room = await game.white.until((r) => r.result, 'the game to end', 20_000);
    const ruleNopes = game.peers.flatMap((p) => p.nopes).filter((n) => !/turn|promote/i.test(n));
    if (ruleNopes.length > 0) {
      bad('random game', `server rejected moves it had offered: ${ruleNopes.slice(0, 3).join(' | ')}`);
    } else {
      ok(`random game ended by ${room.result.reason} after ${room.history.length} plies`);
    }
  } finally {
    closeAll(game);
  }
}

// ------------------------------------------------------------------- driver

console.log(`Empyr Gambit smoke @ ${host}`);

const SUITE = [
  operaGame,
  castling,
  enPassant,
  promotion,
  stalemate,
  threefold,
  fiftyMove,
  insufficient,
  rejections,
  flagging,
  resignAndDraw,
  reconnect,
  randomGame,
];

for (const scenario of SUITE) {
  try {
    await scenario();
  } catch (error) {
    bad(scenario.name, error.message);
  }
  await sleep(150);
}

const REQUIRED = [
  'full game to a decisive result (checkmate)',
  'castle',
  'ep',
  'promotion',
  'checkmate detected',
  'stalemate',
  'threefold',
  'fifty',
  'insufficient',
  'illegal',
  'pinned',
  'flag',
  'flagDraw',
  'reconnect',
];

const missing = REQUIRED.filter((label) => !seen.has(label));
if (missing.length > 0) {
  console.error(`\nMISSING — these were never observed: ${missing.join(', ')}`);
}
if (failures.length > 0) {
  console.error(`\nSMOKE FAILED (${failures.length})`);
  for (const line of failures) console.error(`  ${line}`);
}
if (missing.length > 0 || failures.length > 0) process.exit(1);

console.log('\nPASS — every required rule was observed on the wire');
process.exit(0);
