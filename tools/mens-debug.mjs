import { launch, sleep } from './cdp.mjs';

const page = await launch({ width: 1440, height: 1000 });
await page.go(`http://localhost:4321/${process.argv[2] ?? 'nl'}/minigames/mens`);
await sleep(2500);
console.log(
  await page.run(`(() => {
    const mini = document.getElementById('mini');
    return {
      mini: Boolean(mini),
      cells: document.querySelectorAll('.mini i').length,
      pawns: document.querySelectorAll('.mini b').length,
      firstCell: document.querySelector('.mini i')?.getAttribute('style') ?? null,
      scripts: document.querySelectorAll('script').length,
    };
  })()`),
);
console.log(
  await page.run(`(() => {
    const cell = document.querySelector('.mini i[data-c]');
    const box = cell.getBoundingClientRect();
    const style = getComputedStyle(cell);
    return {
      rect: [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)],
      background: style.backgroundImage.slice(0, 60),
      position: style.position,
      opacity: style.opacity,
      visibility: style.visibility,
      zIndex: style.zIndex,
      miniRect: (() => { const r = document.getElementById('mini').getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    };
  })()`),
);
await page.run(`document.querySelector('astro-dev-toolbar')?.remove()`);
await page.shot('tools/shots/mens/debug-landing.png');
console.log(page.problems());
page.close();
process.exit(0);
