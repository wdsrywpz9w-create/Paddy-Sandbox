'use strict';
// The wave that smooths the tray and reburies the toys.
// Files share one global scope; they load in the order listed in index.html.

// ---------- the wave (smooth + re-level) ----------
let wave = null;
function startWave() {
  if (wave) return;
  wave = { y: -40, mean: bury().bed / CELL, t0: performance.now() }; // fresh, level sand
  needCal = true; // whatever pose the phone is in now becomes "level"
  if (!ori) needCal = true;
  sound.wave();
}
function stepWave() {
  if (!wave) return;
  const t = performance.now() - wave.t0, dur = 1500;
  wave.y = -60 + (cssH + 160) * Math.min(1, t / dur);
  const rows = Math.min(H, Math.floor(wave.y / CELL));
  const m = wave.mean;
  for (let y = 0; y < rows; y++) {
    const back = (wave.y - y * CELL) / 140, f = Math.min(0.25, 0.03 + back * 0.12);
    for (let x = 0, i = y * W; x < W; x++, i++) {
      const tgt = m - base[i];
      h[i] += ((tgt > 0 ? tgt : 0) - h[i]) * f; firm[i] *= 0.8; act[i] = 0; u[i] = 0; v[i] = 0; wat[i] *= 0.8;
      kr[i] += (1 - kr[i]) * f; kg[i] += (1 - kg[i]) * f; kb[i] += (1 - kb[i]) * f; // the sea washes the colours out
      if (wet[i] < 1) wet[i] = Math.min(1, wet[i] + 0.12);
    }
  }
  wetActive = true;
  if (t > dur + 600) {
    placeObjects(); // new dinosaurs to find!
    spring.fill(0); springsOn = false; castleFlags = []; builds.length = 0; // the sea takes the castle
    for (let i = 0; i < N; i++) { firm[i] = 0; h[i] = coverOver(i, m - base[i]); wat[i] = 0; kr[i] = kg[i] = kb[i] = 1; }
    dyeUsed = false;
    waterTotal = 0;
    wave = null;
  }
}
function drawWave() {
  if (!wave) return;
  const y = wave.y;
  const gr = ctx.createLinearGradient(0, y - 170, 0, y + 18);
  gr.addColorStop(0, 'rgba(70,170,220,0)');
  gr.addColorStop(0.7, 'rgba(80,180,225,0.45)');
  gr.addColorStop(0.9, 'rgba(230,248,255,0.85)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(0, y - 170);
  ctx.lineTo(cssW, y - 170);
  for (let x = cssW; x >= 0; x -= 12) ctx.lineTo(x, y + 18 + Math.sin(x * 0.05 + y * 0.03) * 6);
  ctx.closePath(); ctx.fill();
}
