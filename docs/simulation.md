# Simulation

`stepWorld` in `src/lib/engine/sim-core.js` is the whole runtime. It is pure: it clones the yard and returns the next one. It does not read the clock, the canvas, or the network. Chance is a hash, so the same yard and the same law ids step the same way.

`diagnose` runs the order contest without writing, so the inspector can say why.

## One beat

1. Clone the yard. Increment `tick`.
2. **World laws**, in list order. Skip a law whose system is off for this engine. If `tick % every === 0` and the living count of `thingId` is under `cap`, pick a random passable cell of `onTerrain` and add a body. Log the arrival.
3. For each body that was already in the list at the start of this loop (a body born this beat does not act yet):
   - If it is dead, skip.
   - Fill any missing stat from the definition. Increment `age`.
   - **Pulses.** Every enabled pulse whose conditions hold runs, in list order. The last one to run stamps `law` / `lawId` on the body.
   - **Orders.** Enabled orders sort by `priority` ascending, then by name. Walk them. The first one that matches *and* can act is applied, stamped onto the body, and the rest are skipped.
   - If `vigor` is 0 or below, the body dies and the log says it collapsed.
4. Return the new yard. The log keeps the last 48 lines.

A body created by a world law on this beat is in the yard for drawing and for other bodies' "near" tests only after the world-law phase. It does not take a turn until the next beat, because the id list was captured before the entity loop. Bodies removed mid-loop (eaten, slipped away) are skipped when their own id comes up if they are already dead. A later body in the same beat can still see them as dead.

## When an order "can act"

The step copies the yard, tries the order on the copy, and commits only if at least one effect returned success.

Effects inside one law run in written order. The first effect that **steps** ends the law; later effects in that law do not run. Effects before that step do run (a stat change, then a step).

Seeking a terrain you are already standing on returns failure, not success. So an order whose only act is "step toward the shrine" does not win while you are on the shrine, and the next order may. A failed effect does not by itself fail the law if an earlier effect in the same law already succeeded.

If no order can act, the body keeps its previous law name. Its trace becomes "No order can act" only when it has never had a law.

## Conditions

All of them must hold. An empty `when` means always.

| op | holds when |
| --- | --- |
| `always` | always |
| `tag` | the body's thing has any of `any` |
| `stat` | the stat is `>= value` (`gte`) or `<= value` (`lte`) |
| `on` | the cell's terrain id equals `terrain` |
| `nearThing` | some other living body with that tag is within `radius` |
| `awayThing` | no such body |
| `nearTerrain` | a cell of that terrain is within `radius`, including the body's own cell |
| `crowd` | the count of other living bodies with that tag within `radius` compares to `value` |
| `onEdge` | Chebyshev distance to the map border is 0 or 1 |
| `every` | `age % n === 0` (`n` at least 1) |
| `chance` | `hash(tick \| entityId \| lawId) % 100 < pct` |

Missing stats read as 0. Unknown ops do not hold.

Near and crowd use Chebyshev distance (diagonals count as 1). They do not care whether a wall is in the way.

## Effects

| op | success means |
| --- | --- |
| `stat` | add `delta`, then clamp to the stat's min and max. Always succeeds. |
| `seekThing` | step one cell along a four-way path toward the nearest other body with that tag. The goal cell itself must be passable or the step is refused. |
| `seekTerrain` | step toward the nearest cell of that terrain, through passable ground. Already standing on it fails. |
| `digToward` | same, but the path may enter a diggable tile. Entering one excavates it instead of moving. Already standing on the target fails. |
| `fleeThing` | step to the orthogonal neighbor that most increases distance from the nearest body with that tag, anywhere on the map. No such body, or no better step, fails. |
| `fleeEdge` | step to a neighbor closer to the border. |
| `wander` | step to a random passable neighbor. The pick is a hash of tick, body id, and the word `wander`. No neighbor fails. |
| `excavate` | if the current cell is diggable and has `becomes`, replace it, add any yield to the body, and log it. This does not count as a step, so later effects in the law still run. |
| `hurt` | the nearest body with that tag at radius 1 loses `amount` of `stat` (the amount is forced positive). |
| `removeNearest` | that neighbor dies. The log says "ate". |
| `deposit` | if the body carries more than 0 of `stat`, add that amount to `yard.hoard` and set the carried stat to 0. |
| `withdraw` | if the hoard has at least `amount`, subtract it from the hoard and add it to the body's stat. |
| `vanishIf` | if the stat compares, the body dies. Tally `left` increments `yard.left`. Anything else increments `yard.stolen`. The log says "slipped away". |

Paths are breadth-first, four directions, first step only. There is no diagonal move, no blocking by other bodies (they may share a cell), and no action points beyond "one step ends the order".

Digging writes the new terrain immediately, so a later law on a later body in the same beat sees the opened ground.

## Death

Two ways, both set `alive` to false:

- `vigor` is at or below 0 after the body's pulses and order. The sample hens start at vigor 30; nothing in the sample lowers vigor unless a law says so.
- `removeNearest` or a successful `vanishIf`.

Dead bodies stay in the list so the log and the tallies still make sense. They are not drawn as living, they do not act, and they do not count as near.

## World laws versus orders

A world law does not look at hunger or tags. It only checks the clock, the cap, and whether any passable cell of the named terrain exists. If the terrain is impassable (a gold seam, a wall), it will not spawn there. Brood uses hatchery, which is passable. A seam is not a nest.

## What the step will not do

It will not run a system the open engine did not allow. It will not invent a verb that is not in the effect table. It will not move more than one cell for an order. It will not use terrain tags. It will not persist the yard; the studio saves the project (the blueprint), and a reload boots the yard again.
