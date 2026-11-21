// config.js — every tuning number for Moonpetal Heist lives here, in one place,
// so a balance pass never has to hunt through the game logic.
// Units: pixels, seconds, tiles of 32 px. The garden is 40 x 25 tiles (1280 x 800).
export const TILE = 32;
export const COLS = 40;
export const ROWS = 25;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 800

// ---- the moth-thief (player) ----
export const PLAYER = {
  radius: 11,
  walkSpeed: 132, // px per second, quiet
  sneakSpeed: 78, // crouched: slower, harder to see, silent
  runSpeed: 205, // loud: guards hear the footsteps
  accel: 1400,
  friction: 1200,
  // How far a guard can spot the moth at full light, in px, by stance.
  // Sneaking shrinks the moth's silhouette; running flares it.
  spotRadiusWalk: 1.0,
  spotRadiusSneak: 0.62,
  spotRadiusRun: 1.18,
};

// ---- guards: the Lantern Keepers ----
export const GUARD = {
  radius: 13,
  patrolSpeed: 62,
  investigateSpeed: 96,
  chaseSpeed: 148,
  // Vision cone: a lantern's beam, sweeping the dark.
  coneRange: 208,
  coneHalfAngle: (38 * Math.PI) / 180,
  // Suspicion (0..100) fills while the moth is seen in the light.
  suspicionPerSecondSeen: 46, // ~2.2 s of full exposure to trip the bell
  suspicionPerSecondNear: 78, // closer than 70 px fills much faster
  nearDistance: 74,
  suspicionDecayPerSecond: 26, // hidden again: the keeper calms down
  investigateThreshold: 34, // "Did I see something?" — walk over and look
  alarmThreshold: 100, // the bell tolls
  // After losing the moth, a chasing keeper searches this long, then gives up.
  searchSeconds: 3.2,
  // A keeper that heard a noise walks to the sound, looks around, then returns.
  lookAroundSeconds: 2.4,
  // How far a noise carries, by what made it.
  hearRun: 190,
  hearPuff: 260,
  hearPetal: 90,
  // Lantern-Bearer: a wider, longer beam, but a slow walker.
  bearerConeRange: 252,
  bearerConeHalfAngle: (30 * Math.PI) / 180,
  bearerSpeed: 44,
  // Night Watcher: stands still, sweeps its beam back and forth.
  watcherSweepDegrees: 110,
  watcherSweepSeconds: 5.0,
};

// ---- light and shadow ----
// A lantern lights the tiles around it; standing in lantern-light while inside a
// cone is what gets the moth seen. Bushes and tall grass hide the moth even in light.
export const LIGHT = {
  lanternRadius: 150, // px of warm light around a lantern post
  moonRadius: 420, // the moon gate's cold glow
  // How much the dark protects: suspicion fills at this fraction in shadow.
  shadowProtection: 0.12,
  bushProtection: 0.0, // inside a bush the moth cannot be seen at all
};

// ---- the alarm ----
export const ALARM = {
  bellSeconds: 6.0, // the bell tolls this long; every keeper converges
  calmSeconds: 4.0, // then the garden settles and patrols resume
  chaseGiveUpSeconds: 3.2,
};

// ---- pollen puff (the distraction) ----
export const PUFF = {
  startCharges: 3,
  maxCharges: 5,
  throwSpeed: 320,
  throwRange: 230,
  burstRadius: 70, // guards inside the burst walk to it
  lingerSeconds: 5.0, // glowing pollen hangs in the air
};

// ---- moonpetals and glimmer (score) ----
export const SCORE = {
  petalGlimmer: 100,
  nightClearBonus: 250,
  unseenBonus: 400, // finish a night never once tripping the bell
  petalPerfectBonus: 300, // every petal in the night
  swiftBonus: 200, // beat the night's par time
  timeBonusPerSecond: 4, // each second under par adds glimmer
  sealPerNight: 3, // Unseen, Petal Perfect, Swift Moth
};

// ---- the seven nights ----
export const NIGHTS = 7;
export const PAR_SECONDS = [75, 95, 110, 120, 135, 150, 180];

// ---- mothcraft upgrades (the meta shop) ----
export const UPGRADES = [
  {
    id: 'silent-wings',
    name: 'Silent Wings',
    cost: 400,
    max: 3,
    desc: 'Each rank: +12% walk speed and -20% footstep noise. The moth flies like a rumour.',
  },
  {
    id: 'dewdrop',
    name: 'Dewdrop Charm',
    cost: 350,
    max: 3,
    desc: 'Each rank: suspicion fills 15% slower. Morning dew dulls the keepers\u2019 eyes.',
  },
  {
    id: 'pollen-pouch',
    name: 'Pollen Pouch',
    cost: 300,
    max: 2,
    desc: 'Each rank: +1 pollen puff charge every night. Always carry spare sparkle.',
  },
  {
    id: 'long-antennae',
    name: 'Long Antennae',
    cost: 450,
    max: 1,
    desc: 'The minimap shows every keeper, their facing and their patrol route. Knowledge is a kind of dark.',
  },
  {
    id: 'mooncloak',
    name: 'Mooncloak',
    cost: 600,
    max: 1,
    desc: 'Once per night, being caught only costs the cloak: the moth melts into moonlight and the keepers lose the trail.',
  },
];

// ---- palette: a garden at night, lit by lanterns ----
export const PALETTE = {
  lawnDark: '#0d2417',
  lawn: '#12301f',
  lawnLight: '#17402a',
  path: '#3a2f22',
  pathEdge: '#2c2318',
  hedge: '#0a3d1e',
  hedgeTop: '#14663a',
  hedgeDark: '#072a14',
  bush: '#1d5c33',
  bushDark: '#123f22',
  grass: '#1e6b3a',
  pond: '#0e3a4d',
  pondLight: '#17617d',
  lanternGlow: '#ffb347',
  lanternCore: '#ffd98a',
  moon: '#e8f1ff',
  moonGate: '#bcd2ff',
  petal: '#ff9ecf',
  petalCore: '#ffe3f2',
  moth: '#f2ead8',
  mothWing: '#c9b8ff',
  keeper: '#d8c08a',
  keeperCloak: '#7a5a2e',
  bearer: '#e0a458',
  ringer: '#c97b7b',
  watcher: '#9db4d8',
  cone: 'rgba(255, 179, 71, 0.20)',
  coneHot: 'rgba(255, 90, 60, 0.30)',
  hud: '#f2ead8',
  danger: '#ff6b5e',
  safe: '#7be0a3',
};

// ---- screenshot scenes (?shot=...) ----
// Deterministic, seeded scenes so the four screenshots are real renders of the
// game's own code, taken by the maker, and reproducible.
export const SHOTS = {
  cover: { night: 3, seconds: 8, seed: 7 },
  patrol: { night: 1, seconds: 9, seed: 3 },
  alarm: { night: 4, seconds: 17, seed: 11 },
  meta: { night: 0, seconds: 0, seed: 1 }, // the night-select screen
};
