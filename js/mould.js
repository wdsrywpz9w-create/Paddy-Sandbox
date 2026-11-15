'use strict';
// The castle bucket mould: carry an upside-down bucket of packed wet sand, let go, lift it off -> a tower.
// Files share one global scope; they load in the order listed in index.html.

const CASTLE = { r: 30, h: 22 };   // tower radius and height (px)
const castleLifts = [];            // buckets being lifted off a new tower (animation)

// Build a tower of firm, damp sand centred at (cx, cy) in screen px.
function buildCastle(cx, cy) {
  const px = cx / CELL, py = cy / CELL, R = CASTLE.r / CELL, Rout = R + 2 / CELL;
  const ground = surfaceRef(cx, cy, CASTLE.r);
  const Ht = CASTLE.h / CELL, notch = 5 / CELL, dip = 1.5 / CELL;
  const x0 = Math.max(0, Math.floor(px - Rout - 1)), x1 = Math.min(W - 1, Math.ceil(px + Rout + 1));
  const y0 = Math.max(0, Math.floor(py - Rout - 1)), y1 = Math.min(H - 1, Math.ceil(py + Rout + 1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
    if (d > Rout) continue;
    let z;
    if (d <= 0.72 * R) z = Ht - dip;                                         // the flat top inside the battlements
    else if (d <= R) z = Math.cos(Math.atan2(dy, dx) * 8) > -0.1 ? Ht : Ht - notch; // battlements and gaps
    else z = Ht * (1 - (d - R) / (Rout - R)) * 0.9;                           // the bucket's slightly flared rim
    const i = y * W + x, surf = h[i] + base[i], top = ground + z;
    if (top > surf) mixInto(i, top - surf, 0.92 + Math.random() * 0.1, kr[i], kg[i], kb[i]);
    firm[i] = 1; if (wet[i] < 0.85) wet[i] = 0.85; // packed damp sand holds its walls until disturbed
    act[i] = 0; u[i] = 0; v[i] = 0;
  }
  wetActive = true;
  wakeCells(x0, y0, x1, y1);
}

function drawBucket(x, y, scale, alpha, lift) {
  const R = (CASTLE.r + 6) * scale;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
  ctx.fillStyle = 'rgba(50,30,10,0.28)';
  ctx.beginPath(); ctx.arc(8 + lift * 10, 10 + lift * 14, R, 0, Math.PI * 2); ctx.fill();   // shadow
  const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
  g.addColorStop(0, '#ff7a6b'); g.addColorStop(1, '#d4342a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();           // bucket bottom, seen from above
  ctx.strokeStyle = '#a8231b'; ctx.lineWidth = 4 * scale; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2 * scale;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.stroke();                   // moulded rings
  for (let k = 0; k < 8; k++) {                                                              // battlement bumps
    const a = k * Math.PI / 4;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, 4 * scale, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3.5 * scale; ctx.lineCap = 'round';             // the handle
  ctx.beginPath(); ctx.arc(0, 0, R + 3 * scale, -2.4, -0.75); ctx.stroke();
  ctx.restore();
}

// A bucket follows each finger using the mould; the tower is made where the finger lets go.
function drawMoulds(now) {
  for (const p of pointers.values()) {
    if (p.tool !== 'mould') continue;
    const wob = Math.sin(now / 120) * 0.02;
    drawBucket(p.x, p.y, 1.12 + wob, 1, 1);
  }
  for (let n = castleLifts.length - 1; n >= 0; n--) {
    const c = castleLifts[n], t = now - c.t0, DOWN = 120, UP = 420;
    if (!c.built && t >= DOWN) {
      c.built = true; buildCastle(c.x, c.y);
      sound.stamp(3);
      if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
    }
    if (t > DOWN + UP) { castleLifts.splice(n, 1); continue; }
    if (t < DOWN) drawBucket(c.x, c.y, 1.12 - 0.12 * (t / DOWN), 1, 1 - t / DOWN);
    else { const q = (t - DOWN) / UP; drawBucket(c.x, c.y - 30 * q, 1 + 0.2 * q, 1 - q, q); }
  }
}
function dropMould(x, y) {
  if (x < 0 || y < 0 || x > cssW || y > cssH) return;
  castleLifts.push({ x, y, t0: performance.now(), built: false });
}
