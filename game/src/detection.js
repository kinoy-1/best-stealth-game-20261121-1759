// detection.js — the suspicion meter, the bell, and the catch.
// Each keeper carries its own suspicion (0..100). While the moth is seen, it
// fills at a rate set by light, distance and the moth's stance; while hidden it
// drains. Crossing 34 makes the keeper come and look; crossing 100 tolls the
// bell, and every keeper converges. The bell rings for a few seconds, then the
// garden calms — unless the moth is caught first. The Mooncloak (an upgrade)
// forgives one catch per night: the moth melts into moonlight and the keepers
// lose the trail.
import { GUARD, ALARM } from './config.js';
import { guardSeesMoth } from './vision.js';
import { alertAllGuards, setThought } from './guards.js';
import { SUSPICIOUS_LINES, ALARM_LINES, CALM_LINES } from './names.js';
import { clamp } from './random.js';

export function updateDetection(world, dt) {
  const dewdrop = world.upgrades['dewdrop'] || 0;
  const fillSlow = 1 - 0.15 * dewdrop; // Dewdrop Charm dulls the keepers' eyes
  const scentWard = world.upgrades['scent-ward'] || 0;
  world.seenBy = new Set();
  let maxSuspicion = 0;

  for (const guard of world.guards) {
    const strength = guardSeesMoth(world, guard);
    if (strength > 0) {
      world.seenBy.add(guard.id);
      guard.hasSeen = true;
      const d = Math.hypot(guard.x - world.player.x, guard.y - world.player.y);
      // Scent-Ward: a hound's nose fills slower — the trail goes cold faster.
      const noseSlow = guard.type === 'hound' ? 1 - 0.3 * scentWard : 1;
      const rate = (d < GUARD.nearDistance ? GUARD.suspicionPerSecondNear : GUARD.suspicionPerSecondSeen) * strength * guard.senseFactor * fillSlow * noseSlow;
      guard.suspicion = clamp(guard.suspicion + rate * dt, 0, 100);
      guard.lastSeenX = world.player.x;
      guard.lastSeenY = world.player.y;
      // First stirrings: the keeper mutters and comes to look.
      if (guard.suspicion >= GUARD.investigateThreshold && guard.state === 'patrol') {
        guard.state = 'investigate';
        guard.lookTimer = GUARD.lookAroundSeconds;
        setThought(guard, world.rng.pick(SUSPICIOUS_LINES), 2.2);
        world.audio.suspicious();
      }
      // Full alarm: the bell tolls.
      if (guard.suspicion >= GUARD.alarmThreshold && world.alarm.phase === 'none') {
        ringBell(world, guard);
      }
    } else if (guard.state !== 'chase') {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecayPerSecond * dt);
      if (guard.suspicion < GUARD.investigateThreshold && guard.state === 'investigate' && guard.lookTimer <= 0) {
        guard.state = 'return';
      }
    }
    maxSuspicion = Math.max(maxSuspicion, guard.suspicion);
    // A chasing keeper that reaches the moth catches it.
    if (guard.state === 'chase') {
      const d = Math.hypot(guard.x - world.player.x, guard.y - world.player.y);
      if (d < 26 && !world.caught && !world.complete) {
        catchMoth(world, guard);
      }
    }
  }

  world.maxSuspicion = maxSuspicion;

  // The bell's own clock: toll, then calm, then patrols resume.
  if (world.alarm.phase === 'bell') {
    world.alarm.timer -= dt;
    if (world.alarm.timer <= 0) {
      world.alarm.phase = 'calm';
      world.alarm.timer = ALARM.calmSeconds;
      for (const guard of world.guards) {
        if (guard.state === 'chase') {
          guard.state = 'search';
          guard.lookTimer = GUARD.lookAroundSeconds;
        }
        setThought(guard, world.rng.pick(CALM_LINES), 2.0);
      }
    }
  } else if (world.alarm.phase === 'calm') {
    world.alarm.timer -= dt;
    if (world.alarm.timer <= 0) {
      world.alarm.phase = 'none';
      for (const guard of world.guards) {
        guard.suspicion = Math.min(guard.suspicion, 20);
      }
    }
  }
}

/** The bell tolls: lights flare, every keeper converges, the moth is hunted. */
export function ringBell(world, guard) {
  world.alarm.phase = 'bell';
  world.alarm.timer = ALARM.bellSeconds;
  world.bellRang = true;
  world.audio.bell();
  setThought(guard, world.rng.pick(ALARM_LINES), 2.5);
  alertAllGuards(world, world.player.x, world.player.y);
  world.addFloatText(world.player.x, world.player.y - 24, 'THE BELL TOLLS!', '#ff6b5e', 2.2);
}

/** A keeper caught the moth. The Mooncloak forgives once; otherwise the night ends. */
export function catchMoth(world, guard) {
  if (world.mooncloakUsed === false && (world.upgrades['mooncloak'] || 0) > 0) {
    world.mooncloakUsed = true;
    world.audio.mooncloak();
    world.addFloatText(world.player.x, world.player.y - 24, 'MOONCLOAK! The keepers lose you…', '#bcd2ff', 2.6);
    // The moth melts away: keepers search where it was, then give up.
    for (const g of world.guards) {
      if (g.state === 'chase') {
        g.state = 'search';
        g.lookTimer = GUARD.lookAroundSeconds;
        g.suspicion = 40;
      }
    }
    // Shove the moth a little way into the dark, as the cloak carries it.
    world.player.x = clamp(world.player.x - 90, 48, world.width - 48);
    world.player.y = clamp(world.player.y + 40, 48, world.height - 48);
    world.alarm.phase = 'calm';
    world.alarm.timer = 2.0;
    return;
  }
  world.caught = true;
  world.caughtBy = guard.name;
  world.audio.caught();
}
