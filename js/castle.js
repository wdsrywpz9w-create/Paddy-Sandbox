'use strict';
// Sandcastles: the shape of a moulded bucket tower, and the big castle with moat, walls, keep, bridge and flags.
// Files share one global scope; they load in the order listed in index.html.

// cheap repeatable noise in [0, 1) for a hand-patted, slightly rough sand surface
function hash2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }

// Height (px) of a bucket-moulded tower at distance d from its centre and angle ang, or null outside it.
// Tapered sloping sides with the bucket's moulded ridges, a ring of chunky battlements, and a flat top.
function towerZ(d, ang, R, Ht, merlons, notch) {
  const taper = Math.max(3, R * 0.18), skirt = R + taper;
  if (d > skirt) return null;
  if (d > R) {
    const f = (d - R) / taper;
    return Ht * (1 - Math.pow(f, 0.65)) + 0.9 * Math.sin(f * Math.PI * 3) * (1 - f);
  }
  if (d >= 0.64 * R) {
    const fr = (((ang / (2 * Math.PI)) * merlons) % 1 + 1) % 1;
    return fr < 0.56 ? Ht : Ht - notch;
  }
  return Ht - 2.2;
}

// ---------- building: a plan of target heights that sand rises (or sinks) to ----------
// kinds: 1 packed castle sand, 2 loose crumbs, 3 moat (fed by a spring), 4 bridge / courtyard
const builds = [];
function planCells(cx, cy, reach, fn) {
  const ground = surfaceRef(cx, cy, reach * 0.9);
  const x0 = Math.max(0, Math.floor((cx - reach) / CELL)), x1 = Math.min(W - 1, Math.ceil((cx + reach) / CELL));
  const y0 = Math.max(0, Math.floor((cy - reach) / CELL)), y1 = Math.min(H - 1, Math.ceil((cy + reach) / CELL));
  const cells = [], to = [], kind = [], spr = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const r = fn(x * CELL - cx, y * CELL - cy, x, y);
    if (!r) continue;
    const i = y * W + x;
    let zt = r.z;
    if (r.kind === 1) zt += (hash2(x, y) - 0.5) * 0.7;               // patted-by-hand roughness
    const target = Math.max(0, ground + zt / CELL - base[i]);        // as sand height above the floor or toy
    cells.push(i); to.push(target); kind.push(r.kind); spr.push(r.water !== undefined ? ground + r.water / CELL : 0);
  }
  return { cells: Int32Array.from(cells), to: Float32Array.from(to), kind: Uint8Array.from(kind), spring: Float32Array.from(spr),
           from: Float32Array.from(cells, i => h[i]), box: [x0, y0, x1, y1] };
}
function startBuild(plan, ms) { plan.t0 = performance.now(); plan.ms = ms; builds.push(plan); if (!ms) stepBuilds(plan.t0); }
function stepBuilds(now) {
  for (let n = builds.length - 1; n >= 0; n--) {
    const b = builds[n], t = b.ms ? Math.min(1, (now - b.t0) / b.ms) : 1, e = t * t * (3 - 2 * t);
    for (let k = 0; k < b.cells.length; k++) {
      const i = b.cells[k], kd = b.kind[k], target = b.from[k] + (b.to[k] - b.from[k]) * e;
      const dz = target - h[i];
      if (dz > 0) mixInto(i, dz, 0.92 + hash2(i, 7) * 0.1, kr[i], kg[i], kb[i]); else h[i] = target;
      u[i] = 0; v[i] = 0; act[i] = 0;
      if (kd === 2) { firm[i] = 0; continue; }
      // packed damp castle sand holds near-vertical walls; digging, water, rain or a shake loosens it
      firm[i] = kd === 1 ? 3.2 : 2; if (wet[i] < 0.6) wet[i] = 0.6;
      if (kd === 3) { spring[i] = t >= 1 ? b.spring[k] : 0; if (t >= 1) springsOn = true; }
    }
    wakeCells(b.box[0], b.box[1], b.box[2], b.box[3]);
    wetActive = true;
    if (t >= 1) builds.splice(n, 1);
  }
}

// ---------- a single moulded tower (the castle mould tool) ----------
const CASTLE = { r: 30, h: 24, merlons: 6, notch: 6 };
function buildCastle(cx, cy) {
  const R = CASTLE.r, reach = R + R * 0.18 + 7;
  const plan = planCells(cx, cy, reach, (dx, dy, gx, gy) => {
    const d = Math.hypot(dx, dy), z = towerZ(d, Math.atan2(dy, dx), R, CASTLE.h, CASTLE.merlons, CASTLE.notch);
    if (z !== null) return { z, kind: 1 };
    const hsh = hash2(gx, gy);                                   // crumbs of loose sand around the base
    if (d < reach && hsh > 0.55) return { z: 0.4 + (hsh - 0.55) * 3 * (1 - (d - R * 1.18) / 7), kind: 2 };
    return null;
  });
  startBuild(plan, 0);
  rememberTower(plan); // if there are castle keepers, they look after this tower too
}

// ---------- the big castle ----------
// Rounded-square signed distance: < 0 inside, > 0 outside.
function sdBox(x, y, b, r) {
  const qx = Math.abs(x) - b + r, qy = Math.abs(y) - b + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
// A crenellated wall following a rounded square: parapet with merlons on the outside, a walkway inside.
function wallZ(x, y, b, r, half, Hw, period) {
  const sd = sdBox(x, y, b, r);
  if (sd > half + 3 || sd < -half) return null;
  if (sd > half) return (Hw - 1) * (1 - (sd - half) / 3);                 // sloping outer face
  if (sd > 0) {
    const along = Math.abs(x) > Math.abs(y) ? y : x, merlon = ((along / period) % 1 + 1) % 1 < 0.55;
    return merlon ? Hw + 4 : Hw;                                         // battlements
  }
  return Hw - 1;                                                         // walkway
}
let castleFlags = [];
function castleLayout(s) {
  // design units ~ px at s = 1; everything scales with s
  const towers = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    towers.push({ x: sx * 106, y: sy * 106, R: 17, H: 30, m: 7 });       // outer corner towers
    towers.push({ x: sx * 62, y: sy * 62, R: 13, H: 36, m: 6 });         // inner corner towers
  }
  towers.push({ x: -24, y: 106, R: 12, H: 27, m: 6 }, { x: 24, y: 106, R: 12, H: 27, m: 6 }); // gatehouse
  towers.push({ x: 17, y: -17, R: 8, H: 54, m: 5 });                      // the keep's turret
  return { towers: towers.map(t => ({ x: t.x * s, y: t.y * s, R: t.R * s, H: t.H * s, m: t.m })), s };
}
function buildBigCastle() {
  const s = Math.max(0.55, Math.min(1.3, Math.min(cssW - 12, cssH - 12) / 312));
  const cx = cssW / 2, cy = cssH / 2, L = castleLayout(s), reach = 156 * s;
  const plan = planCells(cx, cy, reach, (px, py, gx, gy) => {
    const x = px / s, y = py / s;                                         // design units
    // the bridge over the moat, with low parapets, and the path through the gates
    if (Math.abs(x) < 13 && y > 96 && y < 158) return { z: (Math.abs(x) > 10 ? 4 : 1.5) * s, kind: 4 };
    let z = null;
    const take = v => { if (v !== null && (z === null || v > z)) z = v; };
    const scaled = v => v === null ? null : v * s;
    if (!(y > 92 && Math.abs(x) < 15)) take(scaled(wallZ(x, y, 106, 10, 6, 15, 14)));   // outer curtain wall, gap for the gate
    if (!(y > 50 && Math.abs(x) < 11)) take(scaled(wallZ(x, y, 62, 6, 5, 22, 12)));     // inner wall, with its own gate
    // the keep: a square tower with its own battlements
    const sk = sdBox(x, y, 26, 5);
    if (sk < 4) {
      if (sk > 0) take(38 * (1 - sk / 4) * s);
      else if (sk > -5) { const along = Math.abs(x) > Math.abs(y) ? y : x; take((((along / 10) % 1 + 1) % 1 < 0.55 ? 44 : 39) * s); }
      else take(37.5 * s);
    }
    for (const t of L.towers) {
      const d = Math.hypot(px - t.x, py - t.y);
      if (d < t.R * 1.25) take(towerZ(d, Math.atan2(py - t.y, px - t.x), t.R, t.H, t.m, 6 * s));
    }
    if (z !== null) return { z, kind: 1 };
    if (sdBox(x, y, 112, 14) < 0) return { z: 1 * s, kind: 4 };            // the courtyard, smoothed flat
    const sm = sdBox(x, y, 128, 28);
    if (sm > 0 && sm < 24) {                                              // the moat, with sloping banks
      const dep = Math.min(1, Math.min(sm, 24 - sm) / 5);
      return { z: -11 * s * dep, kind: 3, water: -3 * s };
    }
    if (sm >= 24 && sm < 28 && hash2(gx, gy) > 0.5) return { z: 1.2 * s, kind: 2 }; // spoil from digging the moat
    return null;
  });
  startBuild(plan, 1600);
  // toothpick flags on the towers
  const cols = ['#e53935', '#ffd23f', '#3f8cf0', '#4cc95a', '#ff6fb5'];
  castleFlags = L.towers.map((t, k) => ({ x: cx + t.x, y: cy + t.y, top: t.H, col: cols[k % cols.length], born: performance.now() + 1500, fell: 0 }));
  // the keepers remember the finished castle (and where each flag's tower top should be)
  const want = new Map(); for (let k = 0; k < plan.cells.length; k++) want.set(plan.cells[k], plan.to[k]);
  const specs = castleFlags.map(f => { const i = ((f.y / CELL) | 0) * W + ((f.x / CELL) | 0); return { x: f.x, y: f.y, col: f.col, top: ((want.get(i) || 0) + base[i]) * CELL }; });
  rememberCastle(plan, specs, cx, cy, s);
  sound.build();
}

// Flags fall over if their tower is knocked down.
let flagTick = 0;
function checkFlags(now) {
  if (!castleFlags.length || ++flagTick % 10) return;
  for (const f of castleFlags) {
    if (f.fell || now < f.born) continue;
    const i = ((f.y / CELL) | 0) * W + ((f.x / CELL) | 0);
    if (!f.ground) f.ground = (h[i] + base[i]) * CELL;
    if ((h[i] + base[i]) * CELL < f.ground - 6) f.fell = now;
  }
  castleFlags = castleFlags.filter(f => !f.fell || now - f.fell < 700);
}
function drawFlags(now) {
  for (const f of castleFlags) {
    if (now < f.born) continue;
    const grow = Math.min(1, (now - f.born) / 300), fall = f.fell ? Math.min(1, (now - f.fell) / 600) : 0;
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(fall * 1.4); ctx.globalAlpha = 1 - fall * 0.8;
    const len = 20 * grow, tipX = -3, tipY = -len;
    ctx.strokeStyle = 'rgba(60,35,10,0.3)'; ctx.lineWidth = 2;                  // the stick's shadow
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.5, len * 0.6); ctx.stroke();
    ctx.strokeStyle = '#d7b98c'; ctx.lineWidth = 1.8;                           // the toothpick
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tipX, tipY); ctx.stroke();
    const wv = Math.sin(now / 180 + f.x) * 2.5;                                  // the pennant, flapping
    ctx.fillStyle = f.col; ctx.beginPath();
    ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo(tipX + 7, tipY + 1 + wv * 0.5, tipX + 13, tipY + 3 + wv);
    ctx.lineTo(tipX + 0.5, tipY + 7); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
