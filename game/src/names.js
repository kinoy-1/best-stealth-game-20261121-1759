// names.js — the words of the garden: night titles, keeper names, the little
// log lines the keepers mutter, and the tips that teach the game without a manual.
// Nothing here is borrowed from any commercial game: the garden, its keepers and
// its moth-thief are invented for this entry.
export const GAME_TITLE = 'Moonpetal Heist';
export const GAME_SUBTITLE = 'a moth-thief, ten nights, two gardens';

export const NIGHT_NAMES = [
  'Night I — Petal Court',
  'Night II — Hedge Maze',
  'Night III — Koi Pond',
  'Night IV — Lantern Row',
  'Night V — Rose Vault',
  'Night VI — Bell Tower',
  'Night VII — Moon Gate',
  'Night VIII — Moonwell',
  'Night IX — Moonwell Deep',
  'Night X — The Last Petal',
];

export const NIGHT_FLAVOUR = [
  'The court is quiet. Two keepers walk the lanterns, and the moonpetals glow like small pink lamps.',
  'The hedges grow tall here and the paths turn back on themselves. Learn the patrols before you trust a shortcut.',
  'Koi drift under the pond and the keepers cross the bridges slowly. Water hides nothing — stay off the open stone.',
  'Every lantern is lit tonight and every path is bright. The dark between the lanterns is thin. Move like a shadow between candles.',
  'The roses are thick and the bushes are deep. The bell-ringer walks here now, and his bell is quicker than your wings.',
  'The tower bell hangs above the court. Five keepers, one bell, no place to hide that is not already watched.',
  'The Moon Gate stands open at the far end of the garden. Take every petal, pass every keeper, and vanish before dawn.',
  'Past the gate, a second garden: cold moonwell pools light a moth like a stage, and a hound hunts by scent.',
  'The wells are everywhere now and the hounds run in pairs. A puff thrown here is a trail home.',
  'The last petal grows in the middle of everything: every keeper, every hound, every well, one garden.',
];

export const KEEPER_NAMES = [
  'Keeper Bramble',
  'Keeper Wren',
  'Keeper Sorrel',
  'Keeper Moss',
  'Keeper Fen',
  'Keeper Lark',
  'Keeper Thorn',
  'Keeper Pipkin',
];

export const BEARER_NAMES = ['Lantern-Bearer Ash', 'Lantern-Bearer Cole', 'Lantern-Bearer Ember'];
export const RINGER_NAMES = ['Bell-Ringer Toll', 'Bell-Ringer Chime', 'Bell-Ringer Peal'];
export const WATCHER_NAMES = ['Night Watcher Owl', 'Night Watcher Mothbane', 'Night Watcher Still'];
export const HOUND_NAMES = ['Pollen Hound Brine', 'Pollen Hound Sable', 'Pollen Hound Wisp'];

// What a keeper says when suspicion first stirs (shown as a floating thought).
export const SUSPICIOUS_LINES = [
  '…did something move?',
  'Hm. The petals are trembling.',
  'A moth? At this hour?',
  'I heard wings.',
  'The light feels… watched.',
  'Who brushed the roses?',
];

// What a keeper says when the bell tolls.
export const ALARM_LINES = [
  'THIEF! Light the lanterns!',
  'The bell! The bell! To the gate!',
  'Something is stealing the moonpetals!',
  'Close the garden! No moth leaves tonight!',
];

// What a keeper says when the trail goes cold.
export const CALM_LINES = [
  '…only the wind, then.',
  'Nothing. Back to the lanterns.',
  'The garden keeps its secrets.',
  'False alarm. The moths laugh at us.',
];

// Tips shown on the night-intro card, one per night, teaching as you play.
export const NIGHT_TIPS = [
  'Stay out of the yellow cones. Crouch (C) to move slower and smaller — keepers spot a crouched moth much later.',
  'Bushes hide you completely, even inside a cone. Wait in the green until a patrol passes.',
  'Lantern light makes you visible. The dark between lanterns is your road.',
  'Running (Shift) is fast but loud: keepers hear footsteps and come to look. Walk when a keeper is near.',
  'Press Q to throw a pollen puff: the glow pulls every nearby keeper to look at it instead of you.',
  'The bell-ringer raises the alarm faster than other keepers. Never let him see you twice.',
  'The Moon Gate opens only when you hold enough moonpetals. The last night forgives nothing — patience wins it.',
  'Moonwell pools glow cold blue and light you up. Never cross one in the open — and never throw a puff near a hound: it follows the scent home.',
  'Press E to drop a Moonpetal Veil: a circle of silk no eye can see through, for six seconds. It does not move with you — step out only when the way is clear.',
  'Everything you learned, at once. Veil the crossing, puff the far corner, and let the hounds chase a scent that is not you.',
];

export const SEAL_NAMES = ['Unseen', 'Petal Perfect', 'Swift Moth'];
export const SEAL_DESCS = [
  'Finish the night without the bell ever tolling.',
  'Gather every moonpetal in the night.',
  'Finish before the par time runs out.',
];

// Lines for the moth-thief's own journal, shown on the night-complete card.
export function journalLine(nightIndex, seals) {
  const lines = [
    'One night down. The petals hum in my satchel like a small pink choir.',
    'The hedges tried to keep me. They failed. The maze is mine now.',
    'The koi watched me pass and said nothing. Good fish.',
    'So many lanterns, so little dark — and still I was never once a shadow with a name.',
    'The roses kept me. The bell-ringer looked right through me. Tonight the vault is empty.',
    'The tower bell never rang. I walked out under it like a rumour.',
    'The Moon Gate is behind me and dawn is coming. Seven nights, and the garden never once caught its moth.',
    'The second garden is colder and bluer, and the hound smelled my puff before I finished throwing it. Lesson learned, petal kept.',
    'Two hounds, one scent, and me in the middle of it — I let them chase the wind and took the deep petals while they sniffed the dark.',
    'Ten nights. Every petal, every keeper outwaited, every hound outwitted. The garden is mine, and dawn can have the rest.',
  ];
  const extra = seals === 3 ? ' All three moth-seals, too — the garden will tell this story for years.' : '';
  return lines[nightIndex] + extra;
}

// The Keeper's Ledger: the moth's field notes on everything that hunts it.
// Each entry is what Pip has learned — and the weakness to use.
export const LEDGER = [
  {
    name: 'Lantern Keeper',
    colour: '#d8c08a',
    text: 'Walks a fixed patrol, lantern sweeping. Slow to suspect, slower to run. Weakness: the patrol never changes — learn it, then walk behind it.',
  },
  {
    name: 'Lantern-Bearer',
    colour: '#e0a458',
    text: 'A wider, longer beam on a slow walker. Weakness: the beam is narrow at its edges and he turns like a cart — slip past his flank.',
  },
  {
    name: 'Bell-Ringer',
    colour: '#c97b7b',
    text: 'Trusts his eyes: his suspicion fills half again as fast, and his bell is quicker than your wings. Weakness: he walks alone, and a puff pulls him like any keeper.',
  },
  {
    name: 'Night Watcher',
    colour: '#9db4d8',
    text: 'Never walks. Sweeps its beam like a slow lighthouse across its court. Weakness: the sweep is a rhythm — cross while it looks the other way.',
  },
  {
    name: 'Pollen Hound',
    colour: '#8a6fc0',
    text: 'Hunts by scent, not sight: a short, wide nose-cone, and it follows a pollen puff back to where the moth threw it. Weakness: its nose dies past 150 paces — throw far, and never stand where you threw from.',
  },
  {
    name: 'Moonpetal Veil',
    colour: '#c9b8ff',
    text: 'Your own trick, spun from silk: press E to drop a circle no eye can see through, for six seconds. It does not move — step out only when the way is clear.',
  },
  {
    name: 'Moonwell Pool',
    colour: '#7fd4ff',
    text: 'Cold blue water that glows like a stage. A moth near a moonwell is almost fully lit, cone or no cone. Cross behind a hedge, or not at all.',
  },
];
