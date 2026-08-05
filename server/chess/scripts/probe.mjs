/** Throwaway: does a synthetic pointer land on the board? */
import { launch, sleep } from '../../../tools/cdp.mjs';

const SITE = 'http://localhost:4321';
const WORKER = 'localhost:8793';
const code = `probe${Math.random().toString(36).slice(2, 6)}`;

let room = null;
const page = await launch({ width: 1440, height: 1000 });
await page.go(`${SITE}/en/minigames/chess/play?code=${code}`);
await sleep(1500);
await page.type('.cx-checkin input', 'ALBA');
await page.click('Sit down');
await sleep(1200);

// The browser has to sit first so it owns the white seat and hosts the room.
const black = new WebSocket(`ws://${WORKER}/room/${code}/socket`);
black.addEventListener('open', () =>
  black.send(JSON.stringify({ t: 'hello', key: `pb-${code}`, name: 'NOIR', as: 'play' })),
);
black.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.t === 'sync') room = msg.room;
});
await sleep(900);
black.send(JSON.stringify({ t: 'ready', on: true }));
await sleep(400);
await page.click('Ready');
await sleep(300);
await page.click('Start the clocks');
await sleep(1200);

console.log('phase', room?.phase, 'legal froms', Object.keys(room?.legal ?? {}).length);
console.log('board present:', await page.run(`!!document.querySelector('.cx-board')`));
console.log('board live class:', await page.run(`document.querySelector('.cx-board')?.className`));
console.log('legal dots:', await page.run(`document.querySelectorAll('.cx-dot').length`));
console.log('movable froms:', await page.run(`document.querySelector('.cx-board')?.dataset.movable`));

const at = await page.run(`(() => {
  const r = document.querySelector('[data-square="e2"]').getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
console.log('e2 at', at);
console.log(
  'geometry:',
  await page.run(`(() => {
    const b = document.querySelector('.cx-board').getBoundingClientRect();
    const e2 = document.querySelector('[data-square="e2"]').getBoundingClientRect();
    return { board: [b.left, b.top, b.width, b.height], e2: [e2.left, e2.top, e2.width, e2.height], scrollY: window.scrollY };
  })()`),
);
await page.run(`(() => {
  window.__hit = 0;
  document.querySelector('.cx-board').addEventListener('pointerdown', () => { window.__hit++; }, true);
  window.__err = '';
  window.addEventListener('error', (e) => { window.__err += e.message + '|'; });
  return 'listening';
})()`);

await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount: 1 });
await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', buttons: 0, clickCount: 1 });
await sleep(400);
console.log('dom pointerdown hits:', await page.run(`window.__hit`), 'errors:', await page.run(`window.__err`));
console.log('handler dbg:', await page.run(`String(window.__dbg)`));
console.log('selected after tap:', await page.run(`document.querySelectorAll('.cx-sq.is-selected').length`));
console.log(
  'js pointer dispatch:',
  await page.run(`(() => {
    const board = document.querySelector('.cx-board');
    const r = document.querySelector('[data-square="e2"]').getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, isPrimary: true, button: 0, buttons: 1, pointerType: 'mouse' };
    board.dispatchEvent(new PointerEvent('pointerdown', opts));
    board.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    return 'dispatched';
  })()`),
);
await sleep(300);
console.log('selected after js dispatch:', await page.run(`document.querySelectorAll('.cx-sq.is-selected').length`));
console.log('targets after tap:', await page.run(`document.querySelectorAll('.cx-sq.is-target').length`));

const to = await page.run(`(() => {
  const r = document.querySelector('[data-square="e4"]').getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: to.x, y: to.y, button: 'left', buttons: 1, clickCount: 1 });
await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to.x, y: to.y, button: 'left', buttons: 0, clickCount: 1 });
await sleep(600);
console.log('plies now:', room?.history.length, 'fen', room?.fen);
console.log('toasts:', await page.run(`[...document.querySelectorAll('.cx-toasts p')].map((p) => p.textContent).join('|')`));
console.log('problems:', page.problems().join(' | '));
console.log(
  'bottom elements:',
  await page.run(`[...document.body.querySelectorAll('*')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.top > 900 && r.height > 4 && r.width > 4;
  }).map((el) => el.tagName + '.' + el.className + '@' + Math.round(el.getBoundingClientRect().top)).slice(0, 12).join(', ')`),
);
console.log(
  'odd fixed elements:',
  await page.run(`[...document.body.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el);
    return s.position === 'fixed' && el.getBoundingClientRect().height > 4;
  }).map((el) => el.className + ':' + el.getBoundingClientRect().top.toFixed(0)).join(', ')`),
);
page.close();
process.exit(0);
