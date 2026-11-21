// player.js — Pip, the moth-thief. Walks, sneaks, runs, throws pollen puffs.
// Movement is velocity-based with acceleration and friction so the moth feels
// light but not slippery; running is fast and loud, sneaking is slow and small.
// Footsteps are a real system: running leaves noise rings the keepers hear.
import { PLAYER, GUARD, PUFF, TILE } from './config.js';
import { walkableAt, tileAt } from './levels.js';
import { clamp } from './random.js';

export function createPlayer(start, upgrades) {
  const silent = upgrades['silent-wings'] || 0;
  return {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    dir: -Math.PI / 2, // facing up the garden
    sneaking: false,
    running: false,
    moving: false,
    hidden: false,
    // Mothcraft: silent wings make the moth faster and quieter.
    speedBonus: 1 + 0.12 * silent,
    noiseFactor: 1 - 0.2 * silent,
    puffs: PUFF.startCharges + (upgrades['pollen-pouch'] || 0),
    puffCooldown: 0,
    stepTimer: 0,
    stepPhase: 0,
    wingPhase: 0,
    caughtTimer: 0,
    // Footstep noise the world hears: 0 while still, up to 1 while running.
    noise: 0,
  };
}

/** Read the movement keys and steer the moth. Returns the raw input vector. */
export function readMoveInput(input) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  return { dx, dy };
}

export function updatePlayer(world, input, dt) {
  const p = world.player;
  const move = readMoveInput(input);
  p.sneaking = input.sneak && !input.run;
  p.running = input.run && (move.dx !== 0 || move.dy !== 0);
  const speed = (p.sneaking ? PLAYER.sneakSpeed : p.running ? PLAYER.runSpeed : PLAYER.walkSpeed) * p.speedBonus;
  p.moving = move.dx !== 0 || move.dy !== 0;

  if (p.moving) {
    p.vx += move.dx * PLAYER.accel * dt;
    p.vy += move.dy * PLAYER.accel * dt;
    const v = Math.hypot(p.vx, p.vy);
    if (v > speed) {
      p.vx = (p.vx / v) * speed;
      p.vy = (p.vy / v) * speed;
    }
    p.dir = Math.atan2(p.vy, p.vx);
  } else {
    const v = Math.hypot(p.vx, p.vy);
    const drop = PLAYER.friction * dt;
    if (v <= drop) {
      p.vx = 0;
      p.vy = 0;
    } else {
      p.vx -= (p.vx / v) * drop;
      p.vy -= (p.vy / v) * drop;
    }
  }

  // Move axis by axis so the moth slides along hedges instead of sticking.
  const nx = p.x + p.vx * dt;
  if (walkableAt(world.grid, nx, p.y, PLAYER.radius)) p.x = nx;
  else p.vx = 0;
  const ny = p.y + p.vy * dt;
  if (walkableAt(world.grid, p.x, ny, PLAYER.radius)) p.y = ny;
  else p.vy = 0;
  p.x = clamp(p.x, TILE, world.width - TILE);
  p.y = clamp(p.y, TILE, world.height - TILE);

  // Wing flutter and footstep timing.
  const speedNow = Math.hypot(p.vx, p.vy);
  p.wingPhase += dt * (4 + speedNow / 22);
  p.noise = p.moving ? (p.running ? 1 : p.sneaking ? 0.12 : 0.45) : 0;
  if (p.moving) {
    p.stepTimer -= dt * (p.running ? 1.9 : 1);
    if (p.stepTimer <= 0) {
      p.stepTimer = p.sneaking ? 0.62 : 0.42;
      p.stepPhase += 1;
      world.onFootstep(p);
    }
  }

  if (p.puffCooldown > 0) p.puffCooldown -= dt;
}

/**
 * Throw a pollen puff toward a point (mouse aim, or the moth's facing when no
 * mouse). The puff arcs out, bursts into glowing pollen, and every keeper in
 * earshot walks over to look at the sparkle instead of at the moth.
 */
export function throwPuff(world, targetX, targetY) {
  const p = world.player;
  if (p.puffs <= 0 || p.puffCooldown > 0) return false;
  p.puffs -= 1;
  p.puffCooldown = 0.45;
  const dx = targetX - p.x;
  const dy = targetY - p.y;
  const d = Math.hypot(dx, dy) || 1;
  const range = Math.min(d, PUFF.throwRange);
  const tx = p.x + (dx / d) * range;
  const ty = p.y + (dy / d) * range;
  world.puffs.push({
    x: p.x,
    y: p.y,
    tx,
    ty,
    t: 0,
    flight: 0.45,
    state: 'flying',
    linger: PUFF.lingerSeconds,
  });
  world.audio.puffThrow();
  return true;
}

/** Is the moth standing on the moon gate's glowing ring? */
export function onExit(world) {
  const p = world.player;
  const dx = p.x - world.exit.x;
  const dy = p.y - world.exit.y;
  return dx * dx + dy * dy < 30 * 30;
}
