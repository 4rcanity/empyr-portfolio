/**
 * Captures the Empyr Ledger client at desktop and phone widths so the board,
 * lobby, side rail and every modal can be eyeballed without a browser in the loop.
 *
 *   node tools/mono-capture.mjs [code]
 *
 * Expects `astro dev` on 4321 and `wrangler dev --port 8789` in server/monopoly,
 * and fills the remaining seats with bots from that worker's own harness.
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const code = process.argv[2] ?? `shot${Math.random().toString(36).slice(2, 6)}`;
const base = `http://localhost:4321/en/minigames/monopoly`;
const shots = [];

/** The dev toolbar floats over the bottom of every capture, so drop it. */
const stripToolbar = `(() => {
  document.querySelector('astro-dev-toolbar')?.remove();
  return 'ok';
})()`;

const page = await launch({ width: 1440, height: 1080 });

async function capture(name) {
  await page.run(stripToolbar);
  shots.push(await page.shot(`tools/shots/mono-${name}.png`));
  console.log(`shot → tools/shots/mono-${name}.png`);
}

await page.go(base);
await sleep(2500);
await capture('landing');

await page.go(`${base}/play?code=${code}`);
await sleep(2500);
await page.type('input', 'ARCANE');
await sleep(200);
await page.click('take a seat');
await sleep(1500);

// Seat the human first — the bot harness opens the books the moment it finds
// itself holding the host seat, which would otherwise start without us.
const bots = spawn('node', ['scripts/bots.mjs', code, '2', 'localhost:8789'], {
  cwd: new URL('../server/monopoly/', import.meta.url).pathname.slice(1),
  stdio: 'ignore',
});
await sleep(3000);
await capture('lobby');

await page.click('ready');
await sleep(1200);
await page.click('open the books');
await sleep(3000);
await capture('table');

// Play a few turns for real. The first roll gives us dice and a pawn move; the
// first unowned square we decline sends the lot to auction, which is the only
// honest way to get that modal on film.
let rolled = false;
let auctioned = false;
for (let i = 0; i < 40 && !(rolled && auctioned); i++) {
  if (!rolled && (await page.click('roll the dice')) === 'ok') {
    rolled = true;
    await sleep(1000);
    await capture('rolled');
    continue;
  }
  if (!auctioned && (await page.click('decline')) === 'ok') {
    await sleep(900);
    await capture('auction');
    auctioned = true;
    await page.click('pass');
    await sleep(600);
    continue;
  }
  await page.click('roll the dice');
  await page.click('end turn');
  await sleep(900);
}
if (!rolled) await capture('rolled');
if (!auctioned) console.log('note: never reached an auction');

// Title deed — click any square and read the card.
await page.run(`document.querySelectorAll('.mp-tile')[3]?.click()`);
await sleep(600);
await capture('deed');
await page.click('cancel');
await sleep(400);

// Trade builder.
await page.click('new offer');
await sleep(700);
await capture('trade');
await page.click('cancel');
await sleep(400);

// Bankruptcy confirmation. The button always opens the explainer; only the final
// press is withheld until a bill is actually standing.
await page.click('declare bankruptcy');
await sleep(500);
await capture('fold');
await page.click('keep playing');
await sleep(300);

await page.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 900,
  deviceScaleFactor: 2,
  mobile: true,
});
await sleep(1200);
await capture('phone');

const overflow = await page.run(
  'document.documentElement.scrollWidth - document.documentElement.clientWidth',
);
const problems = page.problems();

console.log(`\nhorizontal overflow at 390px: ${overflow}px`);
console.log(problems.length ? `console:\n  ${problems.join('\n  ')}` : 'console: clean');

page.close();
bots.kill();
process.exit(overflow > 1 || problems.length ? 1 : 0);
