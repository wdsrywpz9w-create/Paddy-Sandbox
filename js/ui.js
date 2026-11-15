'use strict';
// Toolbar, start screen, background and grown-up settings.
// Files share one global scope; they load in the order listed in index.html.

// ---------- toolbar ----------
// Tools are grouped so the bar keeps big, finger-sized buttons. A group's button shows the tool
// last picked from it; tapping it chooses that tool and pops the group's other choices open above.
const toolsRow = document.getElementById('tools'), uiEl = document.getElementById('ui');
const buttons = [], popups = [];

function mkBtn(row, content, label, onPress, cls) {
  const b = document.createElement('button');
  b.className = 'btn' + (cls ? ' ' + cls : ''); b.setAttribute('aria-label', label);
  if (typeof content === 'string') b.textContent = content; else b.appendChild(content);
  b.addEventListener('pointerdown', e => { e.preventDefault(); sound.init(); onPress(b, e); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
  row.appendChild(b); buttons.push(b); return b;
}
function select(b) { buttons.forEach(x => { if (!x.parentElement.classList.contains('popup')) x.classList.toggle('sel', x === b); }); }
function closePopups() { popups.forEach(p => p.classList.remove('open')); }
const closeStamps = closePopups; // the sandbox closes any open picker when touched

// little icon painters (128px canvases)
function icon(paint) { const c2 = document.createElement('canvas'); c2.width = c2.height = 128; paint(c2.getContext('2d')); return c2; }
const emoji = ch => icon(g => { g.font = '84px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70); });
const paintShovel = g => {
  g.translate(58, 70); g.rotate(0.65);
  g.fillStyle = '#c9732f'; g.fillRect(-5, 18, 10, 46); g.fillStyle = '#e53935'; g.beginPath(); g.ellipse(0, 66, 15, 8, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(-26, -8); g.quadraticCurveTo(-26, -44, 0, -52); g.quadraticCurveTo(26, -44, 26, -8); g.lineTo(26, 14); g.quadraticCurveTo(0, 24, -26, 14); g.closePath();
  g.fillStyle = '#c5d0da'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#6f7d89'; g.stroke();
  g.fillStyle = '#e2bf86'; g.beginPath(); g.ellipse(0, -14, 19, 24, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f0d4a2'; g.beginPath(); g.ellipse(-5, -22, 9, 11, 0, 0, Math.PI * 2); g.fill();
};
const paintHose = g => {
  g.lineCap = 'round';
  g.strokeStyle = '#2e8a3a'; g.lineWidth = 16; g.beginPath(); g.arc(50, 80, 30, 0, Math.PI * 1.75); g.stroke();
  g.strokeStyle = '#4cbc57'; g.lineWidth = 10; g.beginPath(); g.arc(50, 80, 30, 0, Math.PI * 1.75); g.stroke();
  g.save(); g.translate(74, 56); g.rotate(-0.8);
  g.fillStyle = '#6b3d10'; g.fillRect(-11, -26, 22, 40); g.fillStyle = '#ffc531'; g.fillRect(-8, -23, 16, 34); g.fillStyle = '#ff8a1f'; g.fillRect(-6, -32, 12, 10);
  g.restore();
  g.fillStyle = '#3aa0f0';
  for (const [x, y, r] of [[98, 22, 7], [114, 12, 5], [108, 36, 6], [120, 28, 4]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
};
const paintCloud = g => {
  g.strokeStyle = '#3aa0f0'; g.lineWidth = 6; g.lineCap = 'round';
  for (const x of [36, 58, 80, 100]) { g.beginPath(); g.moveTo(x, 86); g.lineTo(x - 6, 112); g.stroke(); }
  g.fillStyle = '#c9d6e4';
  for (const [x, y, r] of [[38, 62, 22], [62, 48, 28], [90, 58, 24], [64, 70, 22]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#ffffff'; for (const [x, y, r] of [[40, 58, 16], [62, 44, 21], [88, 54, 17]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
};
const paintCastle = g => {
  g.fillStyle = '#e2bf86'; g.fillRect(28, 46, 72, 66);
  g.fillStyle = '#e2bf86'; for (const x of [28, 52, 76]) g.fillRect(x, 30, 16, 18);
  g.fillStyle = '#c9a26a'; g.fillRect(56, 80, 16, 32); g.fillRect(28, 104, 72, 8);
  g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(64, 30); g.lineTo(64, 6); g.lineTo(86, 14); g.lineTo(64, 22); g.fill();
  g.strokeStyle = '#6b4a20'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 30); g.lineTo(64, 6); g.stroke();
};
const paintTruck = g => {
  g.fillStyle = '#222'; for (const x of [30, 88]) { g.beginPath(); g.arc(x, 96, 14, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#e8582a'; g.fillRect(12, 50, 64, 34);
  g.fillStyle = '#ffc531'; g.fillRect(76, 40, 36, 44);
  g.fillStyle = '#7fc6f0'; g.fillRect(86, 46, 20, 16);
  g.fillStyle = '#e2bf86'; g.beginPath(); g.ellipse(44, 50, 30, 14, 0, Math.PI, 0); g.fill();
  g.fillStyle = '#ddd'; for (const x of [30, 88]) { g.beginPath(); g.arc(x, 96, 5, 0, Math.PI * 2); g.fill(); }
};
const paintFan = g => {
  g.fillStyle = '#4f5a64'; g.beginPath(); g.ellipse(64, 116, 34, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6c7884'; g.fillRect(58, 70, 12, 44);
  g.fillStyle = '#d9eefc'; g.beginPath(); g.arc(64, 54, 46, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3aa0f0';
  for (let k = 0; k < 3; k++) { g.save(); g.translate(64, 54); g.rotate(k * Math.PI * 2 / 3 + 0.3); g.beginPath(); g.ellipse(0, -21, 13, 22, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 54, 9, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#8fa3b3'; g.lineWidth = 5; g.beginPath(); g.arc(64, 54, 46, 0, Math.PI * 2); g.stroke();
};
function drawDrop(g, id) {
  g.beginPath(); g.moveTo(64, 10); g.quadraticCurveTo(106, 62, 106, 82); g.arc(64, 82, 42, 0, Math.PI); g.quadraticCurveTo(22, 62, 64, 10); g.closePath();
  const d = DYES.find(x => x.id === id);
  if (d.rgb) g.fillStyle = `rgb(${d.rgb})`;
  else { const gr = g.createLinearGradient(22, 20, 106, 124); ['#ff4d4d', '#ffa53a', '#ffe14a', '#4cc95a', '#3f8cf0', '#a35de6'].forEach((col, k) => gr.addColorStop(k / 5, col)); g.fillStyle = gr; }
  g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.18)'; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(48, 74, 9, 16, 0.35, 0, Math.PI * 2); g.fill();
}
const shapeIcon = (type, pal) => icon(g => { g.translate(64, 64); g.scale(54, 54); drawShape(g, type, pal); });

// items: { label, icon(), pick(button, pointerEvent|null) }; action items don't stay selected
function makeGroup(label, items) {
  if (items.length === 1) {
    const it = items[0];
    return mkBtn(toolsRow, it.icon(), it.label, (b, e) => { closePopups(); it.pick(b, e); if (!it.action) select(b); }, it.action ? 'action' : '');
  }
  let cur = 0;
  const face = document.createElement('canvas'); face.width = face.height = 128;
  const paintFace = () => { const g = face.getContext('2d'); g.clearRect(0, 0, 128, 128); g.drawImage(items[cur].icon(), 0, 0); };
  paintFace();
  const pop = document.createElement('div'); pop.className = 'row popup' + (items.length > 6 ? ' many' : '');
  uiEl.insertBefore(pop, toolsRow); popups.push(pop);
  const main = mkBtn(toolsRow, face, label, b => {
    const wasOpen = pop.classList.contains('open');
    closePopups(); items[cur].pick(b, null); select(b);
    if (!wasOpen) pop.classList.add('open');
  });
  items.forEach((it, k) => {
    const sb = mkBtn(pop, it.icon(), it.label, (b, e) => {
      cur = k; paintFace(); select(main);
      pop.querySelectorAll('.btn').forEach(x => x.classList.toggle('sel', x === b));
      it.pick(main, e);
      setTimeout(closePopups, 150);
    });
    if (k === 0) sb.classList.add('sel');
  });
  return main;
}

const handBtn = makeGroup('Dig with your finger', [{ label: 'Dig with your finger', icon: () => emoji('✋'), pick: () => { tool = 'hand'; } }]);
makeGroup('Sand tools', [
  { label: 'Pour sand from the bucket', icon: () => emoji('🪣'), pick: () => { tool = 'pour'; } },
  { label: 'Castle mould: let go to make a tower', icon: () => icon(paintCastle), pick: () => { tool = 'mould'; } },
  { label: 'Shovel: scoop sand and move it', icon: () => icon(paintShovel), pick: () => { tool = 'shovel'; } },
]);
makeGroup('Water', [
  { label: 'Spray water with the hose', icon: () => icon(paintHose), pick: () => { tool = 'hose'; } },
  { label: 'Rain cloud', icon: () => icon(paintCloud), pick: () => { tool = 'rain'; } },
]);
makeGroup('Colour dye', DYES.map(d => ({ label: d.id + ' dye', icon: () => icon(g => drawDrop(g, d.id)), pick: () => { tool = 'dye'; dyeId = d.id; } })));
makeGroup('Stamps', STAMPS.map(t => ({
  label: t + ' stamp', icon: () => shapeIcon(t, PAL[t]),
  pick: (b, e) => {
    tool = 'stamp'; stampType = t;
    if (e) { try { e.target.releasePointerCapture(e.pointerId); } catch (_) {} pickUpStamp(e.pointerId, t, null, null); } // drag it straight off the button
  },
})).concat([{ label: 'Dinosaur footprints: drag to walk', icon: () => shapeIcon('dinoprint', PAL.dinoprint), pick: () => { tool = 'prints'; } }]));
makeGroup('Toy truck', [{ label: 'Toy truck: touch the sand and it drives there', icon: () => icon(paintTruck), pick: () => { tool = 'truck'; placeTruck(); } }]);
makeGroup('Desk fan', [{ label: 'Desk fan: blow into the microphone', icon: () => icon(paintFan), pick: () => { tool = 'fan'; placeFan(); startMic(); } }]);
makeGroup('Smooth the sand', [{ label: 'Smooth the sand', icon: () => emoji('🌊'), action: true, pick: () => { startWave(); } }]);
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
// ---------- the guide ----------
const helpWrap = document.getElementById('helpwrap'), helpFrame = document.getElementById('helpframe');
function openHelp() {
  if (!helpFrame.getAttribute('src')) helpFrame.src = 'help.html';
  helpWrap.classList.remove('hide');
  document.documentElement.classList.add('help-open'); // let the guide scroll on iPhones
}
function closeHelp() { helpWrap.classList.add('hide'); document.documentElement.classList.remove('help-open'); }
window.addEventListener('message', e => { if (e.data === 'close-help') closeHelp(); });
document.getElementById('helpBtn').addEventListener('click', openHelp);
document.getElementById('startHelp').addEventListener('click', openHelp);

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
