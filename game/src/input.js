// input.js — keyboard and mouse, kept in one place so the engine never reads
// the DOM directly. WASD or arrows to move, Shift to run, C or Ctrl to sneak,
// Q or right-click to throw a pollen puff, Space to confirm, Esc/P to pause,
// M to mute. The mouse position is tracked in canvas pixels for aiming puffs
// and clicking menu buttons.
export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    run: false,
    sneak: false,
    mouseX: 640,
    mouseY: 400,
    mouseDown: false,
    clicked: false, // set on mousedown, consumed by the engine each frame
    clickX: 0,
    clickY: 0,
    pressed: {}, // edge-triggered keys, consumed by the engine each frame
    anyKey: false,
  };

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    ShiftLeft: 'run',
    ShiftRight: 'run',
    KeyC: 'sneak',
    ControlLeft: 'sneak',
    ControlRight: 'sneak',
  };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    const field = KEYMAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'Space') {
      input.pressed.space = true;
      event.preventDefault();
    }
    if (event.code === 'KeyQ') input.pressed.puff = true;
    if (event.code === 'KeyE') input.pressed.veil = true;
    if (event.code === 'Escape' || event.code === 'KeyP') input.pressed.pause = true;
    if (event.code === 'KeyM') input.pressed.mute = true;
    if (event.code === 'Enter') input.pressed.enter = true;
    input.anyKey = true;
  });

  window.addEventListener('keyup', (event) => {
    const field = KEYMAP[event.code];
    if (field) input[field] = false;
  });

  canvas.addEventListener('mousemove', (event) => {
    const pos = canvasPos(event);
    input.mouseX = pos.x;
    input.mouseY = pos.y;
  });

  canvas.addEventListener('mousedown', (event) => {
    const pos = canvasPos(event);
    input.mouseX = pos.x;
    input.mouseY = pos.y;
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = pos.x;
    input.clickY = pos.y;
    if (event.button === 2) input.pressed.puff = true;
  });

  canvas.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });

  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  /** Clear the edge-triggered flags after a frame has consumed them. */
  input.endFrame = function endFrame() {
    input.clicked = false;
    input.pressed = {};
    input.anyKey = false;
  };

  return input;
}
