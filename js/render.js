'use strict';
// Drawing the sand, water, toys and effects.
// Files share one global scope; they load in the order listed in index.html.

// ---------- rendering ----------
let grainPat = null;
function makeGrain() {
  const s = 160, g = document.createElement('canvas'); g.width = g.height = s;
  const gc = g.getContext('2d'), id = gc.createImageData(s, s), d = id.data;
  for (let i = 0; i < s * s; i++) {
    let v = 128 + (Math.random() - 0.5) * 70;
    const r = Math.random();
    if (r < 0.015) v = 250; else if (r < 0.04) v = 40;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
  }
  gc.putImageData(id, 0, 0);
  grainPat = ctx.createPattern(g, 'repeat');
  try { grainPat.setTransform(new DOMMatrix().scale(1 / DPR)); } catch (e) {}
}

function render(now) {
  // the sun comes from the top-left; its height (a setting) sets the shading and how long shadows are
  const sun = SUN[settings.sun] || SUN.medium, Lx = sun.L[0], Ly = sun.L[1], Lz = sun.L[2], DROP = sun.drop;
  const Hx = sun.H[0], Hy = sun.H[1], Hz = sun.H[2]; // half-way vector between sun and eye, for the wet sheen
  const sandR = 228, sandG = 197, sandB = 148, flR = 64, flG = 158, flB = 214;
  for (let y = 0; y < H; y++) {
    const up = y > 0 ? -W : 0, dn = y < H - 1 ? W : 0;
    for (let x = 0; x < W; x++) {
      const i = y * W + x, lf = x > 0 ? -1 : 0, rt = x < W - 1 ? 1 : 0;
      const hcur = h[i] + base[i], caster = (x > 0 && y > 0) ? sh[i - W - 1] - DROP : hcur;
      sh[i] = caster > hcur ? caster : hcur;
      let shade = (caster - hcur) * 0.45; shade = shade < 0 ? 0 : shade > 1 ? 1 : shade;
      const il = i + lf, ir = i + rt, iu = i + up, id = i + dn;
      const gx = (h[ir] + base[ir] - h[il] - base[il]) * 0.36, gy = (h[id] + base[id] - h[iu] - base[iu]) * 0.36;
      let s = (-gx * Lx - gy * Ly + Lz) / Math.sqrt(gx * gx + gy * gy + 1);
      if (s < 0) s = 0;
      const hh = h[i], w = wet[i];
      let lum = (0.3 + 0.92 * s) * (1 - 0.3 * shade) * c[i] * (1 - 0.22 * w);
      if (hh < 5) lum *= 0.84 + 0.032 * hh; // deeper sand is damper and darker
      let r = sandR * lum * kr[i], g = sandG * lum * kg[i] * (1 - 0.03 * w), b = sandB * lum * kb[i] * (1 + 0.06 * w);
      if (w > 0.4 && wat[i] <= 0.015) { // damp sand has a soft glossy sheen where it faces the sun
        let nh = (-gx * Hx - gy * Hy + Hz) / Math.sqrt(gx * gx + gy * gy + 1);
        if (nh > 0.9) { nh *= nh; nh *= nh; nh *= nh; nh *= nh; nh *= nh; const sp = nh * (w - 0.4) * 110; r += sp; g += sp; b += sp * 0.95; }
      }
      let alpha = 255;
      if (objId[i]) { // a buried toy shows through thin sand
        const t = (hh - 0.3) / 1.9; alpha = t <= 0 ? 0 : t >= 1 ? 255 : 255 * t * t;
      } else if (hh < 1.2) { // the blue tray floor peeks through
        const t = hh / 1.2, fl = 0.75 + 0.3 * s;
        r = flR * fl + (r - flR * fl) * t; g = flG * fl + (g - flG * fl) * t; b = flB * fl + (b - flB * fl) * t;
      }
      const wa = wat[i];
      if (wa > 0.015) { // water: tinted by depth, lit by its own rippling surface
        const wl = hcur + wa, wgx = (h[ir] + base[ir] + wat[ir] - h[il] - base[il] - wat[il]) * 0.5, wgy = (h[id] + base[id] + wat[id] - h[iu] - base[iu] - wat[iu]) * 0.5;
        let sw = (-wgx * Lx - wgy * Ly + Lz) / Math.sqrt(wgx * wgx + wgy * wgy + 1);
        if (wa > 0.25) sw += 0.05 * Math.sin(x * 0.8 + now * 0.006) * Math.sin(y * 0.7 - now * 0.005);
        const t = wa > 1.2 ? 0.82 : 0.36 + wa * 0.38, ws = 0.6 + 0.5 * sw;
        r = r * (1 - t) + 62 * ws * t; g = g * (1 - t) + 158 * ws * t; b = b * (1 - t) + 214 * ws * t;
        if (sw > 0.9) { const sp = (sw - 0.9) * 1400 * (t + 0.2); r += sp; g += sp; b += sp; }
        if (wa < 0.14) { // a frothy, bubbly line where the water's edge meets the sand
          let foam = (1 - wa / 0.14) * (c[i] - 0.84) * 3.2; if (foam > 0) { if (foam > 0.8) foam = 0.8; r += (250 - r) * foam; g += (252 - g) * foam; b += (255 - b) * foam; }
        }
        const wa255 = t * 255 + 60; if (wa255 > alpha) alpha = wa255 > 255 ? 255 : wa255;
        void wl;
      }
      if (r < 0) r = 0; if (g < 0) g = 0; if (b < 0) b = 0;
      img32[i] = ((alpha | 0) << 24) | ((b > 255 ? 255 : b) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r);
    }
  }
  sctx.putImageData(img, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, cssW, cssH);
  for (const o of objs) { // the toys sit under the sand
    const spr = objSprites[o.type], sz = spr.width / DPR;
    ctx.save(); ctx.translate(o.fx * cssW, o.fy * cssH); ctx.rotate(o.rot); ctx.drawImage(spr, -sz / 2, -sz / 2, sz, sz); ctx.restore();
  }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, W * CELL, H * CELL);
  if (grainPat) {
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.32;
    ctx.fillStyle = grainPat; ctx.fillRect(0, 0, cssW, cssH);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // airborne grains + their shadows
  if (parts.length) {
    ctx.fillStyle = 'rgba(70,45,10,0.14)';
    for (const p of parts) { const j = (p.y | 0) * W + (p.x | 0), z = p.z - h[j] - base[j]; if (z > 0.5) ctx.fillRect(p.x * CELL + z * 0.9, p.y * CELL + z * 1.2, 2, 2); }
    for (const p of parts) {
      const sz = 1.8 + Math.max(0, p.z) * 0.03;
      if (p.w) { ctx.fillStyle = 'rgba(190,230,255,0.9)'; ctx.fillRect(p.x * CELL - sz / 2, p.y * CELL - sz / 2, sz + 0.6, sz + 0.6); continue; }
      if (p.dye) { ctx.fillStyle = p.css; ctx.fillRect(p.x * CELL - sz / 2, p.y * CELL - sz / 2, sz + 0.8, sz + 0.8); continue; }
      const v = p.c * 240;
      ctx.fillStyle = `rgb(${Math.min(255, v * p.kr) | 0},${Math.min(255, v * 0.86 * p.kg) | 0},${Math.min(255, v * 0.64 * p.kb) | 0})`;
      ctx.fillRect(p.x * CELL - sz / 2, p.y * CELL - sz / 2, sz, sz);
    }
  }
  drawWave();
  drawFinds(now);
  drawAnims(now);
  drawTruck(now);
  drawFan(now);
  drawHoses();
  drawScoopRings(now);
  drawShovels(now);
  drawMoulds(now);
  drawClouds(now);
  drawCarries(now);
}
