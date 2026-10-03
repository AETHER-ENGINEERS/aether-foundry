# Packing and Vector

The Vector desk turns the **open engine** into a webxdc file. The foundry does not go inside it.

## The file

`packEngine` writes a zip of uncompressed entries (stored, not deflated) and downloads it as `<engine-name>.xdc`.

| entry | what it is |
| --- | --- |
| `index.html` | the player. The license text is an HTML comment at the top, before the doctype. |
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
