'use strict';
// The rain cloud: hold a finger down and a little cloud rains on the sand around it.
// Files share one global scope; they load in the order listed in index.html.

const RAIN = { r: 48, perFrame: 14, mass: 0.035 };

function rainStep() {
  let n = 0;
  for (const p of pointers.values()) {
    if (p.tool !== 'rain') continue; n++;
    for (let k = 0; k < RAIN.perFrame; k++) {
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * RAIN.r;
      const x = (p.x + Math.cos(a) * rr) / CELL, y = (p.y + Math.sin(a) * rr) / CELL;
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const j = (y | 0) * W + (x | 0);
      if (parts.length >= MAXP) break;
      parts.push({ x, y, z: h[j] + base[j] + 26 + Math.random() * 10, vx: 0, vy: 0.05, vz: -1.6, m: RAIN.mass, c: 1, w: 1, rain: 1 });
    }
  }
  return n;
}

function drawClouds(now) {
  for (const p of pointers.values()) {
    if (p.tool !== 'rain') continue;
    const x = p.x, y = p.y - 64, t = now / 900;
    ctx.save();
    ctx.fillStyle = 'rgba(40,50,70,0.18)';                     // the cloud's shadow on the sand
    ctx.beginPath(); ctx.ellipse(p.x + 6, p.y + 6, RAIN.r * 1.05, RAIN.r * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,225,255,0.55)'; ctx.lineWidth = 1.5;   // falling streaks
    for (let k = 0; k < 9; k++) {
      const ph = (t * 2.2 + k * 0.37) % 1, sx = x + ((k * 0.61) % 1 - 0.5) * 70;
      ctx.beginPath(); ctx.moveTo(sx, y + 14 + ph * 50); ctx.lineTo(sx - 2, y + 24 + ph * 50); ctx.stroke();
    }
    const puffs = [[-26, 4, 20], [-6, -8, 25], [18, -2, 22], [32, 8, 15], [4, 10, 20]];
    for (const [dx, dy, r] of puffs) {
      const g = ctx.createRadialGradient(x + dx - r * 0.3, y + dy - r * 0.4, r * 0.2, x + dx, y + dy, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9c6d6');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx + Math.sin(t + dx) * 1.5, y + dy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
