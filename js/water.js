'use strict';
// Water table, shallow water flow, erosion and soaking in.
// Files share one global scope; they load in the order listed in index.html.

// ---------- water table: water seeps up into anything dug below it ----------
// Its surface stays level with real gravity, so tilting sloshes moats to the low side.
const TIDE = { low: 7, high: 3 }; // px below the level of a freshly smoothed tray
function waterTable(tx, ty) {
  const below = TIDE[settings.tide]; if (!below) return;
  // the sand's tilt is exaggerated for little hands; the water table tips more gently and at most ~8px
  const L0 = (bury().bed - below) / CELL, twx = tx / P.tiltGain * 0.06, twy = ty / P.tiltGain * 0.06, cx = W / 2, cy = H / 2;
  const cap = 4 / CELL;
  const w_ = wat, h_ = h, b_ = base;
  let tot = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0, i = y * W; x < W; x++, i++) {
      let off = twx * (x - cx) + twy * (y - cy); off = off > cap ? cap : off < -cap ? -cap : off;
      const depth = L0 + off - h_[i] - b_[i]; // how far this spot is under the water table
      let wv = w_[i];
      if (depth > 0) {
        if (wv < depth) { const add = depth - wv; wv += add < 0.06 ? add : 0.06; }        // seeps in
        else if (wv > depth + 0.02) { const d = wv - depth; wv -= d < 0.015 ? d : 0.015; } // drains back
        wet[i] = 1;
      }
      w_[i] = wv; tot += wv;
    }
  }
  waterTotal = tot; if (tot > 0) wetActive = true;
}

// ---------- water: shallow flow over the sand, erosion, soaking in ----------
function waterStep(tx, ty) {
  if (waterTotal <= 0.001) { waterTotal = 0; return; }
  const w_ = wat, d_ = dw, s_ = dsand, h_ = h, b_ = base, n = N, w = W, hgt = H;
  d_.fill(0); s_.fill(0);
  // water feels the phone's real tilt (the sand's is exaggerated for little hands)
  const KW = 0.2, KE = 0.07, twx = tx / P.tiltGain * 0.5, twy = ty / P.tiltGain * 0.5;
  const pair = (i, j, dd) => {
    if (dd > 0) {
      let q = dd * KW; const cap = w_[i] * 0.24; if (q > cap) q = cap; if (q < 1e-5) return;
      d_[i] -= q; d_[j] += q;
      let e = q * KE * (dd < 1.5 ? dd : 1.5); const ca = h_[i] * 0.04; if (e > ca) e = ca;
      if (e > 1e-5) { s_[i] -= e; s_[j] += e; }
    } else if (dd < 0) {
      let q = -dd * KW; const cap = w_[j] * 0.24; if (q > cap) q = cap; if (q < 1e-5) return;
      d_[j] -= q; d_[i] += q;
      let e = q * KE * (-dd < 1.5 ? -dd : 1.5); const ca = h_[j] * 0.04; if (e > ca) e = ca;
      if (e > 1e-5) { s_[j] -= e; s_[i] += e; }
    }
  };
  for (let y = 0; y < hgt; y++) {
    const row = y * w, notLast = y < hgt - 1;
    for (let x = 0; x < w; x++) {
      const i = row + x, wi = w_[i];
      const Hi = h_[i] + b_[i] + wi;
      if (x < w - 1) { const j = i + 1; if (wi > 0 || w_[j] > 0) pair(i, j, Hi - (h_[j] + b_[j] + w_[j]) + twx); }
      if (notLast) { const j = i + w; if (wi > 0 || w_[j] > 0) pair(i, j, Hi - (h_[j] + b_[j] + w_[j]) + twy); }
    }
  }
  let tot = 0;
  for (let i = 0; i < n; i++) {
    let wv = w_[i] + d_[i];
    if (wv > 0) { const soak = wv < 0.0006 ? wv : 0.0006; wv -= soak; wet[i] = 1; } // soaks into the sand
    w_[i] = wv > 0 ? wv : 0; tot += w_[i];
    const sd = s_[i];
    if (sd !== 0) { h_[i] += sd; if (h_[i] < 0) h_[i] = 0; firm[i] *= 0.9; act[i] = 1; }
  }
  waterTotal = tot;
  if (tot > 0) wetActive = true;
}
