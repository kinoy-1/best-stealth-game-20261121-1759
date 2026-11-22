# Moonpetal Heist — design notes (revision 2)

You are Pip, a moth-thief. Ten nights, two gardens, one rule: never let
the bell toll.

## The two gardens

Nights I–VII play in the Lantern Garden: hedge maze, koi pond, lantern
rows, rose vault, bell tower, and the Moon Gate itself. Gather enough
moonpetals and the gate opens; slip through it and the night is yours.

Nights VIII–X play past the gate in the **Moonwell Garden**, a second
garden built for this revision. Its floors are **moonwell pools** — cold
blue water that glows like a stage. A moth within about 110 paces of a
pool is almost fully lit, cone or no cone, so the pools are the garden's
real walls: cross them behind a hedge, or not at all.

## The Pollen Hound

The new guard type. A hound hunts by **scent**, not sight: its cone is
short (150 paces) and wide (55° each way), and it smells close. When a
pollen puff bursts, every other keeper looks at the glow — a hound does
not. It follows the scent **back to where the moth stood when it threw
the puff**. The counter-play is the point: throw far, and never stand
where you threw from. Hounds run in pairs in Night IX, and their violet
scent-cones read differently from lamplight at a glance. Their names —
Brine, Sable, Wisp — are theirs alone.

## The Moonpetal Veil (E)

The new tool. Press E and Pip drops a circle of spun silk at its feet:
radius 72, six seconds, and no eye can find the moth inside it — not a
keeper, not a hound's nose. It does not move with you, it shimmers and
thins, and there is one charge a night to start. The **Veil Pouch**
upgrade buys more. A veil is an escape, not a cloak: step out only when
the way is clear.

## The Keeper's Ledger

A codex on the title screen. Seven entries — Lantern Keeper,
Lantern-Bearer, Bell-Ringer, Night Watcher, Pollen Hound, Moonpetal Veil,
Moonwell Pool — each with what Pip has learned and the weakness to use.
It is the game's memory: the patrol never changes, the bell-ringer walks
alone, the watcher's sweep is a rhythm, the hound's nose dies past 150
paces.

## Mothcraft (upgrades)

Seven now, bought with glimmer between nights: Silent Wings, Dewdrop
Charm, Pollen Pouch, Long Antennae, Mooncloak, and the two new ones —
**Veil Pouch** (350 glimmer, two ranks, +1 veil charge a night each) and
**Scent-Ward** (400 glimmer, two ranks, hounds fill with suspicion 30%
slower a rank and give up on a scent sooner). The shop fits all seven in
one screen.

## Progression

Ten nights, thirty moth-seals (Unseen, Petal Perfect, Swift Moth — three
a night), par times from 75 to 210 seconds. Nights VIII–X are harder in
a different way from I–VII: more guards, more wells, hounds that punish
the puff you already trusted. The night-select screen shows all ten in a
five-by-two grid with their seals.

## What this revision fixed

- Two lantern-box petals in the original seven nights were sealed inside
  solid walls and could never be reached (Night III row 18, Night V row
  18). Both boxes are open now, and every night was re-validated by
  breadth-first search: every petal reachable, the exit reachable, every
  guard waypoint walkable.
- The night-select screen, the shop, the how-to page and the title screen
  were re-laid-out for ten nights and seven upgrades instead of seven
  nights and five.

## The rules that never change

Patrols never change. Light exposes, shadow hides. A puff pulls eyes;
a veil hides a body; a hound follows a scent home. Watch, wait, then
move like a rumour.
