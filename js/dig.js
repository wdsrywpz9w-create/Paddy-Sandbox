'use strict';
// Finger digging (plowing through the sand).
// Files share one global scope; they load in the order listed in index.html.

// ---------- finger: plowing through sand ----------
function plow(px, py, dirx, diry, speed) {
  const r = FINGER_R / CELL, r2 = r * r, R = r * 2.2;
  const depth = 15 / CELL;
  const x0 = Math.max(0, Math.floor(px - R)), x1 = Math.min(W - 1, Math.ceil(px + R));
  const y0 = Math.max(0, Math.floor(py - R)), y1 = Math.min(H - 1, Math.ceil(py + R));
  let sum = 0, n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - px, dy = y - py; if (dx * dx + dy * dy < r2) { const j = y * W + x; sum += h[j] + base[j]; n++; }
  }
  if (!n) return;
  const ref = sum / n;
  let removed = 0, cm = 0, mr = 0, mg = 0, mb = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
    if (d2 >= r2) continue;
    const i = y * W + x;
    const target = ref - depth * Math.sqrt(1 - d2 / r2), surf = h[i] + base[i];
    if (surf > target) { let rem = (surf - target) * 0.85; if (rem > h[i]) rem = h[i]; h[i] -= rem; removed += rem; cm += c[i] * rem; mr += kr[i] * rem; mg += kg[i] * rem; mb += kb[i] * rem; }
    firm[i] = 0; act[i] = 1; u[i] = 0; v[i] = 0;
    if (wet[i] > 0) wet[i] *= 0.97;
  }
  if (removed <= 0) return;
  const tint = cm / removed, cr = mr / removed, cg = mg / removed, cb = mb / removed;
  // a few grains get flicked into the air by a fast finger
  if (speed > 0.9 && dirx * dirx + diry * diry > 0) {
    const nfl = Math.min(8, (speed * 3) | 0);
    for (let k = 0; k < nfl; k++) {
      const m = Math.min(removed * 0.05, 0.08); if (m <= 0) break;
      removed -= m;
      const sp = (0.6 + Math.random()) * speed * 1.2 / CELL * 2;
      const a = Math.atan2(diry, dirx) + (Math.random() - 0.5) * 1.2;
      spawnGrain(px + Math.cos(a) * r, py + Math.sin(a) * r, ref + 1,
                 Math.cos(a) * sp, Math.sin(a) * sp, 1 + Math.random() * 2.2, m, tint, cr, cg, cb);
    }
  }
  // the rest is bulldozed into a bow-wave ahead of and beside the finger
  const hasDir = dirx * dirx + diry * diry > 0;
  const push = Math.min(0.45, speed * 0.35); // shoved sand keeps sliding a little
  const wgt = (dx, dy) => {
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < r * 0.85 || d > R) return 0;
    let w = 1 - Math.abs(d - r * 1.5) / (r * 0.7); if (w <= 0) return 0;
    if (hasDir) { const f = (dx * dirx + dy * diry) / d + 0.1; w *= f > 0 ? f * f : 0; } // mostly shoved ahead, a little to the sides
    return w;
  };
  let ws = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ws += wgt(x - px, y - py);
  if (ws <= 0) return;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const w = wgt(x - px, y - py); if (!w) continue;
    const i = y * W + x, q = removed * w / ws;
    mixInto(i, q, tint, cr, cg, cb); const nh = h[i]; firm[i] = 0; act[i] = 1;
    if (hasDir) { const f = Math.min(1, q / Math.max(0.5, Math.min(nh, P.mobile))); u[i] += (dirx * push - u[i]) * f; v[i] += (diry * push - v[i]) * f; }
  }
}
