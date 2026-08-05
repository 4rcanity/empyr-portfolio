/**
 * Captures the rebuilt UNO ring table.
 *   node tools/uno-ring.mjs [botCount] [tag] [pack]
 *
 * Seats a human host first, raises the seat cap, fills the table with bots,
 * deals, and writes desktop + mid-effect + phone frames to tools/shots/.
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const botCount = Number(process.argv[2] ?? 3);
const tag = process.argv[3] ?? `p${botCount + 1}`;
const pack = process.argv[4] ?? "Show 'em No Mercy";
/** Stretches effects so a screenshot can land mid-flight. Capture only. */
const slow = process.argv[5] === 'slow';
const rounds = Number(process.argv[6] ?? 14);

const room = `ring${Math.floor(Math.random() * 9000 + 1000)}`;
const base = `http://localhost:4321/en/minigames/uno/play?code=${room}`;

const page = await launch({ width: 1440, height: 980 });
await page.go(base);
await sleep(2500);
await page.run(`document.querySelector('astro-dev-toolbar')?.remove(), 'ok'`);

await page.type('#un-name', 'ARCANE');
await sleep(200);
console.log('seat:', await page.click('Take a seat'));
await sleep(1600);

// Lift the seat cap before anybody else arrives.
console.log(
  'seats:',
  await page.run(`(() => {
    const el = document.querySelector('#un-seats');
    if (!el) return 'MISS';
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
    setter.call(el, '10');
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return 'ok';
  })()`),
);
await sleep(700);

const bots = spawn('node', ['server/uno/scripts/bots.mjs', room, String(botCount), 'localhost:8788'], {
  stdio: 'ignore',
});
await sleep(1200 + botCount * 700);

console.log('pack:', await page.click(pack));
await sleep(600);
console.log('ready:', await page.click('Ready'));
await sleep(1200);
console.log('deal:', await page.click('Deal'));
await sleep(4000);

/** Take whatever turn is on offer: resolve a modal, play a card, or draw. */
const act = () =>
  page.run(`(() => {
    const swatch = document.querySelector('.un-swatch');
    if (swatch) { swatch.click(); return 'colour'; }
    const swap = document.querySelector('.un-veil .un-scores button');
    if (swap) { swap.click(); return 'swap'; }
    const shout = document.querySelector('.un-shout');
    if (shout) shout.click();
    const live = [...document.querySelectorAll('.un-hand-card[data-live="true"]')];
    if (live.length) { live[Math.floor(live.length / 2)].click(); return 'play'; }
    const btn = [...document.querySelectorAll('.un-actions .un-btn')].find((b) => !b.disabled);
    if (btn) { btn.click(); return btn.textContent.trim(); }
    const next = [...document.querySelectorAll('.un-veil .un-btn')]
      .find((b) => !b.disabled && !/leave/i.test(b.textContent));
    if (next) { next.click(); return 'next'; }
    return 'idle';
  })()`);

if (slow) {
  await page.run(`(() => {
    const orig = window.setTimeout;
    window.setTimeout = (fn, ms, ...rest) => orig(fn, (ms || 0) * 9, ...rest);
    const style = document.createElement('style');
    style.textContent = '.un-fx, .un-fx * { animation-duration: 5.4s !important; }';
    document.head.appendChild(style);
    return 'slowed';
  })()`);
}

await act();
await sleep(1500);
await page.shot(`tools/shots/ring-${tag}-a.png`);

// Effects fire constantly once the table gets going. Grab a frame the first
// time each kind shows up, so every entry in the vocabulary gets evidence.
const seen = new Set();
const kinds = () =>
  page.run(`JSON.stringify([...document.querySelectorAll('.un-fx')].map((e) => e.dataset.k))`);

for (let i = 0; i < rounds; i += 1) {
  const what = await act();
  await sleep(what === 'play' ? (slow ? 1300 : 200) : 260);

  const live = JSON.parse(await kinds());
  for (const kind of live) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    console.log(`fx ${kind} captured at step ${i}`);
    await page.shot(`tools/shots/ring-${tag}-fx-${kind}.png`);
  }
  await sleep(what === 'play' ? 700 : 800);
}
console.log('effect kinds seen:', [...seen].join(', ') || 'none');

await sleep(600);
await page.shot(`tools/shots/ring-${tag}-b.png`);

const overflow = await page.run(
  `JSON.stringify({ doc: document.documentElement.scrollWidth, win: window.innerWidth })`,
);
console.log('overflow check (desktop):', overflow);

await page.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await sleep(1500);
await page.shot(`tools/shots/ring-${tag}-phone.png`);
console.log(
  'overflow check (390px):',
  await page.run(`JSON.stringify({ doc: document.documentElement.scrollWidth, win: window.innerWidth })`),
);

await page.send('Emulation.setDeviceMetricsOverride', {
  width: 360,
  height: 800,
  deviceScaleFactor: 2,
  mobile: true,
});
await sleep(900);
console.log(
  'overflow check (360px):',
  await page.run(`JSON.stringify({ doc: document.documentElement.scrollWidth, win: window.innerWidth })`),
);

const issues = page.problems();
console.log(issues.length ? `PAGE ISSUES:\n  ${issues.join('\n  ')}` : 'No page errors.');

bots.kill();
page.close();
process.exit(0);
