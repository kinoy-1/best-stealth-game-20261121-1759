// meta.js — the garden remembers: unlocked nights, moth-seals, the glimmer
// bank, and the Mothcraft upgrades bought with it. Saved in localStorage under
// one key, loaded on boot, and never sent anywhere. A new player starts with
// Night I open, no seals, and an empty satchel.
import { UPGRADES, NIGHTS } from './config.js';

const SAVE_KEY = 'moonpetal-heist-save-v1';

export function emptySave() {
  return {
    unlocked: 1, // nights are 1-based here: night 1 is open
    seals: [0, 0, 0, 0, 0, 0, 0], // bitmask per night: 1 Unseen, 2 Petal Perfect, 4 Swift
    glimmerBank: 0,
    upgrades: {}, // id -> ranks owned
    nightsPlayed: 0,
    nightsCleared: 0,
    bestGlimmer: 0,
  };
}

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    const save = emptySave();
    if (typeof parsed.unlocked === 'number') save.unlocked = Math.min(NIGHTS, Math.max(1, parsed.unlocked));
    if (Array.isArray(parsed.seals)) {
      for (let i = 0; i < NIGHTS; i += 1) save.seals[i] = parsed.seals[i] | 0;
    }
    if (typeof parsed.glimmerBank === 'number') save.glimmerBank = Math.max(0, parsed.glimmerBank | 0);
    if (parsed.upgrades && typeof parsed.upgrades === 'object') save.upgrades = parsed.upgrades;
    if (typeof parsed.nightsPlayed === 'number') save.nightsPlayed = parsed.nightsPlayed;
    if (typeof parsed.nightsCleared === 'number') save.nightsCleared = parsed.nightsCleared;
    if (typeof parsed.bestGlimmer === 'number') save.bestGlimmer = parsed.bestGlimmer;
    return save;
  } catch (err) {
    return emptySave();
  }
}

export function storeSave(save) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (err) {
    // A browser that refuses storage still plays: the night is just forgotten.
  }
}

/** Total moth-seals earned across all nights (21 at most). */
export function totalSeals(save) {
  let total = 0;
  for (const mask of save.seals) {
    if (mask & 1) total += 1;
    if (mask & 2) total += 1;
    if (mask & 4) total += 1;
  }
  return total;
}

/** Record a finished night: seals, unlock the next night, bank the glimmer. */
export function awardNight(save, nightIndex, sealsMask, glimmerEarned) {
  const before = save.seals[nightIndex];
  save.seals[nightIndex] = before | sealsMask;
  save.nightsCleared += 1;
  save.unlocked = Math.max(save.unlocked, Math.min(NIGHTS, nightIndex + 2));
  save.glimmerBank += glimmerEarned;
  save.bestGlimmer = Math.max(save.bestGlimmer, glimmerEarned);
  storeSave(save);
  return { newSeals: sealsMask & ~before, unlockedNight: save.unlocked };
}

/** Can this upgrade be bought now, and what does the next rank cost? */
export function upgradeState(save, upgrade) {
  const owned = save.upgrades[upgrade.id] || 0;
  const maxed = owned >= upgrade.max;
  const cost = upgrade.cost * (owned + 1);
  return { owned, maxed, cost, affordable: !maxed && save.glimmerBank >= cost };
}

/** Buy one rank of an upgrade. Returns false when it cannot be bought. */
export function buyUpgrade(save, upgrade) {
  const state = upgradeState(save, upgrade);
  if (state.maxed || !state.affordable) return false;
  save.glimmerBank -= state.cost;
  save.upgrades[upgrade.id] = (save.upgrades[upgrade.id] || 0) + 1;
  storeSave(save);
  return true;
}

/** Ranks owned of one upgrade id (0 when none). */
export function upgradeRanks(save, id) {
  return save.upgrades[id] || 0;
}

/** A short line describing what the save holds, for the title screen. */
export function saveSummary(save) {
  const seals = totalSeals(save);
  if (save.nightsPlayed === 0) return 'A new moth arrives at the garden gate.';
  return `${seals} moth-seal${seals === 1 ? '' : 's'} · ${save.nightsCleared} night${save.nightsCleared === 1 ? '' : 's'} cleared · ${save.glimmerBank} glimmer in the satchel`;
}

export { UPGRADES };
