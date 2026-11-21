// render.js — everything the eye sees: the garden at night, the lantern light,
// the keepers' sweeping cones, the moth-thief, and the HUD that tells the
// player how close the bell is to tolling. The scene is drawn fully lit, then
// a darkness layer is laid over it with holes punched for lanterns, the moon
// gate and the moth's own faint glow; the vision cones are drawn last, bright
// over the dark, because a cone is the one thing the player must always read.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, PALETTE, LIGHT, GUARD } from './config.js';
import { coneOf, pointInCone } from './vision.js';
import { drawParticles } from './particles.js';
import { formatTime } from './scoring.js';
import { NIGHT_NAMES } from './names.js';

let darkCanvas = null;
let darkCtx = null;

function getDarkCanvas() {
  if (!darkCanvas) {
    darkCanvas = document.createElement('canvas');
    darkCanvas.width = VIEW_W;
    darkCanvas.height = VIEW_H;
    darkCtx = darkCanvas.getContext('2d');
  }
  return { canvas: darkCanvas, ctx: darkCtx };
}

/** A stable per-tile hash for ground variation: no two lawn tiles look alike. */
function tileHash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function drawGround(ctx, world) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const ch = world.grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      const h = tileHash(x, y);
      if (ch === '#') {
        ctx.fillStyle = h > 0.5 ? PALETTE.hedge : PALETTE.hedgeDark;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = PALETTE.hedgeTop;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(px + 3, py + 3, TILE - 6, 4);
      } else if (ch === '.') {
        ctx.fillStyle = h > 0.6 ? PALETTE.pathEdge : PALETTE.path;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(px, py + TILE - 2, TILE, 2);
      } else if (ch === '~') {
        ctx.fillStyle = h > 0.5 ? PALETTE.pond : PALETTE.pondLight;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(190,230,255,0.25)';
        ctx.lineWidth = 1;
        const wave = Math.sin(world.time * 1.4 + (x + y) * 0.9) * 3;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 12 + wave);
        ctx.lineTo(px + TILE - 6, py + 12 + wave);
        ctx.moveTo(px + 8, py + 22 - wave);
        ctx.lineTo(px + TILE - 8, py + 22 - wave);
        ctx.stroke();
      } else if (ch === 'F') {
        ctx.fillStyle = PALETTE.lawn;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#ff7fb8';
        ctx.beginPath();
        ctx.arc(px + 8 + h * 14, py + 9 + h * 10, 3, 0, Math.PI * 2);
        ctx.arc(px + 20, py + 20, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(px + 9 + h * 14, py + 10 + h * 10, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Lawn, in three quiet greens.
        ctx.fillStyle = h > 0.66 ? PALETTE.lawnLight : h > 0.33 ? PALETTE.lawn : PALETTE.lawnDark;
        ctx.fillRect(px, py, TILE, TILE);
        if (h > 0.82) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(px + 5, py + 6, 3, 3);
        }
      }
    }
  }
}

function drawCover(ctx, world) {
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const ch = world.grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      const h = tileHash(x, y);
      if (ch === 'B') {
        // A bush: a dark mound the moth can vanish into.
        ctx.fillStyle = PALETTE.bushDark;
        ctx.beginPath();
        ctx.arc(px + 16, py + 18, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETTE.bush;
        ctx.beginPath();
        ctx.arc(px + 12, py + 14, 10, 0, Math.PI * 2);
        ctx.arc(px + 21, py + 13, 9, 0, Math.PI * 2);
        ctx.arc(px + 16, py + 9, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        ctx.arc(px + 12, py + 10, 3, 0, Math.PI * 2);
        ctx.arc(px + 21, py + 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === 'T') {
        ctx.strokeStyle = PALETTE.grass;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 5; i += 1) {
          const bx = px + 5 + i * 5 + h * 3;
          ctx.moveTo(bx, py + TILE - 4);
          ctx.quadraticCurveTo(bx + 2, py + 12, bx + 4, py + 6 + h * 6);
        }
        ctx.stroke();
      } else if (ch === 'S') {
        ctx.fillStyle = '#5a5f6b';
        ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 8);
        ctx.fillStyle = '#7d8290';
        ctx.fillRect(px + 9, py + 7, TILE - 18, TILE - 14);
        ctx.fillStyle = '#3c4048';
        ctx.fillRect(px + 4, py + TILE - 6, TILE - 8, 4);
      } else if (ch === 'L') {
        drawLantern(ctx, px + 16, py + 16, world, 1);
      }
    }
  }
}

function drawLantern(ctx, x, y, world, scale) {
  ctx.fillStyle = '#2c2318';
  ctx.fillRect(x - 2, y - 6, 4, 14);
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(x, y - 8, 6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2f22';
  ctx.fillRect(x - 7, y - 15, 14, 3);
  ctx.fillRect(x - 5, y - 1, 10, 2);
}

function drawPetals(ctx, world) {
  for (const petal of world.petals) {
    if (petal.taken) continue;
    const bob = Math.sin(petal.bob + world.time * 2) * 2;
    const glow = 0.6 + 0.4 * Math.sin(petal.bob + world.time * 3);
    ctx.globalAlpha = 0.25 + 0.3 * glow;
    ctx.fillStyle = PALETTE.petal;
    ctx.beginPath();
    ctx.arc(petal.x, petal.y + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.petal;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + petal.bob;
      ctx.beginPath();
      ctx.ellipse(petal.x + Math.cos(a) * 6, petal.y + bob + Math.sin(a) * 6, 4.5, 3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.petalCore;
    ctx.beginPath();
    ctx.arc(petal.x, petal.y + bob, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, world) {
  const { x, y } = world.exit;
  const open = world.gateOpen;
  const pulse = 0.7 + 0.3 * Math.sin(world.time * 2.4);
  ctx.save();
  ctx.globalAlpha = open ? 0.5 * pulse : 0.22;
  ctx.fillStyle = PALETTE.moonGate;
  ctx.beginPath();
  ctx.arc(x, y, open ? 34 : 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The gate itself: two moonlit pillars and a crescent.
  ctx.fillStyle = open ? '#dfe9ff' : '#8b98b8';
  ctx.fillRect(x - 22, y - 20, 7, 40);
  ctx.fillRect(x + 15, y - 20, 7, 40);
  ctx.fillStyle = open ? '#eef3ff' : '#6d7890';
  ctx.beginPath();
  ctx.arc(x, y - 4, 12, Math.PI * 0.15, Math.PI * 1.35);
  ctx.arc(x + 5, y - 6, 10, Math.PI * 1.2, Math.PI * 0.3, true);
  ctx.fill();
  if (open) {
    ctx.strokeStyle = 'rgba(188,210,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, world, guard) {
  const cone = coneOf(guard);
  const hot = guard.state === 'chase' || guard.suspicion >= GUARD.alarmThreshold;
  const warm = guard.suspicion >= 34;
  // The vision cone: drawn later, over the dark — see drawCones.
  // Body: a cloaked keeper with a lantern.
  const cloak = guard.type === 'bearer' ? PALETTE.bearer : guard.type === 'ringer' ? PALETTE.ringer : guard.type === 'watcher' ? PALETTE.watcher : PALETTE.keeperCloak;
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.keeper;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // A wide-brimmed hat.
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y - 2, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // The lantern swings at the keeper's side, pointing where it looks.
  const lx = guard.x + Math.cos(guard.dir) * 16;
  const ly = guard.y + Math.sin(guard.dir) * 16;
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // A "!" when the keeper is alarmed, "?" when merely suspicious.
  if (hot) {
    drawMark(ctx, guard.x, guard.y - 24, '!', '#ff6b5e');
  } else if (warm) {
    drawMark(ctx, guard.x, guard.y - 24, '?', '#ffd166');
  }
  // A floating thought, when the keeper is muttering.
  if (guard.thought) {
    ctx.font = '12px Georgia, serif';
    const w = ctx.measureText(guard.thought).width + 12;
    ctx.fillStyle = 'rgba(10,14,10,0.85)';
    ctx.beginPath();
    ctx.roundRect(guard.x - w / 2, guard.y - 46, w, 18, 8);
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(guard.thought, guard.x, guard.y - 37);
  }
}

function drawMark(ctx, x, y, mark, colour) {
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText(mark, x + 1, y + 1);
  ctx.fillStyle = colour;
  ctx.fillText(mark, x, y);
}

function drawCones(ctx, world) {
  for (const guard of world.guards) {
    const cone = coneOf(guard);
    const hot = guard.state === 'chase';
    const warm = guard.suspicion >= 34;
    ctx.fillStyle = hot ? PALETTE.coneHot : warm ? 'rgba(255, 160, 60, 0.26)' : PALETTE.cone;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, cone.range, guard.dir - cone.half, guard.dir + cone.half);
    ctx.closePath();
    ctx.fill();
    // The cone's edge, so its sweep reads at a glance.
    ctx.strokeStyle = hot ? 'rgba(255,90,60,0.5)' : 'rgba(255,200,100,0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const flap = Math.sin(p.wingPhase) * 0.55;
  const hidden = world.grid && (world.grid[Math.floor(p.y / TILE)] || [])[Math.floor(p.x / TILE)];
  const inCover = hidden === 'B' || hidden === 'T';
  ctx.save();
  if (inCover) ctx.globalAlpha = 0.55;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.dir + Math.PI / 2);
  // Wings: two pale lilac ovals that flap as the moth moves.
  ctx.fillStyle = PALETTE.mothWing;
  ctx.beginPath();
  ctx.ellipse(-7, -2 - flap * 4, 7, 10 - flap * 2, -0.5 - flap * 0.4, 0, Math.PI * 2);
  ctx.ellipse(7, -2 - flap * 4, 7, 10 - flap * 2, 0.5 + flap * 0.4, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = PALETTE.moth;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Antennae.
  ctx.strokeStyle = PALETTE.moth;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.quadraticCurveTo(-5, -13, -7, -14);
  ctx.moveTo(2, -8);
  ctx.quadraticCurveTo(5, -13, 7, -14);
  ctx.stroke();
  // Eyes: two dark dots that catch the light.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-2, -5, 1.3, 0, Math.PI * 2);
  ctx.arc(2, -5, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The moth's own faint glow, so the player can always find it in the dark.
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPuffs(ctx, world) {
  for (const puff of world.puffs) {
    if (puff.state === 'flying') {
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,224,102,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(world.player.x, world.player.y);
      ctx.lineTo(puff.x, puff.y);
      ctx.stroke();
    } else if (puff.state === 'burst' || puff.state === 'lingering') {
      const k = puff.state === 'burst' ? 1 - puff.t / 0.4 : 1 - puff.t / puff.linger;
      ctx.globalAlpha = Math.max(0.15, k * 0.75);
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + puff.t;
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(puff.x + Math.cos(a) * 18, puff.y + Math.sin(a) * 18, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawDarkness(ctx, world) {
  const { ctx: dctx } = getDarkCanvas();
  dctx.clearRect(0, 0, VIEW_W, VIEW_H);
  dctx.globalCompositeOperation = 'source-over';
  dctx.fillStyle = 'rgba(3, 8, 20, 0.80)';
  dctx.fillRect(0, 0, VIEW_W, VIEW_H);
  dctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, alpha) => {
    const g = dctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g;
    dctx.beginPath();
    dctx.arc(x, y, r, 0, Math.PI * 2);
    dctx.fill();
  };
  for (const lantern of world.lanterns) {
    const flicker = 1 + Math.sin(world.time * 7 + lantern.flicker) * 0.05;
    hole(lantern.x, lantern.y, LIGHT.lanternRadius * flicker, 0.95);
  }
  hole(world.exit.x, world.exit.y, world.gateOpen ? LIGHT.moonRadius : 190, world.gateOpen ? 0.9 : 0.6);
  hole(world.player.x, world.player.y, 74, 0.55);
  for (const guard of world.guards) {
    hole(guard.x, guard.y, 46, 0.4);
  }
  ctx.drawImage(darkCanvas, 0, 0);
}

function drawFloatTexts(ctx, world) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px Georgia, serif';
  for (const ft of world.floatTexts) {
    ctx.globalAlpha = Math.min(1, ft.life / 0.6);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(ft.text, ft.x + 1, ft.y - ft.life * 12 + 1);
    ctx.fillStyle = ft.colour;
    ctx.fillText(ft.text, ft.x, ft.y - ft.life * 12);
  }
  ctx.globalAlpha = 1;
}

/** The whole world, in draw order. */
export function drawWorld(ctx, world) {
  drawGround(ctx, world);
  drawPetals(ctx, world);
  drawExit(ctx, world);
  drawCover(ctx, world);
  drawPuffs(ctx, world);
  drawParticles(ctx, world);
  drawDarkness(ctx, world);
  drawCones(ctx, world);
  for (const guard of world.guards) drawGuard(ctx, world, guard);
  drawPlayer(ctx, world);
  drawFloatTexts(ctx, world);
  // A soft vignette, so the garden feels like night.
  const vg = ctx.createRadialGradient(640, 400, 320, 640, 400, 780);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
