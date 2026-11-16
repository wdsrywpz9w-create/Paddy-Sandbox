'use strict';
// Grid, settings and the granular sand physics (avalanching + momentum flow).
// Files share one global scope; they load in the order listed in index.html.

/* =====================================================================
   Paddy's Sandbox — a height-field granular sand simulation.
   Each cell holds a column of sand (height, in cell-widths), a grain tint
   that travels with the sand, a compaction ("firm") value, and wetness.
   Sand flows to neighbours whenever the local slope — measured against the
   phone's real gravity vector — exceeds the angle of repose.
   ===================================================================== */

const tray = document.getElementById('tray');
const cv = document.getElementById('sand');
const ctx = cv.getContext('2d');
const small = document.createElement('canvas');
const sctx = small.getContext('2d');

// ---------- grown-up settings (remembered on this device) ----------
const settings = { motion: 'on', sens: 'low', bury: 'medium', sound: 'on', tide: 'off', bg: 'rocky', sun: 'medium' };
try { Object.assign(settings, JSON.parse(localStorage.getItem('sandbox-settings') || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem('sandbox-settings', JSON.stringify(settings)); } catch (e) {} }
// sand bed thickness and the sand left over each toy, in screen px
const BURY = {
  off: { bed: 15, cover: 0 },
  shallow: { bed: 13, cover: 2 }, medium: { bed: 15, cover: 5 }, deep: { bed: 22, cover: 10 },
  hidden: { bed: 26, cover: 8 }, // toys are 14px tall: 26px of sand leaves the surface dead flat over them
};
// how strongly tilt drives the sand, and how hard a shake must be
// sand starts to slide when gain x tan(tilt) beats the angle of repose (0.72): ~50 / 42 / 34 degrees
const SENS = { low: { gain: 0.6, shake: 22 }, medium: { gain: 0.85, shake: 18 }, high: { gain: 1.1, shake: 15 } };
const sens = () => SENS[settings.sens] || SENS.low;
// sun height: shading direction, shadow length (smaller drop = longer shadows), and the sheen's half-vector
const SUN = {};
for (const [k, L, drop] of [['low', [-0.56, -0.72, 0.41], 0.32], ['medium', [-0.42, -0.56, 0.71], 0.6], ['high', [-0.24, -0.32, 0.92], 1.4]]) {
  const l = Math.hypot(...L), n = L.map(v => v / l), hv = [n[0], n[1], n[2] + 1], hl = Math.hypot(...hv);
  SUN[k] = { L: n, drop, H: hv.map(v => v / hl) };
}
const bury = () => BURY[settings.bury] || BURY.medium;

// ---------- tunables ----------
const P = {
  T: 0.72,        // static angle of repose (slope ~36°)
  Td: 0.52,       // dynamic (already-moving) repose — avalanches run on
  COH: 4.0,       // extra slope pressed/compacted sand can hold
  WETC: 1.4,      // extra slope wet sand can hold
  k: 0.1,         // flow rate
  tiltGain: 0.6, // set from the tilt-sensitivity setting
  iters: 3,       // physics passes per frame
  G: 0.13,        // gravity pull on moving sand (cells / pass²)
  mobile: 1.8,    // thickness of the surface layer that can flow
  vmax: 1.0,      // top flow speed (cells / pass)
  maxH: 90,
};

let W = 0, H = 0, N = 0, CELL = 2, cssW = 0, cssH = 0, DPR = 1;
let h, c, dh, cin, outm, act, firm, wet, thr, img, img32;
let u, v, pu, pv, qin, sh; // flow velocity, incoming momentum, shadow height
let base, objId, sf, wat, dw, dsand; // buried-toy floor height, toy id per cell, surface, water
let waterTotal = 0;
let spring, springsOn = false;
let kr, kg, kb, kir, kig, kib, dyeUsed = false;
let windX, windY, windOn = false; // the fan's wind, as an extra downhill push on loose sand // grain colour (dye) multipliers per cell, and their inflow accumulators
let FINGER_R = 16, STAMP_R = 60, OBJ_R = 56;
let wetActive = false;

// ---------- grid setup ----------
function makeArrays(n) {
  return {
    h: new Float32Array(n), c: new Float32Array(n), firm: new Float32Array(n), wet: new Float32Array(n),
    kr: new Float32Array(n).fill(1), kg: new Float32Array(n).fill(1), kb: new Float32Array(n).fill(1),
  };
}

function freshSand() {
  const p1 = Math.random() * 6, p2 = Math.random() * 6, p3 = Math.random() * 6;
  const base = bury().bed / CELL;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, X = x * CELL, Y = y * CELL;
    const dune = Math.sin(X * 0.018 + p1) * Math.sin(Y * 0.014 + p2) * 1.0
               + Math.sin((X + Y) * 0.031 + p3) * 0.45
               + Math.sin(X * 0.06 - Y * 0.045 + p1) * 0.2;
    h[i] = base + dune * (4 / CELL);
    c[i] = grainTint(); kr[i] = kg[i] = kb[i] = 1;
    firm[i] = 0; wet[i] = 0;
  }
}

function grainTint() {
  const r = Math.random();
  if (r < 0.04) return 0.72 + Math.random() * 0.08;   // dark grain
  if (r < 0.08) return 1.15 + Math.random() * 0.1;    // pale / sparkly grain
  return 0.9 + Math.random() * 0.17;
}

function resize() {
  const r = tray.getBoundingClientRect();
  const nw = Math.round(r.width), nh = Math.round(r.height);
  if (nw < 10 || nh < 10) return;
  if (nw === cssW && nh === cssH) return;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(nw * DPR); cv.height = Math.round(nh * DPR);
  const newCell = Math.max(2, Math.round(Math.sqrt(nw * nh / 80000)));
  const nW = Math.ceil(nw / newCell), nH = Math.ceil(nh / newCell);
  const fresh = makeArrays(nW * nH);
  if (h) { // resample existing sand so a rotation / toolbar change keeps the picture
    const scale = CELL / newCell;
    for (let y = 0; y < nH; y++) for (let x = 0; x < nW; x++) {
      const ox = Math.min(W - 1, Math.floor(x * W / nW)), oy = Math.min(H - 1, Math.floor(y * H / nH));
      const o = oy * W + ox, i = y * nW + x;
      fresh.h[i] = h[o] * scale; fresh.c[i] = c[o]; fresh.firm[i] = firm[o]; fresh.wet[i] = wet[o];
      fresh.kr[i] = kr[o]; fresh.kg[i] = kg[o]; fresh.kb[i] = kb[o];
    }
  }
  const hadSand = !!h;
  W = nW; H = nH; N = W * H; CELL = newCell; cssW = nw; cssH = nh;
  h = fresh.h; c = fresh.c; firm = fresh.firm; wet = fresh.wet; kr = fresh.kr; kg = fresh.kg; kb = fresh.kb;
  kir = new Float32Array(N); kig = new Float32Array(N); kib = new Float32Array(N);
  windX = new Float32Array(N); windY = new Float32Array(N); windOn = false;
  dh = new Float32Array(N); cin = new Float32Array(N); outm = new Float32Array(N);
  thr = new Float32Array(N); act = new Uint8Array(N);
  u = new Float32Array(N); v = new Float32Array(N); pu = new Float32Array(N); pv = new Float32Array(N);
  qin = new Float32Array(N); sh = new Float32Array(N);
  base = new Float32Array(N); objId = new Uint8Array(N); sf = new Float32Array(N);
  wat = new Float32Array(N); dw = new Float32Array(N); dsand = new Float32Array(N); waterTotal = 0;
  spring = new Float32Array(N); springsOn = false; // castle moats are fed by springs: the water level they refill to
  small.width = W; small.height = H;
  img = sctx.createImageData(W, H);
  img32 = new Uint32Array(img.data.buffer);
  FINGER_R = Math.max(13, Math.min(22, nw * 0.045));
  STAMP_R = Math.max(42, Math.min(92, Math.min(nw, nh) * 0.17));
  if (!hadSand) freshSand();
  OBJ_R = STAMP_R * 0.95;
  buildStampSprites();
  buildObjSprites();
  if (!hadSand) { placeObjects(); for (let i = 0; i < N; i++) h[i] = coverOver(i, h[i] - base[i]); }
  else rasterizeObjects();
  allocTiles();
  makeGrain();
}

// ---------- sleeping tiles: only work where something is happening ----------
// The tray is split into 16x16-cell tiles. A tile is processed while it (or a neighbour) is
// awake; it wakes when sand in it moves or anything disturbs it, and dozes off once calm.
const TS = 16, TSH = 4;
let TW = 0, TH = 0, tileAwake = new Uint8Array(0), tileProc = new Uint8Array(0), tileList = new Int32Array(0);
function allocTiles() {
  TW = Math.ceil(W / TS); TH = Math.ceil(H / TS);
  tileAwake = new Uint8Array(TW * TH).fill(30); tileProc = new Uint8Array(TW * TH); tileList = new Int32Array(TW * TH);
}
function wakeAll() { tileAwake.fill(30); }
// wake the tiles covering a rectangle given in grid cells
function wakeCells(x0, y0, x1, y1) {
  const a = Math.max(0, (x0 | 0) >> TSH), b = Math.min(TW - 1, (x1 | 0) >> TSH);
  const c0 = Math.max(0, (y0 | 0) >> TSH), d = Math.min(TH - 1, (y1 | 0) >> TSH);
  for (let ty = c0; ty <= d; ty++) for (let tx = a; tx <= b; tx++) tileAwake[ty * TW + tx] = 30;
}
function wakeCss(x, y, r) { wakeCells((x - r) / CELL, (y - r) / CELL, (x + r) / CELL, (y + r) / CELL); }
// called once per frame: tiles count down to sleep; every half second everything gets one look
let tileTick = 0;
function tickTiles() {
  for (let t = 0; t < tileAwake.length; t++) if (tileAwake[t]) tileAwake[t]--;
  if (++tileTick % 30 === 0) for (let t = 0; t < tileAwake.length; t++) if (!tileAwake[t]) tileAwake[t] = 1;
}

// ---------- the physics: granular relaxation ----------
let flowThisFrame = 0;

let rseed = 12345;
function frand() { rseed = (rseed * 1664525 + 1013904223) | 0; return (rseed >>> 8) / 16777216; }

function relax(tx, ty, agit) {
  // which tiles to work on: awake ones and their neighbours (sand can flow in from next door)
  tileProc.fill(0);
  let nt = 0;
  for (let t = 0; t < tileAwake.length; t++) {
    if (!tileAwake[t]) continue;
    const tx0 = t % TW, ty0 = (t / TW) | 0;
    for (let yy = Math.max(0, ty0 - 1); yy <= Math.min(TH - 1, ty0 + 1); yy++)
      for (let xx = Math.max(0, tx0 - 1); xx <= Math.min(TW - 1, tx0 + 1); xx++) {
        const q = yy * TW + xx; if (!tileProc[q]) { tileProc[q] = 1; tileList[nt++] = q; }
      }
  }
  if (!nt) return;
  // local references keep the hot loops fast
  const h_ = h, dh_ = dh, outm_ = outm, cin_ = cin, c_ = c, thr_ = thr, act_ = act, firm_ = firm, wet_ = wet;
  const n = N, w = W, hgt = H;
  const soft = 1 - 0.75 * agit;
  const T = P.T * soft, Td = P.Td * soft, COH = P.COH * soft, WC = P.WETC;
  const sf_ = sf, b_ = base, wt_ = wat;
  for (let i = 0; i < n; i++) {
    sf_[i] = h_[i] + b_[i];
    const wa = wt_[i]; // sand under standing water is saturated and slumps
    thr_[i] = (act_[i] ? Td : T) + firm_[i] * COH + wet_[i] * WC - (wa > 0.3 ? 0.3 : wa);
  }
  dh_.fill(0); cin_.fill(0); outm_.fill(0);
  const kr_ = kr, kg_ = kg, kb_ = kb, ir_ = kir, ig_ = kig, ib_ = kib;
  const col = dyeUsed; // colour bookkeeping only once some sand has been dyed
  if (col) { ir_.fill(0); ig_.fill(0); ib_.fill(0); }
  const k = P.k, kd = P.k * 0.7, S2 = Math.SQRT2, dse = tx + ty, dsw = ty - tx;
  let flow = 0;
  const mv = (i, j, d, ti, tj, kk) => {
    let q;
    if (d > ti) {
      q = (d - ti) * kk; const cap = h_[i] * 0.05; if (q > cap) q = cap;
      if (q < 1e-4) return;
      dh_[i] -= q; dh_[j] += q; outm_[i] += q; cin_[j] += c_[i] * q; flow += q;
      if (col) { ir_[j] += kr_[i] * q; ig_[j] += kg_[i] * q; ib_[j] += kb_[i] * q; }
    } else if (d < -tj) {
      q = (-d - tj) * kk; const cap = h_[j] * 0.05; if (q > cap) q = cap;
      if (q < 1e-4) return;
      dh_[j] -= q; dh_[i] += q; outm_[j] += q; cin_[i] += c_[j] * q; flow += q;
      if (col) { ir_[i] += kr_[j] * q; ig_[i] += kg_[j] * q; ib_[i] += kb_[j] * q; }
    }
  };
  const Wm = w - 1;
  for (let tq = 0; tq < nt; tq++) {
  const tt = tileList[tq], tx0 = (tt % TW) * TS, ty0 = ((tt / TW) | 0) * TS;
  const xe = Math.min(w, tx0 + TS), ye = Math.min(hgt, ty0 + TS);
  for (let y = ty0; y < ye; y++) {
    const row = y * w, notLast = y < hgt - 1;
    for (let x = tx0; x < xe; x++) {
      const i = row + x, hi = sf_[i], ti = thr_[i];
      if (x < Wm) mv(i, i + 1, hi - sf_[i + 1] + tx, ti, thr_[i + 1], k);
      if (notLast) {
        const j = i + w;
        mv(i, j, hi - sf_[j] + ty, ti, thr_[j], k);
        if (x < Wm) mv(i, j + 1, hi - sf_[j + 1] + dse, ti * S2, thr_[j + 1] * S2, kd);
        if (x > 0) mv(i, j - 1, hi - sf_[j - 1] + dsw, ti * S2, thr_[j - 1] * S2, kd);
      }
    }
  }
  }
  // Granular flow with momentum: each column's surface layer has a velocity.
  // Gravity along the slope (terrain + phone tilt) accelerates it; Coulomb
  // friction (the angle of repose) brakes it. Sand speeds up, surges, piles
  // against walls and stops - like a real avalanche.
  const u_ = u, v_ = v, pu_ = pu, pv_ = pv, qin_ = qin, G = P.G, L = P.mobile, VM = P.vmax, wOn = windOn, wX = windX, wY = windY;
  pu_.fill(0); pv_.fill(0); qin_.fill(0);
  for (let tq = 0; tq < nt; tq++) {
  const tt = tileList[tq], tx0 = (tt % TW) * TS, ty0 = ((tt / TW) | 0) * TS;
  const xe = Math.min(w, tx0 + TS), ye = Math.min(hgt, ty0 + TS);
  for (let y = ty0; y < ye; y++) {
    const row = y * w, up = y > 0 ? -w : 0, dn = y < hgt - 1 ? w : 0, gyk = (up && dn) ? 0.5 : 1;
    for (let x = tx0; x < xe; x++) {
      const i = row + x, hi = h_[i];
      let ui = u_[i], vi = v_[i];
      if (hi < 0.03) { u_[i] = v_[i] = 0; continue; }
      const lf = x > 0 ? -1 : 0, rt = x < Wm ? 1 : 0, gxk = (lf && rt) ? 0.5 : 1;
      let sx = tx - (sf_[i + rt] - sf_[i + lf]) * gxk, sy = ty - (sf_[i + dn] - sf_[i + up]) * gyk;
      if (wOn) { sx += wX[i]; sy += wY[i]; }
      const mu = thr_[i];
      const sp = Math.sqrt(ui * ui + vi * vi);
      if (sp > 1e-3) {
        const nu = ui + G * (sx - mu * ui / sp), nv = vi + G * (sy - mu * vi / sp);
        if (nu * ui + nv * vi <= 0) { ui = 0; vi = 0; } else { ui = nu * 0.99; vi = nv * 0.99; }
      } else {
        const sm = Math.sqrt(sx * sx + sy * sy);
        if (sm > mu * 1.04) { ui = G * (sx - mu * sx / sm); vi = G * (sy - mu * sy / sm); } else { ui = 0; vi = 0; }
      }
      if ((x === 0 && ui < 0) || (x === Wm && ui > 0)) ui = 0;
      if ((y === 0 && vi < 0) || (y === hgt - 1 && vi > 0)) vi = 0;
      const sa = (ui < 0 ? -ui : ui) + (vi < 0 ? -vi : vi);
      if (sa > VM) { ui *= VM / sa; vi *= VM / sa; }
      u_[i] = ui; v_[i] = vi;
      if (sa < 1e-4) continue;
      act_[i] = 1;
      const M = hi * 0.6 < L ? hi * 0.6 : L;
      const qx = M * (ui < 0 ? -ui : ui), qy = M * (vi < 0 ? -vi : vi);
      if (qx > 1e-5) { const j = ui > 0 ? i + 1 : i - 1; dh_[j] += qx; cin_[j] += c_[i] * qx; if (col) { ir_[j] += kr_[i] * qx; ig_[j] += kg_[i] * qx; ib_[j] += kb_[i] * qx; } pu_[j] += qx * ui; pv_[j] += qx * vi; qin_[j] += qx; }
      if (qy > 1e-5) { const j = vi > 0 ? i + w : i - w; dh_[j] += qy; cin_[j] += c_[i] * qy; if (col) { ir_[j] += kr_[i] * qy; ig_[j] += kg_[i] * qy; ib_[j] += kb_[i] * qy; } pu_[j] += qy * ui; pv_[j] += qy * vi; qin_[j] += qy; }
      dh_[i] -= qx + qy; outm_[i] += qx + qy; flow += qx + qy;
    }
  }
  }
  const tA = tileAwake;
  for (let y = 0, i = 0; y < hgt; y++) {
  const trow = (y >> TSH) * TW;
  for (let x = 0; x < w; x++, i++) {
    const o = outm_[i], d = dh_[i];
    if (o === 0 && d === 0) { act_[i] = 0; continue; }
    if (o > 0.002 || d > 0.002 || d < -0.002) tA[trow + (x >> TSH)] = 30; // still moving: stay awake
    const h0 = h_[i], nh = h0 + d, inflow = d + o;
    if (nh > 1e-5) {
      const keep = h0 - o, inv = 1 / nh;
      c_[i] = (c_[i] * keep + cin_[i]) * inv;
      if (col) { kr_[i] = (kr_[i] * keep + ir_[i]) * inv; kg_[i] = (kg_[i] * keep + ig_[i]) * inv; kb_[i] = (kb_[i] * keep + ib_[i]) * inv; }
    }
    h_[i] = nh < 0 ? 0 : nh;
    act_[i] = (o > 0.004 || u_[i] !== 0 || v_[i] !== 0) ? 1 : 0;
    const qi = qin_[i];
    if (qi > 0) { // arriving sand brings its momentum
      let keep = (h0 * 0.6 < L ? h0 * 0.6 : L) - o; if (keep < 0.05) keep = 0.05;
      u_[i] = (u_[i] * keep + pu_[i]) / (keep + qi); v_[i] = (v_[i] * keep + pv_[i]) / (keep + qi);
    }
    if (inflow > 0.02) { const f = inflow * 0.5; c_[i] += ((0.88 + frand() * 0.2) - c_[i]) * (f < 0.35 ? f : 0.35); } // tumbling grains
    if (inflow > 0.003 && firm_[i] > 0) { const f = 1 - inflow * 0.35; firm_[i] *= f > 0 ? f : 0; }
  }
  }
  flowThisFrame += flow;
}

// a touch of viscosity in the flowing layer keeps neighbouring grains moving together
function smoothVel() {
  const u_ = u, v_ = v, tu = pu, tv = pv, w = W, hgt = H;
  tu.set(u_); tv.set(v_);
  for (let y = 1; y < hgt - 1; y++) {
    for (let x = 1, i = y * w + 1; x < w - 1; x++, i++) {
      if (tu[i] === 0 && tv[i] === 0) continue;
      u_[i] = tu[i] * 0.4 + (tu[i - 1] + tu[i + 1] + tu[i - w] + tu[i + w]) * 0.15;
      v_[i] = tv[i] * 0.4 + (tv[i - 1] + tv[i + 1] + tv[i - w] + tv[i + w]) * 0.15;
    }
  }
}
