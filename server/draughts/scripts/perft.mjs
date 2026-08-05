/**
 * Engine proof for the DAMCAFÉ draughts rules.
 *
 *   node scripts/perft.mjs [maxDepth]
 *
 * Two halves:
 *   1. perft from the opening position, checked against the published node
 *      counts for 10x10 international draughts.
 *   2. hand-built positions for the rules perft cannot reach quickly — maximum
 *      capture, the tie between equal hauls, crossing a square twice, and the
 *      "no promotion mid-chain" rule.
 *
 * Runs straight off the TypeScript engine the worker uses (Node strips the
 * types), so there is no second copy of the rules to drift.
 */

import {
  apply,
  captureMoves,
  distinctMoves,
  generate,
  legalMoves,
  parseFen,
  perft,
  quietMoves,
  toFen,
} from '../src/engine.ts';
import { W_KING, W_MAN, notation, startBoard } from '../src/protocol.ts';

/**
 * Published perft for international draughts from the initial position
 * (Aart J.C. Bik's tables, matched by every other public draughts engine).
 */
const PUBLISHED = [9, 81, 658, 4265, 27117, 167140, 1049442, 6483961];

const maxDepth = Math.min(PUBLISHED.length, Math.max(1, Number(process.argv[2]) || 7));

const rowOf = (sq) => Math.floor((sq - 1) / 5);
const colOf = (sq) => ((sq - 1) % 5) * 2 + (rowOf(sq) % 2 === 0 ? 1 : 0);
const square = (row, col) => row * 5 + Math.floor(col / 2) + 1;

/** How many times each square is touched or flown over by a route. */
function crossings(move) {
  const counts = new Map();
  const bump = (sq) => counts.set(sq, (counts.get(sq) ?? 0) + 1);
  let at = move.from;
  for (const land of move.path) {
    const dr = Math.sign(rowOf(land) - rowOf(at));
    const dc = Math.sign(colOf(land) - colOf(at));
    let r = rowOf(at) + dr;
    let c = colOf(at) + dc;
    while (r !== rowOf(land) || c !== colOf(land)) {
      bump(square(r, c));
      r += dr;
      c += dc;
    }
    bump(land);
    at = land;
  }
  return { get: (sq) => counts.get(sq) ?? 0 };
}

let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`  FAIL  ${message}`);
};
const pass = (message) => console.log(`  ok    ${message}`);

/* ------------------------------------------------------------------- perft */

console.log('DAMCAFE engine proof\n');
console.log('perft from the opening position');
console.log('  depth        measured       published   ms');

const board = startBoard();
for (let depth = 1; depth <= maxDepth; depth++) {
  const started = Date.now();
  const measured = perft(board, 'w', depth);
  const elapsed = Date.now() - started;
  const expected = PUBLISHED[depth - 1];
  const mark = measured === expected ? 'ok  ' : 'FAIL';
  console.log(
    `  ${String(depth).padStart(5)}  ${String(measured).padStart(14)}  ${String(expected).padStart(14)}  ${String(elapsed).padStart(6)}  ${mark}`,
  );
  if (measured !== expected) failures++;
}

/* ------------------------------------------------------------ rule fixtures */

const load = (fen) => parseFen(fen);
const best = (fen) => {
  const { board: b, turn } = load(fen);
  return { board: b, turn, routes: generate(b, turn) };
};
const routeText = (move) => `${move.from}\u00d7${move.path.join('\u00d7')}`;

console.log('\ncompulsory capture');
{
  // 33 can step quietly to 28/29, but 39 is there to be taken, so it must be.
  const { routes } = best('W:W33,44:B29');
  if (routes.length === 0) fail('no moves generated');
  else if (routes.some((m) => m.captures.length === 0)) {
    fail(`quiet moves offered while a capture exists: ${routes.map(notation).join(' ')}`);
  } else pass(`only captures offered: ${routes.map(notation).join(' ')}`);

  const { board: b, turn } = load('W:W33:B29');
  if (quietMoves(b, turn).length === 0) fail('fixture has no quiet move to suppress');
  else pass(`${quietMoves(b, turn).length} quiet moves existed and were suppressed`);
}

console.log('\nmaximum capture is compulsory');
{
  // From 28 there is a one-piece take (over 22 to 17) and a three-piece chain
  // 28x19x30x39. Only the three-piece chain may be offered.
  const { routes } = best('W:W28:B22,23,24,34');
  const counts = [...new Set(routes.map((m) => m.captures.length))];
  if (counts.length !== 1 || counts[0] !== 3) {
    fail(`expected only 3-piece chains, got counts ${counts.join(',')}`);
  } else pass(`only the 3-piece chain survives: ${routes.map(routeText).join(' ')}`);

  if (routes.some((m) => m.to === 17)) fail('the one-piece capture 28x17 is still legal');
  else pass('the smaller capture 28x17 was filtered out');

  const all = captureMoves(load('W:W28:B22,23,24,34').board, 'w');
  if (!all.some((m) => m.captures.length === 1)) {
    fail('fixture never produced a smaller capture to reject');
  } else pass(`${all.length} raw capture sequences existed before the maximum rule`);
}

console.log('\ntied maximum captures, and crossing a square twice');
{
  // Four black men ring square 28's neighbourhood, so a white man on 28 can
  // loop either way round: two distinct routes, one identical haul, and the
  // piece finishes back on the square it started from — which is only possible
  // because its own origin counts as empty for the whole sequence.
  const fen = 'W:W28:B23,24,33,34';
  const { routes } = best(fen);
  const four = routes.filter((m) => m.captures.length === 4);
  if (four.length !== 2) {
    fail(`expected 2 tied 4-piece routes, got ${routes.length} routes: ${routes.map(routeText).join(' ')}`);
  } else pass(`two tied routes offered: ${four.map(routeText).join('   ')}`);

  if (!four.every((m) => m.to === 28 && m.from === 28)) {
    fail('routes do not return to the origin square');
  } else pass('the man lands back on its own starting square');

  const collapsed = distinctMoves(routes);
  if (collapsed.length !== 1) fail(`FMJD move collapse gave ${collapsed.length}, expected 1`);
  else pass('both routes collapse to one move for perft/notation purposes');
}

console.log('\nflying king: landing choice and re-crossing a flown square');
{
  // 41x19 flies over 23 across square 28; three hops later 44x22 flies back
  // over 39 across square 28 again.
  const fen = 'W:WK41:B23,24,39,40';
  const { routes } = best(fen);
  const top = Math.max(...routes.map((m) => m.captures.length));
  if (top !== 4) fail(`expected a 4-piece king chain, best was ${top}`);
  else pass(`king takes all four: ${routes.length} tied routes at 4 pieces`);

  const crossed = routes.filter((move) => crossings(move).get(28) >= 2);
  if (crossed.length === 0) fail('no route crosses square 28 twice');
  else pass(`${crossed.length} route(s) cross square 28 twice, e.g. ${routeText(crossed[0])}`);

  const landings = [...new Set(routes.map((m) => m.to))];
  if (landings.length < 2) fail('the king was offered only one landing square');
  else pass(`landing squares offered: ${landings.sort((a, b) => a - b).join(', ')}`);
}

console.log('\npromotion');
{
  // 13x2 ends on the promotion row, so it crowns.
  const { routes, board: b } = best('W:W13:B8');
  const crown = routes.find((m) => m.to === 2);
  if (!crown || !crown.promote) fail('a capture ending on row 1 did not promote');
  else if (apply(b, crown)[1] !== W_KING) fail('promotion did not put a king on the board');
  else pass('a man finishing on the far row is crowned');
}
{
  // 13x2x11 only passes through the promotion row, so it stays a man.
  const { routes, board: b } = best('W:W13:B7,8');
  const chain = routes.find((m) => m.captures.length === 2);
  if (!chain) fail('the two-piece chain through the promotion row was not generated');
  else if (chain.path[0] !== 2) fail(`chain did not step onto square 2: ${routeText(chain)}`);
  else if (chain.promote) fail('a man promoted mid-chain');
  else if (apply(b, chain)[chain.to - 1] !== W_MAN) fail('mid-chain crossing produced a king');
  else pass(`${routeText(chain)} touches square 2 and stays a man`);
}

console.log('\ncaptured pieces block until the sequence ends');
{
  const routes = generate(load('W:WK28:B23').board, 'w');
  if (!routes.every((m) => m.captures.length === 1)) fail('a single victim was taken more than once');
  else pass('no piece is ever captured twice in one sequence');

  // 17x39 (over 28) then x30 (over 34) then x19 (over 24) leaves the king on 19
  // with black still on 23 — and a fourth capture would have to land on 28,
  // where the already-captured man is still standing. Three is the maximum.
  const walled = generate(load('W:WK17:B23,24,28,34').board, 'w');
  const top = Math.max(...walled.map((m) => m.captures.length));
  if (top !== 3) fail(`the wall was ignored — best chain took ${top} pieces, expected 3`);
  else pass('a chain stops at 3 because the man on 28 is still standing');
  if (walled.some((m) => m.captures.includes(23))) {
    fail('black 23 was captured, which is only reachable through the captured square');
  } else pass('the man on 23 is unreachable while 28 blocks the landing square');
}

console.log('\nsanity');
{
  const opening = startBoard();
  const first = legalMoves(opening, 'w');
  if (first.length !== 9) fail(`expected 9 opening moves, got ${first.length}`);
  else pass(`9 opening moves: ${first.map(notation).join(' ')}`);
  const round = toFen(parseFen(toFen(opening, 'w')).board, 'w');
  if (round !== toFen(opening, 'w')) fail('FEN round-trip changed the position');
  else pass('FEN round-trip is stable');
}

if (failures > 0) {
  console.error(`\nENGINE PROOF FAILED — ${failures} problem(s)`);
  process.exit(1);
}
console.log('\nPASS — perft matches the published counts and every rule fixture holds');
process.exit(0);
