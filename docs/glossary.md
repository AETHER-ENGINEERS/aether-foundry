# Glossary

Words as this foundry uses them. If the code and this list disagree, the code is what ran, and this list should be corrected in the same change.

**Age.** How many beats a body has been alive. The `every` condition uses age, not the yard's beat number, so a late arrival does not sync to the clock of the room.

**Asset.** An imported picture, sprite or tile, stored as a data URL on a thing. The yard draws it in place of the geometric mark when the thing points at one. Packed engines currently omit asset bytes. See [packing.md](packing.md).

**Bake.** Copy the live yard's tiles, and one spawn per living body, back onto the open engine's blueprint. The next reset starts from that.

**Beat.** One call to `stepWorld`. The paddock calls it on a timer (`tickMs`, divided by the speed button). The player can also step once. Also called a tick in the yard data (`yard.tick`).

**Blueprint.** The engine's saved map and opening spawns. The yard is a copy that laws are allowed to ruin. Reset boots the blueprint again.

**Body.** One living or dead entry in the yard: a thing id, a cell, stats, age, and the name of the last law that touched it. The studio UI often says "body" where the data says `Entity`.

**Cap.** On a world law, the most living bodies of that thing the yard will allow that law to add.

**Cast.** The list of things. In the packed player, the cast is also the row of buttons you arm before placing a body.

**Chebyshev distance.** The distance this step uses: the larger of the horizontal and vertical gaps. A radius of 1 includes the eight neighbors, not only the four you can step to. Movement itself is still only the four orthogonal steps.

**Condition.** One test on a law (`when`). Every condition on the law must hold. The closed list is in [simulation.md](simulation.md).

**Desk.** One editing surface in the studio: Paddock, Things, Systems, Laws, Ground, Assets, Engines, Vector. The same project sits behind all of them.

**Diagnosis.** The inspector's dry run of every enabled law against one body: whether it matches, whether a sharper order already won, or whether the act cannot be done from this cell. It does not change the yard.

**Diggable.** A terrain that is not a floor, but `digToward` may turn it into `becomes` and optionally add `yieldAmt` of `yieldStat` to the digger.

**Effect.** One act on a law (`then`). Effects on a single law run in order, and stop after the first effect that actually steps. See [simulation.md](simulation.md).

**Engine.** A named toy: pitch, allowed systems, map, opening spawns, beat length. Engines do not own private things. They pick from the studio library.

**Foundry.** This whole workshop. Not a single packed toy. The product name on this snapshot is Aether Foundry.

**Hoard.** A number on the yard, not on a body. `deposit` moves a carried stat into it. `withdraw` moves it back out, if the hoard can pay.

**Law.** A mechanic. Either a pulse or an order. People say "law" in the desks; the data says `Mechanic`.

**Left.** A yard tally. `vanishIf` with tally `left` increments it when a body is removed. The sample uses `stolen` for the thief leaving with gold. The paddock label for `stolen` is "Slipped".

**Mark.** The geometric stand-in for a thing that has no sprite: disc, diamond, square, triangle, or hex, in one of the tones.

**Order.** A law of kind `order`. At most one order acts per body per beat. Lowest priority number wins, if it can act.

**Passable.** A terrain a body may step onto. Diggable rock-like tiles are not passable until they become something that is.

**Pitch.** The one line under an engine's name. It is copied into the packed player. It does not affect the step.

**Priority.** An integer on an order. Lower runs first. Equal priorities break ties by law name, alphabetically. Pulses also carry a number, for display; they do not compete with orders.

**Project.** The studio document: title plus the shared library plus the engines. One project is what the device saves, and what "send laws" transmits (without sprite bytes).

**Pulse.** A law of kind `pulse`. Every matching pulse runs every beat, before the order contest. Pulses do not consume the body's choice.

**Radius.** How far a near, away, or crowd test looks, in Chebyshev distance. A body on the same cell as another is distance 0.

**Spawn.** A blueprint instruction: this thing, this cell, at boot. World laws also create bodies later; those are not spawns, and they are not part of the blueprint unless you bake.

**Stat.** A named number with a min, a max, and a start. Things may override the start. The yard clamps to the definition. The sample stats are vigor, hunger, nerve, gold, and faith.

**Studio.** The foundry as a running editor: desks, the open engine, the live yard. "Send laws" sends a studio snapshot.

**System.** A named group of laws (and world laws) with a one-line summary. An engine runs a law only when that law's system is in the engine's `systemIds`.

**Tag.** A string on a thing or a terrain. Laws test thing tags (`worker`, `parish`, `food`). Terrain tags are stored and not yet read by the step. Thing tags are the real switchboard.

**Terrain.** One ground type: tone, pattern, passable, diggable, what it becomes, what it yields, tags. The map stores terrain ids, not colors.

**Tick.** See beat.

**Tone.** A palette name: ink, brass, brass-deep, bone, moss, moss-deep. Drawing maps these to the same colors as the desks.

**Vector.** [Vector](https://vectorprivacy.com) messenger, where a `.xdc` (webxdc) file can be opened in a chat. The Vector desk packs the open engine for that.

**webxdc.** A zip with `index.html`, `manifest.toml`, and whatever else the app needs. Our pack writes those, plus `LICENSE.txt` and an icon. See [packing.md](packing.md).

**World law.** Not a per-body law. On every Nth beat, if fewer than `cap` living bodies of `thingId` exist, one more is placed on a random passable cell of `onTerrain`. Sample names: Brood, Raid, Kin.

**Yard.** The live simulation state: tick, tiles (which may now differ from the blueprint), bodies, hoard, stolen, left, and a short log. The paddock shows the yard. Reset discards it.
