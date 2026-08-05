/**
 * Zero-dependency headless screenshotter + console tap.
 *   node tools/shot.mjs <url> <out.png> [waitMs] [clickText]
 *
 * Drives a headless Chrome over the DevTools Protocol so UI work can be
 * verified without a browser extension in the loop. Prints any console errors
 * and page exceptions it sees, then writes a full-page PNG.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';

const [url, out = 'tools/out.png', waitMs = '2500', clickText = ''] = process.argv.slice(2);
if (!url) {
  console.error('usage: node tools/shot.mjs <url> <out.png> [waitMs] [clickText]');
  process.exit(1);
}

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333 + Math.floor(Math.random() * 400);
const profile = `${tmpdir()}\\empyr-shot-${PORT}`;

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,1000',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const info = await res.json();
      return info.webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error('Chrome never came up');
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.waiting = new Map();
    this.events = [];
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.waiting.has(msg.id)) {
        const { resolve, reject } = this.waiting.get(msg.id);
        this.waiting.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }
}

const browserWs = await endpoint();
const socket = new WebSocket(browserWs);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve);
  socket.addEventListener('error', reject);
});
const cdp = new Cdp(socket);

const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

await cdp.send('Page.enable', {}, sessionId);
await cdp.send('Runtime.enable', {}, sessionId);
await cdp.send('Log.enable', {}, sessionId);
await cdp.send('Page.navigate', { url }, sessionId);
await sleep(Number(waitMs));

if (clickText) {
  await cdp.send(
    'Runtime.evaluate',
    {
      expression: `(() => {
        const hit = [...document.querySelectorAll('button,a')]
          .find((el) => el.textContent.trim().toLowerCase().includes(${JSON.stringify(clickText.toLowerCase())}));
        if (hit) { hit.click(); return 'clicked: ' + hit.textContent.trim(); }
        return 'not found';
      })()`,
      returnByValue: true,
    },
    sessionId,
  ).then((r) => console.log('click →', r.result.value));
  await sleep(1200);
}

const problems = cdp.events
  .filter((e) => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded')
  .map((e) =>
    e.method === 'Runtime.exceptionThrown'
      ? `EXCEPTION ${e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text}`
      : `${e.params.entry.level.toUpperCase()} ${e.params.entry.text}`,
  )
  .filter((line) => !/favicon|Failed to load resource/i.test(line));

console.log(problems.length ? `PAGE ISSUES:\n  ${problems.join('\n  ')}` : 'No page errors.');

const shot = await cdp.send(
  'Page.captureScreenshot',
  { format: 'png', captureBeyondViewport: true },
  sessionId,
);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log(`wrote ${out}`);

socket.close();
chrome.kill();
process.exit(0);
