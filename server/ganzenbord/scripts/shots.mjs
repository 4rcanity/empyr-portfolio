/**
 * Screenshot pass over the Ganzenbord UI, driven through headless Chrome.
 *   node scripts/shots.mjs [lang]
 *
 * Needs the Astro dev server on 4321 and the worker on 8791. Fills a board with
 * practice bots, plays it, and waits for real penalty squares to fire so the
 * punishment window is captured from an actual game rather than a mock.
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from '../../../tools/cdp.mjs';

const lang = process.argv[2] ?? 'nl';
const base = 'http://localhost:4321';
const out = 'tools/shots';
const code = `shot${Math.random().toString(36).slice(2, 6)}`;

const page = await launch({ width: 1500, height: 1050 });
const shots = [];
/** Practice pawns join only after we have claimed the host seat. */
let bots = null;

async function metrics() {
  return page.run(
    '({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })',
  );
}

/**
 * A dropped socket during a long capture run can cost us our seat (the lobby
 * sweep removes offline players), which drops the page back to the check-in
 * form. Sit back down rather than shooting an empty screen.
 */
async function ensureSeated() {
  const form = await page.run(`Boolean(document.querySelector('.gb-page-center form input'))`);
  if (!form) return false;
  await page.type('input', 'JIJ');
  await sleep(150);
  await page.click(lang === 'nl' ? 'Pak een pion' : 'Take a pawn');
  await sleep(1600);
  await autoThrow();
  console.log('re-seated after a page reload');
  return true;
}

/** Throw for our own pawn as soon as the button unlocks. */
async function autoThrow() {
  await page.run(`clearInterval(window.__auto); window.__auto = setInterval(() => {
    const want = ${JSON.stringify(lang === 'nl' ? 'gooien' : 'throw')};
    const btn = [...document.querySelectorAll('button')]
      .find((b) => b.textContent.trim().toLowerCase() === want && !b.disabled);
    if (btn) btn.click();
  }, 500)`);
}

async function shot(name) {
  // The Astro dev toolbar is not part of the design.
  await page.run(`document.querySelector('astro-dev-toolbar')?.remove()`);
  const file = `${out}/ganzenbord-${lang}-${name}.png`;
  await page.shot(file);
  shots.push(file);
  console.log(`shot ${file}`);
}

try {
  // 1. landing page
  await page.go(`${base}/${lang}/minigames/ganzenbord`);
  await sleep(2600);
  await shot('landing');
  console.log('landing overflow', await metrics());

  // 2. check in and land in the lobby with the bots
  await page.go(`${base}/${lang}/minigames/ganzenbord/play?code=${code}`);
  await sleep(2600);
  await page.type('input', 'JIJ');
  await sleep(150);
  await page.click(lang === 'nl' ? 'Pak een pion' : 'Take a pawn');
  await sleep(1800);
  bots = spawn(process.execPath, ['scripts/bots.mjs', code, '3'], { stdio: 'ignore' });
  await sleep(3200);
  await shot('lobby');

  // 3. start the game and keep throwing whenever it is our turn
  console.log('start', await page.click(lang === 'nl' ? 'Beginnen' : 'Start'));
  await sleep(1500);
  await autoThrow();

  await sleep(9000);
  await shot('board');

  // 4. wait for real penalty squares, opening the window for each new one
  const look = lang === 'nl' ? 'Bekijken' : 'Look';
  const seen = new Set();
  const againLabel = lang === 'nl' ? 'Terug naar de lobby' : 'Back to the lobby';
  const startLabel = lang === 'nl' ? 'Beginnen' : 'Start';
  for (let i = 0; i < 400 && seen.size < 2; i++) {
    if (await ensureSeated()) continue;
    // Keep the table alive: a finished game is sent straight back around.
    const finished = await page.run(
      `Boolean([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(againLabel)}))`,
    );
    if (finished && !(await page.run(`Boolean(document.querySelector('.gb-window'))`))) {
      await page.click(againLabel);
      await sleep(1200);
      await page.click(startLabel);
      await sleep(1200);
    }
    const opened = await page.run(`(() => {
      const dialog = document.querySelector('.gb-window');
      if (dialog) return document.querySelector('#gb-window-title')?.textContent ?? 'open';
      const btn = [...document.querySelectorAll('.gb-news button')].find((b) => !b.disabled);
      if (!btn) return null;
      btn.click();
      return document.querySelector('#gb-window-title')?.textContent ?? 'clicked';
    })()`);
    if (opened && opened !== 'clicked' && !seen.has(opened)) {
      seen.add(opened);
      await sleep(500);
      await shot(`punish-${seen.size}-${opened.replace(/[^a-z]/gi, '').toLowerCase()}`);
      await page.run(
        `document.querySelector('.gb-window .gb-btn')?.click(); document.querySelector('.gb-scrim')?.click();`,
      );
    }
    await sleep(450);
  }
  console.log('punishment windows captured:', [...seen]);
  if (seen.size < 2) throw new Error('needed two different punishment windows');

  // 5. phone view of the board, then of the landing page
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(2200);
  await ensureSeated();
  // A finished table makes for a dull phone shot; deal a fresh one.
  if (await page.run(`Boolean([...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(againLabel)}))`)) {
    await page.click(againLabel);
    await sleep(1200);
    await page.click(startLabel);
    await sleep(7000);
  }
  await sleep(800);
  await shot('phone-board');
  console.log('phone board overflow', await metrics());

  await page.run('clearInterval(window.__auto)');
  await page.go(`${base}/${lang}/minigames/ganzenbord`);
  await sleep(2400);
  await shot('phone-landing');
  console.log('phone landing overflow', await metrics());

  const problems = page.problems();
  console.log(problems.length === 0 ? 'console clean' : `console problems:\n  ${problems.join('\n  ')}`);
  console.log(`\n${shots.length} shots:\n  ${shots.join('\n  ')}`);
} catch (error) {
  console.error('capture failed', error);
  process.exitCode = 1;
} finally {
  bots?.kill();
  page.close();
}
