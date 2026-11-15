'use strict';
// Toolbar, start screen, background and grown-up settings.
// Files share one global scope; they load in the order listed in index.html.

// ---------- toolbar ----------
const toolsRow = document.getElementById('tools'), stampsRow = document.getElementById('stamps'), dyesRow = document.getElementById('dyes');
const buttons = [];

function mkBtn(row, content, label, onPress, cls) {
  const b = document.createElement('button');
  b.className = 'btn' + (cls ? ' ' + cls : ''); b.setAttribute('aria-label', label);
  if (typeof content === 'string') b.textContent = content; else b.appendChild(content);
  b.addEventListener('pointerdown', e => { e.preventDefault(); sound.init(); onPress(b, e); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
  row.appendChild(b); buttons.push(b); return b;
}
function select(b) { buttons.forEach(x => { if (!x.parentElement.classList.contains('popup')) x.classList.toggle('sel', x === b); }); }

const closeStamps = () => { stampsRow.classList.remove('open'); dyesRow.classList.remove('open'); };
const handBtn = mkBtn(toolsRow, '✋', 'Dig with your finger', b => { tool = 'hand'; select(b); closeStamps(); });
mkBtn(toolsRow, '🪣', 'Pour sand', b => { tool = 'pour'; select(b); closeStamps(); });
{
  const ic = document.createElement('canvas'); ic.width = ic.height = 128;
  const g = ic.getContext('2d'); g.translate(58, 70); g.rotate(0.65); g.scale(1, 1);
  // handle
  g.fillStyle = '#c9732f'; g.fillRect(-5, 18, 10, 46); g.fillStyle = '#e53935'; g.beginPath(); g.ellipse(0, 66, 15, 8, 0, 0, Math.PI * 2); g.fill();
  // blade with sand
  g.beginPath(); g.moveTo(-26, -8); g.quadraticCurveTo(-26, -44, 0, -52); g.quadraticCurveTo(26, -44, 26, -8); g.lineTo(26, 14); g.quadraticCurveTo(0, 24, -26, 14); g.closePath();
  g.fillStyle = '#c5d0da'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#6f7d89'; g.stroke();
  g.fillStyle = '#e2bf86'; g.beginPath(); g.ellipse(0, -14, 19, 24, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f0d4a2'; g.beginPath(); g.ellipse(-5, -22, 9, 11, 0, 0, Math.PI * 2); g.fill();
  mkBtn(toolsRow, ic, 'Shovel: scoop sand and move it', b => { tool = 'shovel'; select(b); closeStamps(); });
}
{
  const ic = document.createElement('canvas'); ic.width = ic.height = 128;
  const g = ic.getContext('2d'); g.lineCap = 'round';
  g.strokeStyle = '#2e8a3a'; g.lineWidth = 16; g.beginPath(); g.arc(50, 80, 30, 0, Math.PI * 1.75); g.stroke();
  g.strokeStyle = '#4cbc57'; g.lineWidth = 10; g.beginPath(); g.arc(50, 80, 30, 0, Math.PI * 1.75); g.stroke();
  g.save(); g.translate(74, 56); g.rotate(-0.8);
  g.fillStyle = '#6b3d10'; g.fillRect(-11, -26, 22, 40); g.fillStyle = '#ffc531'; g.fillRect(-8, -23, 16, 34); g.fillStyle = '#ff8a1f'; g.fillRect(-6, -32, 12, 10);
  g.restore();
  g.fillStyle = '#3aa0f0';
  for (const [x, y, r] of [[98, 22, 7], [114, 12, 5], [108, 36, 6], [120, 28, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  mkBtn(toolsRow, ic, 'Spray water with the hose', b => { tool = 'hose'; select(b); closeStamps(); });
}
// the dye bottle: one button shows the current colour; pressing it pops the colours open
function drawDrop(g, id) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 128, 128);
  g.beginPath(); g.moveTo(64, 10); g.quadraticCurveTo(106, 62, 106, 82); g.arc(64, 82, 42, 0, Math.PI); g.quadraticCurveTo(22, 62, 64, 10); g.closePath();
  const d = DYES.find(x => x.id === id);
  if (d.rgb) g.fillStyle = `rgb(${d.rgb})`;
  else { const gr = g.createLinearGradient(22, 20, 106, 124); ['#ff4d4d', '#ffa53a', '#ffe14a', '#4cc95a', '#3f8cf0', '#a35de6'].forEach((col, k) => gr.addColorStop(k / 5, col)); g.fillStyle = gr; }
  g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.18)'; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(48, 74, 9, 16, 0.35, 0, Math.PI * 2); g.fill();
}
const dyeIcon = document.createElement('canvas'); dyeIcon.width = dyeIcon.height = 128;
drawDrop(dyeIcon.getContext('2d'), dyeId);
const dyeBtn = mkBtn(toolsRow, dyeIcon, 'Colour dye', b => { tool = 'dye'; select(b); stampsRow.classList.remove('open'); dyesRow.classList.toggle('open'); });
for (const d of DYES) {
  const ic = document.createElement('canvas'); ic.width = ic.height = 128; drawDrop(ic.getContext('2d'), d.id);
  const db = mkBtn(dyesRow, ic, d.id + ' dye', b => {
    tool = 'dye'; dyeId = d.id; select(dyeBtn); drawDrop(dyeIcon.getContext('2d'), d.id);
    dyesRow.querySelectorAll('.btn').forEach(x => x.classList.toggle('sel', x === b));
    setTimeout(closeStamps, 150);
  });
  if (d.id === dyeId) db.classList.add('sel');
}
// one stamp button shows the current stamp; pressing it pops the stamp choices open
const stampIcon = document.createElement('canvas'); stampIcon.width = stampIcon.height = 128;
function drawStampIcon() {
  const g = stampIcon.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 128, 128);
  g.translate(64, 64); g.scale(54, 54); drawShape(g, stampType, PAL[stampType]);
}
drawStampIcon();
const stampBtn = mkBtn(toolsRow, stampIcon, 'Stamps', b => { tool = 'stamp'; select(b); dyesRow.classList.remove('open'); stampsRow.classList.toggle('open'); });
{
  const ic = document.createElement('canvas'); ic.width = ic.height = 128;
  const g = ic.getContext('2d');
  g.fillStyle = '#4f5a64'; g.beginPath(); g.ellipse(64, 116, 34, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6c7884'; g.fillRect(58, 70, 12, 44);
  g.fillStyle = '#d9eefc'; g.beginPath(); g.arc(64, 54, 46, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3aa0f0';
  for (let k = 0; k < 3; k++) { g.save(); g.translate(64, 54); g.rotate(k * Math.PI * 2 / 3 + 0.3); g.beginPath(); g.ellipse(0, -21, 13, 22, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 54, 9, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#8fa3b3'; g.lineWidth = 5; g.beginPath(); g.arc(64, 54, 46, 0, Math.PI * 2); g.stroke();
  mkBtn(toolsRow, ic, 'Desk fan: blow into the microphone', b => { tool = 'fan'; select(b); closeStamps(); placeFan(); startMic(); });
}
mkBtn(toolsRow, '🌊', 'Smooth the sand', b => { startWave(); closeStamps(); }, 'action');

for (const t of STAMPS) {
  const ic = document.createElement('canvas'); ic.width = ic.height = 128;
  const g = ic.getContext('2d'); g.translate(64, 64); g.scale(54, 54); drawShape(g, t, PAL[t]);
  const sb = mkBtn(stampsRow, ic, t + ' stamp', (b, e) => {
    tool = 'stamp'; stampType = t; select(stampBtn); drawStampIcon();
    stampsRow.querySelectorAll('.btn').forEach(x => x.classList.toggle('sel', x === b));
    try { b.releasePointerCapture(e.pointerId); } catch (_) {}
    pickUpStamp(e.pointerId, t, null, null); // drag it straight off the button onto the sand
    setTimeout(closeStamps, 150);
  });
  if (t === stampType) sb.classList.add('sel');
}
select(handBtn);

// ---------- start screen ----------
const startEl = document.getElementById('start');
document.getElementById('play').addEventListener('click', async () => {
  sound.init();
  if (settings.motion === 'on') await askMotion();
  needCal = true;
  try {
    const de = document.documentElement;
    if (de.requestFullscreen && !navigator.standalone) await de.requestFullscreen({ navigationUI: 'hide' });
  } catch (e) {}
  startEl.classList.add('hide');
  setTimeout(() => { try { screen.orientation.lock('portrait'); } catch (e) {} }, 300);
});
async function askMotion() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')
      await DeviceOrientationEvent.requestPermission();
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function')
      await DeviceMotionEvent.requestPermission();
  } catch (e) {}
}

// ---------- the rocky ground around the sandbox (drawn once per screen size) ----------
let rockKey = '';
function applyBackground() {
  document.body.classList.toggle('sky', settings.bg === 'sky');
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = settings.bg === 'sky' ? '#5cc4ea' : '#3a342f';
  if (settings.bg === 'sky') return;
  const w = Math.ceil(innerWidth), hgt = Math.ceil(innerHeight), key = w + 'x' + hgt;
  if (key === rockKey) return; rockKey = key;
  const cnv = document.createElement('canvas'), sc = Math.min(2, devicePixelRatio || 1);
  cnv.width = w * sc; cnv.height = hgt * sc;
  const g = cnv.getContext('2d'); g.scale(sc, sc);
  g.fillStyle = '#332d29'; g.fillRect(0, 0, w, hgt);
  const n = Math.round(w * hgt / 260);
  for (let k = 0; k < n; k++) { // pebbles and stones, lit from the top-left like the sand
    const x = Math.random() * w, y = Math.random() * hgt, r = 3 + Math.pow(Math.random(), 2.2) * 26;
    const rx = r * (0.75 + Math.random() * 0.5), ry = r * (0.6 + Math.random() * 0.4), rot = Math.random() * Math.PI;
    const hue = 18 + Math.random() * 22, sat = 5 + Math.random() * 12, lit = 20 + Math.random() * 22;
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(r * 0.18, r * 0.22, rx, ry, 0, 0, Math.PI * 2); g.fill();
    const gr = g.createRadialGradient(-rx * 0.35, -ry * 0.4, r * 0.1, 0, 0, r * 1.1);
    gr.addColorStop(0, `hsl(${hue},${sat}%,${lit + 14}%)`); gr.addColorStop(0.6, `hsl(${hue},${sat}%,${lit}%)`); gr.addColorStop(1, `hsl(${hue},${sat}%,${lit - 9}%)`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  const id = g.getImageData(0, 0, cnv.width, cnv.height), d = id.data; // gritty speckle
  for (let i = 0; i < d.length; i += 4) { const v = (Math.random() - 0.5) * 22; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
  g.putImageData(id, 0, 0);
  document.body.style.backgroundImage = `url(${cnv.toDataURL('image/jpeg', 0.85)})`;
}
applyBackground();
window.addEventListener('resize', () => setTimeout(applyBackground, 300));

// ---------- grown-up settings panel (press and hold the gear) ----------
const gear = document.getElementById('gear'), panel = document.getElementById('settings');
let holdTimer = 0, buryWhenOpened = settings.bury;
function showSettings() {
  buryWhenOpened = settings.bury;
  panel.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(b =>
    b.classList.toggle('on', settings[seg.dataset.key] === b.dataset.v)));
  panel.classList.remove('hide');
  document.documentElement.classList.add('settings-open');
  panel.querySelector('.panel').scrollTop = 0;
}
gear.addEventListener('pointerdown', e => {
  e.preventDefault(); gear.classList.add('holding');
  holdTimer = setTimeout(() => { gear.classList.remove('holding'); showSettings(); }, 1200);
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => gear.addEventListener(t, () => { clearTimeout(holdTimer); gear.classList.remove('holding'); }));
gear.addEventListener('contextmenu', e => e.preventDefault());
panel.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', async () => {
  const key = b.parentElement.dataset.key;
  settings[key] = b.dataset.v; saveSettings();
  b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  if (key === 'sound') sound.setMuted(settings.sound === 'off');
  if (key === 'bg') applyBackground();
  if (key === 'motion') {
    if (settings.motion === 'on') { await askMotion(); needCal = true; }
    else { tiltX = tiltY = 0; agit = 0; }
  }
}));
function closeSettings() {
  panel.classList.add('hide');
  document.documentElement.classList.remove('settings-open');
  if (settings.bury !== buryWhenOpened) startWave(); // re-bury at the new depth
}
document.getElementById('done').addEventListener('click', closeSettings);
document.getElementById('closeX').addEventListener('click', closeSettings);
panel.addEventListener('click', e => { if (e.target === panel) closeSettings(); }); // tap outside the panel

document.addEventListener('visibilitychange', () => { document.hidden ? sound.suspend() : sound.resume(); });
window.addEventListener('resize', () => setTimeout(resize, 60));
