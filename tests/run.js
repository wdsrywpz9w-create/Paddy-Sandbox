// Automated checks for Paddy's Sandbox. Drives the real app in headless Chromium.
// Run: npm test   (or: node tests/run.js)
'use strict';
const path = require('path');
const { chromium, devices } = require('playwright');

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const results = [];
function check(name, ok, detail = '') { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); }

// Open the app with given saved settings, press play, return { page, box, errors }.
async function open(browser, settings = {}, device = 'iPhone 13', extra = {}) {
  const ctx = await browser.newContext({ ...devices[device], ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  await page.evaluate(s => localStorage.setItem('sandbox-settings', JSON.stringify(s)), settings);
  await page.reload();
  await page.click('#play', { force: true });
  await page.waitForTimeout(400);
  const box = await page.locator('#tray').boundingBox();
  return { page, ctx, box, errors };
}
// All the sand there is: on the ground, in the air, being dumped, or on a shovel.
const totalSand = page => page.evaluate(() => {
  let s = 0; for (let i = 0; i < N; i++) s += h[i];
  for (const q of parts) if (!q.w && !q.dye) s += q.m;
  for (const d of dumps) s += d.left;
  for (const sh of shovels.values()) s += sh.load;
  return s;
});
const chooseTool = async (page, group, item) => {
  await page.locator(`#tools [aria-label="${group}"]`).dispatchEvent('pointerdown');
  await page.waitForTimeout(120);
  if (item) { await page.locator(`.popup.open [aria-label="${item}"]`).dispatchEvent('pointerdown'); await page.waitForTimeout(160); }
};
async function drag(page, box, pts, pause = 14) {
  await page.mouse.move(box.x + pts[0][0], box.y + pts[0][1]); await page.mouse.down();
  for (const [x, y] of pts.slice(1)) { await page.mouse.move(box.x + x, box.y + y); await page.waitForTimeout(pause); }
  await page.mouse.up();
}

(async () => {
  const browser = await chromium.launch();
  try {
    // 1. Loads cleanly on a big and a small phone, with every tool on the toolbar
    for (const dev of ['iPhone 13', 'iPhone SE']) {
      const { page, ctx, errors } = await open(browser, {}, dev);
      const n = await page.locator('#tools .btn').count();
      check(`loads without errors on ${dev}`, errors.length === 0, errors.join('; '));
      check(`toolbar has 8 buttons on ${dev}`, n === 8, `${n}`);
      await ctx.close();
    }

    // 2. Sand is conserved by digging, stamping, shovelling, tilting and the fan
    {
      const { page, ctx, box, errors } = await open(browser, { bury: 'off', sens: 'high' });
      const t0 = await totalSand(page);
      await drag(page, box, Array.from({ length: 30 }, (_, k) => [60 + k * 8, 200 + Math.sin(k / 4) * 40]));
      await chooseTool(page, 'Sand tools', 'Shovel: scoop sand and move it');
      await page.mouse.move(box.x + 120, box.y + 120); await page.mouse.down(); await page.waitForTimeout(900);
      for (let k = 1; k <= 10; k++) { await page.mouse.move(box.x + 120 + k * 15, box.y + 120 + k * 25); await page.waitForTimeout(16); }
      await page.mouse.up(); await page.waitForTimeout(1200);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowRight');
      await page.locator('#tools [aria-label="Desk fan: blow into the microphone"]').dispatchEvent('pointerdown');
      await page.keyboard.down('f'); await page.waitForTimeout(1500); await page.keyboard.up('f'); await page.waitForTimeout(1500);
      const t1 = await totalSand(page);
      check('sand is neither lost nor created (dig, shovel, tilt, fan)', Math.abs(t1 - t0) / t0 < 1e-4, `${t0.toFixed(1)} -> ${t1.toFixed(1)}`);
      // stamps pack sand down (that's what keeps imprints crisp): some volume goes, but only under the stamp
      const s0 = await totalSand(page);
      await chooseTool(page, 'Stamps', 'crab stamp'); await page.mouse.click(box.x + 180, box.y + 380); await page.waitForTimeout(700);
      const lost = (s0 - await totalSand(page)) * 4 /* cell area in px^2 at CELL 2 */ / 1000;
      check('a stamp only packs down a stamp-sized amount of sand', lost > 0 && lost < 40, `${lost.toFixed(1)} thousand px³`);
      check('no errors while using tools', errors.length === 0, errors.join('; '));
      await ctx.close();
    }

    // 3. A buried toy is found when uncovered, and the shelf fills in
    {
      const { page, ctx, errors } = await open(browser, { bury: 'medium' });
      const n = await page.evaluate(() => objs.length);
      check('a round buries 6 toys (4 dinosaurs + 2 treasures)', n === 6, `${n}`);
      await page.evaluate(() => { for (let i = 0; i < N; i++) if (objId[i] === 1) h[i] = 0; });
      await page.waitForTimeout(800);
      const [found, slot] = await page.evaluate(() => [objs[0].collected, document.querySelectorAll('#shelf .slot.got').length]);
      check('uncovering a toy finds it and fills its shelf slot', found && slot === 1);
      await page.evaluate(() => { for (let i = 0; i < N; i++) if (objId[i]) h[i] = 0; });
      await page.waitForTimeout(2200);
      check('finding every toy finishes the shelf', await page.evaluate(() => shelf.classList.contains('done')));
      const flat = await open(browser, { bury: 'hidden' });
      const bump = await flat.page.evaluate(() => { let on = 0, n1 = 0, off = 0, n2 = 0; for (let i = 0; i < N; i++) { const s = h[i] + base[i]; if (objId[i]) { on += s; n1++; } else if (base[i] === 0) { off += s; n2++; } } return (on / n1 - off / n2) * CELL; });
      check('"Hidden" leaves no lumps over the toys', Math.abs(bump) < 1, `${bump.toFixed(2)}px`);
      const none = await open(browser, { bury: 'off' });
      check('"Off" buries nothing', await none.page.evaluate(() => objs.length === 0));
      check('no errors in the dig', errors.length === 0 && flat.errors.length === 0 && none.errors.length === 0);
      await ctx.close(); await flat.ctx.close(); await none.ctx.close();
    }

    // 4. Tools change the sand the way they should
    {
      const { page, ctx, box, errors } = await open(browser, { bury: 'off' });
      const surfAt = (x, y) => page.evaluate(([x, y]) => { const i = ((y / CELL) | 0) * W + ((x / CELL) | 0); return (h[i] + base[i]) * CELL; }, [x, y]);
      const before = await surfAt(250, 470);
      await chooseTool(page, 'Sand tools', 'Castle mould: let go to make a tower');
      await page.mouse.move(box.x + 250, box.y + 470); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(800);
      const after = await surfAt(250, 470);
      check('the castle mould builds a tower', after - before > 12, `+${(after - before).toFixed(1)}px`);
      // hose into a bowl
      await page.evaluate(() => { const cx = 120 / CELL, cy = 160 / CELL, r = 30 / CELL; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d < r) { const i = y * W + x; h[i] = Math.max(1, h[i] - 6 * (1 - d * d / (r * r))); } } wakeAll(); });
      await chooseTool(page, 'Water', 'Spray water with the hose');
      await page.mouse.move(box.x + 120, box.y + 174); await page.mouse.down(); await page.waitForTimeout(3000); await page.mouse.up(); await page.waitForTimeout(800);
      const depth = await page.evaluate(() => wat[((160 / CELL) | 0) * W + ((120 / CELL) | 0)] * CELL);
      check('the hose fills a hole with water', depth > 2, `${depth.toFixed(1)}px deep`);
      // truck leaves tracks
      await page.locator('#tools [aria-label="Toy truck: touch the sand and it drives there"]').dispatchEvent('pointerdown');
      const t0 = await page.evaluate(() => [truck.x, truck.y]);
      await page.mouse.move(box.x + 60, box.y + 300); await page.mouse.down(); await page.waitForTimeout(1500); await page.mouse.up();
      const t1 = await page.evaluate(() => [truck.x, truck.y]);
      check('the truck drives towards the finger', Math.hypot(t1[0] - t0[0], t1[1] - t0[1]) > 40);
      // the big castle: rises, has flags, a full moat, and a keep that stands up
      await chooseTool(page, 'Sand tools', 'Build a big castle'); await page.waitForTimeout(2600);
      const castle = await page.evaluate(() => {
        const at = (x, y) => { const i = ((y / CELL) | 0) * W + ((x / CELL) | 0); return [(h[i] + base[i]) * CELL, wat[i] * CELL]; };
        const s = Math.max(0.55, Math.min(1.3, Math.min(cssW - 12, cssH - 12) / 312));
        const ground = at(cssW / 2, cssH / 2 + 156 * s + 10)[0];
        return { flags: castleFlags.length, keep: at(cssW / 2 - 10 * s, cssH / 2 - 10 * s)[0] - ground,
                 moat: at(cssW / 2 + 140 * s, cssH / 2)[1], tool };
      });
      check('the big castle has 11 flags, a tall keep and a full moat', castle.flags === 11 && castle.keep > 25 * 0.8 && castle.moat > 3,
        `flags ${castle.flags}, keep +${castle.keep.toFixed(0)}px, moat ${castle.moat.toFixed(1)}px deep`);
      await page.waitForTimeout(2500);
      const kept = await page.evaluate(() => {
        const s = Math.max(0.55, Math.min(1.3, Math.min(cssW - 12, cssH - 12) / 312));
        const at = (x, y) => { const i = ((y / CELL) | 0) * W + ((x / CELL) | 0); return (h[i] + base[i]) * CELL; };
        return at(cssW / 2 - 10 * s, cssH / 2 - 10 * s) - at(cssW / 2, cssH / 2 + 156 * s + 10);
      });
      check('the keep still stands 2.5 s after building (no slumping)', Math.abs(kept - castle.keep) < 3, `${castle.keep.toFixed(1)} -> ${kept.toFixed(1)}px`);
      // castle keepers: four of them, they rebuild a knocked-down tower, and get crosser
      const nk = await page.evaluate(() => keepers.length);
      await chooseTool(page, 'Dig with your finger');
      const tw = await page.evaluate(() => [castleBP.flags[0].x, castleBP.flags[0].y]);
      for (let k = 0; k < 3; k++) await drag(page, box, Array.from({ length: 12 }, (_, j) => [tw[0] - 28 + j * 5, tw[1] + (k - 1) * 8]), 12);
      await page.waitForTimeout(700);
      const [hurt, cross] = await page.evaluate(() => [lastDeficit, keeperAnger]);
      await page.waitForTimeout(9000);
      const healed = await page.evaluate(() => lastDeficit);
      check('4 castle keepers rebuild a knocked-down tower', nk === 4 && healed < hurt * 0.6, `${nk} keepers, damage ${hurt | 0} -> ${healed | 0}`);
      check('the keepers get cross when the castle is knocked down', cross > 0.1, cross.toFixed(2));
      check('building a castle keeps the chosen tool', castle.tool === 'shovel' || castle.tool === 'hose' || castle.tool === 'truck' || castle.tool === 'mould', castle.tool);
      check('no errors with mould, hose, truck and castle', errors.length === 0, errors.join('; '));
      await ctx.close();
    }

    // 5. Tilt thresholds match the settings note (flat sand)
    {
      const { page, ctx } = await open(browser, { bury: 'off' });
      const slides = (sensName, deg) => page.evaluate(([sensName, deg]) => {
        const fire = beta => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { beta, gamma: 0 }));
        settings.sens = sensName; needCal = true; fire(0);
        for (let i = 0; i < N; i++) { h[i] = 7.5; u[i] = v[i] = 0; act[i] = 0; firm[i] = 0; wet[i] = 0; wat[i] = 0; }
        wakeAll(); fire(deg); for (let f = 0; f < 40; f++) updateTilt();
        flowThisFrame = 0; for (let f = 0; f < 60; f++) for (let k = 0; k < 3; k++) relax(tiltX, tiltY, 0);
        return flowThisFrame > 50;
      }, [sensName, deg]);
      check('Low tilt: still at 44°, slides at 56°', !(await slides('low', 44)) && await slides('low', 56));
      check('High tilt: still at 28°, slides at 40°', !(await slides('high', 28)) && await slides('high', 40));
      await ctx.close();
    }

    // 6. Settings persist, and the panel's Done button is reachable on a short screen
    {
      const { page, ctx } = await open(browser, { sens: 'medium', sun: 'low' }, undefined, { viewport: { width: 402, height: 560 } });
      await page.locator('#gear').dispatchEvent('pointerdown'); await page.waitForTimeout(1400);
      const open1 = await page.evaluate(() => !panel.classList.contains('hide'));
      const done = await page.locator('#done').boundingBox();
      check('holding the gear opens settings', open1);
      check('Done is on screen on a short phone', done && done.y + done.height <= 560, done ? `${Math.round(done.y + done.height)}px` : 'missing');
      await page.click('[data-key=tide] [data-v=high]'); await page.click('#done');
      await page.reload();
      const saved = await page.evaluate(() => [settings.tide, settings.sens, settings.sun]);
      check('settings are remembered after reload', saved.join() === 'high,medium,low', saved.join());
      await page.evaluate(() => { settings.keepers = 'off'; buildBigCastle(); });
      await page.waitForTimeout(2200);
      check('keepers can be switched off', await page.evaluate(() => keepers.length === 0));
      await ctx.close();
    }

    // 7. The guide opens over the sandbox and closes again
    {
      const { page, ctx, errors } = await open(browser);
      await page.locator('#gear').dispatchEvent('pointerdown'); await page.waitForTimeout(1400);
      await page.click('#helpBtn'); await page.waitForTimeout(600);
      const shown = await page.evaluate(() => !helpWrap.classList.contains('hide'));
      const imgs = await page.frameLocator('#helpframe').locator('img').count();
      await page.frameLocator('#helpframe').locator('#back').click(); await page.waitForTimeout(200);
      check('the guide opens with its pictures and closes', shown && imgs > 15 && await page.evaluate(() => helpWrap.classList.contains('hide')), `${imgs} pictures`);
      check('no errors with the guide', errors.length === 0, errors.join('; '));
      await ctx.close();
    }

    // 8. Calm sand sleeps (performance)
    {
      const { page, ctx } = await open(browser);
      await page.waitForTimeout(4000);
      const [ms, awake] = await page.evaluate(() => [physMs, Array.from(tileAwake).filter(x => x).length]);
      check('idle sand uses little time (sleeping tiles)', ms < 3, `${ms.toFixed(2)} ms/frame, ${awake} tiles awake`);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
