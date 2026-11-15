'use strict';
// The toy dump truck: it drives towards the finger, bulldozes sand with its front blade and leaves tyre tracks.
// Files share one global scope; they load in the order listed in index.html.

let truck = null; // { x, y, ang, speed, odo }

function placeTruck() {
  if (!truck) truck = { x: cssW * 0.5, y: cssH * 0.6, ang: -Math.PI / 2, speed: 0, odo: 0 };
}

// Push the sand in front of the blade forward, and press tyre tracks under the rear wheels.
function truckWork(x, y, ang) {
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  // blade: a strip across the front of the truck
  const bx = x + dx * 27, by = y + dy * 27, half = 18, thick = 5;
  const ref = surfaceRef(bx, by, 22);
  let removed = 0, cm = 0, mr = 0, mg = 0, mb = 0;
  const x0 = Math.max(0, Math.floor((bx - 24) / CELL)), x1 = Math.min(W - 1, Math.ceil((bx + 24) / CELL));
  const y0 = Math.max(0, Math.floor((by - 24) / CELL)), y1 = Math.min(H - 1, Math.ceil((by + 24) / CELL));
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    const rx = gx * CELL - bx, ry = gy * CELL - by, along = rx * dx + ry * dy, across = rx * nx + ry * ny;
    if (Math.abs(across) > half || along < -thick || along > thick) continue;
    const i = gy * W + gx, target = ref - 2 / CELL, surf = h[i] + base[i];
    if (surf > target) {
      let rem = (surf - target) * 0.6; if (rem > h[i]) rem = h[i];
      h[i] -= rem; removed += rem; cm += c[i] * rem; mr += kr[i] * rem; mg += kg[i] * rem; mb += kb[i] * rem;
      firm[i] = 0; act[i] = 1;
    }
  }
  if (removed > 0) { // the berm builds up just ahead of the blade
    const tint = cm / removed, cr = mr / removed, cg = mg / removed, cb = mb / removed, cells = [];
    for (let k = -half; k <= half; k += CELL) for (let a = 8; a <= 14; a += CELL) {
      const gx = Math.round((bx + dx * a + nx * k) / CELL), gy = Math.round((by + dy * a + ny * k) / CELL);
      if (gx >= 0 && gy >= 0 && gx < W && gy < H) cells.push(gy * W + gx);
    }
    if (cells.length) for (const i of cells) { mixInto(i, removed / cells.length, tint, cr, cg, cb); firm[i] = 0; act[i] = 1; u[i] = dx * 0.25; v[i] = dy * 0.25; }
  }
  // tyre tracks under the rear wheels, with a chunky tread pattern
  const tread = 0.6 + 0.4 * Math.sin(truck.odo * 0.9);
  for (const side of [-1, 1]) {
    const wx = x - dx * 15 + nx * 12 * side, wy = y - dy * 15 + ny * 12 * side;
    const px = wx / CELL, py = wy / CELL, r = 4 / CELL;
    for (let gy = Math.max(0, Math.floor(py - r)); gy <= Math.min(H - 1, Math.ceil(py + r)); gy++)
      for (let gx = Math.max(0, Math.floor(px - r)); gx <= Math.min(W - 1, Math.ceil(px + r)); gx++) {
        if (Math.hypot(gx - px, gy - py) > r) continue;
        const i = gy * W + gx, dig = Math.min(h[i], 0.25 * tread);
        if (dig <= 0) continue;
        // squash a little sand out to the outside of the tyre
        const ox = Math.round(px + nx * side * (r + 1)), oy = Math.round(py + ny * side * (r + 1));
        if (ox < 0 || oy < 0 || ox >= W || oy >= H) continue;
        h[i] -= dig; mixInto(oy * W + ox, dig, c[i], kr[i], kg[i], kb[i]);
        firm[i] = Math.max(firm[i], 0.4); act[i] = 1;
      }
  }
  wakeCss(x, y, 60);
}

// Each frame: if a finger is down with the truck tool, drive towards it.
function truckStep() {
  if (!truck) return 0;
  let target = null;
  for (const p of pointers.values()) if (p.tool === 'truck') target = p;
  if (!target) { truck.speed *= 0.8; return 0; }
  const dx = target.x - truck.x, dy = target.y - truck.y, dist = Math.hypot(dx, dy);
  if (dist < 6) { truck.speed *= 0.7; return truck.speed; }
  // steer towards the finger, at most a little each frame (it can also reverse a bit if the finger is behind)
  let want = Math.atan2(dy, dx), diff = want - truck.ang;
  while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
  truck.ang += Math.max(-0.09, Math.min(0.09, diff));
  const go = Math.min(4.2, 0.6 + dist * 0.05) * Math.max(0.25, Math.cos(diff));
  truck.speed = go;
  const steps = Math.max(1, Math.ceil(go / 2));
  for (let k = 0; k < steps; k++) {
    truck.x = Math.max(16, Math.min(cssW - 16, truck.x + Math.cos(truck.ang) * go / steps));
    truck.y = Math.max(16, Math.min(cssH - 16, truck.y + Math.sin(truck.ang) * go / steps));
    truck.odo += go / steps;
    truckWork(truck.x, truck.y, truck.ang);
  }
  return go;
}

function drawTruck(now) {
  if (!truck) return;
  const t = truck, bob = t.speed > 0.3 ? Math.sin(now / 45) * 0.6 : 0;
  ctx.save(); ctx.translate(t.x, t.y + bob); ctx.rotate(t.ang);
  ctx.fillStyle = 'rgba(40,25,10,0.3)'; roundRect(-26, -15, 58, 34, 8); ctx.fill();          // shadow (offset by the sun)
  ctx.translate(-3, -3);
  ctx.fillStyle = '#222'; for (const [wx, wy] of [[-15, -16], [-15, 12], [13, -16], [13, 12]]) { roundRect(wx - 7, wy, 14, 5, 2); ctx.fill(); } // wheels
  ctx.fillStyle = '#7d8a96'; roundRect(23, -16, 6, 32, 2); ctx.fill();                        // blade
  ctx.fillStyle = '#e8582a'; roundRect(-27, -13, 30, 26, 4); ctx.fill();                      // dump bed
  ctx.fillStyle = '#c4431c'; roundRect(-23, -9, 22, 18, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-23, -9, 22, 3);
  ctx.fillStyle = '#ffc531'; roundRect(4, -12, 18, 24, 4); ctx.fill();                        // cab
  ctx.fillStyle = '#7fc6f0'; roundRect(13, -9, 6, 18, 2); ctx.fill();                         // windscreen
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(6, -10, 4, 20);
  ctx.restore();
  if (tool === 'truck' && !pointers.size) { // a gentle hint: touch the sand and the truck drives there
    const a = (now / 700) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${(0.7 * (1 - a)).toFixed(3)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(t.x, t.y, 34 + a * 18, 0, Math.PI * 2); ctx.stroke();
  }
}
