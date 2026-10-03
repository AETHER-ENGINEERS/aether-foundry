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
- `index.html` — the foundry as one page, so this directory can be zipped into a webxdc
- `manifest.toml` — the webxdc name and source URL
- `icon.png` — the mark Vector shows for that package
- `xdc/` and `build-xdc.mjs` — how `index.html` is produced from the desks. Run `node build-xdc.mjs` after a studio change, from a checkout that can resolve the studio's imports

`src/lib/engine/sim-core.js` is the single simulation. The studio imports it. The root `index.html` bundles that same studio. A packed engine embeds the same step again. If those disagree, that is a bug.

## Packaging this directory as a webxdc

`index.html` sits at the top of the repository so the directory can be zipped as a webxdc. Include `index.html`, `manifest.toml`, `icon.png`, and `LICENSE`, and name the archive with a `.xdc` suffix. Open it in Vector and the desks come up. Vector supplies `webxdc.js`; this repository only references it.

The license text is an HTML comment at the top of `index.html`, the same wording as `LICENSE`. The page also carries React, Zustand, and Lucide inside the script. Those stay under their own terms. This repository does not relicense them.

## What is not in this repository

The account gate and preview chrome this studio was written beside are not part of the package. `index.html` does not need them.

Third-party code stays under that code's own terms. The license below covers Aether Foundry.

## License

The full text is [`LICENSE`](LICENSE). It is also in `src/lib/engine/license.ts`, and it is written, unaltered, at the top of `index.html` and at the top of every packed engine.

Do not edit that text. If a later timestamp exists on [AETHER-ENGINEERS](https://github.com/AETHER-ENGINEERS/AETHER-ENGINEERS/blob/main/LICENSE) or DarkIlluminatus, that later text wins. This distribution is not an offer of profit or of a proprietary path.
