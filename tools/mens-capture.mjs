/**
 * Drives a real Mens erger je niet board in headless Chrome and captures the
 * moments worth judging: landing page, lobby, mid-game, a multi-option choice,
 * a capture, and a 390px phone view.
 *
 *   node tools/mens-capture.mjs
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const SITE = 'http://localhost:4321';
const LANG = process.argv[2] ?? 'nl';
const OUT = 'tools/shots/mens';
const code = `shot${Math.random().toString(36).slice(2, 6)}`;

const shots = [];
const page = await launch({ width: 1440, height: 1020 });

async function snap(name) {
  const file = `${OUT}/${name}.png`;
  await page.shot(file);
  shots.push(file);
  console.log(`  shot ${file}`);
}

const state = () =>
  page.run(`(() => {
    const shout = document.querySelector('.mn-shout[data-k="capture"]');
    return {
      phase: document.querySelector('.mn-board') ? 'board' : 'lobby',
      seats: document.querySelectorAll('.mn-rail li').length,
      choices: document.querySelectorAll('.mn-choice').length,
      canRoll: Boolean(document.querySelector('.mn-die:not([disabled])')),
      hitTarget: Boolean(document.querySelector('.mn-target[data-hit="true"]')),
      pawnsOut: document.querySelectorAll('.mn-pawn[data-home="false"]').length,
      onRing: [...document.querySelectorAll('.mn-pawn[data-home="false"]')].filter((el) => {
        const x = Number(el.style.getPropertyValue('--x'));
        const y = Number(el.style.getPropertyValue('--y'));
        return Number.isInteger(x) && Number.isInteger(y);
      }).length,
      capture: Boolean(shout),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      winner: Boolean(document.querySelector('.mn-veil')),
    };
  })()`);

console.log(`landing page (${LANG})`);
await page.go(`${SITE}/${LANG}/minigames/mens`);
await sleep(2200);
await snap('01-landing');

console.log(`board ${code}`);
await page.go(`${SITE}/${LANG}/minigames/mens/play?code=${code}`);
await sleep(2000);
await page.type('#mn-name', 'ARCA');
await sleep(150);
await page.click(LANG === 'nl' ? 'Neem plaats' : 'Take a seat');
await sleep(1400);

const bots = spawn('node', ['server/mens/scripts/bots.mjs', code, '3'], { stdio: 'inherit' });
for (let i = 0; i < 40; i++) {
  const now = await state();
  if (now.seats >= 4) break;
  await sleep(400);
}
await sleep(600);
await snap('02-lobby');

// The host has to be ready too before the button unlocks.
await page.click(LANG === 'nl' ? 'Klaar' : 'Ready');
await sleep(400);
await page.click(LANG === 'nl' ? 'Start het spel' : 'Start the game');
await sleep(1600);

let gotChoice = false;
let gotCapture = false;
let gotMid = false;

for (let step = 0; step < 400; step++) {
  const now = await state();

  if (now.capture && !gotCapture) {
    gotCapture = true;
    await snap('05-capture');
  }
  if (now.choices > 1 && !gotChoice) {
    gotChoice = true;
    await snap('04-choice');
  }
  if (!gotMid && now.onRing >= 4 && now.choices === 0) {
    gotMid = true;
    await snap('03-midgame');
  }
  if (now.overflow) console.log('  !! horizontal overflow detected');
  if (now.winner) break;

  // Play our own turn: prefer a capture, otherwise the first offer.
  if (now.canRoll) {
    await page.run(`document.querySelector('.mn-die:not([disabled])').click()`);
  } else if (now.choices > 0) {
    await sleep(500);
    await page.run(`(() => {
      const hit = document.querySelector('.mn-choice[data-hit="true"]');
      (hit ?? document.querySelector('.mn-choice')).click();
    })()`);
  }
  if (gotChoice && gotCapture && gotMid) break;
  await sleep(320);
}

console.log(`choice=${gotChoice} capture=${gotCapture} mid=${gotMid}`);
if (!gotMid) await snap('03-midgame');
if (!gotChoice) await snap('04-choice');
if (!gotCapture) await snap('05-capture');

console.log('phone view');
await page.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await sleep(1200);
const phone = await state();
console.log(`  phone overflow: ${phone.overflow}`);
await snap('06-phone-board');

console.log('narrow view (360px)');
await page.send('Emulation.setDeviceMetricsOverride', {
  width: 360,
  height: 800,
  deviceScaleFactor: 2,
  mobile: true,
});
await sleep(1200);
const narrow = await state();
console.log(`  360px board overflow: ${narrow.overflow}`);
await snap('08-narrow-board');

await page.go(`${SITE}/${LANG}/minigames/mens`);
await sleep(1800);
const phoneLanding = await page.run(
  'document.documentElement.scrollWidth > window.innerWidth',
);
console.log(`  phone landing overflow: ${phoneLanding}`);
await snap('07-phone-landing');

const problems = page.problems();
console.log(problems.length === 0 ? '\nconsole clean' : `\nconsole:\n${problems.join('\n')}`);
console.log(`\n${shots.length} shots:\n${shots.join('\n')}`);

bots.kill();
page.close();
process.exit(0);
