/* Drives RANGE-07 through its test hook and captures the screenshots.
   Pointer lock cannot engage headlessly, so every drill is stepped by hand. */

import { launch, sleep } from './cdp.mjs';

const BASE = 'http://localhost:4321';
const OUT = 'tools/shots';

/* scrollWidth lies when an ancestor sets overflow-x: hidden, so measure the
   real geometry of every element instead. */
const OVERFLOW = `(() => {
  const limit = document.documentElement.clientWidth;
  const bad = [];
  const inScroller = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > limit + 0.5 || r.left < -0.5) && !inScroller(el)) {
      bad.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40) + '@' + Math.round(r.right));
    }
  }
  return { limit, scroll: document.documentElement.scrollWidth, bad: bad.slice(0, 6) };
})()`;

const waitHook = `(async () => {
  for (let i = 0; i < 100; i++) {
    if (window.__aim) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
})()`;

async function main() {
  const page = await launch({ width: 1440, height: 1000 });
  const results = [];
  const say = (name, pass, detail) => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}  ${detail}`);
  };

  /* ---- landing page ----------------------------------------------------
     The site auto-redirects by IP, so pin the language preference first. */
  await page.go(`${BASE}/en/minigames/aim`);
  await sleep(600);
  await page.run(`localStorage.setItem('empyr-lang-pref','en')`);
  await page.go(`${BASE}/en/minigames/aim`);
  await sleep(1800);
  await page.shot(`${OUT}/aim-landing-en.png`);
  const enHeading = await page.run(`document.querySelector('h1').textContent.trim()`);
  say('landing: English copy', /Seven drills/.test(enHeading), JSON.stringify(enHeading));
  const overflowLanding = await page.run(OVERFLOW);
  say('landing: no horizontal overflow', overflowLanding.bad.length === 0, JSON.stringify(overflowLanding.bad));

  await page.run(`localStorage.setItem('empyr-lang-pref','nl')`);
  await page.go(`${BASE}/nl/minigames/aim`);
  await sleep(1500);
  await page.shot(`${OUT}/aim-landing-nl.png`);
  const nlHeading = await page.run(`document.querySelector('h1').textContent.trim()`);
  say('landing: Dutch copy', /Zeven drills/.test(nlHeading), JSON.stringify(nlHeading));
  const nlPlay = await page.run(`(async () => {
    localStorage.setItem('empyr-lang-pref','nl');
    const res = await fetch('/nl/minigames/aim/play');
    return (await res.text()).includes('lang="nl"');
  })()`);
  say('play page: Dutch document', nlPlay === true, String(nlPlay));
  await page.run(`localStorage.setItem('empyr-lang-pref','en')`);

  /* ---- trainer -------------------------------------------------------- */
  await page.go(`${BASE}/en/minigames/aim/play`);
  await sleep(500);
  const hooked = await page.run(waitHook);
  say('trainer: test hook exposed', hooked === true, `__aim=${hooked}`);
  await page.run(`localStorage.removeItem('empyr.aim.v1')`);
  await page.go(`${BASE}/en/minigames/aim/play`);
  await sleep(500);
  await page.run(waitHook);
  await sleep(400);
  await page.shot(`${OUT}/aim-menu-drills.png`);

  const overflowMenu = await page.run(OVERFLOW);
  say('trainer: no horizontal overflow', overflowMenu.bad.length === 0, JSON.stringify(overflowMenu.bad));

  /* ---- sensitivity maths ---------------------------------------------- */
  await page.click('Sensitivity');
  await sleep(400);
  await page.shot(`${OUT}/aim-sensitivity.png`);

  const sensCheck = await page.run(`(() => {
    const cells = [...document.querySelectorAll('.ar-stat')].map((el) => [
      el.querySelector('.ar-stat-label').textContent.trim(),
      el.querySelector('.ar-stat-value').textContent.trim(),
    ]);
    const table = [...document.querySelectorAll('.ar-table tbody tr')].map((tr) =>
      [...tr.querySelectorAll('th,td')].map((c) => c.textContent.trim()),
    );
    return { cells, table };
  })()`);
  const shown = Object.fromEntries(sensCheck.cells);
  // 0.4 sens @ 800 DPI: eDPI 320, cm/360 = 360/(0.07*0.4*800)*2.54 = 40.82 cm
  say('sens: eDPI 320', shown['eDPI'] === '320', JSON.stringify(shown['eDPI']));
  say('sens: cm/360 = 40.82', shown['cm / 360°'] === '40.82', JSON.stringify(shown['cm / 360°']));
  say('sens: °/count = 0.028', shown['Degrees per count'] === '0.0280', JSON.stringify(shown['Degrees per count']));
  const cs2Row = sensCheck.table.find((row) => row[0].startsWith('CS2'));
  // 0.07*0.4/0.022 = 1.2727 → same 40.82 cm/360
  say('sens: CS2 equivalent 1.273', cs2Row && cs2Row[2] === '1.273', JSON.stringify(cs2Row));
  say('sens: CS2 cm/360 matches', cs2Row && cs2Row[4] === '40.82', JSON.stringify(cs2Row && cs2Row[4]));
  const owRow = sensCheck.table.find((row) => row[0].startsWith('Overwatch'));
  // 0.07*0.4/0.0066 = 4.2424
  say('sens: Overwatch equivalent 4.242', owRow && owRow[2] === '4.242', JSON.stringify(owRow));

  const lookCheck = await page.run(`(() => {
    const h = window.__aim;
    h.begin('gridshot', { duration: 60 }, 11);
    const before = h.camera();
    h.look(1000, 0);
    const after = h.camera();
    return { before, after, sens: h.sens() };
  })()`);
  // 1000 counts * 0.07 deg/count * 0.4 sens = 28 degrees
  const yawMoved = lookCheck.after.yaw - lookCheck.before.yaw;
  say('input: 1000 counts = 28.0°', Math.abs(yawMoved - 28) < 1e-6, `moved=${yawMoved.toFixed(6)}°`);

  await page.click('Crosshair');
  await sleep(400);
  await page.shot(`${OUT}/aim-crosshair.png`);

  await page.run(`localStorage.setItem('empyr-lang-pref','nl')`);
  await page.go(`${BASE}/nl/minigames/aim/play?tab=sens`);
  await sleep(500);
  await page.run(waitHook);
  await sleep(500);
  await page.shot(`${OUT}/aim-sensitivity-nl.png`);
  const nlTrainer = await page.run(`document.body.textContent.includes('De berekening')`);
  say('trainer: Dutch copy', nlTrainer === true, String(nlTrainer));
  say(
    'trainer: ?tab= deep link',
    (await page.run(`!!document.querySelector('.ar-working')`)) === true,
    'sensitivity tab opened',
  );
  await page.run(`localStorage.setItem('empyr-lang-pref','en')`);
  await page.go(`${BASE}/en/minigames/aim/play`);
  await sleep(500);
  await page.run(waitHook);

  /* ---- gridshot scoring ------------------------------------------------ */
  const grid = await page.run(`(() => {
    const h = window.__aim;
    h.begin('gridshot', { duration: 60, targets: 4 }, 5);
    for (let i = 0; i < 12; i++) { h.snap(0); h.tick(250); h.down(); h.up(); }
    for (let i = 0; i < 4; i++) { h.snap(0, 25, 0); h.down(); h.up(); }
    const s = h.stats();
    return { stats: s, targets: h.targets().length };
  })()`);
  say('gridshot: 16 shots', grid.stats.shots === 16, JSON.stringify(grid.stats.shots));
  say('gridshot: 12 hits / 4 misses', grid.stats.hits === 12 && grid.stats.misses === 4, `${grid.stats.hits}/${grid.stats.misses}`);
  say('gridshot: accuracy 75%', Math.abs(grid.stats.accuracy - 0.75) < 1e-9, grid.stats.accuracy.toFixed(4));
  say('gridshot: target count held at 4', grid.targets === 4, String(grid.targets));

  /* ---- TTK ------------------------------------------------------------- */
  const ttk = await page.run(`(() => {
    const h = window.__aim;
    h.begin('gridshot', { duration: 60, targets: 1 }, 9);
    // Kill on a 250ms clock five times, then twice at 500ms.
    for (let i = 0; i < 5; i++) { h.tick(250); h.snap(0); h.down(); h.up(); }
    for (let i = 0; i < 2; i++) { h.tick(500); h.snap(0); h.down(); h.up(); }
    const r = h.finish();
    return { ttks: r.ttks, avg: r.avgTtk, med: r.medTtk, kps: r.kps, kills: r.kills, elapsed: r.elapsed };
  })()`);
  const ttkExpected = (5 * 250 + 2 * 500) / 7;
  say('ttk: seven samples', ttk.ttks.length === 7, JSON.stringify(ttk.ttks));
  say(`ttk: mean ${ttkExpected.toFixed(1)}ms`, Math.abs(ttk.avg - ttkExpected) < 0.5, ttk.avg.toFixed(2));
  say('ttk: median 250ms', Math.abs(ttk.med - 250) < 0.5, ttk.med.toFixed(2));
  say('ttk: kps = kills/elapsed', Math.abs(ttk.kps - ttk.kills / (ttk.elapsed / 1000)) < 1e-9, ttk.kps.toFixed(4));

  /* ---- flick overshoot -------------------------------------------------- */
  const flick = await page.run(`(() => {
    const h = window.__aim;
    h.begin('flick', { duration: 60 }, 3);
    const log = [];
    // Alternate: stop 0.5° short of centre, then sail 0.5° past it.
    for (let i = 0; i < 6; i++) {
      const t = h.targets()[0];
      const scale = i % 2 === 0 ? -0.5 : 0.5;
      const len = Math.hypot(t.yaw - h.camera().yaw, t.pitch - h.camera().pitch) || 1;
      const ux = (t.yaw - h.camera().yaw) / len;
      const uy = (t.pitch - h.camera().pitch) / len;
      h.snap(0, ux * scale, uy * scale);
      h.tick(100);
      h.down(); h.up();
      log.push(scale);
    }
    const r = h.finish();
    return { errors: r.flickError, over: r.avgOvershoot, under: r.avgUndershoot, rate: r.overshootRate };
  })()`);
  const overs = flick.errors.filter((v) => v > 0);
  const unders = flick.errors.filter((v) => v <= 0);
  say('flick: 6 first-shot samples', flick.errors.length === 6, JSON.stringify(flick.errors.map((v) => v.toFixed(3))));
  say('flick: 3 over / 3 under', overs.length === 3 && unders.length === 3, `${overs.length}/${unders.length}`);
  say('flick: avg overshoot 0.50°', Math.abs(flick.over - 0.5) < 0.02, flick.over.toFixed(4));
  say('flick: avg undershoot 0.50°', Math.abs(flick.under - 0.5) < 0.02, flick.under.toFixed(4));
  say('flick: overshoot rate 50%', Math.abs(flick.rate - 0.5) < 1e-9, flick.rate.toFixed(2));

  /* ---- tracking --------------------------------------------------------- */
  const track = await page.run(`(() => {
    const h = window.__aim;
    h.begin('tracking', { duration: 60 }, 21);
    h.down();
    for (let i = 0; i < 200; i++) { h.snap(0); h.tick(10); }   // 2s glued on
    for (let i = 0; i < 100; i++) { h.snap(0, 30, 0); h.tick(10); } // 1s way off
    h.up();
    const r = h.finish();
    return { onTarget: r.onTarget, trackTime: r.trackTime, pct: r.onTargetPct, score: r.score };
  })()`);
  say('tracking: 3.0s of clock', Math.abs(track.trackTime - 3) < 0.02, track.trackTime.toFixed(3));
  say('tracking: 2.0s on target', Math.abs(track.onTarget - 2) < 0.05, track.onTarget.toFixed(3));
  say('tracking: 66.7% on target', Math.abs(track.pct - 2 / 3) < 0.02, (track.pct * 100).toFixed(2) + '%');

  /* ---- target switch ---------------------------------------------------- */
  const swap = await page.run(`(() => {
    const h = window.__aim;
    h.begin('switch', { duration: 60, targets: 5 }, 17);
    for (let i = 0; i < 5; i++) { h.snap(); h.tick(120); h.down(); h.up(); }   // lit target
    // Now deliberately shoot a dark one.
    let dark = 0;
    const ts = h.targets();
    for (let i = 0; i < ts.length; i++) if (!ts[i].active) { dark = i; break; }
    h.snap(dark); h.down(); h.up();
    const s = h.stats();
    const r = h.finish();
    return { stats: s, reactions: r.reactions };
  })()`);
  say('switch: 5 lit hits', swap.stats.hits === 5, String(swap.stats.hits));
  say('switch: dark target counts as miss', swap.stats.misses === 1, String(swap.stats.misses));
  say('switch: reaction times recorded', swap.reactions.length === 5, JSON.stringify(swap.reactions.map((v) => Math.round(v))));

  /* ---- microshot accuracy weighting ------------------------------------- */
  const micro = await page.run(`(() => {
    const h = window.__aim;
    h.begin('micro', { duration: 60, targets: 2 }, 4);
    for (let i = 0; i < 5; i++) { h.snap(0); h.tick(200); h.down(); h.up(); }
    for (let i = 0; i < 5; i++) { h.snap(0, 20, 0); h.down(); h.up(); }
    const live = h.stats();
    const r = h.finish();
    return { live, final: r.score, acc: r.accuracy };
  })()`);
  const expectedMicro = Math.round(micro.live.score * micro.acc);
  say('micro: accuracy 50%', Math.abs(micro.acc - 0.5) < 1e-9, micro.acc.toFixed(3));
  say('micro: score weighted by accuracy', micro.final === expectedMicro, `${micro.live.score} → ${micro.final}`);

  /* ---- spray ------------------------------------------------------------ */
  const spray = await page.run(`(() => {
    const h = window.__aim;
    h.begin('spray', { duration: 60 }, 8);
    h.snap(0);
    h.down();
    for (let i = 0; i < 400; i++) h.tick(10);
    const s = h.stats();
    const r = h.finish();
    return { stats: s, group: r.sprayGroup, samples: r.shotSamples.length };
  })()`);
  say('spray: magazine of 25', spray.stats.shots === 25, String(spray.stats.shots));
  say('spray: ammo counted down to 0', spray.stats.ammo === 0, String(spray.stats.ammo));
  say('spray: grouping measured', spray.group > 0, spray.group.toFixed(3));
  say('spray: 25 scatter samples', spray.samples === 25, String(spray.samples));

  /* ---- live drill screenshot -------------------------------------------- */
  await page.run(`(() => {
    const h = window.__aim;
    h.begin('gridshot', { duration: 60, targets: 6 }, 31);
    h.show();
    return true;
  })()`);
  await sleep(700);
  await page.run(`(() => {
    const h = window.__aim;
    for (let i = 0; i < 9; i++) { h.snap(0); h.down(); h.up(); }
    h.snap(0, 3, 1.5);
    return h.stats();
  })()`);
  await sleep(300);
  await page.shot(`${OUT}/aim-live-drill.png`);

  /* ---- results screen ---------------------------------------------------- */
  const report = await page.run(`(() => {
    const h = window.__aim;
    h.begin('flick', { duration: 60 }, 77);
    for (let i = 0; i < 28; i++) {
      const jitter = ((i * 37) % 11) / 22;
      h.tick(180 + (i % 7) * 30);
      h.snap(0, jitter - 0.25, 0.2 - jitter);
      h.down(); h.up();
    }
    for (let i = 0; i < 6; i++) { h.snap(0, 6, 0); h.down(); h.up(); }
    const r = h.finish();
    return { score: r.score, hits: r.hits, shots: r.shots, acc: r.accuracy, timeline: r.timeline.length };
  })()`);
  say('report: 34 shots recorded', report.shots === 34, String(report.shots));
  say('report: timeline sampled', report.timeline > 0, String(report.timeline));
  await sleep(600);
  await page.shot(`${OUT}/aim-report.png`);

  const domCheck = await page.run(`(() => {
    const stat = (label) => {
      const el = [...document.querySelectorAll('.ar-stat')].find(
        (n) => n.querySelector('.ar-stat-label').textContent.trim() === label,
      );
      return el ? el.querySelector('.ar-stat-value').textContent.trim() : null;
    };
    return {
      score: stat('Score'),
      accuracy: stat('Accuracy'),
      hits: stat('Hits'),
      misses: stat('Misses'),
      scatter: document.querySelectorAll('.ar-chart svg circle').length,
      compare: document.querySelectorAll('.ar-compare-row').length,
    };
  })()`);
  const reportOverflow = await page.run(OVERFLOW);
  const scoreText = report.score.toLocaleString('en-GB');
  say('report: score rendered', domCheck.score === scoreText, `${domCheck.score} vs ${scoreText}`);
  say('report: hits rendered', domCheck.hits === String(report.hits), `${domCheck.hits}`);
  say('report: scatter plotted', domCheck.scatter > 20, `${domCheck.scatter} svg circles`);
  say('report: comparison rows', domCheck.compare === 3, String(domCheck.compare));
  say('report: no horizontal overflow', reportOverflow.bad.length === 0, JSON.stringify(reportOverflow.bad));

  /* ---- pointer lock failure path ---------------------------------------
     Headless Chrome will not grant pointer lock, which is exactly the
     situation the fallback exists for. Walk it through the UI. */
  await page.go(`${BASE}/en/minigames/aim/play`);
  await sleep(500);
  await page.run(waitHook);
  await sleep(400);
  say('lock: start drill opens arming overlay', (await page.click('Start drill')) === 'ok', 'clicked');
  await sleep(400);
  const armed = await page.run(
    `!!document.querySelector('.ar-overlay') && document.querySelector('.ar-overlay h2').textContent.trim()`,
  );
  say('lock: arming overlay shown', armed === 'Mouse capture', JSON.stringify(armed));
  await page.shot(`${OUT}/aim-arming.png`);

  say('lock: cursor fallback offered', (await page.click('Use cursor mode instead')) === 'ok', 'clicked');
  await sleep(500);
  const running = await page.run(`(() => ({
    overlay: !!document.querySelector('.ar-overlay'),
    badge: !!document.querySelector('.ar-hud-badge'),
    running: window.__aim.stats().running,
  }))()`);
  say('lock: fallback starts the drill', running.running === true && running.overlay === false, JSON.stringify(running));
  say('lock: cursor-mode badge shown', running.badge === true, String(running.badge));

  // Real mouse movement through the fallback path, then quit mid-run.
  const moved = await page.run(`(() => {
    const before = window.__aim.camera();
    for (let i = 0; i < 20; i++) {
      document.dispatchEvent(new MouseEvent('mousemove', { movementX: 10, movementY: 0, bubbles: true }));
    }
    return { before, after: window.__aim.camera() };
  })()`);
  say(
    'lock: cursor mode moves the camera',
    moved.after.yaw > moved.before.yaw,
    `${moved.before.yaw.toFixed(2)}° → ${moved.after.yaw.toFixed(2)}°`,
  );

  say('lock: quit mid-run works', (await page.click('Quit run')) === 'ok', 'clicked');
  await sleep(500);
  const quit = await page.run(`(() => ({
    report: !!document.querySelector('.ar-result'),
    running: window.__aim.stats().running,
  }))()`);
  say('lock: quitting lands on the report', quit.report === true && quit.running === false, JSON.stringify(quit));

  const stored = await page.run(
    `JSON.parse(localStorage.getItem('empyr.aim.v1') || '{}').history?.length ?? 0`,
  );
  say('storage: runs persisted', stored > 0, `${stored} runs`);

  const console1 = page.problems();
  say('console: clean', console1.length === 0, JSON.stringify(console1.slice(0, 4)));

  page.close();

  /* ---- phone ------------------------------------------------------------- */
  const phone = await launch({ width: 390, height: 1400 });
  await phone.go(`${BASE}/en/minigames/aim`);
  await sleep(1800);
  await phone.shot(`${OUT}/aim-phone-landing.png`);
  const phoneOverflow = await phone.run(OVERFLOW);
  say('phone: landing no overflow', phoneOverflow.bad.length === 0, JSON.stringify(phoneOverflow.bad));

  await phone.go(`${BASE}/en/minigames/aim/play`);
  await sleep(500);
  await phone.run(waitHook);
  await sleep(500);
  await phone.shot(`${OUT}/aim-phone-menu.png`);
  const phoneMenuOverflow = await phone.run(OVERFLOW);
  say('phone: trainer no overflow', phoneMenuOverflow.bad.length === 0, JSON.stringify(phoneMenuOverflow.bad));
  await phone.click('Sensitivity');
  await sleep(400);
  await phone.shot(`${OUT}/aim-phone-sens.png`);
  const phoneSensOverflow = await phone.run(OVERFLOW);
  say('phone: sensitivity no overflow', phoneSensOverflow.bad.length === 0, JSON.stringify(phoneSensOverflow.bad));

  await phone.click('Crosshair');
  await sleep(400);
  const phoneCrossOverflow = await phone.run(OVERFLOW);
  say('phone: crosshair no overflow', phoneCrossOverflow.bad.length === 0, JSON.stringify(phoneCrossOverflow.bad));
  await phone.click('History');
  await sleep(400);
  const phoneHistOverflow = await phone.run(OVERFLOW);
  say('phone: history no overflow', phoneHistOverflow.bad.length === 0, JSON.stringify(phoneHistOverflow.bad));
  await phone.click('Drills');
  await sleep(300);

  await phone.run(`(() => {
    const h = window.__aim;
    h.begin('gridshot', { duration: 30, targets: 5 }, 12);
    for (let i = 0; i < 22; i++) { h.tick(240 + (i % 5) * 40); h.snap(0, (i % 3) * 0.2 - 0.2, 0.1); h.down(); h.up(); }
    for (let i = 0; i < 5; i++) { h.snap(0, 12, 0); h.down(); h.up(); }
    h.finish();
    return true;
  })()`);
  await sleep(700);
  await phone.shot(`${OUT}/aim-phone-report.png`);
  const phoneReportOverflow = await phone.run(OVERFLOW);
  say('phone: report no overflow', phoneReportOverflow.bad.length === 0, JSON.stringify(phoneReportOverflow.bad));
  const phoneProblems = phone.problems();
  say('phone console: clean', phoneProblems.length === 0, JSON.stringify(phoneProblems.slice(0, 4)));
  phone.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILURES:');
    for (const f of failed) console.log(` - ${f.name} :: ${f.detail}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
