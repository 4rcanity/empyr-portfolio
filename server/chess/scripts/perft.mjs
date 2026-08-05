/**
 * Move-generation proof: perft node counts against the published values.
 *
 *   node scripts/perft.mjs [maxDepth]
 *
 * The expectations below are the standard reference figures from the Chess
 * Programming Wiki (start position, "Kiwipete", and positions 3 to 6). They are
 * facts about chess, not about this engine — if a number disagrees, the engine
 * is wrong. Run with a depth argument to go deeper (slower).
 */

import { parseFen, perft, perftDivide, START_FEN } from '../src/engine.ts';

const CASES = [
  {
    name: 'start position',
    fen: START_FEN,
    nodes: [20, 400, 8902, 197281, 4865609],
  },
  {
    name: 'kiwipete',
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    nodes: [48, 2039, 97862, 4085603],
  },
  {
    name: 'position 3 (rook endgame, ep pins)',
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    nodes: [14, 191, 2812, 43238, 674624],
  },
  {
    name: 'position 4 (promotions)',
    fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    nodes: [6, 264, 9467, 422333],
  },
  {
    name: 'position 5',
    fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    nodes: [44, 1486, 62379, 2103487],
  },
  {
    name: 'position 6 (steven edwards)',
    fen: 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
    nodes: [46, 2079, 89890, 3894594],
  },
  {
    name: 'position 4 mirrored (black to move)',
    fen: 'r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1',
    nodes: [6, 264, 9467, 422333],
  },
  {
    name: 'most legal moves (petrovic 1964)',
    fen: 'R6R/3Q4/1Q4Q1/4Q3/2Q4Q/Q4Q2/pp1Q4/kBNN1KB1 w - - 1 1',
    nodes: [218],
  },
];

const maxDepth = Number(process.argv[2] ?? 4);
let failed = false;

console.log(`perft — depths up to ${maxDepth}\n`);

for (const testCase of CASES) {
  const pos = parseFen(testCase.fen);
  console.log(testCase.name);
  for (let depth = 1; depth <= Math.min(maxDepth, testCase.nodes.length); depth++) {
    const expected = testCase.nodes[depth - 1];
    const started = Date.now();
    const got = perft(pos, depth);
    const ms = Date.now() - started;
    const ok = got === expected;
    if (!ok) failed = true;
    const rate = ms > 0 ? ` ${Math.round(got / ms)}k n/s` : '';
    console.log(
      `  depth ${depth}  got ${String(got).padStart(9)}  want ${String(expected).padStart(9)}  ` +
        `${ok ? 'ok' : 'MISMATCH'}  ${String(ms).padStart(6)}ms${rate}`,
    );
    if (!ok) {
      console.log('  divide:');
      for (const [move, count] of perftDivide(pos, depth)) console.log(`    ${move} ${count}`);
      break;
    }
  }
  console.log('');
}

if (failed) {
  console.error('PERFT FAILED — the move generator disagrees with the published counts');
  process.exit(1);
}
console.log('PASS — every counted position matches the published node counts');
