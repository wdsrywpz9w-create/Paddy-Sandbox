'use strict';
// Airborne grains and droplets.
// Files share one global scope; they load in the order listed in index.html.

// ---------- flying / falling grains ----------
const parts = [];
const MAXP = 3500;

function spawnGrain(x, y, z, vx, vy, vz, m, tint, r = 1, g = 1, b = 1) {
  if (parts.length >= MAXP) return;
  parts.push({ x, y, z, vx, vy, vz, m, c: tint, kr: r, kg: g, kb: b });
}
// add q of sand with a given tint and colour on top of cell i
function mixInto(i, q, tint, r, g, b) {
  const nh = h[i] + q; if (nh <= 1e-6) return;
  const a = h[i] / nh, e = q / nh;
  c[i] = c[i] * a + tint * e; kr[i] = kr[i] * a + r * e; kg[i] = kg[i] * a + g * e; kb[i] = kb[i] * a + b * e;
  h[i] = nh;
}

function updateParticles() {
  for (let n = parts.length - 1; n >= 0; n--) {
    const p = parts[n];
    p.vz -= 0.22; p.x += p.vx; p.y += p.vy; p.z += p.vz;
    p.vx *= 0.985; p.vy *= 0.985;
    if (p.x < 0) { p.x = 0; p.vx = -p.vx * 0.3; } else if (p.x > W - 1) { p.x = W - 1; p.vx = -p.vx * 0.3; }
    if (p.y < 0) { p.y = 0; p.vy = -p.vy * 0.3; } else if (p.y > H - 1) { p.y = H - 1; p.vy = -p.vy * 0.3; }
    const i = (p.y | 0) * W + (p.x | 0);
    if (p.dye && p.z <= h[i] + base[i] + wat[i]) { applyDye(p.x, p.y, p.dye); parts[n] = parts[parts.length - 1]; parts.pop(); continue; }
    if (p.w && p.z <= h[i] + base[i] + wat[i]) { landDrop(p, i); parts[n] = parts[parts.length - 1]; parts.pop(); continue; }
    if (p.z <= h[i] + base[i]) {
      const nh = h[i] + p.m;
      if (nh < P.maxH) mixInto(i, p.m, p.c, p.kr, p.kg, p.kb);
      const share = p.m / Math.max(1, Math.min(nh, P.mobile));
      u[i] += p.vx / P.iters * share; v[i] += p.vy / P.iters * share;
      firm[i] = 0; act[i] = 1;
      parts[n] = parts[parts.length - 1]; parts.pop();
    }
  }
}

function spawnDrop(x, y, z, vx, vy, vz, m) {
  if (parts.length >= MAXP) return;
  parts.push({ x, y, z, vx, vy, vz, m, c: 1, w: 1 });
}
function landDrop(p, i) {
  wat[i] += p.m; waterTotal += p.m;
  wet[i] = 1; wetActive = true; firm[i] *= 0.6; act[i] = 1;
  if (h[i] > 0.05 && wat[i] < 0.6) { // the jet blasts a small crater; once water collects it cushions the jet and the hole fills
    const e = Math.min(h[i], 0.05 * (1 - wat[i] / 0.6));
    const a = Math.atan2(p.vy, p.vx) + (Math.random() - 0.5) * 2.2, d = 2 + Math.random() * 4;
    const x = Math.round(p.x + Math.cos(a) * d), y = Math.round(p.y + Math.sin(a) * d);
    if (x >= 0 && y >= 0 && x < W && y < H) { const j = y * W + x; h[i] -= e; h[j] += e; act[j] = 1; firm[j] = 0; }
  }
}
