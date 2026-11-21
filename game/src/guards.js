// guards.js — the Lantern Keepers. Four kinds, one state machine:
//   patrol -> suspicious (investigate) -> chase -> search -> return to patrol.
//   keeper: the everyday patrol. bearer: a wide slow lantern-beam.
//   ringer: raises the alarm faster and calls the others in.
//   watcher: stands still and sweeps its beam like a slow lighthouse.
// A keeper that hears a noise walks to the sound and looks around; a keeper
// that sees the moth clearly enough fills with suspicion, and at 100 the bell
// tolls. Patrols are learnable: the same route, the same pauses, every night.
import { GUARD, TILE } from './config.js';
import { KEEPER_NAMES, BEARER_NAMES, RINGER_NAMES, WATCHER_NAMES } from './names.js';
import { walkableAt, tileAt } from './levels.js';
import { clamp, angleDiff, easeInOutSine } from './random.js';

const TYPE_NAMES = {
  keeper: KEEPER_NAMES,
  bearer: BEARER_NAMES,
  ringer: RINGER_NAMES,
  watcher: WATCHER_NAMES,
};

export function createGuards(levelData) {
  return levelData.guards.map((g, i) => {
    const [tx, ty] = g.path[0];
    const names = TYPE_NAMES[g.type] || KEEPER_NAMES;
    const baseSpeed = g.type === 'bearer' ? GUARD.bearerSpeed : GUARD.patrolSpeed;
    return {
      id: i,
      type: g.type,
      name: names[g.name % names.length],
      path: g.path.map(([px, py]) => ({ x: px * TILE + TILE / 2, y: py * TILE + TILE / 2 })),
      waypointIndex: 0,
      pause: g.pause,
      pauseTimer: 0,
      speedFactor: g.speed || 1,
      baseSpeed,
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
      dir: 0,
      state: 'patrol', // patrol | investigate | chase | search | return
      suspicion: 0,
      searchTimer: 0,
      lookTimer: 0,
      lastSeenX: 0,
      lastSeenY: 0,
      hasSeen: false,
      noiseX: 0,
      noiseY: 0,
      sweepPhase: (i * 1.7) % 1,
      thought: null, // floating line above the keeper's head
      thoughtTimer: 0,
      exclaimTimer: 0,
      // The bell-ringer's suspicion fills faster: he trusts his eyes.
      senseFactor: g.type === 'ringer' ? 1.45 : g.type === 'bearer' ? 0.9 : 1.0,
    };
  });
}

/** Face a target point smoothly, at a limited turn rate. */
function turnToward(guard, tx, ty, dt, rate) {
  const want = Math.atan2(ty - guard.y, tx - guard.x);
  const diff = angleDiff(guard.dir, want);
  const step = clamp(diff, -rate * dt, rate * dt);
  guard.dir += step;
}

/** Move toward a point, sliding along walls; returns true when arrived. */
function moveToward(world, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  const nx = guard.x + (dx / d) * step;
  const ny = guard.y + (dy / d) * step;
  if (walkableAt(world.grid, nx, guard.y, GUARD.radius)) guard.x = nx;
  if (walkableAt(world.grid, guard.x, ny, GUARD.radius)) guard.y = ny;
  guard.dir = Math.atan2(dy, dx);
  return d - step < 4;
}

export function setThought(guard, text, seconds) {
  guard.thought = text;
  guard.thoughtTimer = seconds;
}

export function updateGuards(world, dt) {
  for (const guard of world.guards) {
    if (guard.thoughtTimer > 0) guard.thoughtTimer -= dt;
    else guard.thought = null;
    if (guard.exclaimTimer > 0) guard.exclaimTimer -= dt;

    if (guard.type === 'watcher') {
      updateWatcher(world, guard, dt);
      continue;
    }

    if (guard.state === 'patrol') {
      const target = guard.path[guard.waypointIndex];
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        // While paused the keeper looks around slowly, scanning the garden.
        guard.dir += Math.sin(world.time * 0.9 + guard.id) * 0.35 * dt;
      } else if (moveToward(world, guard, target.x, target.y, guard.baseSpeed * guard.speedFactor, dt)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.path.length;
        guard.pauseTimer = guard.pause;
      }
    } else if (guard.state === 'investigate') {
      // Walk to the last thing that stirred suspicion, then look around.
      if (moveToward(world, guard, guard.lastSeenX, guard.lastSeenY, GUARD.investigateSpeed * guard.speedFactor, dt)) {
        guard.lookTimer -= dt;
        guard.dir += 1.6 * dt; // slow scan
        if (guard.lookTimer <= 0) {
          guard.state = 'return';
          guard.suspicion = Math.max(guard.suspicion, 12);
        }
      }
    } else if (guard.state === 'chase') {
      // The moth is in sight: run at it. If the trail goes cold, search.
      const seen = world.seenBy.has(guard.id);
      if (seen) {
        guard.lastSeenX = world.player.x;
        guard.lastSeenY = world.player.y;
        guard.searchTimer = GUARD.searchSeconds;
      }
      moveToward(world, guard, guard.lastSeenX, guard.lastSeenY, GUARD.chaseSpeed * guard.speedFactor, dt);
      turnToward(guard, guard.lastSeenX, guard.lastSeenY, dt, 9);
      if (!seen) {
        guard.searchTimer -= dt;
        if (guard.searchTimer <= 0) {
          guard.state = 'search';
          guard.lookTimer = GUARD.lookAroundSeconds;
        }
      }
    } else if (guard.state === 'search') {
      guard.lookTimer -= dt;
      guard.dir += 2.2 * dt;
      if (guard.lookTimer <= 0) {
        guard.state = 'return';
        guard.suspicion = 30;
      }
    } else if (guard.state === 'return') {
      // Walk back to the nearest waypoint and resume the patrol.
      let best = guard.path[0];
      let bestD = Infinity;
      for (const wp of guard.path) {
        const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
        if (d < bestD) {
          bestD = d;
          best = wp;
        }
      }
      if (moveToward(world, guard, best.x, best.y, guard.baseSpeed * guard.speedFactor, dt)) {
        guard.waypointIndex = guard.path.indexOf(best);
        guard.state = 'patrol';
        guard.suspicion = Math.max(0, guard.suspicion - 20);
      }
    }

    // A keeper that is not chasing calms down slowly when nothing stirs.
    if (guard.state !== 'chase' && guard.suspicion > 0 && !world.seenBy.has(guard.id)) {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecayPerSecond * 0.4 * dt);
    }
  }
}

/** The watcher never walks: it sweeps its beam across its court. */
function updateWatcher(world, guard, dt) {
  guard.sweepPhase += dt / GUARD.watcherSweepSeconds;
  const t = (guard.sweepPhase % 2) < 1 ? guard.sweepPhase % 1 : 1 - (guard.sweepPhase % 1);
  const sweep = easeInOutSine(t);
  const centre = guard.path[0] ? Math.atan2(world.exit.y - guard.y, world.exit.x - guard.x) : 0;
  const half = (GUARD.watcherSweepDegrees * Math.PI) / 180 / 2;
  guard.dir = centre + (sweep * 2 - 1) * half;
}

/** Every keeper in earshot of a noise turns toward it and investigates. */
export function alertGuardsToNoise(world, x, y, radius) {
  for (const guard of world.guards) {
    if (guard.state === 'chase') continue;
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d <= radius) {
      guard.lastSeenX = x;
      guard.lastSeenY = y;
      guard.lookTimer = GUARD.lookAroundSeconds;
      if (guard.state === 'patrol' || guard.state === 'return') {
        guard.state = 'investigate';
        guard.suspicion = Math.max(guard.suspicion, GUARD.investigateThreshold * 0.6);
      }
    }
  }
}

/** The bell tolls: every keeper converges on the moth's last known place. */
export function alertAllGuards(world, x, y) {
  for (const guard of world.guards) {
    guard.lastSeenX = x;
    guard.lastSeenY = y;
    guard.searchTimer = GUARD.searchSeconds;
    if (guard.type !== 'watcher') {
      guard.state = 'chase';
      guard.suspicion = GUARD.alarmThreshold;
    } else {
      guard.suspicion = GUARD.investigateThreshold;
    }
  }
}
