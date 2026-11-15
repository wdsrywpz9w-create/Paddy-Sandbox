'use strict';
// Buried toys to dig up, and the find celebration.
// Files share one global scope; they load in the order listed in index.html.

// ---------- buried treasure: dinosaurs! ----------
const DINOS = ['trex', 'trike', 'stego', 'longneck', 'ptero'];
const EXTRAS = ['egg', 'bone'];
const DINOPAL = {
  trex:     { a: '#62c04c', b: '#3e8e32' },
  trike:    { a: '#ff9b3d', b: '#d9652a' },
  stego:    { a: '#9c6cd8', b: '#ffcf3f' },
  longneck: { a: '#45a6e8', b: '#2d77b8' },
  ptero:    { a: '#ef5f7a', b: '#ffb35c' },
  egg:      { a: '#f6edd2', b: '#8cc86a' },
  bone:     { a: '#f3efe2', b: '#cfc6ad' },
};

// Toy dinosaurs lying on their sides (side view), unit size ~[-1, 1].
function drawDino(g, type, p, solid) {
  const A = solid || p.a, B = solid || p.b, HORN = solid || '#fff3d6', EYEW = solid || '#ffffff', EYE = solid || '#1d1d1d';
  const tri = (a, b, c2) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.closePath(); g.fill(); };
  const eye = (x, y, r) => { g.fillStyle = EYEW; dotc(g, x, y, r); g.fillStyle = EYE; dotc(g, x + r * 0.25, y, r * 0.55); };
  g.lineJoin = 'round'; g.lineCap = 'round';
  switch (type) {
    case 'trex': {
      g.fillStyle = A;
      g.beginPath(); g.moveTo(-0.25, -0.14); g.quadraticCurveTo(-0.7, -0.06, -1.0, 0.3); g.quadraticCurveTo(-0.6, 0.2, -0.2, 0.2); g.closePath(); g.fill();
      g.fillStyle = B; ell(g, -0.14, 0.34, 0.14, 0.26, 0.25); ell(g, -0.08, 0.62, 0.18, 0.07, 0);
      g.fillStyle = A; ell(g, 0, 0.02, 0.42, 0.27, -0.3);
      g.beginPath(); g.moveTo(0.16, -0.22); g.lineTo(0.42, -0.54); g.lineTo(0.6, -0.36); g.lineTo(0.34, 0.04); g.closePath(); g.fill();
      ell(g, 0.6, -0.52, 0.32, 0.17, 0.08);
      ell(g, 0.1, 0.36, 0.13, 0.26, 0.1); ell(g, 0.17, 0.64, 0.19, 0.07, 0);
      g.strokeStyle = A; g.lineWidth = 0.08;
      g.beginPath(); g.moveTo(0.34, -0.06); g.lineTo(0.46, 0.08); g.lineTo(0.54, 0.05); g.stroke();
      g.strokeStyle = B; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(0.42, -0.44); g.quadraticCurveTo(0.66, -0.4, 0.9, -0.48); g.stroke();
      g.fillStyle = B; dotc(g, -0.16, -0.14, 0.05); dotc(g, 0.05, -0.2, 0.045); dotc(g, -0.32, 0.0, 0.04);
      eye(0.62, -0.58, 0.06);
      break;
    }
    case 'trike': {
      g.fillStyle = A;
      g.beginPath(); g.moveTo(-0.45, -0.06); g.quadraticCurveTo(-0.8, 0, -1.0, 0.16); g.quadraticCurveTo(-0.75, 0.22, -0.4, 0.22); g.closePath(); g.fill();
      g.fillStyle = B; ell(g, -0.36, 0.36, 0.11, 0.21, 0); ell(g, 0.18, 0.36, 0.11, 0.21, 0);
      g.fillStyle = A; ell(g, -0.06, 0.02, 0.55, 0.32, 0);
      ell(g, -0.22, 0.42, 0.12, 0.2, 0); ell(g, 0.3, 0.42, 0.12, 0.2, 0);
      g.fillStyle = B; ell(g, 0.48, -0.2, 0.26, 0.31, 0.4);
      g.fillStyle = A; ell(g, 0.68, 0.0, 0.25, 0.17, 0.15);
      g.fillStyle = HORN;
      tri([0.6, -0.12], [0.69, -0.15], [0.99, -0.4]); tri([0.5, -0.12], [0.58, -0.15], [0.82, -0.45]); tri([0.84, -0.04], [0.9, -0.05], [0.97, -0.2]);
      eye(0.7, -0.05, 0.055);
      break;
    }
    case 'stego': {
      g.fillStyle = B;
      for (let k = 0; k < 6; k++) {
        const x = -0.5 + k * 0.2, lift = Math.sin(Math.PI * (k + 0.5) / 6);
        const y = -0.12 - 0.15 * lift;
        tri([x - 0.1, y + 0.08], [x + 0.1, y + 0.08], [x, y - 0.14 - 0.12 * lift]);
      }
      tri([-0.86, 0.04], [-0.8, 0.04], [-0.96, -0.2]); tri([-0.74, 0.05], [-0.68, 0.05], [-0.78, -0.22]);
      g.fillStyle = A;
      g.beginPath(); g.moveTo(-0.45, -0.04); g.quadraticCurveTo(-0.8, 0.04, -1.0, 0.02); g.quadraticCurveTo(-0.78, 0.2, -0.42, 0.2); g.closePath(); g.fill();
      g.fillStyle = B; ell(g, -0.3, 0.38, 0.1, 0.2, 0); ell(g, 0.22, 0.38, 0.1, 0.2, 0);
      g.fillStyle = A; ell(g, -0.05, 0.06, 0.52, 0.3, 0);
      ell(g, -0.18, 0.44, 0.11, 0.19, 0); ell(g, 0.32, 0.44, 0.11, 0.19, 0);
      ell(g, 0.55, 0.1, 0.19, 0.1, 0.3); ell(g, 0.73, 0.19, 0.15, 0.09, 0.2);
      eye(0.77, 0.15, 0.045);
      break;
    }
    case 'longneck': {
      g.fillStyle = A;
      g.beginPath(); g.moveTo(-0.4, 0.15); g.quadraticCurveTo(-0.8, 0.25, -1.0, 0.55); g.quadraticCurveTo(-0.7, 0.38, -0.35, 0.36); g.closePath(); g.fill();
      g.fillStyle = B; ell(g, -0.3, 0.56, 0.09, 0.22, 0); ell(g, 0.14, 0.56, 0.09, 0.22, 0);
      g.fillStyle = A; ell(g, -0.08, 0.26, 0.45, 0.27, -0.1);
      ell(g, -0.15, 0.6, 0.1, 0.22, 0); ell(g, 0.28, 0.58, 0.1, 0.22, 0);
      g.beginPath(); g.moveTo(0.12, 0.12); g.quadraticCurveTo(0.45, -0.2, 0.54, -0.78); g.lineTo(0.72, -0.76); g.quadraticCurveTo(0.64, -0.12, 0.38, 0.28); g.closePath(); g.fill();
      ell(g, 0.7, -0.83, 0.18, 0.1, 0.15);
      g.fillStyle = B; dotc(g, -0.2, 0.14, 0.06); dotc(g, 0.02, 0.1, 0.05); dotc(g, -0.36, 0.26, 0.045);
      eye(0.74, -0.87, 0.045);
      break;
    }
    case 'ptero': {
      g.fillStyle = A;
      for (const sx of [-1, 1]) {
        g.beginPath(); g.moveTo(sx * 0.08, -0.16); g.lineTo(sx * 1.0, -0.12); g.quadraticCurveTo(sx * 0.62, 0.06, sx * 0.36, 0.32); g.lineTo(sx * 0.07, 0.14); g.closePath(); g.fill();
      }
      g.strokeStyle = B; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(-0.08, -0.14); g.lineTo(-0.94, -0.12); g.moveTo(0.08, -0.14); g.lineTo(0.94, -0.12); g.stroke();
      g.fillStyle = B; ell(g, 0, 0.02, 0.13, 0.32, 0);
      tri([-0.05, 0.3], [0.05, 0.3], [0, 0.5]);
      g.fillStyle = A; ell(g, 0, -0.38, 0.11, 0.13, 0);
      g.fillStyle = solid || '#ffcf3f'; tri([-0.05, -0.46], [0.05, -0.46], [0, -0.75]);
      g.fillStyle = B; tri([-0.04, -0.3], [0.04, -0.3], [0, -0.1]);
      eye(-0.055, -0.4, 0.035); eye(0.055, -0.4, 0.035);
      break;
    }
    case 'egg': {
      g.fillStyle = A; ell(g, 0, 0.05, 0.5, 0.66, 0);
      g.fillStyle = B;
      for (const [x, y, r] of [[-0.2, -0.3, 0.09], [0.18, -0.12, 0.11], [-0.12, 0.2, 0.08], [0.2, 0.36, 0.07], [-0.3, 0.0, 0.05], [0.05, -0.5, 0.05]]) dotc(g, x, y, r);
      break;
    }
    case 'bone': {
      g.strokeStyle = A; g.lineWidth = 0.24;
      g.beginPath(); g.moveTo(-0.55, 0.28); g.lineTo(0.55, -0.28); g.stroke();
      g.fillStyle = A;
      for (const [cx, cy] of [[-0.62, 0.32], [0.62, -0.32]]) { dotc(g, cx + 0.06, cy + 0.15, 0.17); dotc(g, cx - 0.1, cy - 0.12, 0.17); }
      g.strokeStyle = B; g.lineWidth = 0.035;
      g.beginPath(); g.moveTo(-0.35, 0.12); g.lineTo(0.35, -0.24); g.stroke();
      break;
    }
  }
}

const objSprites = {};
function paintObj(g, type, scale, rot) {
  g.save(); g.rotate(rot || 0); g.scale(scale, scale);
  const o = 0.045;
  for (const [dx, dy] of [[o, 0], [-o, 0], [0, o], [0, -o], [o, o], [-o, -o], [o, -o], [-o, o]]) {
    g.save(); g.translate(dx, dy); drawDino(g, type, DINOPAL[type], 'rgba(45,32,20,1)'); g.restore();
  }
  drawDino(g, type, DINOPAL[type]);
  // shiny plastic
  g.globalCompositeOperation = 'source-atop';
  const gr = g.createRadialGradient(-0.35, -0.45, 0.05, -0.2, -0.2, 1.3);
  gr.addColorStop(0, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = gr; g.fillRect(-1.3, -1.3, 2.6, 2.6);
  g.restore();
}
function buildObjSprites() {
  for (const t of DINOS.concat(EXTRAS)) {
    const sz = Math.ceil(OBJ_R * 2.4 * DPR), cnv = document.createElement('canvas');
    cnv.width = cnv.height = sz;
    const g = cnv.getContext('2d'); g.translate(sz / 2, sz / 2); paintObj(g, t, OBJ_R * DPR);
    objSprites[t] = cnv;
  }
}

let objs = [];
// toys start properly hidden: at least ~7px of sand over them
function coverOver(i, hh) {
  if (base[i] > 0.05) firm[i] = 0.7; // the sand over a buried toy is packed down
  const minC = base[i] > 0.05 ? bury().cover / CELL : 0.5; return hh > minC ? hh : minC;
}
function placeObjects() {
  if (settings.bury === 'off') { objs = []; rasterizeObjects(); return; }
  const pick = DINOS.slice().sort(() => Math.random() - 0.5).slice(0, 4);
  pick.push(EXTRAS[(Math.random() * EXTRAS.length) | 0]);
  objs = [];
  const m = OBJ_R + 6, minD = OBJ_R * 2.05;
  for (const type of pick) {
    for (let tries = 0; tries < 300; tries++) {
      const x = m + Math.random() * (cssW - 2 * m), y = m + Math.random() * (cssH - 2 * m);
      if (objs.some(o => Math.hypot(o.fx * cssW - x, o.fy * cssH - y) < minD)) continue;
      objs.push({ type, fx: x / cssW, fy: y / cssH, rot: (Math.random() - 0.5) * 1.2, found: false, cel: 0 });
      break;
    }
  }
  rasterizeObjects();
}
function rasterizeObjects() {
  base.fill(0); objId.fill(0);
  const objH = 14 / CELL;
  objs.forEach((o, k) => {
    const S = Math.ceil(OBJ_R * 2.4 / CELL) + 4;
    maskCanvas.width = S; maskCanvas.height = S;
    mctx.clearRect(0, 0, S, S);
    mctx.save(); mctx.translate(S / 2, S / 2); paintObj(mctx, o.type, OBJ_R / CELL, o.rot); mctx.restore();
    const d = mctx.getImageData(0, 0, S, S).data;
    const cov = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) cov[i] = d[i * 4 + 3] / 255;
    const soft = boxBlur(cov, S, 2);
    const ox = Math.round(o.fx * cssW / CELL - S / 2), oy = Math.round(o.fy * cssH / CELL - S / 2);
    for (let q = 0; q < S * S; q++) {
      const x = ox + (q % S), y = oy + ((q / S) | 0);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x, bh = objH * Math.sqrt(soft[q]);
      if (bh > base[i]) base[i] = bh;
      if (cov[q] > 0.5) objId[i] = k + 1;
    }
  });
}

// When enough sand is brushed off a toy: roar, sparkles, a little happy dance.
const sparkles = [];
let findTick = 0;
function checkFinds(now) {
  if (++findTick % 12 || !objs.length) return;
  const tot = new Int32Array(objs.length + 1), shown = new Int32Array(objs.length + 1);
  for (let i = 0; i < N; i++) { const k = objId[i]; if (k) { tot[k]++; if (h[i] < 1.4 && wat[i] < 1.2) shown[k]++; } }
  objs.forEach((o, k) => {
    const f = tot[k + 1] ? shown[k + 1] / tot[k + 1] : 0;
    if (!o.found && f > 0.4) {
      o.found = true; o.cel = now;
      sound.found(DINOS.includes(o.type));
      if (navigator.vibrate) try { navigator.vibrate([30, 60, 30]); } catch (e) {}
      const cx = o.fx * cssW, cy = o.fy * cssH;
      for (let s = 0; s < 22; s++) {
        const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3;
        sparkles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, t0: now, life: 700 + Math.random() * 600, r: 4 + Math.random() * 5,
                        col: ['#fff27a', '#ffffff', '#ffd23f', '#ff9de2'][s % 4] });
      }
    } else if (o.found && f < 0.1) o.found = false; // buried again - can be found again
  });
}
function star(x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}
function drawFinds(now) {
  for (const o of objs) {
    const t = (now - o.cel) / 1000;
    if (!o.cel || t > 1.6) continue;
    const spr = objSprites[o.type], hop = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t / 1.6);
    const sz = spr.width / DPR * (1 + 0.15 * hop), x = o.fx * cssW, y = o.fy * cssH - 18 * hop;
    ctx.save();
    ctx.globalAlpha = t < 1.3 ? 1 : (1.6 - t) / 0.3;
    ctx.translate(x, y); ctx.rotate(o.rot + Math.sin(t * 14) * 0.12 * (1 - t / 1.6));
    ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz);
    ctx.restore();
  }
  for (let n = sparkles.length - 1; n >= 0; n--) {
    const s = sparkles[n], t = now - s.t0;
    if (t > s.life) { sparkles.splice(n, 1); continue; }
    s.x += s.vx; s.y += s.vy; s.vy += 0.06;
    ctx.globalAlpha = 1 - t / s.life; ctx.fillStyle = s.col;
    star(s.x, s.y, s.r * (1 - 0.4 * t / s.life));
  }
  ctx.globalAlpha = 1;
}
