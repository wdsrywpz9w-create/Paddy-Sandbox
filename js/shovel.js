'use strict';
// The shovel: scoop (growing while held), carry and dump.
// Files share one global scope; they load in the order listed in index.html.

// ---------- the shovel: scoop here, carry, dump there ----------
const shovels = new Map(); // pointerId -> { x, y, load, tint, r, g, b }
const dumps = [], tipping = [];
// Shovel scoop sizes (screen px). Holding still digs from SCOOP_MIN out to SCOOP_MAX.
const SCOOP_MIN = { r: 13, d: 8 }, SCOOP_MAX = { r: 36, d: 17 }, SCOOP_GROW_MS = 1500;
function surfaceRef(cx, cy, rPx) { // average surface level under the shovel before digging
  const px = cx / CELL, py = cy / CELL, r = rPx / CELL, r2 = r * r;
  let sum = 0, n = 0;
  for (let y = Math.max(0, Math.floor(py - r)); y <= Math.min(H - 1, Math.ceil(py + r)); y++)
    for (let x = Math.max(0, Math.floor(px - r)); x <= Math.min(W - 1, Math.ceil(px + r)); x++) {
      const dx = x - px, dy = y - py; if (dx * dx + dy * dy < r2) { const j = y * W + x; sum += h[j] + base[j]; n++; }
    }
  return n ? sum / n : 0;
}
// Dig a bowl of radius rPx and depth dPx below the reference level; adds what it digs to the shovel load.
function scoop(sh, rPx, dPx) {
  const px = sh.ox / CELL, py = sh.oy / CELL, r = rPx / CELL, r2 = r * r, depth = dPx / CELL, ref = sh.ref;
  const x0 = Math.max(0, Math.floor(px - r)), x1 = Math.min(W - 1, Math.ceil(px + r));
  const y0 = Math.max(0, Math.floor(py - r)), y1 = Math.min(H - 1, Math.ceil(py + r));
  let got = 0, cm = 0, mr = 0, mg = 0, mb = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
    if (d2 >= r2) continue;
    const i = y * W + x, target = ref - depth * Math.sqrt(1 - d2 / r2), surf = h[i] + base[i];
    if (surf > target) {
      let rem = surf - target; if (rem > h[i]) rem = h[i];
      h[i] -= rem; got += rem; cm += c[i] * rem; mr += kr[i] * rem; mg += kg[i] * rem; mb += kb[i] * rem;
    }
    firm[i] = 0; act[i] = 1; u[i] = 0; v[i] = 0;
  }
  if (got > 0) { // mix into what is already on the shovel
    const tot = sh.load + got;
    sh.tint = (sh.tint * sh.load + cm) / tot; sh.r = (sh.r * sh.load + mr) / tot; sh.g = (sh.g * sh.load + mg) / tot; sh.b = (sh.b * sh.load + mb) / tot;
    sh.load = tot;
  }
  return got;
}
function startShovel(id, x, y) {
  const sh = { x, y, ox: x, oy: y, t0: performance.now(), growing: true, grow: 0, load: 0, tint: 1, r: 1, g: 1, b: 1, lastCrunch: 0 };
  sh.ref = surfaceRef(x, y, SCOOP_MAX.r);
  scoop(sh, SCOOP_MIN.r, SCOOP_MIN.d);
  shovels.set(id, sh);
  sound.scoop();
}
// Each frame: a shovel held still keeps digging a bigger, deeper scoop.
function growShovels(now) {
  for (const sh of shovels.values()) {
    if (!sh.growing) continue;
    if (Math.hypot(sh.x - sh.ox, sh.y - sh.oy) > 14) { sh.growing = false; continue; } // lifted away: stop digging
    const g = Math.min(1, (now - sh.t0) / SCOOP_GROW_MS);
    if (g <= sh.grow) continue;
    sh.grow = g;
    const rPx = SCOOP_MIN.r + (SCOOP_MAX.r - SCOOP_MIN.r) * g, dPx = SCOOP_MIN.d + (SCOOP_MAX.d - SCOOP_MIN.d) * g;
    const got = scoop(sh, rPx, dPx);
    if (got > 0) { // grains kick up from the rim as it digs
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * Math.PI * 2, rr = rPx / CELL, sp = 0.5 + Math.random() * 0.8;
        const x = Math.max(0, Math.min(W - 1, sh.ox / CELL + Math.cos(a) * rr)), y = Math.max(0, Math.min(H - 1, sh.oy / CELL + Math.sin(a) * rr));
        const m = Math.min(0.05, sh.load * 0.001); if (m <= 0) break;
        sh.load -= m;
        spawnGrain(x, y, sh.ref + 1, Math.cos(a) * sp, Math.sin(a) * sp, 1.2 + Math.random(), m, sh.tint, sh.r, sh.g, sh.b);
      }
    }
    if (now - sh.lastCrunch > 330) { sh.lastCrunch = now; sound.scoop(); }
    if (g >= 1) sh.growing = false;
  }
}
function drawScoopRings(now) {
  for (const sh of shovels.values()) {
    const age = now - sh.t0;
    if (!sh.growing && sh.grow < 1 && age > 200) continue;
    const g = sh.grow, rPx = SCOOP_MIN.r + (SCOOP_MAX.r - SCOOP_MIN.r) * g;
    const full = g >= 1, fade = full ? Math.max(0, 1 - (age - SCOOP_GROW_MS) / 500) : 1;
    if (fade <= 0) continue;
    ctx.save(); ctx.translate(sh.ox, sh.oy); ctx.globalAlpha = fade;
    // marching dashed ring = the edge of the scoop
    ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now / 40;
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(0, 0, rPx + 4, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // progress arc just outside it, filling up as the scoop grows
    const R2 = SCOOP_MAX.r + 12;
    ctx.lineCap = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.arc(0, 0, R2, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = full ? '#7ee06f' : '#ffcf3f';
    ctx.beginPath(); ctx.arc(0, 0, R2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, g)); ctx.stroke();
    if (full) { // a happy pop when it's as big as it gets
      const p = Math.min(1, (age - SCOOP_GROW_MS) / 350);
      ctx.globalAlpha = fade * (1 - p); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, R2 + 4 + p * 16, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}
function dumpShovel(sh) {
  if (sh.load > 0.01) dumps.push({ x: sh.x / CELL, y: sh.y / CELL, left: sh.load, tint: sh.tint, r: sh.r, g: sh.g, b: sh.b });
  tipping.push({ ...sh, t0: performance.now() });
}
function dumpStep() {
  for (let n = dumps.length - 1; n >= 0; n--) {
    const d = dumps[n];
    if (!d.per) d.per = Math.max(0.5, d.left / 1000);
    for (let k = 0; k < 90 && d.left > 0 && parts.length < MAXP - 10; k++) {
      const m = Math.min(d.per, d.left); d.left -= m;
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * (6 + Math.sqrt(d.per) * 8) / CELL;
      const x = Math.max(0, Math.min(W - 1, d.x + Math.cos(a) * rr)), y = Math.max(0, Math.min(H - 1, d.y + Math.sin(a) * rr));
      const j = (y | 0) * W + (x | 0);
      spawnGrain(x, y, h[j] + base[j] + 10 + Math.random() * 12, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15, -0.4, m,
                 d.tint * (0.94 + Math.random() * 0.12), d.r, d.g, d.b);
    }
    if (d.left <= 0) dumps.splice(n, 1);
  }
  return dumps.length;
}
function sandCss(tint, r, g, b, lum) {
  const v = tint * lum;
  return `rgb(${Math.min(255, 228 * v * r) | 0},${Math.min(255, 197 * v * g) | 0},${Math.min(255, 148 * v * b) | 0})`;
}
function drawShovel(x, y, rot, load, sh, scale) {
  const U = 30 * scale;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(U, U);
  ctx.lineJoin = 'round';
  // shadow
  ctx.save(); ctx.translate(0.35, 0.45); ctx.fillStyle = 'rgba(60,35,10,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 0.6, 0.55, 1.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // handle
  ctx.fillStyle = '#c9732f'; ctx.fillRect(-0.08, 0.55, 0.16, 1.35);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-0.05, 0.6, 0.04, 1.25);
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.ellipse(0, 1.95, 0.26, 0.13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7d8a96'; ctx.fillRect(-0.1, 0.35, 0.2, 0.3);
  // blade
  const blade = () => { ctx.beginPath(); ctx.moveTo(-0.5, -0.2); ctx.quadraticCurveTo(-0.5, -0.82, 0, -0.98); ctx.quadraticCurveTo(0.5, -0.82, 0.5, -0.2);
    ctx.lineTo(0.5, 0.3); ctx.quadraticCurveTo(0, 0.48, -0.5, 0.3); ctx.closePath(); };
  const gr = ctx.createLinearGradient(-0.5, -1, 0.5, 0.4); gr.addColorStop(0, '#eef3f7'); gr.addColorStop(1, '#9fadb9');
  blade(); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 0.07; ctx.strokeStyle = '#6f7d89'; ctx.stroke();
  if (load > 0.01) { // the heap of sand on the shovel
    const s2 = 0.45 + 0.55 * Math.min(1, load / 2500);
    ctx.fillStyle = sandCss(sh.tint, sh.r, sh.g, sh.b, 0.9);
    ctx.beginPath(); ctx.ellipse(0, -0.28, 0.42 * s2, 0.55 * s2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = sandCss(sh.tint, sh.r, sh.g, sh.b, 1.08);
    ctx.beginPath(); ctx.ellipse(-0.1, -0.42, 0.2 * s2, 0.26 * s2, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function drawShovels(now) {
  for (const sh of shovels.values()) drawShovel(sh.x, sh.y, -0.6, sh.load, sh, 1.0 + 0.4 * Math.min(1, sh.load / 2500));
  for (let n = tipping.length - 1; n >= 0; n--) {
    const t = (now - tipping[n].t0) / 380;
    if (t >= 1) { tipping.splice(n, 1); continue; }
    const sh = tipping[n];
    ctx.globalAlpha = t < 0.6 ? 1 : (1 - t) / 0.4;
    drawShovel(sh.x, sh.y, -0.6 + 1.1 * Math.sin(t * Math.PI / 2), sh.load * Math.max(0, 1 - t * 3), sh, 1.0 + 0.4 * Math.min(1, sh.load / 2500) + 0.1 * t);
    ctx.globalAlpha = 1;
  }
}
