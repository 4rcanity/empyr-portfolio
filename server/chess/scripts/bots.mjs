/**
 * Load harness: greedy bots grinding out complete games.
 *
 *   node scripts/bots.mjs [host] [games]
 *
 * Each bot picks its move with a two-ply material search (its own best gain
 * minus the opponent's best reply), which produces real games with real mates
 * rather than the aimless shuffling of a random walk. Any move the server
 * refuses after offering it in `legal` is a desync and fails the run.
 */

import { applyMove, inCheck, legalMoves, parseFen, pieceColor, pieceType } from '../src/engine.ts';

const host = process.argv[2] ?? 'localhost:8793';
const games = Number(process.argv[3] ?? 3);
const secure = !host.startsWith('localhost') && !host.startsWith('127.');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VALUE = [0, 100, 320, 330, 500, 900, 0];

function material(pos, side) {
  let score = 0;
  for (const piece of pos.board) {
    if (piece === 0) continue;
    const value = VALUE[pieceType(piece)];
    score += pieceColor(piece) === side ? value : -value;
  }
  return score;
}

/** Best move for the side to move, looking one reply deep. */
function choose(fen) {
  const pos = parseFen(fen);
  const me = pos.turn;
  const moves = legalMoves(pos);
  if (moves.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const move of moves) {
    const next = applyMove(pos, move);
    const replies = legalMoves(next);
    if (replies.length === 0) {
      // Mate beats everything; stalemate is worth roughly nothing.
      if (inCheck(next, next.turn)) return move;
      if (bestScore < 0 && best === null) best = move;
      continue;
    }
    let worst = Infinity;
    for (const reply of replies) {
      const after = applyMove(next, reply);
      worst = Math.min(worst, material(after, me));
    }
    // A whisper of noise stops two identical bots repeating forever.
    const score = worst + Math.random() * 6;
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

class Bot {
  constructor(code, key, name) {
    this.name = name;
    this.room = null;
    this.seat = null;
    this.nopes = [];
    this.busy = false;
    this.socket = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}/room/${code}/socket`);
    this.socket.addEventListener('open', () =>
      this.send({ t: 'hello', key, name, as: 'play' }),
    );
    this.socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.t === 'sync') {
        this.room = msg.room;
        this.seat = msg.seat;
        void this.think();
      } else if (msg.t === 'nope') {
        this.nopes.push(msg.msg);
      }
    });
  }

  send(message) {
    if (this.socket.readyState === 1) this.socket.send(JSON.stringify(message));
  }

  async think() {
    const room = this.room;
    if (!room || room.phase !== 'play' || room.result) return;
    if (room.turn !== this.seat || this.busy) return;
    this.busy = true;
    const move = choose(room.fen);
    this.busy = false;
    if (!move) return;
    this.send({ t: 'move', from: move.from, to: move.to, promo: move.promo });
  }
}

async function runGame(index) {
  const code = `bots${index}${Math.random().toString(36).slice(2, 6)}`;
  const white = new Bot(code, `bw-${code}`, 'ALBA');
  await sleep(400);
  const black = new Bot(code, `bb-${code}`, 'NOIR');
  await sleep(600);

  white.send({ t: 'rules', patch: { preset: 'custom', minutes: 20, increment: 1 } });
  await sleep(250);
  white.send({ t: 'ready', on: true });
  black.send({ t: 'ready', on: true });
  await sleep(250);
  white.send({ t: 'begin' });

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    await sleep(400);
    if (white.room?.result) break;
    // Nudge in case a sync arrived while the bot was still thinking.
    void white.think();
    void black.think();
  }

  const room = white.room;
  white.socket.close();
  black.socket.close();

  const desync = [...white.nopes, ...black.nopes].filter((n) => !/turn|promote/i.test(n));
  if (desync.length > 0) throw new Error(`server refused an offered move: ${desync.slice(0, 3).join(' | ')}`);
  if (!room?.result) throw new Error(`game ${index} never finished (${room?.history.length} plies)`);

  console.log(
    `  game ${index}: ${room.result.score.padEnd(7)} ${room.result.reason.padEnd(13)} ` +
      `${room.history.length} plies  last: ${room.history.slice(-3).map((h) => h.san).join(' ')}`,
  );
  return room.result.reason;
}

console.log(`Empyr Gambit bots @ ${host} — ${games} game(s)\n`);
const reasons = [];
let failed = false;
for (let i = 1; i <= games; i++) {
  try {
    reasons.push(await runGame(i));
  } catch (error) {
    failed = true;
    console.error(`  FAIL game ${i}: ${error.message}`);
  }
  await sleep(400);
}

console.log(`\nendings: ${reasons.join(', ') || 'none'}`);
if (failed) {
  console.error('BOTS FAILED');
  process.exit(1);
}
console.log('PASS — every bot game reached a legal ending');
process.exit(0);
