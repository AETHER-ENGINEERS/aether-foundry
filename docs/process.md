# Process

How this foundry is being built, and how a person is meant to use it. Written so a later change is obvious against this note.

## The bet

A single game engine would have frozen one toy: one map, one cast, one win. The useful object is the thing that makes engines. Aether Foundry is that workshop.

An **engine** here is small on purpose. It is a cast drawn from a shared library, a set of systems that are allowed to run, a blueprint (map plus opening bodies), and a beat length. Undercroft and Parish are both engines. They do not share a goal. They share stats, terrains, things, and the law language.

That is the Bullfrog-shaped habit this project is practicing, without claiming their tools:

- Build a **toy** you can watch, not a pipeline you have to trust.
- Put the rules in **data** (things, terrains, laws), not in a new function per creature.
- Let simple laws **outrank** each other, and read the outcome in the yard.
- Keep a second toy on the same vocabulary, so a "system" that only works for imps is revealed as a special case.

If a feature only makes sense inside Undercroft, it does not belong in the step. It belongs in a law, a tag, or a terrain.

## One library, many engines

A **project** (the studio) holds the shared lists:

- stats
- terrains
- things
- assets
- systems
- mechanics (laws)
- world laws

Each engine then *selects*:

- which systems are on (`systemIds`)
- the map (`tiles`, width, height)
- who starts where (`spawns`)
- how long a beat is (`tickMs`)
- a name and a one-line pitch

Turn Devotion off on Undercroft and the parish laws go quiet there, even though the laws still exist in the library. Turn Toil on for a new engine and imps in that yard can dig, if the map has something diggable and the things are spawned.

New engines start empty: a walled rectangle, no systems, no bodies. Nothing runs until a system is allowed. That is intentional. An engine with every system on is how two toys contaminate each other.

## The loop we want people to use

1. **Name a thing.** Give it tags (worker, food, intruder) and a sentence about what it wants. The sentence is for humans. The tags are for laws.
2. **Give the ground a meaning.** A terrain is passable or not, diggable or not, and it may become another terrain and yield a stat.
3. **Write a law as a sentence.** The Laws desk shows the English the data will become. Conditions are the "if". Effects are the "then".
4. **Decide whether it is climate or a choice.** A pulse always fires when it matches. An order competes, and the lowest priority number wins.
5. **Run the paddock.** Step one beat when you do not believe the trace. The inspector lists every order for the selected body: matched, outranked, or impossible from here.
6. **Change one number.** Hunger threshold, priority, cap on a world law. Run again. If you cannot tell what changed, the law is too big.
7. **Pack it** only when the yard is doing the thing you meant. The packed file is a player, not the foundry.

Bake is the other direction: the live yard's tiles and living bodies become the blueprint. Use it when a dug map is the map you now want to start from. Reset throws the yard away and boots the blueprint again.

## Priority is the design tool

Orders sort by priority, lowest number first, then by name. The first order that both matches and can actually act takes the beat. Later orders do not get a consolation move.

This is why "keep the post" can sit above "seek the shrine" and still not trap an elder. Seeking the shrine while already standing on it cannot be done, so that order fails and a lower law (feeding, in the sample) is allowed to run. A law that cannot act must get out of the way. The step enforces that. See [simulation.md](simulation.md).

Pulses do not enter this contest. Hunger climbing is climate. It happens, and then the body still chooses an order.

## Two toys, on purpose

Undercroft asks: will the workers bank the seam before hunger, beetles, and a thief pull them off it?

Parish asks: will people stay near a shrine, or will hunger, low faith, and a crowd move them?

Same stats (vigor, hunger, nerve, gold, faith). Different systems enabled. If Parish needs a new verb the step does not have, that is a foundry change and it should be justified by both toys or by a clear gap, not by one scene.

The sample laws are documented in [samples.md](samples.md). They are allowed to be replaced. Restoring the sample studio puts this exact library back.

## What we pack, and what we keep

The foundry is the editor. A packed `.xdc` is one engine plus the shared library it needs to run, and a small player: run, step, reset, place a body, share a beat. Sprites are not inside that file yet. Law-sharing between foundries in a Vector chat strips sprite bytes on purpose, so a chat update stays small and each device keeps the pictures it already has.

Details, including the webxdc calls, are in [packing.md](packing.md).

## Deliberately unfinished

So nobody mistakes the prototype for a promise:

- No win screen, no campaign, no scripting language beyond the closed lists of conditions and effects.
- No illustrated cast unless someone imports a sprite. Bodies default to geometric marks.
- The packed player does not include the desks. You cannot author a new law inside the `.xdc`.
- There is no live shared yard. A beat can be sent. A cursor cannot.
- Studio memory is on the device (one saved project). There are no accounts in this foundry.
- Distance is a square (Chebyshev), movement is four directions, and chance is a hash of the beat and the body. It will not drift into floating-point physics by accident.

When one of those changes, change this note in the same commit.
