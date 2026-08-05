/**
 * Captures the Empyr Ledger client at desktop and phone widths so the board,
 * lobby and in-game panels can be eyeballed without a browser in the loop.
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
await sleep(2500);
await capture('table');

await page.click('roll');
await sleep(1800);
await capture('rolled');

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
