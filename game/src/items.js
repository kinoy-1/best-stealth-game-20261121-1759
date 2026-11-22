// items.js — moonpetals, the moon gate, and the pollen puffs in flight.
// Moonpetals are the night's goal: gather enough and the Moon Gate opens, a
// cold blue ring the moth can slip through. A petal picked up in the open
// makes a small sound — a keeper very close may hear the chime. Pollen puffs
// arc to where they were thrown, burst into glowing pollen, and pull every
// keeper in earshot over to look at the sparkle.
import { SCORE, PUFF, GUARD } from './config.js';
import { alertGuardsToNoise, alertHoundsToScent } from './guards.js';
import { dist } from './random.js';

export function updateItems(world, dt) {
  // Moonpetal Veils fade: silk thins, then the circle is gone.
  for (const veil of world.veils || []) veil.t -= dt;
  world.veils = (world.veils || []).filter((veil) => veil.t > 0);
  const p = world.player;
  // Moonpetals: drift close and the petal floats into the satchel.
  for (const petal of world.petals) {
    if (petal.taken) continue;
    petal.bob += dt;
    if (dist(p.x, p.y, petal.x, petal.y) < 26) {
      petal.taken = true;
      world.petalsTaken += 1;
      world.glimmer += SCORE.petalGlimmer;
      world.audio.petal();
      world.burst(petal.x, petal.y, '#ff9ecf', 14);
      world.addFloatText(petal.x, petal.y - 18, '+100 glimmer', '#ff9ecf', 1.2);
      // The chime carries a little way: a keeper standing close hears it.
      alertGuardsToNoise(world, petal.x, petal.y, GUARD.hearPetal);
      if (world.petalsTaken >= world.petalsNeeded && !world.gateOpen) {
        openGate(world);
      }
    }
  }

  // Pollen puffs in flight, then bursting, then lingering.
  for (const puff of world.puffs) {
    if (puff.state === 'flying') {
      puff.t += dt;
      const k = Math.min(1, puff.t / puff.flight);
      puff.x = p.x + (puff.tx - p.x) * k;
      puff.y = p.y + (puff.ty - p.y) * k;
      if (k >= 1) {
        puff.state = 'burst';
        puff.t = 0;
        world.audio.puffBurst();
        world.burst(puff.x, puff.y, '#ffe066', 22);
        alertGuardsToNoise(world, puff.x, puff.y, GUARD.hearPuff);
        // And the hounds: they do not come to the glow — they follow the
        // scent back to where the moth stood when it threw the puff.
        alertHoundsToScent(world, puff);
        world.addFloatText(puff.x, puff.y - 18, 'pollen!', '#ffe066', 1.4);
      }
    } else if (puff.state === 'burst') {
      puff.t += dt;
      if (puff.t > 0.4) {
        puff.state = 'lingering';
        puff.t = 0;
      }
    } else if (puff.state === 'lingering') {
      puff.t += dt;
      // The glow keeps pulling keepers in while it hangs in the air.
      if (puff.t < puff.linger) {
        for (const guard of world.guards) {
          if (guard.state === 'patrol' && dist(guard.x, guard.y, puff.x, puff.y) < PUFF.burstRadius + 60) {
            guard.lastSeenX = puff.x;
            guard.lastSeenY = puff.y;
            guard.lookTimer = GUARD.lookAroundSeconds;
            guard.state = 'investigate';
          }
        }
      } else {
        puff.state = 'done';
      }
    }
  }
  world.puffs = world.puffs.filter((puff) => puff.state !== 'done');
}

/** The gate swings open: cold moonlight, a chime, and the way home. */
export function openGate(world) {
  world.gateOpen = true;
  world.audio.gate();
  world.addFloatText(world.exit.x, world.exit.y - 30, 'THE MOON GATE OPENS', '#bcd2ff', 2.4);
  world.burst(world.exit.x, world.exit.y, '#bcd2ff', 26);
}

/** Is the night finished — moth on the open gate? */
export function checkExit(world) {
  if (!world.gateOpen || world.complete || world.caught) return false;
  const p = world.player;
  const d = dist(p.x, p.y, world.exit.x, world.exit.y);
  return d < 30;
}
