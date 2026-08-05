/**
 * Drives a real UNO game in headless Chrome and captures the lobby + table.
 *   node tools/uno-capture.mjs
 *
 * The human tab takes the host seat first, three bots fill the table, the host
 * deals, and screenshots are written to tools/shots/.
 */

import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const room = `shot${Math.floor(Math.random() * 900 + 100)}`;
const base = 'http://localhost:4321/en/minigames/uno/play?code=' + room;

const page = await launch({ width: 1440, height: 980 });
await page.go(base);
await sleep(2500);
// The Astro dev toolbar floats over the table and ruins the shots.
await page.run(`document.querySelector('astro-dev-toolbar')?.remove(), 'ok'`);

await page.type('#un-name', 'ARCANE');
await sleep(200);
console.log('seat:', await page.click('Take a seat'));
await sleep(1500);

const bots = spawn('node', ['server/uno/scripts/bots.mjs', room, '3', 'localhost:8788'], {
  stdio: 'ignore',
});
await sleep(3500);

console.log('pack:', await page.click("Show 'em No Mercy"));
await sleep(600);
console.log('ready:', await page.click('Ready'));
await sleep(1200);
await page.shot('tools/shots/uno-lobby.png');

console.log('deal:', await page.click('Deal'));
await sleep(4000);
await page.shot('tools/shots/uno-table.png');

// Let a few bot turns play out so the discard pile and feed fill up.
await sleep(6000);
await page.shot('tools/shots/uno-table-2.png');

await page.send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await sleep(1200);
await page.shot('tools/shots/uno-mobile.png');

const issues = page.problems();
console.log(issues.length ? `PAGE ISSUES:\n  ${issues.join('\n  ')}` : 'No page errors.');

bots.kill();
page.close();
process.exit(0);
