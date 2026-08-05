/**
 * Cross-checks what the browser draws against what the worker believes.
 *
 *   node tools/mens-verify.mjs [lang]
 *
 * A spectator socket (one that never says hello) receives every broadcast, so
 * we can compare the authoritative pawn positions with the grid coordinates the
 * React board actually rendered. Geometry is re-derived here independently of
 * the client so a wiring mistake cannot hide.
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const LANG = process.argv[2] ?? 'nl';
const SITE = 'http://localhost:4321';
const WORKER = 'localhost:8792';
const code = `vfy${Math.random().toString(36).slice(2, 6)}`;

/* --- geometry, rebuilt from the definition: the boundary of a plus shape --- */
const GRID = 11;
const inGrid = (x, y) => x >= 0 && y >= 0 && x < GRID && y < GRID;
const inPlus = (x, y) => inGrid(x, y) && ((x >= 4 && x <= 6) || (y >= 4 && y <= 6));
/** The four turning tips sit on the centre lines; every other centre cell is private. */
const isTip = (x, y) => (x === 5 && (y === 0 || y === 10)) || (y === 5 && (x === 0 || x === 10));
/** Track squares are the plus minus its centre cross, with the tips added back. */
const onTrack = (x, y) => inPlus(x, y) && (isTip(x, y) || (x !== 5 && y !== 5));

/** Contour-follow the track clockwise from (0,4): straight, then left, then right. */
function walkRing() {
  const cells = [[0, 4]];
  const seen = new Set(['0,4']);
  let heading = [1, 0];
  while (cells.length < 40) {
    const [x, y] = cells[cells.length - 1];
    const [dx, dy] = heading;
    const tries = [
      [dx, dy],
      [-dy, dx],
      [dy, -dx],
    ];
    const move = tries.find(([mx, my]) => onTrack(x + mx, y + my) && !seen.has(`${x + mx},${y + my}`));
    if (!move) break;
    heading = move;
    const next = [x + move[0], y + move[1]];
    seen.add(`${next[0]},${next[1]}`);
    cells.push(next);
  }
  return cells;
}

const RING = walkRing();
if (RING.length !== 40) {
  console.error(`FAIL — boundary walk produced ${RING.length} cells, expected 40`);
  process.exit(1);
}
const START = [0, 10, 20, 30];
const HOME = [
  [[1, 5], [2, 5], [3, 5], [4, 5]],
  [[5, 1], [5, 2], [5, 3], [5, 4]],
  [[9, 5], [8, 5], [7, 5], [6, 5]],
  [[5, 9], [5, 8], [5, 7], [5, 6]],
];
const YARD = [
  [[0.4, 0.4], [2.1, 0.4], [0.4, 2.1], [2.1, 2.1]],
  [[7.9, 0.4], [9.6, 0.4], [7.9, 2.1], [9.6, 2.1]],
  [[7.9, 7.9], [9.6, 7.9], [7.9, 9.6], [9.6, 9.6]],
  [[0.4, 7.9], [2.1, 7.9], [0.4, 9.6], [2.1, 9.6]],
];

/* The clockwise walk must line each corner's lap up with its own home column. */
for (let corner = 0; corner < 4; corner++) {
  const tip = RING[(START[corner] + 39) % 40];
  const gate = HOME[corner][0];
  const step = Math.abs(tip[0] - gate[0]) + Math.abs(tip[1] - gate[1]);
  if (step !== 1) {
    console.error(`FAIL — corner ${corner} tip ${tip} is not adjacent to home ${gate}`);
    process.exit(1);
  }
}
console.log('geometry ok: 40-square boundary, every lap ends beside its own home column');

const cellFor = (corner, pos, pawn) =>
  pos < 0 ? YARD[corner][pawn] : pos >= 40 ? HOME[corner][pos - 40] : RING[(START[corner] + pos) % 40];

/* ---------------------------------------------------------------- observer */

let live = null;
const spy = new WebSocket(`ws://${WORKER}/room/${code}/socket`);
spy.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.t === 'sync') live = msg.room;
});
await sleep(700);

/* ------------------------------------------------------------------ browser */

const page = await launch({ width: 1440, height: 1020 });
await page.go(`${SITE}/${LANG}/minigames/mens/play?code=${code}`);
await sleep(2200);
await page.type('#mn-name', 'ARCA');
await page.click(LANG === 'nl' ? 'Neem plaats' : 'Take a seat');
await sleep(1200);

const bots = spawn('node', ['server/mens/scripts/bots.mjs', code, '3'], { stdio: 'ignore' });
for (let i = 0; i < 40 && (live?.players.length ?? 0) < 4; i++) await sleep(400);
await page.click(LANG === 'nl' ? 'Klaar' : 'Ready');
await sleep(300);
await page.click(LANG === 'nl' ? 'Start het spel' : 'Start the game');
await sleep(1500);

const readDom = () =>
  page.run(`[...document.querySelectorAll('.mn-pawn')].map((el) => ({
    label: el.getAttribute('aria-label'),
    color: el.dataset.c,
    x: Number(el.style.getPropertyValue('--x')),
    y: Number(el.style.getPropertyValue('--y')),
  }))`);

let checks = 0;
let failures = 0;

for (let step = 0; step < 160; step++) {
  if (!live || live.phase !== 'play') break;

  // Only compare when nothing is mid-animation, or the walker legitimately
  // holds a pawn behind the authoritative position.
  const settled = await page.run(
    `document.querySelectorAll('.mn-pawn[data-walk="true"],.mn-pawn[data-boot="true"]').length === 0
      && document.querySelectorAll('.mn-shout').length === 0`,
  );

  if (settled) {
    const dom = await readDom();
    const want = live.players.flatMap((player) =>
      player.pawns.map((pos, pawn) => {
        const [x, y] = cellFor(player.corner, pos, pawn);
        return { label: `${player.name} — ${LANG === 'nl' ? 'Pion' : 'Pawn'} ${pawn + 1}`, color: player.color, x, y };
      }),
    );
    checks++;
    for (const expected of want) {
      const drawn = dom.find((item) => item.label === expected.label);
      if (!drawn) {
        console.error(`FAIL — no pawn drawn for ${expected.label}`);
        failures++;
        continue;
      }
      if (drawn.color !== expected.color || drawn.x !== expected.x || drawn.y !== expected.y) {
        console.error(
          `FAIL — ${expected.label}: drawn ${drawn.color}@${drawn.x},${drawn.y} but server says ${expected.color}@${expected.x},${expected.y}`,
        );
        failures++;
      }
    }
    if (failures > 6) break;
  }

  const now = await page.run(`(() => {
    const die = document.querySelector('.mn-die:not([disabled])');
    if (die) { die.click(); return 'roll'; }
    const choice = document.querySelector('.mn-choice[data-hit="true"]') ?? document.querySelector('.mn-choice');
    if (choice) { choice.click(); return 'move'; }
    return 'wait';
  })()`);
  await sleep(now === 'wait' ? 260 : 420);
}

console.log(`\ncompared ${checks} settled board states, ${failures} mismatches`);
const problems = page.problems().filter((line) => !/AudioContext/i.test(line));
if (problems.length > 0) console.log(`console:\n${problems.join('\n')}`);

bots.kill();
spy.close();
page.close();
process.exit(failures > 0 || checks === 0 ? 1 : 0);
