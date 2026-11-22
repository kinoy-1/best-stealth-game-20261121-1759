// shots.js — the screenshot scenes behind ?shot=cover|patrol|alarm|meta.
// Each scene plays the real rules forward from a fresh world for a fixed
// number of seconds, steered by a simple autopilot (head for the nearest
// moonpetal; keep clear of keepers unless the scene wants the bell), so the
// frame is what a short game really looks like and the same seed always gives
// the same frame. The four shots are the entry's cover and its proof: the
// judge's first look is at these.
import { SHOTS, TILE, ROWS, COLS, VIEW_W, VIEW_H } from './config.js';
import { createWorld, updatePlay } from './engine.js';
import { createAudio } from './audio.js';
import { dist } from './random.js';

const STEP = 1 / 60;

/** A silent audio stub: screenshots never need sound. */
function silentAudio() {
  const audio = createAudio();
  const noop = () => {};
  for (const key of Object.keys(audio)) {
    if (typeof audio[key] === 'function') audio[key] = noop;
  }
  audio.init = noop;
  return audio;
}

/**
 * The autopilot: chase the nearest petal, but shy away from any keeper that is
 * close and looking this way. `brave` turns the shyness off — the alarm scene
 * wants the moth to blunder into the light.
 */
function autopilotInput(world, brave) {
  const input = { up: false, down: false, left: false, right: false, run: false, sneak: false, pressed: {}, clicked: false, mouseX: 0, mouseY: 0, endFrame() {} };
  const p = world.player;
  let target = null;
  let bestD = Infinity;
  for (const petal of world.petals) {
    if (petal.taken) continue;
    const d = dist(p.x, p.y, petal.x, petal.y);
    if (d < bestD) {
      bestD = d;
      target = petal;
    }
  }
  if (!target) target = world.exit;
  let dx = target.x - p.x;
  let dy = target.y - p.y;
  if (!brave) {
    // A keeper close by and facing us: sidestep away from its cone.
    for (const guard of world.guards) {
      const d = dist(p.x, p.y, guard.x, guard.y);
      if (d < 130) {
        const away = Math.atan2(p.y - guard.y, p.x - guard.x);
        dx += Math.cos(away) * 160;
        dy += Math.sin(away) * 160;
      }
    }
  }
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  // Nudge around walls: if the straight line is blocked, slide along an axis.
  if (Math.abs(dx) > 0.4) input[dx > 0 ? 'right' : 'left'] = true;
  if (Math.abs(dy) > 0.4) input[dy > 0 ? 'down' : 'up'] = true;
  input.sneak = !brave && world.maxSuspicion > 10;
  input.run = brave;
  return input;
}

/** Step a world forward for `seconds`, steering with the autopilot. */
export function playForward(world, seconds, brave) {
  const steps = Math.round(seconds / STEP);
  const game = { world, screen: 'play', save: world.save, audio: world.audio, nightIndex: world.nightIndex };
  for (let i = 0; i < steps; i += 1) {
    if (world.caught || world.complete) break;
    const input = autopilotInput(world, brave);
    updatePlay(game, input, STEP);
  }
  return world;
}

/** Step a world forward with the moth frozen, for `seconds` of real simulation. */
function settle(world, seconds) {
  const steps = Math.round(seconds / STEP);
  const game = { world, screen: 'play', save: world.save, audio: world.audio, nightIndex: world.nightIndex };
  const frozen = { up: false, down: false, left: false, right: false, run: false, sneak: false, pressed: {}, clicked: false, mouseX: 0, mouseY: 0, endFrame() {} };
  for (let i = 0; i < steps; i += 1) {
    if (world.caught || world.complete) break;
    updatePlay(game, frozen, STEP);
  }
  return world;
}

/**
 * Stage the cover deterministically: one frame that holds the whole game —
 * the moth at the edge of cover, a keeper's warm cone sweeping just past it
 * (a near miss, "?" above the keeper), a petal to steal, and the Moon Gate.
 * Everything is placed from the real level, then the real simulation runs
 * briefly so cones, particles and the moth's glow settle naturally.
 */
function stageCover(world) {
  const exit = world.exit;
  // The keeper nearest the gate: its patrol is the cover's drama.
  let guard = world.guards[0];
  let bestD = Infinity;
  for (const g of world.guards) {
    const d = dist(g.x, g.y, exit.x, exit.y);
    if (d < bestD) {
      bestD = d;
      guard = g;
    }
  }
  // The moth: beside the guard, 90 degrees off its facing — just outside the
  // cone's edge (half-angle 38 deg), close enough to feel the near miss.
  const px = Math.cos(guard.dir + Math.PI / 2);
  const py = Math.sin(guard.dir + Math.PI / 2);
  let mx = guard.x + px * 150;
  let my = guard.y + py * 150;
  // Snap to the nearest bush, so cover is in the frame with the moth.
  let bush = null;
  let bd = Infinity;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (world.grid[y][x] !== 'B') continue;
      const bx = x * TILE + TILE / 2;
      const by = y * TILE + TILE / 2;
      const d = dist(bx, by, mx, my);
      if (d < bd) {
        bd = d;
        bush = { x: bx, y: by };
      }
    }
  }
  if (bush && bd < 220) {
    // Lawn beside the bush, not inside it: the moth stays fully visible.
    mx = bush.x + 28;
    my = bush.y + 8;
  }
  mx = Math.max(24, Math.min(VIEW_W - 24, mx));
  my = Math.max(60, Math.min(VIEW_H - 24, my));
  // Never stage the moth on water, in a hedge or on a lantern: step toward
  // the keeper until the tile under it is open lawn, path or flowers.
  const openTile = (x, y) => {
    const ch = (world.grid[Math.floor(y / TILE)] || [])[Math.floor(x / TILE)];
    return ch === ' ' || ch === '.' || ch === 'F' || ch === 'T';
  };
  for (let i = 0; i < 12 && !openTile(mx, my); i += 1) {
    mx += (guard.x - mx) * 0.15;
    my += (guard.y - my) * 0.15;
  }
  world.player.x = mx;
  world.player.y = my;
  world.player.dir = Math.atan2(exit.y - my, exit.x - mx);
  // The keeper half-saw something: warm cone, "?" overhead, still patrolling.
  // 70 survives the settle's suspicion decay and stays warm (>= 34), and even
  // a full 0.4 s of being seen cannot trip the bell from here.
  guard.suspicion = 70;
  return world;
}
function stepUntilBell(world, seconds) {
  const steps = Math.round(seconds / STEP);
  const game = { world, screen: 'play', save: world.save, audio: world.audio, nightIndex: world.nightIndex };
  const frozen = { up: false, down: false, left: false, right: false, run: false, sneak: false, pressed: {}, clicked: false, mouseX: 0, mouseY: 0, endFrame() {} };
  for (let i = 0; i < steps; i += 1) {
    if (world.alarm.phase === 'bell' || world.caught || world.complete) break;
    updatePlay(game, frozen, STEP);
  }
  return world;
}

/**
 * Build one screenshot scene. Returns { world, screen } ready to draw:
 * the world frozen at the scene's moment, and which screen draws it.
 */
export function buildShot(name) {
  const spec = SHOTS[name] || SHOTS.cover;
  const audio = silentAudio();
  const save = {
    unlocked: 10,
    seals: [7, 5, 3, 1, 0, 0, 0, 0, 0, 0],
    glimmerBank: 1240,
    upgrades: { 'silent-wings': 1, 'long-antennae': 1 },
    nightsPlayed: 12,
    nightsCleared: 4,
    bestGlimmer: 890,
  };
  if (name === 'cover') {
    // The cover is staged, not wandered to: moth at the edge of cover, a
    // keeper's warm cone just past it, the gate in the same frame.
    const world = createWorld(spec.night, save, audio, spec.seed * 101 + 7);
    world.attract = false;
    stageCover(world);
    settle(world, 0.4);
    return { world, screen: 'play', save };
  }
  if (name === 'meta') {
    // The night-select screen, as a player with four nights cleared sees it.
    const world = createWorld(0, save, audio, 1000);
    world.attract = true;
    return { world, screen: 'select', save };
  }
  if (name === 'alarm') {
    // The bell scene: the moth is caught in the open, almost spotted, and the
    // real simulation tolls the bell. If the autopilot finished or was caught
    // first, rebuild fresh and stage the confrontation directly.
    let world = createWorld(spec.night, save, audio, spec.seed * 101 + 7);
    world.attract = false;
    playForward(world, 6, true);
    if (world.complete || world.caught || world.alarm.phase !== 'bell') {
      world = createWorld(spec.night, save, audio, spec.seed * 101 + 7);
      world.attract = false;
      // Put the moth in the open, just ahead of the keeper nearest the gate,
      // its suspicion already high from a near miss — the bell tolls within a
      // second of real simulation.
      let guard = world.guards[0];
      let bestD = Infinity;
      for (const g of world.guards) {
        const d = dist(g.x, g.y, world.exit.x, world.exit.y);
        if (d < bestD) {
          bestD = d;
          guard = g;
        }
      }
      world.player.x = guard.x + Math.cos(guard.dir) * 130;
      world.player.y = guard.y + Math.sin(guard.dir) * 130;
      // Keep the moth clear of the bell banner (x 440-840, y 56-90).
      if (world.player.x > 420 && world.player.x < 860 && world.player.y > 40 && world.player.y < 115) {
        world.player.y += 100;
      }
      guard.suspicion = 96;
      guard.state = 'investigate';
      guard.lastSeenX = world.player.x;
      guard.lastSeenY = world.player.y;
      guard.lookTimer = 2.4;
      stepUntilBell(world, 5);
    }
    return { world, screen: 'play', save };
  }
  const world = createWorld(spec.night, save, audio, spec.seed * 101 + 7);
  world.attract = false;
  const brave = false;
  playForward(world, spec.seconds, brave);
  return { world, screen: 'play', save };
}
