// random.js — a small seeded generator (mulberry32) plus the helpers the game
// leans on: picking, shuffling, jittering, and the firefly drift that makes the
// garden feel alive. Seeded, so a screenshot scene replays exactly.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    /** Float in [min, max). */
    range(min, max) {
      return min + next() * (max - min);
    },
    /** Integer in [min, max] inclusive. */
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** One element of an array. */
    pick(array) {
      return array[Math.floor(next() * array.length)];
    },
    /** True with probability p. */
    chance(p) {
      return next() < p;
    },
    /** A shuffled copy of an array (Fisher-Yates). */
    shuffle(array) {
      const copy = array.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        const tmp = copy[i];
        copy[i] = copy[j];
        copy[j] = tmp;
      }
      return copy;
    },
    /** Gaussian-ish jitter: the sum of three uniforms, centred on 0. */
    jitter(amount) {
      return (next() + next() + next() - 1.5) * (2 / 3) * amount;
    },
  };
}

/** Clamp a number into [min, max]. */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Distance between two points. */
export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Angle from (ax, ay) to (bx, by). */
export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

/** Smallest signed difference between two angles, in (-PI, PI]. */
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/** Ease-out cubic, for UI slides and the moon gate's opening glow. */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/** Ease-in-out sine, for the watchers' slow beam sweeps. */
export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
