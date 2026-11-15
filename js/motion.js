'use strict';
// Phone tilt and shake (motion sensors).
// Files share one global scope; they load in the order listed in index.html.

// ---------- tilt, shake ----------
const D2R = Math.PI / 180;
let ori = null, g0 = null, needCal = true;
let tiltX = 0, tiltY = 0, agit = 0;
const keyTilt = { x: 0, y: 0 };

function gvec(o) {
  const b = o.b * D2R, g = o.g * D2R;
  return [Math.cos(b) * Math.sin(g), Math.sin(b), Math.cos(b) * Math.cos(g)];
}
function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

window.addEventListener('deviceorientation', e => {
  if (e.beta == null || e.gamma == null) return;
  ori = { b: e.beta, g: e.gamma };
  if (needCal) { g0 = norm(gvec(ori)); needCal = false; }
});

window.addEventListener('devicemotion', e => {
  if (settings.motion !== 'on') return;
  const a = e.acceleration;
  let m = 0;
  if (a && a.x != null) m = Math.hypot(a.x, a.y, a.z);
  else if (e.accelerationIncludingGravity && e.accelerationIncludingGravity.x != null) {
    const g = e.accelerationIncludingGravity; m = Math.abs(Math.hypot(g.x, g.y, g.z) - 9.81);
  }
  const sh = sens().shake;
  if (m > sh) agit = Math.min(1, agit + (m - sh) * 0.02);
});

function screenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
  return typeof window.orientation === 'number' ? window.orientation : 0;
}

function updateTilt() {
  let gx = 0, gy = 0, gz = 1;
  if (ori && g0 && settings.motion === 'on') {
    const g = norm(gvec(ori));
    // Basis that treats the "calibrated" pose as level.
    let by = [-g0[1] * g0[0], 1 - g0[1] * g0[1], -g0[1] * g0[2]];
    if (Math.hypot(by[0], by[1], by[2]) < 1e-3) by = [0, 0, 1];
    by = norm(by);
    const bx = norm(cross(by, g0));
    const dx = dot(g, bx), dy = dot(g, by);
    gz = dot(g, g0);
    const a = screenAngle() * D2R, ca = Math.cos(a), sa = Math.sin(a);
    gx = dx * ca + dy * sa; gy = -dx * sa + dy * ca;
  }
  gx += keyTilt.x; gy += keyTilt.y;
  gz = Math.max(gz, 0.3);
  P.tiltGain = sens().gain;
  let tx = P.tiltGain * gx / gz, ty = P.tiltGain * gy / gz;
  tx = Math.max(-3, Math.min(3, tx)); ty = Math.max(-3, Math.min(3, ty));
  tiltX += (tx - tiltX) * 0.15; tiltY += (ty - tiltY) * 0.15;
}

window.addEventListener('keydown', e => {
  const s = 0.45;
  if (e.key === 'ArrowLeft') keyTilt.x = -s;
  if (e.key === 'ArrowRight') keyTilt.x = s;
  if (e.key === 'ArrowUp') keyTilt.y = -s;
  if (e.key === 'ArrowDown') keyTilt.y = s;
  if (e.key === 's') agit = 1;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keyTilt.x = 0;
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') keyTilt.y = 0;
});
