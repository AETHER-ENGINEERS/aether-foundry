# Desks

The studio is one screen. A desk is which editor is in the main column. The inspector stays beside it on a wide window and below it on a narrow one. The open engine is the menu in the header. Changing engines reboots the yard from that engine's blueprint and stops the clock.

Nothing here is a separate save file. One project is stored on the device under the key `aether-foundry-v1`. Restoring the sample replaces that project with `createSeed()`.

## Paddock

The test yard. Run, pause, step, reset. Speed is Steady, Brisk, or Hasty: the engine's `tickMs` divided by 1, 2, or 4, and never faster than 70 ms.

The line under the buttons is the beat, the hoard, and slipped (`yard.stolen`). Chips count living bodies of each thing that is either alive now or listed in the blueprint.

The canvas is the yard if one is booted for this engine, otherwise the blueprint. Tap a body to inspect it. Tap an empty cell to inspect the tile. Marks are drawn in tone; a thing with an asset draws the picture instead. Several bodies may share a cell. They stack.

Reset discards digs, deaths, and the hoard. It does not discard laws.

## Things

The shared cast. A thing has a name, a blurb, tags, a mark, a tone, optional sprite, and starting overrides for stats. The blurb is not read by the step. Tags are.

Deleting a thing pulls it out of spawns and out of world laws that would have born it. The studio keeps at least one thing.

## Systems

Groups, plus the stat definitions. Each system is a name and a summary. The open engine has a system on or off. Off means every mechanic and world law in that system is silent on this engine only.

Stats added here exist for every thing. A thing that does not override a stat starts at the definition's `start`.

## Laws

Mechanics and world laws.

A mechanic edits as data, and the desk shows the English sentence from `phrase.ts` (`lawSentence`). That sentence is a reading aid. The step never parses English. If you need a verb the sentence cannot say, the verb does not exist yet: extend the effect table, the phrase, and [simulation.md](simulation.md) together.

Kind is pulse or order. Priority is the order's place in line. Filter by system when the list gets long.

World laws are the arrival rules: every N beats, cap, which thing, which terrain. They are not pulses and they are not orders.

## Ground

Terrains, and the blueprint map of the open engine.

Painting a cell changes the blueprint, not the live yard. If a dig has already changed the yard, the paddock will not show the new paint until reset, unless you are looking at a blueprint view. Placing a spawn writes an opening body. Clearing a spawn removes it. Bake, from the yard side of the studio, is the opposite: live tiles and living bodies become this blueprint.

A terrain needs an honest `passable` / `diggable` pair. A diggable tile with no `becomes` cannot be excavated.

## Assets

Import a picture, name it, and point a thing at it. The yard uses it as the body's mark. Pictures are kept in the project on this device. They are stripped when laws are sent to a chat, and they are omitted from the packed player. See [packing.md](packing.md).

## Engines

The list of toys in this studio. Create, duplicate, rename, set the pitch, set the beat length, delete (not the last one). Duplicating copies the map, the spawns, and which systems are on. It does not copy the library, because the library is already shared.

The studio title is the project name, separate from each engine's name. "Send laws" sends the project. A packed file is named after the engine.

## Vector

Hand the open engine over.

- **Download** builds a `.xdc` in the browser.
- **Send to this chat** does the same and asks Vector to attach it. It only works when the foundry itself is open inside Vector.
- **Send laws** pushes a studio snapshot into the chat with `sendUpdate`. Sprites are emptied first. If the payload is over 60,000 characters, the send is refused. A peer's foundry offers Apply or Dismiss. Apply keeps any sprite bytes the receiver already had for the same asset id.
- **Preview** shows the packed player in the page, so you can see the toy without a chat.

The manifest line on this desk is what will be written into `manifest.toml`, including `source_code_url` for this repository.

## Inspector

Selection decides the page: a body, a tile, a thing, a law, a system, an asset, or nothing.

On a body, the diagnosis is the important part. Each row is one enabled law. An order row can be the winner, a match that lost to a sharper order, a match that cannot be done from here, or a miss. Pulses are listed as matches or misses. They are never "the" winner, because they are not in the contest. The trace under the body's name is the note from the last order that acted, or a short reason it is idle.
