'use strict';
// The main loop.
// Files share one global scope; they load in the order listed in index.html.

// ---------- main loop ----------
let scrapeLvl = 0, physMs = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (!N) { resize(); if (!N) return; }
  updateTilt();
  tickTiles();
  if (agit > 0.01 || wave || windOn) wakeAll();
  for (const p of pointers.values()) wakeCss(p.x, p.y, 90);   // wherever a finger is working
  for (const sh of shovels.values()) wakeCss(sh.ox, sh.oy, 60);
  if (agit > 0.01) { agit *= 0.95; for (let i = 0; i < N; i++) firm[i] *= 1 - 0.04 * agit; } else agit = 0;
  if (wetActive && !wave) {
    let any = false;
    for (let i = 0; i < N; i++) if (wet[i] > 0) { wet[i] -= 0.0007; if (wet[i] < 0) wet[i] = 0; else any = true; }
    wetActive = any;
  }
  const pouring = pourStep();
  const spraying = hoseStep();
  const dyeing = dyeStep(now);
  growShovels(now);
  const fanning = fanStep(now);
  sound.fanLevel(fanning * 0.3);
  const dumping = dumpStep();
  stepWave();
  flowThisFrame = 0;
  const t0 = performance.now();
  for (let k = 0; k < P.iters; k++) relax(tiltX, tiltY, agit);
  smoothVel();
  // slower phones: drop to two physics passes per frame if the sim is hogging the frame
  physMs = physMs * 0.97 + (performance.now() - t0) * 0.03;
  if (physMs > 11 && P.iters > 2) P.iters = 2;
  updateParticles();
  waterTable(tiltX, tiltY);
  waterStep(tiltX, tiltY); waterStep(tiltX, tiltY);
  checkFinds(now);
  render(now);
  scrapeLvl = scrapeLvl * 0.6 + Math.min(0.55, fingerTravel / 60) * 0.4; fingerTravel = 0;
  sound.levels(scrapeLvl, (pouring || dumping) ? 0.22 : 0, Math.min(0.4, flowThisFrame / (N * 0.004)), spraying ? 0.2 : dyeing ? 0.07 : 0);
}

resize();
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
