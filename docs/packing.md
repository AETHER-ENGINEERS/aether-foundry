# Packing and Vector

Two different packages:

- **This repository** ships `aether-foundry.xdc`. That file is the desks. Send that file. Do not send GitHub's Download ZIP: it is Zip64, the page is inside a folder, and Vector answers "Could not find EOCD".
- **The Vector desk** packs the *open engine* into its own smaller `.xdc`. That file is a yard, not the foundry. The desks do not go inside it.

## The foundry package

| entry | what it is |
| --- | --- |
| `review/00-START-HERE.md` | short on purpose. Read this first. It names the sim-core.js and store.ts parts. |
| `review/parts/` | every long file split into pieces under 4000 bytes, so a reader that cuts files at about 4500 bytes still receives each piece whole. |
| `src/` | the readable studio and the step. `src/lib/engine/sim-core.js` is the simulation. |
| `docs/` | the contract, the desks, the samples, the glossary. |
| `index.html` | the studio, one page, minified so Vector can boot it. Not the source. The license is an HTML comment at the top. A second comment points at the files above. |
| `manifest.toml` | `name` is Aether Foundry. `source_code_url` is this repository. The source the reviewer needs is already in the archive. |
| `icon.png` | the brass mark. |
| `LICENSE.txt` | the same text as the comment. |

`webxdc.js` is referenced from `index.html` and is provided by Vector when the file is opened there. It is not stored in the repository. In a normal browser the missing script is a harmless 404, and the desks still run.

`node build-xdc.mjs` rebuilds `index.html` and `icon.png` from `xdc/main.tsx` and the desks. Do that after changing the studio, or the packaged page will be the previous one.

## The engine file

`packEngine` writes a zip of uncompressed entries (stored, not deflated) and downloads it as `<engine-name>.xdc`.

| entry | what it is |
| --- | --- |
| `HOW-THIS-RUNS.md` | how the packed yard steps, and where the readable files are in that same archive. |
| `src/lib/engine/sim-core.js` | the step, unbundled, with its exports. |
| `engine.json` | the blueprint that was packed. |
| `index.html` | the player. The license text is an HTML comment at the top, before the doctype. The first script is the same step. |
| `manifest.toml` | `name` (the engine name) and `source_code_url` (this repository). |
| `LICENSE.txt` | the same license text as [`LICENSE`](../LICENSE), unaltered. |
| `icon.png` | a generated brass mark on ink, when the browser can paint a canvas. |

The player HTML embeds two things:

1. The text of `sim-core.js`, wrapped so `bootRuntime` and `stepWorld` sit on a small runtime object. This is the same step as the studio. It is not a second implementation.
2. A snapshot: stats, terrains, things, systems, mechanics, world laws, and the engine (map, spawns, pitch, allowed systems). **Assets are an empty list.** Sprites do not travel in the pack yet.

The player can run, step, reset, arm a thing from the cast, and tap the yard to place a body. It shows the beat, the hoard, slipped, the last trace, and the log.

## When the pack is opened in Vector

If `window.webxdc` exists, the player uses it.

- **Share this beat** sends `{ type: "yard", yard }` with `sendUpdate`. A peer who receives it replaces their yard and pauses. This is a snapshot of the board, not a stream of inputs.
- **Placing a body** sends `{ type: "spawn", entity }`. Peers append that body if they do not already have the id.

There is no lock, no host, and no merge of two yards that both moved. The last yard snapshot to arrive wins. Spawns add. That is enough to hand someone a beat and drop a body in their copy. It is not a multiplayer game.

Outside Vector, share and send do nothing useful. Download the file, then put it in a chat yourself.

## When the foundry itself is opened in Vector

The studio listens for `{ type: "studio", project }`.

- **Send to this chat** uses `sendToChat` with the `.xdc` as a file, plus the engine's pitch as the message text.
- **Send laws** uses `sendUpdate`. Sprite `dataUrl`s are cleared first. If the JSON is longer than 60,000 characters, it refuses. Receivers who already have an identical signature (ids only, for assets) do not get a banner. Otherwise the studio shows Apply / Dismiss.
- **Apply** takes the incoming project and, for each asset id, keeps the local picture if the incoming one is empty. Pictures you already imported survive a law update. Pictures you never had stay blank.

The foundry does not send the live yard when it sends laws. The peer reboots from the blueprint.

## What not to "fix" without a note

- Do not drop `LICENSE.txt` or the comment at the top of `index.html` to save bytes.
- Do not point `source_code_url` at a different repository unless this one has moved.
- Do not put the desks inside the player. The split is the product: author here, play there.
- Do not silently start embedding full sprite bytes in the pack. They will blow the chat update and the file. If that changes, say so in this note and in the Assets desk copy.
