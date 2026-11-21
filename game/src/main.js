// main.js — the bootstrap. One canvas, one game, one loop.
// With ?shot=cover|patrol|alarm|meta in the URL, it renders a single
// deterministic screenshot scene instead of starting the loop: that is how
// the entry's four screenshots are taken, from the game's own code.
import { VIEW_W, VIEW_H } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createGame, frame, drawGame } from './engine.js';
import { buildShot } from './shots.js';
import { drawWorld } from './render.js';
import { drawPlayHud, drawNightSelect } from './hud.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

if (shot) {
  // Screenshot mode: one frozen frame, drawn synchronously, then stop.
  // The capture tool reads window.__shotReady to know the frame is done.
  try {
    const { world, screen } = buildShot(shot);
    if (screen === 'select') {
      drawWorld(ctx, world);
      drawNightSelect(ctx, world, { hover: null, buttons: [] });
    } else {
      drawWorld(ctx, world);
      drawPlayHud(ctx, world);
    }
    window.__shotReady = true;
    window.__shotWorld = world;
  } catch (err) {
    document.title = 'SHOT ERROR: ' + (err && err.message ? err.message : err);
    window.__shotError = String(err && err.stack ? err.stack : err);
  }
} else {
  const audio = createAudio();
  const input = createInput(canvas);
  const game = createGame(canvas, audio);
  // First gesture unlocks audio, as browsers require.
  const unlock = () => audio.init();
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  const loop = (now) => {
    frame(game, input, now);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
