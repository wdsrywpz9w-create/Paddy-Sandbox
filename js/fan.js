'use strict';
// The microphone-powered desk fan and its wind.
// Files share one global scope; they load in the order listed in index.html.

// ---------- the desk fan: blow into the microphone to make it spin ----------
let fan = null; // { x, y, ang, speed, spin }
const FAN_R = 30;          // touch radius of the fan body (px)
const mic = { on: false, failed: false, an: null, buf: null, stream: null, level: 0 };
async function startMic() {
  if (mic.on || mic.failed || mic.starting) return;
  mic.starting = true;
  try {
    sound.init();
    const a = sound.ctx();
    const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const src = a.createMediaStreamSource(st);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; // breath is a low rumble on a mic; speech much less so
    const an = a.createAnalyser(); an.fftSize = 1024;
    const mute = a.createGain(); mute.gain.value = 0;
    src.connect(lp); lp.connect(an); an.connect(mute); mute.connect(a.destination);
    Object.assign(mic, { an, buf: new Float32Array(an.fftSize), stream: st, on: true });
  } catch (e) { mic.failed = true; }
  mic.starting = false;
}
function stopMic() {
  if (mic.stream) mic.stream.getTracks().forEach(t => t.stop());
  Object.assign(mic, { on: false, an: null, stream: null, level: 0 });
}
function micBlow() {
  if (!mic.on) return 0;
  mic.an.getFloatTimeDomainData(mic.buf);
  let sum = 0; for (let i = 0; i < mic.buf.length; i++) sum += mic.buf[i] * mic.buf[i];
  const rms = Math.sqrt(sum / mic.buf.length);
  mic.level = mic.level * 0.6 + rms * 0.4;
  const b = (mic.level - 0.035) / 0.12;
  return b < 0 ? 0 : b > 1 ? 1 : b;
}
function placeFan() {
  if (!fan) fan = { x: cssW * 0.5, y: cssH * 0.78, ang: -Math.PI / 2, speed: 0, spin: 0 };
}
let keyBlow = false;
window.addEventListener('keydown', e => { if (e.key === 'f') keyBlow = true; });
window.addEventListener('keyup', e => { if (e.key === 'f') keyBlow = false; });
// Each frame: spin the fan up or down, build the wind field, and kick dust into the air.
function fanStep(now) {
  if (!fan) { if (windOn) { windX.fill(0); windY.fill(0); windOn = false; } return 0; }
  let target = Math.max(micBlow(), keyBlow ? 1 : 0);
  for (const p of pointers.values()) if (p.tool === 'fan' && p.mode === 'move' && !mic.on) target = 1; // no mic: hold the fan to run it
  fan.speed += (target - fan.speed) * (target > fan.speed ? 0.08 : 0.025);
  if (fan.speed < 0.01) fan.speed = 0;
  fan.spin += fan.speed * 0.9;
  windX.fill(0); windY.fill(0);
  windOn = fan.speed > 0.03;
  if (!windOn) return 0;
  // real wind comes in gusts: strength swells and dips, and the jet sways a little
  const gust = 0.78 + 0.16 * Math.sin(now * 0.0031) + 0.1 * Math.sin(now * 0.0089 + 1.3) + 0.06 * Math.sin(now * 0.021);
  const sway = 0.06 * Math.sin(now * 0.0017) * fan.speed;
  const dx = Math.cos(fan.ang + sway), dy = Math.sin(fan.ang + sway);
  const nxp = fan.x + dx * 22, nyp = fan.y + dy * 22;             // the front of the fan
  const Lmax = Math.max(cssW, cssH) * 0.65, spread = Math.tan(0.4), S = 2.0 * fan.speed * gust;
  fan.gust = gust;
  // wind ripples: loose sand is nudged into little ridges across the wind that creep downwind
  const RIP = 2 * Math.PI / 9, ripPhase = now * 0.004 * fan.speed;
  const jStep = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : (dy > 0 ? W : -W);
  for (let y = 0; y < H; y++) {
    const py = y * CELL - nyp;
    for (let x = 0, i = y * W; x < W; x++, i++) {
      const px = x * CELL - nxp;
      const along = px * dx + py * dy; if (along <= 0 || along >= Lmax) continue;
      const across = Math.abs(px * dy - py * dx), half = 26 + along * spread;
      if (across >= half) continue;
      const a2 = across / half, w = S * (1 - along / Lmax) * (1 - a2 * a2);
      const d = Math.hypot(px, py) || 1; // the jet fans out slightly
      windX[i] = w * (dx * 0.8 + (px / d) * 0.2); windY[i] = w * (dy * 0.8 + (py / d) * 0.2);
      if (w > 0.45 && firm[i] < 0.3 && wet[i] < 0.5 && wat[i] < 0.02) {
        const j = i + jStep;
        if (j >= 0 && j < N && Math.abs((j % W) - x) <= 1) {
          const q = 0.012 * w * Math.sin(along * RIP - ripPhase);   // mass moves between neighbours: nothing gained or lost
          if (q > 0) { const m = Math.min(q, h[i] * 0.2); h[i] -= m; h[j] += m; }
          else if (q < 0) { const m = Math.min(-q, h[j] * 0.2); h[j] -= m; h[i] += m; }
        }
      }
    }
  }
  // saltation: grains hop downwind from where the wind is strongest
  for (let k = 0; k < 40 * fan.speed; k++) {
    const along = Math.random() * Lmax * 0.6, across = (Math.random() - 0.5) * 2 * (26 + along * spread);
    const gx = (nxp + dx * along - dy * across) / CELL, gy = (nyp + dy * along + dx * across) / CELL;
    if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
    const i = (gy | 0) * W + (gx | 0), w = Math.hypot(windX[i], windY[i]);
    if (w < 0.9 || h[i] < 0.3 || firm[i] > 0.3 || wet[i] > 0.5 || wat[i] > 0.05) continue;
    const m = Math.min(0.06, h[i] * 0.05); h[i] -= m;
    const sp = w * 1.6;
    spawnGrain(gx, gy, h[i] + base[i] + 0.3, dx * sp + (Math.random() - 0.5) * 0.3, dy * sp + (Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.8, m, c[i], kr[i], kg[i], kb[i]);
  }
  return fan.speed;
}
function drawFan(now) {
  if (!fan) return;
  const f = fan, dx = Math.cos(f.ang), dy = Math.sin(f.ang);
  // where it points: a faint cone while the fan tool is chosen and it's still, streaks of air when it blows
  if (tool === 'fan' && f.speed < 0.2) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
    ctx.setLineDash([5, 7]); ctx.lineDashOffset = -now / 50; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(26, -26); ctx.lineTo(150, -26 - 124 * Math.tan(0.4)); ctx.moveTo(26, 26); ctx.lineTo(150, 26 + 124 * Math.tan(0.4)); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  if (f.speed > 0.05) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang); ctx.lineCap = 'round';
    const L = Math.max(cssW, cssH) * 0.55, gs = fan.gust || 1;
    for (let k = 0; k < 14; k++) {
      const ph = (now * 0.0011 * (0.6 + f.speed) + k * 0.618) % 1, along = 26 + ph * L;
      const across = (((k * 0.37) % 1) - 0.5) * 2 * (20 + along * Math.tan(0.35));
      ctx.strokeStyle = `rgba(255,255,255,${(0.55 * (1 - ph) * f.speed * gs).toFixed(3)})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(along, across); ctx.lineTo(along + 18 + 14 * f.speed, across); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.ang);
  ctx.fillStyle = 'rgba(40,25,10,0.28)'; ctx.beginPath(); ctx.ellipse(-4, 8, 34, 30, 0, 0, Math.PI * 2); ctx.fill(); // shadow
  ctx.fillStyle = '#4f5a64'; roundRect(-36, -20, 24, 40, 8); ctx.fill();                                          // heavy base
  ctx.fillStyle = '#6c7884'; ctx.fillRect(-16, -5, 14, 10);                                                       // neck
  const mg = ctx.createRadialGradient(-12, -6, 2, -6, 0, 14); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, '#9fb3c4');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(-6, 0, 12, 0, Math.PI * 2); ctx.fill();                          // motor
  // blades seen from above: they sweep up and down inside the cage as they turn
  for (let k = 0; k < 3; k++) {
    const th = f.spin + k * Math.PI * 2 / 3, yy = 22 * Math.sin(th), depth = Math.cos(th);
    ctx.fillStyle = `rgba(58,160,240,${(0.55 + 0.4 * depth).toFixed(3)})`;
    ctx.beginPath(); ctx.ellipse(10 + depth * 2, yy, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (f.speed > 0.4) { ctx.fillStyle = `rgba(120,200,255,${(f.speed * 0.45).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(10, 0, 6, 27, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#e8eef3'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.ellipse(10, 0, 9, 31, 0, 0, Math.PI * 2); ctx.stroke(); // cage
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
  for (const yy of [-20, -10, 0, 10, 20]) { ctx.beginPath(); ctx.moveTo(4, yy); ctx.lineTo(17, yy); ctx.stroke(); }  // grille
  ctx.restore();
  // a little "blow!" hint bubble while the fan tool is chosen and nothing is happening
  if (tool === 'fan' && f.speed < 0.05 && mic.on) {
    const t = (now / 600) % 1;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let k = 0; k < 3; k++) { const ph = (t + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(f.x - 40 - ph * 18, f.y - 34 - ph * 14, 3 + ph * 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}
function roundRect(x, y, w, h2, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h2, r); ctx.arcTo(x + w, y + h2, x, y + h2, r);
  ctx.arcTo(x, y + h2, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
