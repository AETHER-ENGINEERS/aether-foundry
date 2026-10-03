# Sample studio

`createSeed()` in `src/lib/engine/seed.ts` builds the project named **Floor 1**. Restoring the sample from the Engines desk loads this again. These notes describe that data, not a promise that your edited studio still matches.

Two engines. Five systems. Six things. Nine terrains. Three world laws. The mechanics are the climate and the choices.

## Shared library

**Stats.** Vigor 0–100 (start 100), hunger 0–100 (start 20), nerve 0–100 (start 80), gold 0–12 (start 0), faith 0–100 (start 0).

**Terrains.**

| id | floor? | digs into | yield |
| --- | --- | --- | --- |
| rock | no | — | — |
| earth | no | flag | — |
| gold | no | flag | 2 gold |
| flag | yes | — | — |
| water | yes | — | — |
| hatchery | yes | — | — |
| treasury | yes | — | — |
| grass | yes | — | — |
| shrine | yes | — | — |

**Things.** Imp (`worker`), beetle (`guard`), hero (`intruder`), hen (`food`), follower (`faithful`, `parish`), elder (`elder`, `parish`). Starting stats in the seed override hunger, nerve, gold, vigor, or faith where the blurb needs a head start. Read the blurbs in `seed.ts`. They are the design intent. The laws are the implementation.

**Systems.**

| id | on in | intent |
| --- | --- | --- |
| appetite | Undercroft | hunger climbs, and it outranks the job |
| toil | Undercroft | open earth, cut seams, bank what you carry |
| nerve | Undercroft | guards hold; intruders steal and run |
| drift | both | if nothing sharper can act, still move |
| devotion | Parish | faith and hunger trade places at the shrine |

## Undercroft

Pitch: *Imps owe the earth. Heroes owe the hoard. Hunger outranks both.*

Map is 16 by 12. A rock border. Hatchery in the upper left. Flagstone halls. A treasury pocket on the upper right. A block of earth with a gold seam in the middle. Water along the lower right. Opening bodies are placed from those cells: imps and hens on the hatchery, beetles on flagstone near the treasury, one hero on flagstone far from it.

Beat length 420 ms.

**World laws.** Brood: a hen on hatchery every 12 beats, cap 5. Raid: a hero on flagstone every 24 beats, cap 2.

**How the laws are meant to tangle.** Lower numbers win. Pulses are not in that contest.

Climate, every beat:

- Hunger clock adds 2 hunger to workers, guards, and intruders. Damp adds another 2 while they stand on water. The body fails once hunger is at least 94: vigor drops by 8. Collapse comes only when vigor hits 0, not on the first hungry beat.
- Nerve frays takes 6 nerve from an intruder with a guard within 2. Catch breath gives 2 nerve back when no guard is within 4.

Choices, sharpest first:

- Eat at the hatchery (8) if hunger is at least 20 and they are already standing there. Hunger drops by 28. The seam waits.
- Scoff a hen (9) if hunger is at least 36 and food is adjacent. Hunger drops, and the hen is removed.
- Slip the gate (11): an intruder carrying at least 3 gold, already on the edge, leaves. That counts as slipped.
- Nerve breaks (12): an intruder at 32 nerve or less, with a guard within 3, steps away from the guard.
- Bank the seam (14): a worker on the treasury, carrying any gold, deposits it into the hoard.
- Make for the door (16): an intruder with at least 3 gold steps toward the edge. Slip is what finishes the theft, and only on the edge.
- Seek a meal (18) once hunger is at least 64: step toward the hatchery. This is the "hunger outranks gold" line. It is not as sharp as eating, scoffing, or a worker who is already on the treasury with gold in hand.
- Haul to the treasury (22) when a worker carries at least 2 gold.
- Rob the treasury (24): an intruder standing on the treasury and carrying at most 2 gold takes 1 from the hoard, if the hoard can pay. One coin a beat.
- Hold the hall (26): a guard strikes an adjacent intruder for 14 vigor, and otherwise steps toward one.
- Work the seam (30): a worker carrying at most 1 gold digs toward gold. Earth in the way comes out on the way.
- Seek the hoard (34): an intruder still under 3 gold steps toward the treasury.
- Open the earth (44): a worker digs toward earth. This only wins when the sharper jobs cannot act, which is how a finished seam becomes more floor.
- Pan the seam (48): an intruder who is not yet carrying 3 gold, and who cannot do a sharper theft, digs toward gold.
- Idle feet (200) wanders. It is the floor under both toys.

A beetle's hold-the-hall loses to eating and to scoffing a hen. Hunger is supposed to pull the guard off the post. That gap is how a raid gets through.

## Parish

Pitch: *Faith gathers at the shrine. Crowds undo it. Nothing here is a dungeon.*

Map is 14 by 10. Rock border, grass, a shrine block, a small water. One elder on the shrine, four followers on the far grass. Beat length 480 ms. Systems: devotion and drift only. Undercroft's hunger, digging, and raids do not run here, even though those laws are still in the library.

**World law.** Kin: a follower on the shrine every 8 beats, cap 7.

**How it is meant to tangle.**

- Field hunger (pulse) adds 2 hunger to anyone tagged `parish`. Both followers and the elder carry that tag.
- Keep the post (order, priority 10) sends the elder toward the shrine. Once the elder is standing on it, that seek fails, so it does not block the next law.
- At the shrine (14) is anyone tagged `parish` who is on the shrine: hunger down 12, faith up 8.
- Disperse (16) if at least three `faithful` are within radius 1: step away from `faithful`. The elder is not tagged `faithful`, so the elder is not pushed by this and does not count toward it.
- Seek the shrine (24) when hunger is at least 48. Low faith (28) when faith is at most 24. Both lose to disperse and to feeding when those can act.
- Drift still fidgets anyone an order did not move.

The parish has no gold and no hoard. Faith is the score that matters, and only because a law reads it.

## What a good change looks like

Change one priority or one threshold. Step Parish and Undercroft both, even if you think the edit was local. A new tag that only one engine's laws mention is safe. A new effect is a foundry change: both toys may start using it the moment someone writes a law, because the library is shared.
