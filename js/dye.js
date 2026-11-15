'use strict';
// Coloured dye.
// Files share one global scope; they load in the order listed in index.html.

// ---------- coloured dye: squirts that stain the grains they land on ----------
const DYES = [
  { id: 'red', rgb: [236, 64, 64] }, { id: 'orange', rgb: [250, 146, 40] }, { id: 'yellow', rgb: [250, 222, 50] },
  { id: 'green', rgb: [70, 196, 84] }, { id: 'blue', rgb: [60, 136, 240] }, { id: 'purple', rgb: [160, 90, 225] },
  { id: 'pink', rgb: [250, 112, 192] }, { id: 'rainbow', rgb: null },
];
let dyeId = 'blue';
function hsl2rgb(hh, ss, ll) {
  const k = n => (n + hh / 30) % 12, a = ss * Math.min(ll, 1 - ll);
  const f = n => ll - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
function dyeColour(now) {
  const d = DYES.find(x => x.id === dyeId) || DYES[0];
  return d.rgb || hsl2rgb((now / 8) % 360, 0.85, 0.58);
}
function applyDye(x, y, k) {
  const R = 2.8, x0 = Math.max(0, Math.floor(x - R)), x1 = Math.min(W - 1, Math.ceil(x + R));
  const y0 = Math.max(0, Math.floor(y - R)), y1 = Math.min(H - 1, Math.ceil(y + R));
  for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
    const d = Math.hypot(xx - x, yy - y); if (d >= R) continue;
    const i = yy * W + xx, f = 0.32 * (1 - d / R);
    kr[i] += (k[0] - kr[i]) * f; kg[i] += (k[1] - kg[i]) * f; kb[i] += (k[2] - kb[i]) * f;
    if (wet[i] < 0.35) wet[i] = 0.35;
  }
  wetActive = true; dyeUsed = true;
}
function dyeStep(now) {
  let n = 0;
  for (const p of pointers.values()) {
    if (p.tool !== 'dye') continue; n++;
    const rgb = dyeColour(now), css = `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`;
    const k = [rgb[0] / (228 * 0.95), rgb[1] / (197 * 0.95), rgb[2] / (148 * 0.95)];
    for (let q = 0; q < 16 && parts.length < MAXP; q++) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 11 / CELL;
      const x = Math.max(0, Math.min(W - 1, p.x / CELL + Math.cos(a) * rr)), y = Math.max(0, Math.min(H - 1, p.y / CELL + Math.sin(a) * rr));
      const j = (y | 0) * W + (x | 0);
      parts.push({ x, y, z: h[j] + base[j] + 5 + Math.random() * 6, vx: 0, vy: 0, vz: -0.4, m: 0, c: 1, dye: k, css });
    }
  }
  return n;
}
