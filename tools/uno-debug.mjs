import { spawn } from 'node:child_process';
import { launch, sleep } from './cdp.mjs';

const room = `dbg${Math.floor(Math.random() * 900 + 100)}`;
const page = await launch({ width: 1400, height: 1000 });
await page.go(`http://localhost:4321/en/minigames/uno/play?code=${room}`);
await sleep(2500);
await page.type('#un-name', 'HOSTY');
await page.click('Take a seat');
await sleep(2000);

const state = () => page.run(`JSON.stringify({
  packs: [...document.querySelectorAll('.un-pack')].map((b) =>
    b.querySelector('.un-pack-name').textContent + '=' + b.dataset.on + (b.disabled ? '(off)' : '')),
  host: [...document.querySelectorAll('.un-pod')].map((p) => p.textContent.trim().slice(0, 24)),
  err: document.querySelector('.un-error')?.textContent ?? null,
})`);

console.log('alone   :', await state());

const bots = spawn('node', ['server/uno/scripts/bots.mjs', room, '3', 'localhost:8788'], { stdio: 'ignore' });
await sleep(3500);
console.log('withbots:', await state());

console.log('click   :', await page.click("Show 'em No Mercy"));
await sleep(1500);
console.log('after   :', await state());

bots.kill();
page.close();
process.exit(0);
