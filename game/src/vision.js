// vision.js — what a keeper can see, and what the dark hides.
// A keeper's eye is a lantern beam: a cone with a range, an angle, and a line of
// sight that hedges, bushes, statues and lantern posts block. The moth is seen
// only when it stands in the cone AND in the light — shadow is a real mechanic,
// not a mood. Bushes and tall grass hide the moth outright.
import { GUARD, LIGHT, TILE } from './config.js';
import { SIGHT_BLOCKERS, HIDING, tileAt } from './levels.js';
import { clamp, dist, angleDiff } from './random.js';

/** Step along the segment in small hops; blocked if any hopped tile blocks sight. */
export function hasLineOfSight(grid, x1, y1, x2, y2) {
  const d = dist(x1, y1, x2, y2);
  const steps = Math.max(1, Math.ceil(d / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (SIGHT_BLOCKERS.has(tileAt(grid, x, y))) return false;
  }
  return true;
}

/** Is the moth standing in a hiding tile (bush or tall grass)? */
export function isHiddenInCover(grid, x, y) {
  return HIDING.has(tileAt(grid, x, y));
}

/** Light level at a point, 0 (deep dark) to 1 (lantern glare). */
export function lightAt(world, x, y) {
  let light = 0;
  for (const lantern of world.lanterns) {
    const d = dist(x, y, lantern.x, lantern.y);
    if (d < LIGHT.lanternRadius) {
      const fall = 1 - d / LIGHT.lanternRadius;
      light = Math.max(light, fall * fall);
    }
  }
  // The moon gate glows cold blue across its court.
  const gateD = dist(x, y, world.exit.x, world.exit.y);
  if (gateD < LIGHT.moonRadius) {
    light = Math.max(light, (1 - gateD / LIGHT.moonRadius) * 0.55);
  }
  return clamp(light, 0, 1);
}

/** Cone range and half-angle for a guard of this type. */
export function coneOf(guard) {
  if (guard.type === 'bearer') {
    return { range: GUARD.bearerConeRange, half: GUARD.bearerConeHalfAngle };
  }
  if (guard.type === 'watcher') {
    return { range: GUARD.coneRange * 1.1, half: GUARD.coneHalfAngle * 0.9 };
  }
  return { range: GUARD.coneRange, half: GUARD.coneHalfAngle };
}

/**
 * Can this guard see the moth right now? Returns 0 (no) or a strength 0..1.
 * Strength grows as the moth gets closer and stands brighter; a sneaking moth
 * in the dark at the edge of the cone barely registers.
 */
export function guardSeesMoth(world, guard) {
  const player = world.player;
  const d = dist(guard.x, guard.y, player.x, player.y);
  const cone = coneOf(guard);
  const stance = player.sneaking ? 0.62 : player.running ? 1.18 : 1.0;
  const effectiveRange = cone.range * stance;
  if (d > effectiveRange) return 0;
  // Inside a bush or tall grass the moth is invisible unless the keeper is
  // almost on top of it.
  if (isHiddenInCover(world.grid, player.x, player.y) && d > 42) return 0;
  const toMoth = Math.atan2(player.y - guard.y, player.x - guard.x);
  const off = Math.abs(angleDiff(guard.dir, toMoth));
  if (off > cone.half) return 0;
  if (!hasLineOfSight(world.grid, guard.x, guard.y, player.x, player.y)) return 0;
  // Light decides how fast the keeper's eye catches the moth.
  const light = lightAt(world, player.x, player.y);
  const litFactor = LIGHT.shadowProtection + (1 - LIGHT.shadowProtection) * light;
  const closeness = 1 - d / effectiveRange;
  const edge = 1 - off / cone.half; // dead-centre of the beam counts most
  return clamp(litFactor * (0.35 + 0.65 * closeness) * (0.5 + 0.5 * edge), 0, 1);
}

/** Is a point inside a guard's cone (ignoring light and cover)? Used by the render. */
export function pointInCone(guard, x, y) {
  const d = dist(guard.x, guard.y, x, y);
  const cone = coneOf(guard);
  if (d > cone.range) return false;
  const toPoint = Math.atan2(y - guard.y, x - guard.x);
  return Math.abs(angleDiff(guard.dir, toPoint)) <= cone.half;
}

/** The nearest lantern to a point, for the renderer's glow. */
export function nearestLantern(world, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const lantern of world.lanterns) {
    const d = dist(x, y, lantern.x, lantern.y);
    if (d < bestD) {
      bestD = d;
      best = lantern;
    }
  }
  return { lantern: best, distance: bestD };
}
