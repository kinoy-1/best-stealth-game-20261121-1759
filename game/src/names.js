// names.js — the words of the garden: night titles, keeper names, the little
// log lines the keepers mutter, and the tips that teach the game without a manual.
// Nothing here is borrowed from any commercial game: the garden, its keepers and
// its moth-thief are invented for this entry.
export const GAME_TITLE = 'Moonpetal Heist';
export const GAME_SUBTITLE = 'a moth-thief, seven nights, one lantern garden';

export const NIGHT_NAMES = [
  'Night I — Petal Court',
  'Night II — Hedge Maze',
  'Night III — Koi Pond',
  'Night IV — Lantern Row',
  'Night V — Rose Vault',
  'Night VI — Bell Tower',
  'Night VII — Moon Gate',
];

export const NIGHT_FLAVOUR = [
  'The court is quiet. Two keepers walk the lanterns, and the moonpetals glow like small pink lamps.',
  'The hedges grow tall here and the paths turn back on themselves. Learn the patrols before you trust a shortcut.',
  'Koi drift under the pond and the keepers cross the bridges slowly. Water hides nothing — stay off the open stone.',
  'Every lantern is lit tonight and every path is bright. The dark between the lanterns is thin. Move like a shadow between candles.',
  'The roses are thick and the bushes are deep. The bell-ringer walks here now, and his bell is quicker than your wings.',
  'The tower bell hangs above the court. Five keepers, one bell, no place to hide that is not already watched.',
  'The Moon Gate stands open at the far end of the garden. Take every petal, pass every keeper, and vanish before dawn.',
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
  ];
  const extra = seals === 3 ? ' All three moth-seals, too — the garden will tell this story for years.' : '';
  return lines[nightIndex] + extra;
}
