'use strict';
// The hose.
// Files share one global scope; they load in the order listed in index.html.

// ---------- the hose ----------
function hoseStep() {
  let n = 0;
  for (const p of pointers.values()) {
    if (p.tool !== 'hose') continue; n++;
    // the nozzle sits just below the finger and arcs the water onto the spot just past the fingertip
    const nx = p.x / CELL, ny = Math.min(H - 1, (p.y + 30) / CELL);
    if (nx < 0 || nx >= W || p.y < 0 || p.y >= cssH) continue;
    const tgx = p.x / CELL, tgy = Math.max(0, (p.y - 14) / CELL);
    const z0 = h[(ny | 0) * W + (nx | 0)] + base[(ny | 0) * W + (nx | 0)] + 8;
    for (let k = 0; k < 26; k++) {
      const T = 12 + Math.random() * 3, a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * 6 / CELL;
      const ex = tgx + Math.cos(a) * rr, ey = tgy + Math.sin(a) * rr;
      spawnDrop(nx + (Math.random() - 0.5) * 0.5, ny, z0, (ex - nx) / T, (ey - ny) / T, 1.1 + Math.random() * 0.4, 0.12);
    }
  }
  return n;
}
function drawHoses() {
  for (const p of pointers.values()) {
    if (p.tool !== 'hose') continue;
    const x = p.x, y = p.y;
    ctx.lineCap = 'round';
    const hose = (lw, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      ctx.moveTo(cssW * 0.5, cssH + 40); ctx.bezierCurveTo(cssW * 0.5, cssH - 20, x, y + 120, x, y + 70); ctx.stroke();
    };
    hose(17, 'rgba(0,0,0,0.18)'); hose(15, '#2e8a3a'); hose(10, '#48b955'); hose(3, 'rgba(255,255,255,0.35)');
    ctx.fillStyle = '#6b3d10'; ctx.fillRect(x - 10, y + 28, 20, 46);
    ctx.fillStyle = '#ffc531'; ctx.fillRect(x - 8, y + 30, 16, 42);
    ctx.fillStyle = '#ff8a1f'; ctx.fillRect(x - 6, y + 22, 12, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - 6, y + 32, 4, 36);
  }
}
