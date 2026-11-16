'use strict';
// Castle keepers: little builders who live in the big castle and rebuild whatever gets knocked down.
// The more often their castle is wrecked, the more frustrated they get.
// Files share one global scope; they load in the order listed in index.html.

let castleBP = null;   // the castle's blueprint: { plans: [plan], flags: [{ x, y, col }], cx, cy, s }
let keepers = [];
let keeperAnger = 0;   // 0 calm ... 1 furious
let lastDeficit = 0, wasIntact = true, scanTick = 0, lastKnock = 0;
const jobs = new Map(); // block key -> { x, y, cells: [{ i, want }], taken }

const MOODS = [
  { upTo: 0.2, say: ['🙂', '🎵', '👍', '🏰'], hit: ['😮', '🙁', 'Oops!'] },
  { upTo: 0.45, say: ['🙂', '😐'], hit: ['😟', 'Hey!', '😕'] },
  { upTo: 0.7, say: ['😐', '😒'], hit: ['😠', 'Not again!', '🙄'] },
  { upTo: 1.01, say: ['😤', '😒'], hit: ['😤💢', 'GRR!', '💢', '😡'] },
];
const mood = () => MOODS.find(m => keeperAnger < m.upTo);
const pickOne = a => a[(Math.random() * a.length) | 0];

function rememberCastle(plan, flags, cx, cy, s) {
  castleBP = { plans: [plan], flags, cx, cy, s };
  keeperAnger = 0; lastDeficit = 0; wasIntact = true; jobs.clear();
  spawnKeepers();
}
// towers from the castle mould become part of the castle the keepers look after
function rememberTower(plan) { if (castleBP) castleBP.plans.push(plan); }
function forgetCastle() { castleBP = null; keepers = []; jobs.clear(); }

function spawnKeepers() {
  keepers = [];
  if (!castleBP || settings.keepers === 'off') return;
  const shirts = ['#e53935', '#3f8cf0', '#4cc95a', '#a35de6'];
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + 0.6;
    keepers.push({ x: castleBP.cx + Math.cos(a) * 45 * castleBP.s, y: castleBP.cy + 40 * castleBP.s + Math.sin(a) * 10,
      tx: null, ty: null, job: null, taps: 0, shirt: shirts[k], phase: Math.random() * 6, bubble: null, hat: 1, hatFly: 0,
      wander: 0, cheer: 0, stomp: 0, born: performance.now() + 1700 + k * 250 });
  }
}

// Every so often: compare the sand with the blueprint and make repair jobs out of what's missing.
function scanCastle(now) {
  jobs.forEach(j => { j.cells.length = 0; });
  let deficit = 0; // only walls, towers, bridge and courtyard count towards being 'knocked down'
  const B = 22; // job blocks of about 22px
  for (const plan of castleBP.plans) {
    for (let k = 0; k < plan.cells.length; k++) {
      const kd = plan.kind[k]; if (kd === 2) continue;
      const i = plan.cells[k], want = plan.to[k], have = h[i];
      const miss = kd === 3 ? have - want : want - have;          // a moat clogged with sand also needs fixing
      if (miss < 1.5) continue;
      if (kd !== 3) deficit += miss;
      const x = (i % W) * CELL, y = ((i / W) | 0) * CELL, key = ((x / B) | 0) + ',' + ((y / B) | 0);
      let j = jobs.get(key);
      if (!j) { j = { x: 0, y: 0, cells: [], taken: null }; jobs.set(key, j); }
      j.cells.push({ i, want, moat: kd === 3, kd });
    }
  }
  jobs.forEach((j, key) => {
    if (!j.cells.length) { if (j.taken) j.taken.job = null; jobs.delete(key); return; }
    let sx = 0, sy = 0; for (const c of j.cells) { sx += (c.i % W) * CELL; sy += ((c.i / W) | 0) * CELL; }
    j.x = sx / j.cells.length; j.y = sy / j.cells.length;
  });
  // a fresh knock: more frustration, and everyone says so
  if (deficit > lastDeficit + 25 && now - lastKnock > 1500) { // one knock (several strokes close together count once)
    lastKnock = now;
    keeperAnger = Math.min(1, keeperAnger + 0.16);
    for (const kp of keepers) if (now > kp.born) say(kp, pickOne(mood().hit), now, 1500);
    if (keeperAnger > 0.8) for (const kp of keepers) if (kp.hat && Math.random() < 0.5) { kp.hat = 0; kp.hatFly = now; }
    sound.grumble(keeperAnger);
  }
  wasIntact = deficit < 25;
  lastDeficit = deficit;
  // flags go back up on towers that have been rebuilt
  for (const f of castleBP.flags) {
    if (castleFlags.some(q => q.x === f.x && q.y === f.y && !q.fell)) continue;
    const i = ((f.y / CELL) | 0) * W + ((f.x / CELL) | 0);
    if ((h[i] + base[i]) * CELL >= f.top - 3) castleFlags.push({ x: f.x, y: f.y, col: f.col, born: now + 200, fell: 0 });
  }
}
function say(kp, text, now, ms) { kp.bubble = { text, until: now + ms }; }

function keepersStep(now) {
  if (!castleBP) return;
  if (settings.keepers === 'off') { keepers = []; return; }
  if (!keepers.length) spawnKeepers();
  if (++scanTick % 15 === 0) scanCastle(now);
  keeperAnger = Math.max(0, keeperAnger - (wasIntact ? 0.0012 : 0.0002)); // they calm down when left in peace
  const angry = keeperAnger;
  for (const kp of keepers) {
    if (now < kp.born) continue;
    kp.phase += 0.25 + angry * 0.2;
    // run from fingers and the truck
    let fleeX = 0, fleeY = 0;
    const threats = [...pointers.values()].map(p => [p.x, p.y]);
    if (truck && truck.speed > 0.3) threats.push([truck.x, truck.y]); // a parked truck is just scenery
    for (const [px, py] of threats) {
      const dx = kp.x - px, dy = kp.y - py, d = Math.hypot(dx, dy);
      if (d < 34 && d > 0.01) { fleeX += dx / d; fleeY += dy / d; }
    }
    if (fleeX || fleeY) {
      const l = Math.hypot(fleeX, fleeY);
      kp.x += fleeX / l * 2.6; kp.y += fleeY / l * 2.6;
      if (!kp.bubble || now > kp.bubble.until) say(kp, angry > 0.5 ? pickOne(['😠', '💢', 'Oi!']) : pickOne(['😱', 'Eek!', '😮']), now, 900);
      kp.shake = angry > 0.45 ? now : 0; // shake a fist at whoever's doing it
      clampKeeper(kp); continue;
    }
    // take a job: the nearest one nobody else is on (big jobs get a helper)
    if (!kp.job || !kp.job.cells.length) {
      kp.job = null;
      // big damage first (a few loose grains can wait), nearer is better; big jobs can share a helper
      let best = null, bs = 0;
      jobs.forEach(j => {
        if (!j.cells.length || (j.taken && j.taken !== kp && j.cells.length < 60)) return;
        const score = (j.cells.length > 12 ? j.cells.length : j.cells.length * 0.05) / (Math.hypot(j.x - kp.x, j.y - kp.y) + 60);
        if (score > bs) { bs = score; best = j; }
      });
      if (best) { kp.job = best; if (!best.taken) best.taken = kp; if (angry > 0.6) kp.stomp = now; }
    }
    const speed = 1.4 + angry * 1.4;
    if (kp.job) {
      const j = kp.job, dx = j.x - kp.x, dy = j.y - kp.y, d = Math.hypot(dx, dy);
      if (d > 6) { kp.x += dx / d * Math.min(speed, d); kp.y += dy / d * Math.min(speed, d); kp.working = false; }
      else { kp.working = true; repair(kp, j, 1 + angry * 1.5, now); }
    } else {
      kp.working = false;
      // potter about the courtyard
      if (!kp.tx || Math.hypot(kp.tx - kp.x, kp.ty - kp.y) < 3 || Math.random() < 0.003) {
        const a = Math.random() * Math.PI * 2, r = (20 + Math.random() * 70) * castleBP.s;
        kp.tx = castleBP.cx + Math.cos(a) * r; kp.ty = castleBP.cy + Math.sin(a) * r;
      }
      const dx = kp.tx - kp.x, dy = kp.ty - kp.y, d = Math.hypot(dx, dy) || 1;
      kp.x += dx / d * 0.45; kp.y += dy / d * 0.45;
      if (Math.random() < 0.002) say(kp, pickOne(mood().say), now, 1200);
    }
    clampKeeper(kp);
  }
}
function clampKeeper(kp) { kp.x = Math.max(6, Math.min(cssW - 6, kp.x)); kp.y = Math.max(10, Math.min(cssH - 4, kp.y)); }

// Pat sand back into place (or scoop it out of the moat), nearest cells first.
function repair(kp, j, rate, now) {
  j.cells.sort((a, b) => Math.hypot((a.i % W) * CELL - kp.x, ((a.i / W) | 0) * CELL - kp.y) - Math.hypot((b.i % W) * CELL - kp.x, ((b.i / W) | 0) * CELL - kp.y));
  let budget = 22;
  for (let n = 0; n < j.cells.length && budget > 0; n++) {
    const c = j.cells[n], i = c.i;
    if (c.moat) { const ex = h[i] - c.want; if (ex > 0.2) { h[i] -= Math.min(ex, 0.5 * rate); budget--; } continue; }
    const miss = c.want - h[i];
    if (miss > 0.2) {
      mixInto(i, Math.min(miss, 0.5 * rate), 0.92 + hash2(i, 3) * 0.1, kr[i], kg[i], kb[i]);
      firm[i] = c.kd === 1 ? 3.2 : 2; if (wet[i] < 0.6) wet[i] = 0.6; act[i] = 0; u[i] = 0; v[i] = 0;
      budget--;
    }
  }
  j.cells = j.cells.filter(c => c.moat ? h[c.i] - c.want > 0.2 : c.want - h[c.i] > 0.2);
  wakeCss(j.x, j.y, 30); wetActive = true;
  if (++kp.taps % 9 === 0) sound.tap();
  if (!j.cells.length) { // done: a little cheer
    kp.cheer = now; kp.job = null;
    say(kp, keeperAnger > 0.6 ? pickOne(['😤', 'Hmph.', 'There!']) : pickOne(['😊', 'Done!', '👍', '🎉']), now, 1100);
  }
}

function drawKeepers(now) {
  for (const kp of keepers) {
    if (now < kp.born) continue;
    const appear = Math.min(1, (now - kp.born) / 300);
    const i = ((Math.max(0, Math.min(cssH - 1, kp.y)) / CELL) | 0) * W + ((Math.max(0, Math.min(cssW - 1, kp.x)) / CELL) | 0);
    const swim = wat[i] > 1.2;
    const walking = !kp.working && !swim;
    const hop = (kp.cheer && now - kp.cheer < 500) ? Math.abs(Math.sin((now - kp.cheer) / 500 * Math.PI * 2)) * 6
              : (kp.stomp && now - kp.stomp < 700) ? Math.abs(Math.sin((now - kp.stomp) / 700 * Math.PI * 4)) * 4 : 0;
    const S = 1.3 * appear, x = kp.x, y = kp.y - hop;
    const red = keeperAnger;                                     // faces go red with frustration
    const skin = `rgb(${255},${Math.round(214 - red * 120)},${Math.round(170 - red * 120)})`;
    ctx.save(); ctx.translate(x, y); ctx.scale(S, S);
    ctx.fillStyle = 'rgba(40,25,10,0.3)'; ctx.beginPath(); ctx.ellipse(2, hop / S + 1, 5, 2.2, 0, 0, Math.PI * 2); ctx.fill(); // shadow
    if (swim) { // just a head and splashing arms in the moat
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, -1, 6 + Math.sin(now / 150) * 1, 2.2, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -4, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      const sw = walking ? Math.sin(kp.phase) * 2.2 : 0;
      ctx.strokeStyle = '#3b3b48'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';  // legs
      ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(-1.5 + sw, 0); ctx.moveTo(1, -4); ctx.lineTo(1.5 - sw, 0); ctx.stroke();
      ctx.fillStyle = kp.shirt; roundRect(-2.8, -10, 5.6, 6.5, 2); ctx.fill();  // body
      ctx.strokeStyle = skin; ctx.lineWidth = 1.4;                               // arms
      if (kp.working) {           // patting the sand with a tiny spade
        const pat = Math.sin(now / (110 - red * 50)) * 2;
        ctx.beginPath(); ctx.moveTo(2.4, -8.5); ctx.lineTo(5, -6 + pat); ctx.stroke();
        ctx.strokeStyle = '#9aa7b2'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(5, -6 + pat); ctx.lineTo(6.5, -2.5 + pat); ctx.stroke();
        ctx.strokeStyle = skin; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2.4, -8.5); ctx.lineTo(-3.8, -5.5); ctx.stroke();
      } else if (kp.shake && now - kp.shake < 900) { // shaking a fist
        const sh = Math.sin(now / 50) * 1.5;
        ctx.beginPath(); ctx.moveTo(2.4, -8.5); ctx.lineTo(4 + sh, -13); ctx.stroke();
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(4 + sh, -13.5, 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-2.4, -8.5); ctx.lineTo(-3.8, -5.5); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(2.4, -8.5); ctx.lineTo(3.6 - sw * 0.6, -5); ctx.moveTo(-2.4, -8.5); ctx.lineTo(-3.6 + sw * 0.6, -5); ctx.stroke();
      }
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -12.6, 2.8, 0, Math.PI * 2); ctx.fill();   // head
      ctx.fillStyle = '#222'; ctx.fillRect(-1.3, -13.1, 0.8, 0.8); ctx.fillRect(0.6, -13.1, 0.8, 0.8); // eyes
      if (red > 0.45) { ctx.strokeStyle = '#222'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-1.8, -14.2); ctx.lineTo(-0.4, -13.6); ctx.moveTo(1.8, -14.2); ctx.lineTo(0.4, -13.6); ctx.stroke(); } // cross eyebrows
      if (kp.hat) { ctx.fillStyle = '#ffc531'; ctx.beginPath(); ctx.arc(0, -14, 3.1, Math.PI, 0); ctx.fill(); ctx.fillRect(-3.8, -14.2, 7.6, 1); } // hard hat
    }
    ctx.restore();
    if (red > 0.75 && !swim && Math.random() < 0.08) { // steam
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x + (Math.random() - 0.5) * 8, y - 24 * S - Math.random() * 4, 1.5 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
    }
    if (kp.hatFly && now - kp.hatFly < 900) { // a hat thrown off in a temper
      const t = (now - kp.hatFly) / 900;
      ctx.save(); ctx.translate(x + t * 18, y - 20 * S - Math.sin(t * Math.PI) * 26); ctx.rotate(t * 7);
      ctx.fillStyle = '#ffc531'; ctx.beginPath(); ctx.arc(0, 0, 4, Math.PI, 0); ctx.fill(); ctx.fillRect(-5, 0, 10, 1.3); ctx.restore();
    } else if (!kp.hat && kp.hatFly && keeperAnger < 0.4) kp.hat = 1; // calm again: hat back on
    if (kp.bubble && now < kp.bubble.until) { // speech bubble
      const txt = kp.bubble.text; ctx.font = 'bold 12px system-ui, sans-serif';
      const w = Math.max(18, ctx.measureText(txt).width + 10), bx = x - w / 2, by = y - 25 * S - 18;
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(bx, by, w, 17, 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 3, by + 16); ctx.lineTo(x, by + 21); ctx.lineTo(x + 3, by + 16); ctx.fill();
      ctx.fillStyle = keeperAnger > 0.6 ? '#c62828' : '#333'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, x, by + 9); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
  }
}
