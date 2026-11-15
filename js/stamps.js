'use strict';
// Stamps: shapes, imprinting, and carrying them around.
// Files share one global scope; they load in the order listed in index.html.

// ---------- stamps ----------
const STAMPS = ['turtle', 'starfish', 'shell', 'fish', 'crab', 'heart'];
const PAL = {
  turtle:   { a: '#86cf6c', b: '#3e8c4c', d: '#c3eaa0', e: '#1d2a1d' },
  starfish: { a: '#ff8a3d', b: '#ff8a3d', d: '#ffd38f', e: '#3a1d08' },
  shell:    { a: '#ffb7c9', b: '#f28aab', d: '#e0688c', e: '#e0688c' },
  fish:     { a: '#4fc3f7', b: '#ffd54f', d: '#1f86c4', e: '#10202a' },
  crab:     { a: '#f0524f', b: '#f0524f', d: '#a51b1b', e: '#1a0a0a' },
  heart:    { a: '#ff5c8a', b: '#ff5c8a', d: '#ffc4d5', e: '#ffc4d5' },
};
// In the depth mask, white = pressed deepest, grey = details that stay raised.
const MASKPAL = { a: '#ffffff', b: '#ffffff', d: '#7a7a7a', e: '#5a5a5a' };

function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); }
function dotc(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }

function drawShape(g, type, p) {
  g.lineJoin = 'round'; g.lineCap = 'round';
  switch (type) {
    case 'turtle': {
      g.fillStyle = p.a;
      ell(g, -0.52, -0.38, 0.32, 0.15, 0.6); ell(g, 0.52, -0.38, 0.32, 0.15, -0.6);
      ell(g, -0.42, 0.5, 0.22, 0.13, -0.7); ell(g, 0.42, 0.5, 0.22, 0.13, 0.7);
      ell(g, 0, -0.74, 0.18, 0.21, 0);
      g.beginPath(); g.moveTo(-0.08, 0.6); g.lineTo(0.08, 0.6); g.lineTo(0, 0.87); g.fill();
      g.fillStyle = p.b; ell(g, 0, 0.06, 0.5, 0.6, 0);
      g.strokeStyle = p.d; g.lineWidth = 0.075;
      const pts = [];
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; pts.push([Math.cos(a) * 0.2, 0.06 + Math.sin(a) * 0.23, a]); }
      g.beginPath(); pts.forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke();
      g.beginPath();
      pts.forEach(q => { g.moveTo(q[0], q[1]); g.lineTo(Math.cos(q[2]) * 0.46, 0.06 + Math.sin(q[2]) * 0.56); });
      g.stroke();
      g.beginPath(); g.ellipse(0, 0.06, 0.45, 0.55, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = p.e; dotc(g, -0.08, -0.8, 0.04); dotc(g, 0.08, -0.8, 0.04);
      break;
    }
    case 'starfish': {
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 0.4 : 0.92;
        k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath(); g.fillStyle = p.a; g.fill();
      g.strokeStyle = p.a; g.lineWidth = 0.18; g.stroke();
      g.fillStyle = p.d;
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * 2 * Math.PI / 5;
        for (const t of [0.24, 0.43, 0.61, 0.78]) dotc(g, Math.cos(a) * t, Math.sin(a) * t, 0.06 * (1 - t * 0.45));
      }
      dotc(g, 0, 0, 0.09);
      break;
    }
    case 'shell': {
      const cx = 0, cy = 0.72, R1 = 1.32, a0 = -Math.PI * 0.8, a1 = -Math.PI * 0.2, ribs = 9;
      const pt = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      g.fillStyle = p.b;
      g.beginPath(); g.moveTo(-0.36, 0.6); g.lineTo(0.36, 0.6); g.lineTo(0.26, 0.92); g.lineTo(-0.26, 0.92); g.closePath(); g.fill();
      g.fillStyle = p.a;
      g.beginPath(); g.moveTo(cx, cy);
      for (let r = 0; r < ribs; r++) {
        const s = a0 + (a1 - a0) * r / ribs, e = a0 + (a1 - a0) * (r + 1) / ribs, m = (s + e) / 2;
        if (r === 0) { const q = pt(s, R1); g.lineTo(q[0], q[1]); }
        const cp = pt(m, R1 * 1.1), q = pt(e, R1); g.quadraticCurveTo(cp[0], cp[1], q[0], q[1]);
      }
      g.closePath(); g.fill();
      g.strokeStyle = p.d; g.lineWidth = 0.07; g.beginPath();
      for (let r = 1; r < ribs; r++) {
        const a = a0 + (a1 - a0) * r / ribs, q0 = pt(a, 0.22), q = pt(a, R1 * 0.96);
        g.moveTo(q0[0], q0[1]); g.lineTo(q[0], q[1]);
      }
      g.stroke();
      break;
    }
    case 'fish': {
      g.fillStyle = p.b;
      g.beginPath(); g.moveTo(0.38, 0); g.lineTo(0.95, -0.46); g.quadraticCurveTo(0.78, 0, 0.95, 0.46); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-0.38, -0.3); g.quadraticCurveTo(-0.02, -0.78, 0.26, -0.28); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-0.05, 0.3); g.quadraticCurveTo(0.1, 0.62, 0.25, 0.28); g.closePath(); g.fill();
      g.fillStyle = p.a; ell(g, -0.12, 0, 0.62, 0.4, 0);
      g.strokeStyle = p.d; g.lineWidth = 0.07;
      g.beginPath(); g.arc(-0.44, 0, 0.26, -0.95, 0.95); g.stroke();
      for (const sx of [-0.04, 0.2]) for (const sy of [-0.14, 0.12]) { g.beginPath(); g.arc(sx, sy, 0.12, -1.2, 1.2); g.stroke(); }
      g.fillStyle = p.e; dotc(g, -0.52, -0.1, 0.075);
      break;
    }
    case 'crab': {
      g.strokeStyle = p.a; g.lineWidth = 0.13;
      for (const s of [-1, 1]) {
        for (let k = 0; k < 3; k++) {
          g.beginPath(); g.moveTo(s * 0.35, 0.12 + k * 0.12); g.lineTo(s * 0.78, 0.14 + k * 0.17); g.lineTo(s * 0.92, 0.42 + k * 0.16); g.stroke();
        }
        g.lineWidth = 0.16; g.beginPath(); g.moveTo(s * 0.3, -0.1); g.lineTo(s * 0.56, -0.42); g.stroke(); g.lineWidth = 0.13;
        g.fillStyle = p.a; dotc(g, s * 0.6, -0.62, 0.23);
        g.save(); g.globalCompositeOperation = 'destination-out';
        const ca = -Math.PI / 2 + s * 0.45;
        g.beginPath(); g.moveTo(s * 0.6, -0.62); g.arc(s * 0.6, -0.62, 0.3, ca - 0.33, ca + 0.33); g.closePath(); g.fill();
        g.restore();
      }
      g.fillStyle = p.b; ell(g, 0, 0.1, 0.56, 0.38, 0);
      g.strokeStyle = p.a; g.lineWidth = 0.065;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 0.13, -0.18); g.lineTo(s * 0.2, -0.42); g.stroke(); }
      g.fillStyle = p.e; dotc(g, -0.2, -0.45, 0.085); dotc(g, 0.2, -0.45, 0.085);
      g.strokeStyle = p.d; g.lineWidth = 0.065; g.beginPath(); g.arc(0, 0.02, 0.22, 0.35, Math.PI - 0.35); g.stroke();
      break;
    }
    case 'heart': {
      const path = () => { g.beginPath(); g.moveTo(0, 0.85); g.bezierCurveTo(-1.25, 0.05, -0.8, -1.05, 0, -0.42); g.bezierCurveTo(0.8, -1.05, 1.25, 0.05, 0, 0.85); };
      g.fillStyle = p.a; path(); g.fill();
      g.save(); g.translate(0, 0.06); g.scale(0.6, 0.6); g.strokeStyle = p.d; g.lineWidth = 0.15; path(); g.stroke(); g.restore();
      break;
    }
  }
}

const maskCanvas = document.createElement('canvas');
const mctx = maskCanvas.getContext('2d', { willReadFrequently: true });

function boxBlur(src, S, r) {
  const tmp = new Float32Array(S * S), out = new Float32Array(S * S), inv = 1 / (2 * r + 1);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let s = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < S) s += src[y * S + xx]; }
    tmp[y * S + x] = s * inv;
  }
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let s = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < S) s += tmp[yy * S + x]; }
    out[y * S + x] = s * inv;
  }
  return out;
}

function makeMask(type, rot) {
  const R = STAMP_R / CELL, pad = Math.ceil(16 / CELL) + 3;
  const S = Math.ceil(R * 2.3 + pad * 2);
  maskCanvas.width = S; maskCanvas.height = S;
  mctx.clearRect(0, 0, S, S);
  mctx.save(); mctx.translate(S / 2, S / 2); mctx.rotate(rot); mctx.scale(R, R);
  drawShape(mctx, type, MASKPAL); mctx.restore();
  const d = mctx.getImageData(0, 0, S, S).data;
  const cov = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) cov[i] = d[i * 4] * d[i * 4 + 3] / 65025;
  const dep = boxBlur(cov, S, 1);
  const solid = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) solid[i] = cov[i] > 0.03 ? 1 : 0;
  const near = boxBlur(solid, S, Math.max(1, Math.round(3 / CELL)));
  const far = boxBlur(boxBlur(solid, S, Math.round(6 / CELL) + 1), S, Math.round(6 / CELL) + 1);
  const rim = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) rim[i] = near[i] > 0.02 ? 0 : far[i];
  return { S, dep, near, rim };
}

function pressStamp(type, cx, cy, rot) {
  const { S, dep, near, rim } = makeMask(type, rot);
  const ox = Math.round(cx - S / 2), oy = Math.round(cy - S / 2);
  const D = 8 / CELL;
  let sum = 0, n = 0;
  for (let k = 0; k < S * S; k++) {
    if (dep[k] < 0.5) continue;
    const x = ox + (k % S), y = oy + ((k / S) | 0);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    sum += h[y * W + x] + base[y * W + x]; n++;
  }
  if (!n) return;
  const mean = sum / n;
  let removed = 0, cm = 0, mr = 0, mg = 0, mb = 0;
  for (let k = 0; k < S * S; k++) {
    const x = ox + (k % S), y = oy + ((k / S) | 0);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x, m = dep[k];
    if (m > 0.02) {
      const surf = h[i] + base[i], target = mean + (surf - mean) * 0.35 - D * m;
      if (surf > target) { let rem = surf - target; if (rem > h[i]) rem = h[i]; removed += rem; cm += c[i] * rem; mr += kr[i] * rem; mg += kg[i] * rem; mb += kb[i] * rem; h[i] -= rem; }
      firm[i] = Math.max(firm[i], Math.min(1, m * 1.6));
      act[i] = 0; u[i] = 0; v[i] = 0;
    } else if (near[k] > 0.02) {
      firm[i] = Math.max(firm[i], 0.6); // sand squashed around the edge
    }
  }
  // most of the volume is compacted; some is pushed up into a soft rim
  let ws = 0;
  for (let k = 0; k < S * S; k++) {
    const x = ox + (k % S), y = oy + ((k / S) | 0);
    if (x >= 0 && y >= 0 && x < W && y < H) ws += rim[k];
  }
  if (ws <= 0 || removed <= 0) return;
  const push = removed * 0.16, tint = cm / removed;
  for (let k = 0; k < S * S; k++) {
    if (!rim[k]) continue;
    const x = ox + (k % S), y = oy + ((k / S) | 0);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x, q = push * rim[k] / ws;
    mixInto(i, q, tint, mr / removed, mg / removed, mb / removed); firm[i] = 0; act[i] = 1;
  }
}

// colourful sprites for the press animation
const sprites = {}, shadows = {};
const SHADOWPAL = { a: '#3b2508', b: '#3b2508', d: '#3b2508', e: '#3b2508' };
function buildStampSprites() {
  for (const t of STAMPS) {
    const s = Math.ceil(STAMP_R * 2.4 * DPR), cnv = document.createElement('canvas');
    cnv.width = cnv.height = s;
    const g = cnv.getContext('2d');
    g.translate(s / 2, s / 2); g.scale(STAMP_R * DPR, STAMP_R * DPR);
    drawShape(g, t, PAL[t]);
    sprites[t] = cnv;
    const sc = document.createElement('canvas'); sc.width = sc.height = s;
    const sg = sc.getContext('2d'); sg.translate(s / 2, s / 2); sg.scale(STAMP_R * DPR, STAMP_R * DPR);
    drawShape(sg, t, SHADOWPAL); shadows[t] = sc;
  }
}

const anims = [];
function startStamp(type, cssX, cssY, rot) {
  anims.push({ type, x: cssX, y: cssY, rot, t0: performance.now(), done: false });
}

// Stamps being carried by a finger: they hover and follow until let go.
const carries = new Map();
const LIFT = 1.18;
function pickUpStamp(id, type, x, y) {
  carries.set(id, { type, x, y, rot: (Math.random() - 0.5) * 0.5, wob: Math.random() * 6, t0: performance.now() });
  sound.pickup();
}
function moveStamp(id, x, y) { const k = carries.get(id); if (k) { k.x = x; k.y = y; } }
function dropStamp(id, press) {
  const k = carries.get(id); if (!k) return;
  carries.delete(id);
  if (press && k.x != null && k.x >= 0 && k.y >= 0 && k.x <= cssW && k.y <= cssH) startStamp(k.type, k.x, k.y, k.rot);
}
function drawSprite(spr, shd, x, y, rot, scale, lift, alpha) {
  const sz = spr.width / DPR * scale;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.globalAlpha = alpha * (0.32 - 0.12 * lift);
  ctx.drawImage(shd, -sz / 2 + 10 * lift + 2, -sz / 2 + 14 * lift + 3, sz, sz); // shadow on the sand
  ctx.globalAlpha = alpha;
  ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz);
  ctx.restore();
}
function drawCarries(now) {
  for (const k of carries.values()) {
    if (k.x == null || k.x < -40 || k.y < -40 || k.x > cssW + 40 || k.y > cssH + 40) continue;
    const t = (now - k.t0) / 1000, grow = Math.min(1, (now - k.t0) / 120);
    const wob = Math.sin(t * 5 + k.wob) * 0.05;
    drawSprite(sprites[k.type], shadows[k.type], k.x, k.y, k.rot + wob, 1 + (LIFT - 1) * grow, grow, 0.75 + 0.25 * grow);
  }
}

function drawAnims(now) {
  for (let n = anims.length - 1; n >= 0; n--) {
    const a = anims[n], t = now - a.t0;
    const DOWN = 130, UP = 380;
    if (!a.done && t >= DOWN) {
      a.done = true;
      pressStamp(a.type, a.x / CELL, a.y / CELL, a.rot);
      sound.stamp(STAMPS.indexOf(a.type));
      if (navigator.vibrate) try { navigator.vibrate(18); } catch (e) {}
    }
    if (t > DOWN + UP) { anims.splice(n, 1); continue; }
    let scale, alpha, lift;
    if (t < DOWN) { const q = t / DOWN; scale = LIFT - (LIFT - 1) * q * q; lift = 1 - q * q; alpha = 1; }
    else { const q = (t - DOWN) / UP; scale = 1 + 0.25 * q; lift = q; alpha = 1 - q; }
    drawSprite(sprites[a.type], shadows[a.type], a.x, a.y, a.rot, scale, lift, alpha);
  }
}
