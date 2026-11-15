'use strict';
// Dinosaur footprints: drag a finger and a dinosaur walks along it, left foot, right foot.
// Files share one global scope; they load in the order listed in index.html.

const PRINT = { stride: 42, scale: 0.4, side: 12, depth: 6 };

function startPrints(p) { p.walked = PRINT.stride * 0.7; p.foot = 1; }
// Called for each finger movement while the footprints tool is used.
function walkPrints(p, x, y) {
  const dx = x - p.x, dy = y - p.y, dist = Math.hypot(dx, dy);
  if (dist < 0.5) return;
  p.walked += dist;
  if (p.walked < PRINT.stride) return;
  p.walked = 0; p.foot = -p.foot;
  const a = Math.atan2(dy, dx), nx = -Math.sin(a), ny = Math.cos(a);
  const fx = x + nx * PRINT.side * p.foot, fy = y + ny * PRINT.side * p.foot;
  pressStamp('dinoprint', fx / CELL, fy / CELL, a + Math.PI / 2 + p.foot * 0.12, PRINT.scale, PRINT.depth);
  sound.step();
}
