// scoring.js — what a finished night is worth, and the three moth-seals.
// Glimmer is the garden's currency: petals pay, clearing pays, and the seals
// pay more. A night's result is three yes/no questions — were you ever seen,
// did you take every petal, did you beat the par time — plus the time bonus
// for finishing fast. The seals are the game's memory of a perfect night.
import { SCORE, PAR_SECONDS } from './config.js';
import { SEAL_NAMES } from './names.js';

/**
 * Score a finished night. Returns the glimmer earned, the seals mask
 * (1 Unseen, 2 Petal Perfect, 4 Swift Moth) and a line per seal for the card.
 */
export function scoreNight(world) {
  const nightIndex = world.nightIndex;
  const par = PAR_SECONDS[nightIndex];
  const unseen = !world.bellRang;
  const perfect = world.petalsTaken >= world.petals.length;
  const swift = world.time <= par;
  let glimmer = world.glimmer + SCORE.nightClearBonus;
  const lines = [];
  lines.push({ text: `Night clear  +${SCORE.nightClearBonus}`, earned: true });

  if (unseen) {
    glimmer += SCORE.unseenBonus;
    lines.push({ text: `Unseen — the bell never tolled  +${SCORE.unseenBonus}`, earned: true });
  } else {
    lines.push({ text: 'Unseen — the bell tolled once', earned: false });
  }
  if (perfect) {
    glimmer += SCORE.petalPerfectBonus;
    lines.push({ text: `Petal Perfect — every petal  +${SCORE.petalPerfectBonus}`, earned: true });
  } else {
    lines.push({ text: `Petal Perfect — ${world.petalsTaken} of ${world.petals.length} petals`, earned: false });
  }
  if (swift) {
    glimmer += SCORE.swiftBonus;
    const timeBonus = Math.round((par - world.time) * SCORE.timeBonusPerSecond);
    glimmer += timeBonus;
    lines.push({ text: `Swift Moth — under par (${formatTime(world.time)} vs ${formatTime(par)})  +${SCORE.swiftBonus + timeBonus}`, earned: true });
  } else {
    lines.push({ text: `Swift Moth — par is ${formatTime(par)}, you took ${formatTime(world.time)}`, earned: false });
  }

  const seals = (unseen ? 1 : 0) | (perfect ? 2 : 0) | (swift ? 4 : 0);
  return { glimmer, seals, lines, unseen, perfect, swift, par };
}

/** "1:23" for a number of seconds. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest < 10 ? '0' : ''}${rest}`;
}

/** The three seal names with whether this night earned each one. */
export function sealList(sealsMask) {
  return SEAL_NAMES.map((name, i) => ({ name, earned: Boolean(sealsMask & (1 << i)) }));
}

/** Rank a night's play in words, for the result card's headline. */
export function nightRank(seals) {
  if (seals === 7) return 'A flawless night — the garden never knew you were there.';
  if (seals >= 5) return 'A fine night of thieving. The keepers suspect nothing.';
  if (seals >= 3) return 'A good night. A little noise, a little moonlight, all the petals.';
  if (seals >= 1) return 'The night is yours, though the bell remembers you.';
  return 'You escaped — and that, some nights, is enough.';
}
