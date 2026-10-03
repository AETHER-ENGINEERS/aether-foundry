# How the engine works

This file is inside the `.xdc`. Read it here. The readable source is the other files in this same archive. `index.html` is a minified bundle so Vector can boot the studio as one page. It is not the source, and it is not a second implementation. Do not fetch `source_code_url` to review this package, and do not ask for the files below to be pasted. They are already in the zip.

If this note and `src/lib/engine/sim-core.js` disagree, the JavaScript is the step that runs. The notes are supposed to match it. A mismatch is a bug.

## What to open, in this archive

1. This file.
2. `src/lib/engine/sim-core.js` — `bootRuntime`, `stepWorld`, `diagnose`. Pure. No React.
3. `src/lib/engine/types.ts` — stats, terrains, things, mechanics, world laws, engines, the yard.
4. `src/lib/engine/seed.ts` — `createSeed()`, the Undercroft and the Parish, already wired.
5. `src/lib/engine/phrase.ts` — the English reading of a law. The step never parses that English.
6. `src/lib/engine/store.ts` — edits, the device save `aether-foundry-v1`, and an incoming studio from the chat.
7. `src/components/studio/` — the desks. They edit the project. They do not step the yard themselves.
8. `docs/simulation.md` — the condition and effect tables, in full.
9. `docs/desks.md`, `docs/samples.md`, `docs/glossary.md`, `docs/packing.md`.
10. `src/lib/engine/export-xdc.ts` — how a packed yard is written. `src/lib/engine/zip.ts` — stored zip, classic end-of-central-directory, no Zip64.

`xdc/main.tsx` is the unbundled entry: it renders `Studio` and nothing else. The root `index.html` is that entry after the bundler. React, Zustand, and Lucide live only in that bundle, under their own terms.

## The idea

A developer does not write a loop per creature. They name things, ground, and laws. Laws are data. The paddock runs one shared step so the laws can be watched. That is the whole foundry: a creator of engines, not one game.

Two sample engines share one cast and one law list. The Undercroft is imps, beetles, and a hoard. The Parish is hens, a hero, and an elder. An engine turns systems on or off. A system that is off silences its mechanics and its world laws on that engine only.

## One beat

`stepWorld` clones the yard and returns the next one. It does not read the clock, the canvas, or the network. Chance is `hash(tick, entityId, lawId) % 100`, so the same yard and the same law ids step the same way.

`diagnose` runs the order contest without writing, so the inspector can say why a body did what it did.

1. Clone. Increment `tick`.
2. World laws, in list order. Skip a law whose system is off. If `tick % every === 0` and the living count of `thingId` is under `cap`, place that thing on a passable cell of `onTerrain`.
3. For each body already in the list at the start of the loop (a body born this beat does not act yet):
   - Dead bodies are skipped. Missing stats are filled. `age` increments.
   - Pulses whose conditions hold all run, in list order. The last one stamps `law` / `lawId`.
   - Orders sort by `priority` ascending, then by name. The first one that matches and can act is applied. The rest are skipped.
   - If `vigor` is at or below 0, the body dies.
4. The log keeps the last 48 lines.

An order "can act" when a dry-run copy reports at least one successful effect. Effects in one law run in written order. The first effect that steps ends the law. Seeking a terrain the body is already standing on fails, so a lower-priority order can run instead.

Near and crowd use Chebyshev distance. Movement is four-way, one step, breadth-first. Bodies may share a cell. Digging writes the new terrain immediately, so a later body in the same beat sees the opened ground.

The condition and effect verbs are the tables in `docs/simulation.md`. The switch that implements them is in `sim-core.js`. Adding a verb means adding it in three places: the type in `types.ts`, the phrase in `phrase.ts`, and the step.

## What the desks edit

Nothing in the studio is a separate save file. One project is the cast, the laws, the ground, the assets, and the engines.

- Paddock runs, pauses, steps, and resets the open engine. Reset rebuilds the yard from the blueprint. It does not discard laws.
- Things, Systems, Laws, and Ground edit definitions. The Laws desk shows `lawSentence`. That sentence is a reading aid.
- Assets import pictures through `importFiles` when Vector is present, else a file input. Sprites are scaled to 64 pixels. They are drawing only. The step does not read them.
- Engines are named yards: which systems are on, the map, the spawns, `tickMs`.
- Vector packs the open engine, or sends the laws to the chat as `{ type: "studio", project }` with sprite bytes stripped. `offerIncoming` holds that snapshot until it is applied. Local sprite bytes are kept when the ids match.

## Two packages

This archive is the foundry: the desks.

The Vector desk also builds a smaller `.xdc` for the open engine. That file is a yard, not the desks. Its player inlines this same `sim-core.js` (exports removed so it runs without a bundler) and writes three review files beside `index.html`: `src/lib/engine/sim-core.js`, `engine.json` (the blueprint), and `HOW-THIS-RUNS.md`. Assets are not packed. The player can run, step, reset, place a body, and share a beat or a spawn with `sendUpdate`.
