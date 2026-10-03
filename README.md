# Aether Foundry

A workshop for simulation engines. You design things, ground, and laws, run them in a yard, and pack one engine as a Vector webxdc. The foundry stays. The toy travels.

**Status, 3 October 2026.** This is a working prototype, published while it is still changing, so the process is visible. The name on this snapshot is **Aether Foundry**. Earlier drafts of the same work were called Aether Engineer. The name may move again. The repository will not.

This is not a finished game, and it is not one engine. Undercroft and Parish are two toys that share a library and almost nothing else. That split is the point.

## Read this first

| If you want… | Open |
| --- | --- |
| The working method | [docs/process.md](docs/process.md) |
| Every word we mean | [docs/glossary.md](docs/glossary.md) |
| What one beat actually does | [docs/simulation.md](docs/simulation.md) |
| What each desk is for | [docs/desks.md](docs/desks.md) |
| The two sample toys | [docs/samples.md](docs/samples.md) |
| What a packed `.xdc` contains | [docs/packing.md](docs/packing.md) |
| Where the code lives | [docs/source-map.md](docs/source-map.md) |

Start with the process note if you are new. Start with `src/lib/engine/sim-core.js` if you already know you are here for the step.

## What is in this repository

The foundry itself:

- `src/lib/engine/` — the project model, the pure step, the sample studio, drawing, and the packer
- `src/components/studio/` — the desks (paddock, things, systems, laws, ground, assets, engines, Vector)
- `src/styles.css` — the ink / brass / moss / bone palette the desks use
- `docs/` — the notes above
- `LICENSE` — the canonical license text, unaltered

`src/lib/engine/sim-core.js` is the single simulation. The studio imports it. The packed player embeds the same file. If those two ever disagree, that is a bug.

## What is not in this repository

The studio currently runs inside a host application (routing, accounts, preview chrome). That host is not this project, and it is not published here. You cannot `npm install` this repository and boot the desks. Read it as the product surface.

Third-party code a host might use (React, a zip the browser already has, a messenger) stays under that code's own terms. This repository does not relicense those works. The license below covers Aether Foundry.

## License

The full text is [`LICENSE`](LICENSE). It is also in `src/lib/engine/license.ts`, and it is written, unaltered, at the top of every packed engine (`LICENSE.txt` inside the `.xdc`, and an HTML comment at the top of the player page).

Do not edit that text. If a later timestamp exists on [AETHER-ENGINEERS](https://github.com/AETHER-ENGINEERS/AETHER-ENGINEERS/blob/main/LICENSE) or DarkIlluminatus, that later text wins. This distribution is not an offer of profit or of a proprietary path.
