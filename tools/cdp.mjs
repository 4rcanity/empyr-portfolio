/** Minimal zero-dependency Chrome DevTools Protocol driver for UI verification. */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Session {
  constructor(ws, sessionId, chrome) {
    this.ws = ws;
    this.sessionId = sessionId;
    this.chrome = chrome;
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

  send(method, params = {}) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId: this.sessionId }));
    });
  }

  async go(url) {
    await this.send('Page.navigate', { url });
  }

  /** Evaluate an expression in the page and return its value. */
  async run(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed');
    }
    return result.result.value;
  }

  /**
   * Click a button/link by its text. Exact matches win over substring matches,
   * so asking for "Ready" cannot accidentally hit a card reading "already".
   */
  click(text) {
    return this.run(`(() => {
      const want = ${JSON.stringify(text.toLowerCase())};
      const all = [...document.querySelectorAll('button,a,[role=button]')]
        .filter((el) => el.offsetParent !== null && !el.disabled);
      const hit =
        all.find((el) => el.textContent.trim().toLowerCase() === want) ??
        all.find((el) => el.textContent.trim().toLowerCase().includes(want));
      if (!hit) return 'MISS';
      hit.click();
      return 'ok';
    })()`);
  }

  /** Set a React-controlled input's value. */
  type(selector, value) {
    return this.run(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return 'MISS';
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
      setter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return 'ok';
    })()`);
  }

  problems() {
    return this.events
      .filter((e) => e.method === 'Runtime.exceptionThrown' || e.method === 'Log.entryAdded')
      .map((e) =>
        e.method === 'Runtime.exceptionThrown'
          ? `EXCEPTION ${e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text}`
          : `${e.params.entry.level.toUpperCase()} ${e.params.entry.text}`,
      )
      .filter((line) => !/favicon|Failed to load resource|DevTools/i.test(line));
  }

  async shot(out) {
    const data = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(data.data, 'base64'));
    return out;
  }

  close() {
    this.ws.close();
    this.chrome.kill();
  }
}

export async function launch({ width = 1440, height = 1000 } = {}) {
  const port = 9333 + Math.floor(Math.random() * 500);
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${tmpdir()}\\empyr-cdp-${port}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      `--window-size=${width},${height}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      wsUrl = (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  if (!wsUrl) throw new Error('Chrome never came up');

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });

  const boot = new Session(ws, undefined, chrome);
  const { targetId } = await boot.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await boot.send('Target.attachToTarget', { targetId, flatten: true });

  const page = new Session(ws, sessionId, chrome);
  // Reuse the same socket, so hand the message pump to the page session.
  page.seq = boot.seq;
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return page;
}
