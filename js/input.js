'use strict';
// Touch input on the sandbox.
// Files share one global scope; they load in the order listed in index.html.

// ---------- touch input ----------
let tool = 'hand', stampType = 'turtle';
const pointers = new Map();
let fingerTravel = 0;

function localXY(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  closeStamps();
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  const [x, y] = localXY(e);
  pointers.set(e.pointerId, { x, y, t: performance.now(), tool });
  if (tool === 'stamp') pickUpStamp(e.pointerId, stampType, x, y);
  else if (tool === 'shovel') startShovel(e.pointerId, x, y);
  else if (tool === 'hand') plow(x / CELL, y / CELL, 0, 0, 0);
  else if (tool === 'prints') startPrints(pointers.get(e.pointerId));
  else if (tool === 'truck') placeTruck();
  else if (tool === 'mould') sound.pickup();
  else if (tool === 'fan') {
    const p = pointers.get(e.pointerId);
    if (!fan) { placeFan(); fan.x = x; fan.y = y; }
    if (Math.hypot(x - fan.x, y - fan.y) < FAN_R + 8) { p.mode = 'move'; p.ox = fan.x - x; p.oy = fan.y - y; } // grab it
    else { p.mode = 'aim'; fan.ang = Math.atan2(y - fan.y, x - fan.x); }                              // point it
  }
});

cv.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  e.preventDefault();
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of (evs.length ? evs : [e])) {
    const [x, y] = localXY(ev), now = performance.now();
    if (p.tool === 'fan' && fan) {
      if (p.mode === 'move') { fan.x = x + p.ox; fan.y = y + p.oy; }
      else fan.ang = Math.atan2(y - fan.y, x - fan.x);
    }
    if (p.tool === 'prints') walkPrints(p, x, y);
    if (p.tool === 'hand') {
      const dx = x - p.x, dy = y - p.y, dist = Math.hypot(dx, dy);
      if (dist < 0.5) continue;
      const speed = dist / Math.max(4, now - p.t);
      const step = FINGER_R * 0.4, n = Math.ceil(dist / step);
      for (let k = 1; k <= n; k++) {
        const u = k / n;
        plow((p.x + dx * u) / CELL, (p.y + dy * u) / CELL, dx / dist, dy / dist, speed);
      }
      fingerTravel += dist;
    }
    p.x = x; p.y = y; p.t = now;
  }
});

function endPointer(e) {
  const p = pointers.get(e.pointerId);
  if (p && p.tool === 'mould' && e.type === 'pointerup') dropMould(p.x, p.y); // let go: a tower!
  if (p && p.tool === 'fan' && p.mode === 'move' && fan) { // dragged off the sandbox: put the fan away
    if (fan.x < -10 || fan.y < -10 || fan.x > cssW + 10 || fan.y > cssH + 10) { fan = null; stopMic(); }
    else { fan.x = Math.max(20, Math.min(cssW - 20, fan.x)); fan.y = Math.max(20, Math.min(cssH - 20, fan.y)); }
  }
  pointers.delete(e.pointerId);
}

// carried stamps follow the finger anywhere (including straight off a toolbar button)
window.addEventListener('pointermove', e => {
  const sh = shovels.get(e.pointerId);
  if (sh) { const [x, y] = localXY(e); sh.x = Math.max(0, Math.min(cssW, x)); sh.y = Math.max(0, Math.min(cssH, y)); }
  if (!carries.size || !carries.has(e.pointerId)) return;
  const [x, y] = localXY(e); moveStamp(e.pointerId, x, y);
});
function liftShovel(e) {
  const sh = shovels.get(e.pointerId); if (!sh) return;
  shovels.delete(e.pointerId); dumpShovel(sh);
}
window.addEventListener('pointerup', e => {
  liftShovel(e);
  if (!carries.has(e.pointerId)) return;
  const [x, y] = localXY(e); moveStamp(e.pointerId, x, y); dropStamp(e.pointerId, true);
});
window.addEventListener('pointercancel', e => { liftShovel(e); dropStamp(e.pointerId, false); });
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('lostpointercapture', endPointer);

function pourStep() {
  let n = 0;
  for (const p of pointers.values()) {
    if (p.tool !== 'pour') continue; n++;
    const gx = p.x / CELL, gy = p.y / CELL, spread = 7 / CELL;
    for (let k = 0; k < 48; k++) {
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
      const x = Math.max(0, Math.min(W - 1, gx + Math.cos(a) * r)), y = Math.max(0, Math.min(H - 1, gy + Math.sin(a) * r));
      spawnGrain(x, y, h[(y | 0) * W + (x | 0)] + base[(y | 0) * W + (x | 0)] + 22 + Math.random() * 10, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, -0.6, 0.3, grainTint());
    }
  }
  return n;
}

// stop the page itself from scrolling / zooming / long-press menus
['touchstart', 'touchmove', 'gesturestart', 'gesturechange'].forEach(t =>
  document.addEventListener(t, e => { if (e.target.closest('#start, #settings')) return; e.preventDefault(); }, { passive: false }));
document.addEventListener('contextmenu', e => e.preventDefault());
