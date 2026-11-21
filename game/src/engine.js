// engine.js — the heart of the game: it builds a night's world, runs the loop,
// and owns the screen state machine (title, how-to, night select, shop, intro,
// play, pause, caught, complete). Everything the other modules compute, the
// engine calls in the right order, sixty times a second.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, PAR_SECONDS, GUARD } from './config.js';
import { LEVELS, parseLevel } from './levels.js';
import { makeRng } from './random.js';
import { createPlayer, updatePlayer, throwPuff, onExit } from './player.js';
import { createGuards, updateGuards, alertGuardsToNoise } from './guards.js';
import { updateDetection } from './detection.js';
import { updateItems, checkExit } from './items.js';
import { createParticles, seedFireflies, burst, footstepDust, noiseRing, updateParticles } from './particles.js';
import { drawWorld } from './render.js';
import {
  drawPlayHud, drawTitle, drawHowTo, drawNightSelect, drawShop,
  drawNightIntro, drawPause, drawCaught, drawComplete, isInside,
} from './hud.js';
import { loadSave, storeSave, awardNight, buyUpgrade, upgradeRanks } from './meta.js';
import { scoreNight } from './scoring.js';
import { UPGRADES } from './config.js';

export function createWorld(nightIndex, save, audio, seed) {
  const parsed = parseLevel(nightIndex);
  const upgrades = {};
  for (const up of UPGRADES) upgrades[up.id] = upgradeRanks(save, up.id);
  const world = {
    nightIndex,
    seed: seed || (1000 + nightIndex * 77),
    width: VIEW_W,
    height: VIEW_H,
    time: 0,
    grid: parsed.grid,
    petals: parsed.petals,
    lanterns: parsed.lanterns,
    exit: parsed.exit,
    petalsNeeded: parsed.level.petalsNeeded,
    petalsTaken: 0,
    glimmer: 0,
    parSeconds: PAR_SECONDS[nightIndex],
    guards: [],
    puffs: [],
    floatTexts: [],
    particles: null,
    maxSuspicion: 0,
    seenBy: new Set(),
    alarm: { phase: 'none', timer: 0 },
    bellRang: false,
    gateOpen: false,
    caught: false,
    caughtBy: null,
    complete: false,
    mooncloakUsed: false,
    upgrades,
    save,
    audio,
    rng: makeRng((seed || (1000 + nightIndex * 77)) * 13 + 5),
    moteTimer: 0,
    result: null,
    attract: false, // menu backdrop: the garden lives, but nobody is caught
  };
  world.player = createPlayer(parsed.playerStart, upgrades);
  world.guards = createGuards(parsed.level);
  world.particles = createParticles(world.seed);
  seedFireflies(world, 46);
  world.onFootstep = (p) => onFootstep(world, p);
  world.burst = (x, y, colour, count) => burst(world, x, y, colour, count);
  world.addFloatText = (x, y, text, colour, life) => {
    world.floatTexts.push({ x, y, text, colour, life: life || 1.4, maxLife: life || 1.4 });
  };
  return world;
}

/** A footstep: dust, a sound, and — when running — a ring the keepers hear. */
export function onFootstep(world, p) {
  footstepDust(world, p.x, p.y + 8, p.running);
  if (!world.attract) {
    world.audio.footstep(p.running, p.sneaking);
    if (p.running) {
      const radius = GUARD.hearRun * p.noiseFactor;
      noiseRing(world, p.x, p.y, radius);
      alertGuardsToNoise(world, p.x, p.y, radius);
    }
  }
}

export function createGame(canvas, audio) {
  const ctx = canvas.getContext('2d');
  const save = loadSave();
  const game = {
    canvas,
    ctx,
    audio,
    save,
    screen: 'title',
    returnTo: 'title', // where "Back" goes from how-to / shop
    world: null,
    ui: { hover: null, buttons: [] },
    lastTime: 0,
    nightIndex: 0,
  };
  game.world = createWorld(0, save, audio, 1000);
  game.world.attract = true;
  return game;
}

/** Start a night: fresh world, intro card first. */
export function startNight(game, nightIndex) {
  game.nightIndex = nightIndex;
  game.save.nightsPlayed += 1;
  storeSave(game.save);
  game.world = createWorld(nightIndex, game.save, game.audio, 1000 + nightIndex * 77);
  game.screen = 'intro';
}

/** The intro card's button: the night itself begins. */
export function beginPlay(game) {
  game.world.attract = false;
  game.world.time = 0;
  game.screen = 'play';
  game.audio.init();
}

/** Finish a night: score it, bank it, show the card. */
export function completeNight(game) {
  const world = game.world;
  world.complete = true;
  world.result = scoreNight(world);
  const awarded = awardNight(game.save, world.nightIndex, world.result.seals, world.result.glimmer);
  world.result.newSeals = awarded.newSeals;
  game.audio.seal();
  game.screen = 'complete';
}

/** One frame of simulation while playing. */
export function updatePlay(game, input, dt) {
  const world = game.world;
  world.time += dt;
  if (input.pressed.pause) {
    game.screen = 'pause';
    return;
  }
  if (input.pressed.mute) game.audio.toggleMute();
  if (input.pressed.puff) {
    throwPuff(world, input.mouseX, input.mouseY);
  }
  updatePlayer(world, input, dt);
  updateGuards(world, dt);
  updateDetection(world, dt);
  updateItems(world, dt);
  updateParticles(world, dt);
  for (let i = world.floatTexts.length - 1; i >= 0; i -= 1) {
    world.floatTexts[i].life -= dt;
    if (world.floatTexts[i].life <= 0) world.floatTexts.splice(i, 1);
  }
  if (world.caught) {
    game.screen = 'caught';
    return;
  }
  if (checkExit(world)) {
    completeNight(game);
  }
}

/** The menu backdrop: guards patrol, fireflies drift, nobody is caught. */
export function updateAttract(game, dt) {
  const world = game.world;
  world.time += dt;
  updateGuards(world, dt);
  updateParticles(world, dt);
  for (let i = world.floatTexts.length - 1; i >= 0; i -= 1) {
    world.floatTexts[i].life -= dt;
    if (world.floatTexts[i].life <= 0) world.floatTexts.splice(i, 1);
  }
}

/** Route a click to the current screen's buttons. */
export function handleClick(game, x, y) {
  const ui = game.ui;
  let hit = null;
  for (const b of ui.buttons) {
    if (isInside(x, y, b.x, b.y, b.w, b.h)) {
      hit = b.id;
      break;
    }
  }
  if (!hit) return;
  game.audio.init();
  game.audio.uiClick();
  const save = game.save;
  if (hit === 'begin') game.screen = 'select';
  else if (hit === 'how') {
    game.returnTo = 'title';
    game.screen = 'how';
  } else if (hit === 'shop') {
    game.returnTo = game.screen === 'complete' ? 'complete' : 'title';
    game.screen = 'shop';
  } else if (hit === 'back') {
    game.screen = game.returnTo === 'complete' ? 'complete' : game.returnTo;
  } else if (hit === 'title') game.screen = 'title';
  else if (hit.startsWith('night-')) {
    const index = parseInt(hit.slice(6), 10);
    if (index < save.unlocked) startNight(game, index);
  } else if (hit.startsWith('buy-')) {
    const id = hit.slice(4);
    const up = UPGRADES.find((u) => u.id === id);
    if (up && buyUpgrade(save, up)) game.audio.buy();
  } else if (hit === 'play') beginPlay(game);
  else if (hit === 'resume') game.screen = 'play';
  else if (hit === 'restart') startNight(game, game.nightIndex);
  else if (hit === 'quit') game.screen = 'select';
  else if (hit === 'retry') startNight(game, game.nightIndex);
  else if (hit === 'select') game.screen = 'select';
  else if (hit === 'next') {
    if (game.nightIndex + 1 < 7) startNight(game, game.nightIndex + 1);
    else game.screen = 'select';
  }
}

/** Hover tracking for button highlights. */
export function handleHover(game, x, y) {
  let hover = null;
  for (const b of game.ui.buttons) {
    if (isInside(x, y, b.x, b.y, b.w, b.h)) {
      hover = b.id;
      break;
    }
  }
  game.ui.hover = hover;
}

/** Draw the current screen. */
export function drawGame(game) {
  const { ctx, world } = game;
  switch (game.screen) {
    case 'title':
      drawTitle(ctx, world, game.ui);
      break;
    case 'how':
      drawHowTo(ctx, world, game.ui);
      break;
    case 'select':
      drawNightSelect(ctx, world, game.ui);
      break;
    case 'shop':
      drawShop(ctx, world, game.ui);
      break;
    case 'intro':
      drawNightIntro(ctx, world, game.ui);
      break;
    case 'play':
      drawWorld(ctx, world);
      drawPlayHud(ctx, world);
      break;
    case 'pause':
      drawPause(ctx, world, game.ui);
      break;
    case 'caught':
      drawCaught(ctx, world, game.ui);
      break;
    case 'complete':
      drawComplete(ctx, world, game.ui);
      break;
    default:
      drawWorld(ctx, world);
      break;
  }
}

/** One animation frame: update, then draw. */
export function frame(game, input, now) {
  const dt = Math.min(0.05, Math.max(0.0001, (now - game.lastTime) / 1000 || 0.016));
  game.lastTime = now;
  if (game.screen === 'play') {
    updatePlay(game, input, dt);
  } else if (game.screen === 'intro' || game.screen === 'title' || game.screen === 'select' || game.screen === 'shop' || game.screen === 'how') {
    updateAttract(game, dt);
    if (input.pressed.enter || input.pressed.space) {
      if (game.screen === 'intro') beginPlay(game);
    }
  } else if (game.screen === 'pause') {
    if (input.pressed.pause) game.screen = 'play';
  }
  if (input.pressed.mute) game.audio.toggleMute();
  if (input.clicked) {
    handleClick(game, input.clickX, input.clickY);
  }
  handleHover(game, input.mouseX, input.mouseY);
  drawGame(game);
  input.endFrame();
}
