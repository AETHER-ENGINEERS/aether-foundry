# Source map

Paths are the foundry. A host app mounts `Studio` on a route. That host is not in this repository.

## The step

| file | role |
| --- | --- |
| `src/lib/engine/sim-core.js` | `bootRuntime`, `stepWorld`, `diagnose`. The only simulation. |
| `src/lib/engine/sim.ts` | typed imports of those three, for the studio. |
| `src/lib/engine/types.ts` | the nouns: project, engine, law, yard, desk, selection. |
| `src/lib/engine/phrase.ts` | condition, effect, and law sentences. Display only. |
| `src/lib/engine/drafts.ts` | blank conditions, effects, and world laws when a desk adds one. |

If you change a condition or an effect, touch `types.ts`, `sim-core.js`, `phrase.ts`, and `docs/simulation.md` in the same change. A new op that the step understands and the sentence cannot say will ship as "a test" or "act". A new op the sentence names and the step ignores will not hold, or will not succeed.

## The studio data

| file | role |
| --- | --- |
| `src/lib/engine/seed.ts` | Floor 1: Undercroft, Parish, and the shared library. |
| `src/lib/engine/store.ts` | the project, the yard, the open desk, run/step/reset, edits, bake, incoming laws. Saved on device as `aether-foundry-v1`. |
| `src/lib/engine/license.ts` | the license string packed into engines. Must match `LICENSE`. Do not edit the wording. |

## Drawing and packing

| file | role |
| --- | --- |
| `src/lib/engine/tones.ts` | tone name to color, shared by the canvas. |
| `src/lib/engine/draw-yard.ts` | paints tiles, marks, sprites, selection. |
| `src/lib/engine/export-xdc.ts` | player HTML, snapshot, icon, zip entries. Embeds `sim-core.js`. |
| `src/lib/engine/zip.ts` | a stored-method zip. No compression library. |
| `src/lib/engine/webxdc.ts` | the small `window.webxdc` surface the desks call: inside-Vector check, file pick, image downscale, base64. |

## Desks

| file | desk |
| --- | --- |
| `src/components/studio/studio.tsx` | shell, desk list, engine menu, run timer, incoming banner. |
| `src/components/studio/paddock.tsx` | run / step / reset / speed, counts, canvas. |
| `src/components/studio/yard-canvas.tsx` | sizing and clicks. |
| `src/components/studio/things-desk.tsx` | cast. |
| `src/components/studio/systems-desk.tsx` | systems and stats. |
| `src/components/studio/laws-desk.tsx` | mechanics, world laws, the English sentence. |
| `src/components/studio/ground-desk.tsx` | terrains and blueprint painting. |
| `src/components/studio/assets-desk.tsx` | imported pictures. |
| `src/components/studio/engines-desk.tsx` | the list of toys, studio title, restore sample. |
| `src/components/studio/vector-desk.tsx` | download, send, share laws, preview. |
| `src/components/studio/inspector.tsx` | selection, including diagnosis. |
| `src/components/studio/ui.tsx` | buttons, fields, the stage heading. |

`src/styles.css` is the palette (ink, panel, brass, moss, bone) and the type (Fraunces for the name, Outfit for the rest). Desk layout is utility classes against those tokens.

## A change, in order

1. Say which toy it is for, or say it is a foundry change.
2. If it is a new verb or test, extend the step, the types, the sentence, and `docs/simulation.md`.
3. If it changes how Undercroft or Parish behave, update `docs/samples.md`.
4. If it changes the file we hand to Vector, update `docs/packing.md`.
5. If you renamed a word people will search for, update `docs/glossary.md`.
6. Leave `LICENSE` and the string in `license.ts` alone.
