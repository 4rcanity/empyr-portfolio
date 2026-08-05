/**
 * Captures the smaller boards so a 2- or 3-player game can be judged on its
 * own terms: closed arms, tinted-down colours, fewer seats.
 *
 *   node tools/mens-duel.mjs [seats] [lang]
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const SEATS = Number(process.argv[2] ?? 2);
const LANG = process.argv[3] ?? 'nl';
const SITE = 'http://localhost:4321';
const code = `duel${Math.random().toString(36).slice(2, 6)}`;

const page = await launch({ width: 1440, height: 1020 });
await page.go(`${SITE}/${LANG}/minigames/mens/play?code=${code}`);
await sleep(2000);
await page.type('#mn-name', 'ARCA');
await page.click(LANG === 'nl' ? 'Neem plaats' : 'Take a seat');
await sleep(1200);

// Shrink the table before the others arrive so nobody is bumped.
await page.run(`(() => {
  const select = [...document.querySelectorAll('select')].find((el) =>
    [...el.options].some((option) => option.value === '${SEATS}'));
  select.value = '${SEATS}';
  select.dispatchEvent(new Event('change', { bubbles: true }));
})()`);
await sleep(600);

const bots = spawn('node', ['server/mens/scripts/bots.mjs', code, String(SEATS - 1)], {
  stdio: 'ignore',
});
for (let i = 0; i < 40; i++) {
  const seats = await page.run(`document.querySelectorAll('.mn-rail li').length`);
  if (seats >= SEATS) break;
  await sleep(400);
}
await page.click(LANG === 'nl' ? 'Klaar' : 'Ready');
await sleep(400);
await page.click(LANG === 'nl' ? 'Start het spel' : 'Start the game');
await sleep(1500);

for (let step = 0; step < 60; step++) {
  const now = await page.run(`(() => {
    const die = document.querySelector('.mn-die:not([disabled])');
    if (die) { die.click(); return 'roll'; }
    const choice = document.querySelector('.mn-choice');
    if (choice) { choice.click(); return 'move'; }
    return 'wait';
  })()`);
  const out = await page.run(`document.querySelectorAll('.mn-pawn[data-home="false"]').length`);
  if (out >= 3) break;
  await sleep(now === 'wait' ? 300 : 420);
}
await sleep(900);

const file = `tools/shots/mens/09-${SEATS}p-board.png`;
await page.shot(file);
console.log(`overflow: ${await page.run('document.documentElement.scrollWidth > window.innerWidth')}`);
console.log(`shot ${file}`);

bots.kill();
page.close();
process.exit(0);
