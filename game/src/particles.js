// particles.js — the small lights of the garden: fireflies drifting over the
// lawn, pollen bursting pink and gold, moon motes around the gate, footstep
// dust, and the expanding noise rings that show what a keeper can hear.
// Particles are cheap, short-lived, and purely visual — except the noise rings,
// which are the game's way of telling the player how loud they are being.
import { makeRng } from './random.js';

export function createParticles(seed) {
  return {
    list: [],
    fireflies: [],
    rng: makeRng(seed),
  };
}

/** Seed the ambient fireflies for a night: they drift all game long. */
export function seedFireflies(world, count) {
  const rng = makeRng(world.seed * 31 + 7);
  for (let i = 0; i < count; i += 1) {
    world.particles.fireflies.push({
      x: rng.range(40, world.width - 40),
      y: rng.range(40, world.height - 40),
      phase: rng.range(0, Math.PI * 2),
      speed: rng.range(0.2, 0.7),
      size: rng.range(1.2, 2.4),
      hue: rng.pick(['#ffe066', '#bcd2ff', '#ff9ecf']),
    });
  }
}

/** A burst of coloured sparks at a point. */
export function burst(world, x, y, colour, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.particles.rng.next() * Math.PI * 2;
    const speed = world.particles.rng.range(30, 130);
    world.particles.list.push({
      kind: 'spark',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: world.particles.rng.range(0.4, 0.9),
      maxLife: 0.9,
      size: world.particles.rng.range(1.5, 3.5),
      colour,
    });
  }
}

/** A soft puff of dust where a footstep landed. */
export function footstepDust(world, x, y, running) {
  world.particles.list.push({
    kind: 'dust',
    x: x + world.particles.rng.range(-4, 4),
    y: y + world.particles.rng.range(-4, 4),
    vx: 0,
    vy: -6,
    life: 0.5,
    maxLife: 0.5,
    size: running ? 4 : 2.5,
    colour: 'rgba(200, 190, 160, 0.5)',
  });
}

/** An expanding ring that shows how far a sound carries. */
export function noiseRing(world, x, y, radius, colour) {
  world.particles.list.push({
    kind: 'ring',
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.8,
    maxLife: 0.8,
    size: 6,
    radius,
    colour: colour || 'rgba(255, 220, 120, 0.7)',
  });
}

/** Moon motes that rise from the gate while it stands open. */
export function gateMotes(world, dt) {
  if (!world.gateOpen) return;
  world.moteTimer = (world.moteTimer || 0) - dt;
  if (world.moteTimer <= 0) {
    world.moteTimer = 0.12;
    world.particles.list.push({
      kind: 'mote',
      x: world.exit.x + world.particles.rng.range(-26, 26),
      y: world.exit.y + world.particles.rng.range(-10, 10),
      vx: world.particles.rng.range(-6, 6),
      vy: -world.particles.rng.range(12, 30),
      life: world.particles.rng.range(0.8, 1.6),
      maxLife: 1.6,
      size: world.particles.rng.range(1.5, 3),
      colour: '#bcd2ff',
    });
  }
}

export function updateParticles(world, dt) {
  const list = world.particles.list;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const pt = list[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    if (pt.kind === 'spark') {
      pt.vx *= 1 - 2.4 * dt;
      pt.vy *= 1 - 2.4 * dt;
    }
  }
  for (const fly of world.particles.fireflies) {
    fly.phase += dt * fly.speed;
    fly.x += Math.sin(fly.phase * 0.7) * 12 * dt;
    fly.y += Math.cos(fly.phase * 0.5) * 9 * dt;
  }
  gateMotes(world, dt);
}

export function drawParticles(ctx, world) {
  // Fireflies first, under everything but the dark.
  for (const fly of world.particles.fireflies) {
    const glow = 0.45 + 0.4 * Math.sin(fly.phase * 2.2);
    ctx.globalAlpha = Math.max(0.08, glow);
    ctx.fillStyle = fly.hue;
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, fly.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const pt of world.particles.list) {
    const k = pt.life / pt.maxLife;
    if (pt.kind === 'ring') {
      const radius = pt.radius * (1 - k) + 8;
      ctx.globalAlpha = k * 0.8;
      ctx.strokeStyle = pt.colour;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pt.kind === 'mote') {
      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = pt.colour;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = k;
      ctx.fillStyle = pt.colour;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (pt.kind === 'dust' ? (1.6 - k * 0.6) : 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
