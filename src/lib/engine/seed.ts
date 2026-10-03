import type {
  EngineDef,
  Mechanic,
  Project,
  Spawn,
  StatDef,
  SystemDef,
  TerrainDef,
  ThingDef,
  WorldLaw,
} from "./types";

function parseMap(art: string, key: Record<string, string>) {
  const lines = art
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const w = lines[0]?.length ?? 0;
  for (const line of lines) {
    if (line.length !== w) {
      throw new Error(`ragged map (${line.length} != ${w}): ${line}`);
    }
  }
  const tiles: string[] = [];
  for (const line of lines) {
    for (const ch of line) {
      const id = key[ch];
      if (!id) throw new Error(`unknown tile '${ch}'`);
      tiles.push(id);
    }
  }
  return { w, h: lines.length, tiles };
}

function cells(tiles: string[], w: number, id: string) {
  const out: { x: number; y: number }[] = [];
  tiles.forEach((t, i) => {
    if (t === id) out.push({ x: i % w, y: Math.floor(i / w) });
  });
  return out;
}

const stats: StatDef[] = [
  { key: "vigor", label: "Vigor", min: 0, max: 100, start: 100 },
  { key: "hunger", label: "Hunger", min: 0, max: 100, start: 20 },
  { key: "nerve", label: "Nerve", min: 0, max: 100, start: 80 },
  { key: "gold", label: "Gold", min: 0, max: 12, start: 0 },
  { key: "faith", label: "Faith", min: 0, max: 100, start: 0 },
];

const terrains: TerrainDef[] = [
  { id: "rock", name: "Rock", tone: "ink", pattern: "solid", passable: false, diggable: false, tags: ["wall"] },
  {
    id: "earth",
    name: "Earth",
    tone: "brass-deep",
    pattern: "hatch",
    passable: false,
    diggable: true,
    becomes: "flag",
    tags: ["soil"],
  },
  {
    id: "gold",
    name: "Gold seam",
    tone: "brass",
    pattern: "speck",
    passable: false,
    diggable: true,
    becomes: "flag",
    yieldStat: "gold",
    yieldAmt: 2,
    tags: ["seam", "prize"],
  },
  { id: "flag", name: "Flagstone", tone: "moss-deep", pattern: "grid", passable: true, diggable: false, tags: ["floor"] },
  { id: "water", name: "Water", tone: "moss-deep", pattern: "wave", passable: true, diggable: false, tags: ["wet"] },
  { id: "hatchery", name: "Hatchery", tone: "moss", pattern: "speck", passable: true, diggable: false, tags: ["food"] },
  { id: "treasury", name: "Treasury", tone: "bone", pattern: "ring", passable: true, diggable: false, tags: ["vault"] },
  { id: "grass", name: "Grass", tone: "moss", pattern: "solid", passable: true, diggable: false, tags: ["field"] },
  { id: "shrine", name: "Shrine", tone: "bone", pattern: "ring", passable: true, diggable: false, tags: ["holy"] },
];

const things: ThingDef[] = [
  {
    id: "imp",
    name: "Imp",
    blurb: "Digs what blocks the seam, then banks what it can carry. Hunger will pull it off the job.",
    tags: ["worker"],
    mark: "square",
    tone: "brass",
    stats: { hunger: 12, nerve: 90, gold: 0 },
  },
  {
    id: "beetle",
    name: "Beetle",
    blurb: "Holds the hall. Leaves the post only to eat, which is how raids get through.",
    tags: ["guard"],
    mark: "hex",
    tone: "moss",
    stats: { hunger: 8, nerve: 100 },
  },
  {
    id: "hero",
    name: "Hero",
    blurb: "Comes for the hoard. Nerve breaks before pride, and a full purse heads for the door.",
    tags: ["intruder"],
    mark: "triangle",
    tone: "bone",
    stats: { hunger: 28, nerve: 100, gold: 0 },
  },
  {
    id: "hen",
    name: "Hen",
    blurb: "Food with feet. Stays in the hatchery until someone digs a way out.",
    tags: ["food"],
    mark: "disc",
    tone: "brass-deep",
    stats: { vigor: 30, hunger: 0, nerve: 40 },
  },
  {
    id: "follower",
    name: "Follower",
    blurb: "Walks the grass, returns to the shrine when hunger or doubt wins, dislikes a crowd.",
    tags: ["faithful", "parish"],
    mark: "disc",
    tone: "brass",
    stats: { hunger: 20, faith: 10, nerve: 60 },
  },
  {
    id: "elder",
    name: "Elder",
    blurb: "Stays with the shrine. The parish takes its temper from whoever keeps this post.",
    tags: ["elder", "parish"],
    mark: "diamond",
    tone: "bone",
    stats: { hunger: 10, faith: 80, nerve: 90 },
  },
];

const systems: SystemDef[] = [
  { id: "appetite", name: "Appetite", summary: "Hunger climbs, and it outranks the job." },
  { id: "toil", name: "Toil", summary: "Workers open earth, cut seams, and bank what they carry." },
  { id: "nerve", name: "Nerve", summary: "Guards hold the hall. Intruders steal, break, and run." },
  { id: "drift", name: "Drift", summary: "If no sharper law can act, a body still moves." },
  { id: "devotion", name: "Devotion", summary: "Faith and hunger trade places at the shrine." },
];

const mechanics: Mechanic[] = [
  {
    id: "m-hunger",
    name: "Hunger clock",
    systemId: "appetite",
    kind: "pulse",
    priority: 1,
    when: [{ op: "tag", any: ["worker", "guard", "intruder"] }],
    then: [{ op: "stat", stat: "hunger", delta: 2 }],
    note: "Bodies keep the score, whether or not they are busy.",
  },
  {
    id: "m-damp",
    name: "Damp",
    systemId: "appetite",
    kind: "pulse",
    priority: 2,
    when: [
      { op: "tag", any: ["worker", "guard", "intruder"] },
      { op: "on", terrain: "water" },
    ],
    then: [{ op: "stat", stat: "hunger", delta: 2 }],
    note: "Water is a worse road than flagstone.",
  },
  {
    id: "m-starve",
    name: "The body fails",
    systemId: "appetite",
    kind: "pulse",
    priority: 3,
    when: [
      { op: "tag", any: ["worker", "guard", "intruder"] },
      { op: "stat", stat: "hunger", cmp: "gte", value: 94 },
    ],
    then: [{ op: "stat", stat: "vigor", delta: -8 }],
    note: "Past this, the job does not matter.",
  },
  {
    id: "m-eat-hatch",
    name: "Eat at the hatchery",
    systemId: "appetite",
    kind: "order",
    priority: 8,
    when: [
      { op: "tag", any: ["worker", "guard", "intruder"] },
      { op: "stat", stat: "hunger", cmp: "gte", value: 20 },
      { op: "on", terrain: "hatchery" },
    ],
    then: [{ op: "stat", stat: "hunger", delta: -28 }],
    note: "They stand and eat. The seam can wait.",
  },
  {
    id: "m-eat-hen",
    name: "Scoff a hen",
    systemId: "appetite",
    kind: "order",
    priority: 9,
    when: [
      { op: "tag", any: ["worker", "guard", "intruder"] },
      { op: "stat", stat: "hunger", cmp: "gte", value: 36 },
      { op: "nearThing", tag: "food", radius: 1 },
    ],
    then: [
      { op: "stat", stat: "hunger", delta: -34 },
      { op: "removeNearest", tag: "food" },
    ],
    note: "A hen in reach beats a walk to the trough.",
  },
  {
    id: "m-seek-meal",
    name: "Seek a meal",
    systemId: "appetite",
    kind: "order",
    priority: 18,
    when: [
      { op: "tag", any: ["worker", "guard", "intruder"] },
      { op: "stat", stat: "hunger", cmp: "gte", value: 64 },
    ],
    then: [{ op: "seekTerrain", terrain: "hatchery" }],
    note: "Hunger outranks gold.",
  },
  {
    id: "m-bank",
    name: "Bank the seam",
    systemId: "toil",
    kind: "order",
    priority: 14,
    when: [
      { op: "tag", any: ["worker"] },
      { op: "stat", stat: "gold", cmp: "gte", value: 1 },
      { op: "on", terrain: "treasury" },
    ],
    then: [{ op: "deposit", stat: "gold" }],
    note: "The hoard is the point of the digging.",
  },
  {
    id: "m-haul",
    name: "Haul to the treasury",
    systemId: "toil",
    kind: "order",
    priority: 22,
    when: [
      { op: "tag", any: ["worker"] },
      { op: "stat", stat: "gold", cmp: "gte", value: 2 },
    ],
    then: [{ op: "seekTerrain", terrain: "treasury" }],
    note: "Full hands leave the seam.",
  },
  {
    id: "m-dig-gold",
    name: "Work the seam",
    systemId: "toil",
    kind: "order",
    priority: 30,
    when: [
      { op: "tag", any: ["worker"] },
      { op: "stat", stat: "gold", cmp: "lte", value: 1 },
    ],
    then: [{ op: "digToward", terrain: "gold" }],
    note: "Dig toward gold. Earth in the way comes out first.",
  },
  {
    id: "m-dig-earth",
    name: "Open the earth",
    systemId: "toil",
    kind: "order",
    priority: 44,
    when: [{ op: "tag", any: ["worker"] }],
    then: [{ op: "digToward", terrain: "earth" }],
    note: "When the seam is gone, they still dig. That is how a yard becomes a plaza.",
  },
  {
    id: "m-fray",
    name: "Nerve frays",
    systemId: "nerve",
    kind: "pulse",
    priority: 4,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "nearThing", tag: "guard", radius: 2 },
    ],
    then: [{ op: "stat", stat: "nerve", delta: -6 }],
    note: "A beetle in the hall changes the plan.",
  },
  {
    id: "m-breath",
    name: "Catch breath",
    systemId: "nerve",
    kind: "pulse",
    priority: 5,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "awayThing", tag: "guard", radius: 4 },
    ],
    then: [{ op: "stat", stat: "nerve", delta: 2 }],
    note: "Distance puts the spine back.",
  },
  {
    id: "m-slip",
    name: "Slip the gate",
    systemId: "nerve",
    kind: "order",
    priority: 11,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "stat", stat: "gold", cmp: "gte", value: 3 },
      { op: "onEdge" },
    ],
    then: [{ op: "vanishIf", stat: "gold", cmp: "gte", value: 3, tally: "stolen" }],
    note: "A full purse on the edge is already gone.",
  },
  {
    id: "m-flee",
    name: "Nerve breaks",
    systemId: "nerve",
    kind: "order",
    priority: 12,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "stat", stat: "nerve", cmp: "lte", value: 32 },
      { op: "nearThing", tag: "guard", radius: 3 },
    ],
    then: [{ op: "fleeThing", tag: "guard" }],
    note: "They run before they finish the theft.",
  },
  {
    id: "m-escape",
    name: "Make for the door",
    systemId: "nerve",
    kind: "order",
    priority: 16,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "stat", stat: "gold", cmp: "gte", value: 3 },
    ],
    then: [{ op: "fleeEdge" }],
    note: "Three coins is enough. The yard is no longer the point.",
  },
  {
    id: "m-hunt",
    name: "Hold the hall",
    systemId: "nerve",
    kind: "order",
    priority: 26,
    when: [{ op: "tag", any: ["guard"] }],
    then: [
      { op: "hurt", tag: "intruder", stat: "vigor", amount: 14 },
      { op: "seekThing", tag: "intruder" },
    ],
    note: "Strike if close. Otherwise close the gap.",
  },
  {
    id: "m-steal",
    name: "Rob the treasury",
    systemId: "nerve",
    kind: "order",
    priority: 24,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "on", terrain: "treasury" },
      { op: "stat", stat: "gold", cmp: "lte", value: 2 },
    ],
    then: [{ op: "withdraw", stat: "gold", amount: 1 }],
    note: "One coin a beat, if the hoard has any.",
  },
  {
    id: "m-seek-vault",
    name: "Seek the hoard",
    systemId: "nerve",
    kind: "order",
    priority: 34,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "stat", stat: "gold", cmp: "lte", value: 2 },
    ],
    then: [{ op: "seekTerrain", terrain: "treasury" }],
    note: "The treasury is the job until the purse is heavy.",
  },
  {
    id: "m-pan",
    name: "Pan the seam",
    systemId: "nerve",
    kind: "order",
    priority: 48,
    when: [
      { op: "tag", any: ["intruder"] },
      { op: "stat", stat: "gold", cmp: "lte", value: 2 },
    ],
    then: [{ op: "digToward", terrain: "gold" }],
    note: "If the treasury cannot be reached, the seam will do.",
  },
  {
    id: "m-idle",
    name: "Idle feet",
    systemId: "drift",
    kind: "order",
    priority: 200,
    when: [{ op: "always" }],
    then: [{ op: "wander" }],
    note: "A yard with nowhere to go still fidgets.",
  },
  {
    id: "m-parish-hunger",
    name: "Field hunger",
    systemId: "devotion",
    kind: "pulse",
    priority: 1,
    when: [{ op: "tag", any: ["parish"] }],
    then: [{ op: "stat", stat: "hunger", delta: 2 }],
    note: "The grass does not feed by itself.",
  },
  {
    id: "m-shrine",
    name: "At the shrine",
    systemId: "devotion",
    kind: "order",
    priority: 14,
    when: [
      { op: "tag", any: ["parish"] },
      { op: "on", terrain: "shrine" },
    ],
    then: [
      { op: "stat", stat: "hunger", delta: -12 },
      { op: "stat", stat: "faith", delta: 8 },
    ],
    note: "The shrine feeds and steadies. That is the whole parish.",
  },
  {
    id: "m-elder",
    name: "Keep the post",
    systemId: "devotion",
    kind: "order",
    priority: 10,
    when: [{ op: "tag", any: ["elder"] }],
    then: [{ op: "seekTerrain", terrain: "shrine" }],
    note: "Elders return, and stay.",
  },
  {
    id: "m-disperse",
    name: "Disperse",
    systemId: "devotion",
    kind: "order",
    priority: 16,
    when: [
      { op: "tag", any: ["faithful"] },
      { op: "crowd", tag: "faithful", radius: 1, cmp: "gte", value: 3 },
    ],
    then: [{ op: "fleeThing", tag: "faithful" }],
    note: "Three shoulders in one square and the hymn falls apart.",
  },
  {
    id: "m-seek-shrine",
    name: "Seek the shrine",
    systemId: "devotion",
    kind: "order",
    priority: 24,
    when: [
      { op: "tag", any: ["faithful"] },
      { op: "stat", stat: "hunger", cmp: "gte", value: 48 },
    ],
    then: [{ op: "seekTerrain", terrain: "shrine" }],
    note: "Doubt and hunger use the same road.",
  },
  {
    id: "m-low-faith",
    name: "Low faith",
    systemId: "devotion",
    kind: "order",
    priority: 28,
    when: [
      { op: "tag", any: ["faithful"] },
      { op: "stat", stat: "faith", cmp: "lte", value: 24 },
    ],
    then: [{ op: "seekTerrain", terrain: "shrine" }],
    note: "Below this, wandering is not allowed.",
  },
];

const worldLaws: WorldLaw[] = [
  { id: "w-brood", name: "Brood", systemId: "appetite", every: 12, cap: 5, thingId: "hen", onTerrain: "hatchery" },
  { id: "w-raid", name: "Raid", systemId: "nerve", every: 24, cap: 2, thingId: "hero", onTerrain: "flag" },
  { id: "w-kin", name: "Kin", systemId: "devotion", every: 8, cap: 7, thingId: "follower", onTerrain: "shrine" },
];

const undercroftArt = `
################
#HHH#FFFFFFFFFT#
#HHH#FFFFFFFFFT#
#HHH#FFFFFFFFFT#
#HHHFFFFFFFFFFT#
#FFFFEEEEEEEEEE#
#FFFFEGGGGGEEEE#
#FFFFEGGGGGEEEE#
#FFFFEEEEEEEEEE#
#FFFFFFFFFFFWWW#
#FFFFFFFFFFFWWW#
################
`;

const parishArt = `
##############
#GGGGGGGGGGGG#
#GGGGGGGGGGGG#
#GGGGSSSSGGGG#
#GGGGSSSSGGGG#
#GGWWWGGGGGGG#
#GGWWWGGGGGGG#
#GGGGGGGGGGGG#
#GGGGGGGGGGGG#
##############
`;

function undercroftSpawns(tiles: string[], w: number): Spawn[] {
  const hatch = cells(tiles, w, "hatchery");
  const flags = cells(tiles, w, "flag");
  const vaults = cells(tiles, w, "treasury");
  const vault = vaults[0] ?? { x: 1, y: 1 };
  const dist = (a: { x: number; y: number }) => Math.abs(a.x - vault.x) + Math.abs(a.y - vault.y);
  const nearHall = flags.slice().sort((a, b) => dist(a) - dist(b));
  const far = flags.slice().sort((a, b) => dist(b) - dist(a));
  const spawns: Spawn[] = [];
  hatch.slice(0, 3).forEach((p) => spawns.push({ thingId: "imp", ...p }));
  hatch.slice(-2).forEach((p) => spawns.push({ thingId: "hen", ...p }));
  nearHall.slice(0, 2).forEach((p) => spawns.push({ thingId: "beetle", ...p }));
  if (far[0]) spawns.push({ thingId: "hero", ...far[0] });
  return spawns;
}

function parishSpawns(tiles: string[], w: number): Spawn[] {
  const shrines = cells(tiles, w, "shrine");
  const grass = cells(tiles, w, "grass");
  const center = shrines[Math.floor(shrines.length / 2)] ?? { x: 1, y: 1 };
  const dist = (a: { x: number; y: number }) => Math.abs(a.x - center.x) + Math.abs(a.y - center.y);
  const far = grass.slice().sort((a, b) => dist(b) - dist(a));
  const spawns: Spawn[] = [{ thingId: "elder", ...center }];
  far.slice(0, 4).forEach((p) => spawns.push({ thingId: "follower", ...p }));
  return spawns;
}

export function createSeed(): Project {
  const underMap = parseMap(undercroftArt, {
    "#": "rock",
    H: "hatchery",
    F: "flag",
    T: "treasury",
    E: "earth",
    G: "gold",
    W: "water",
  });
  const parishMap = parseMap(parishArt, {
    "#": "rock",
    G: "grass",
    S: "shrine",
    W: "water",
  });
  const engines: EngineDef[] = [
    {
      id: "undercroft",
      name: "Undercroft",
      pitch: "Imps owe the earth. Heroes owe the hoard. Hunger outranks both.",
      systemIds: ["appetite", "toil", "nerve", "drift"],
      mapW: underMap.w,
      mapH: underMap.h,
      tiles: underMap.tiles,
      spawns: undercroftSpawns(underMap.tiles, underMap.w),
      tickMs: 420,
    },
    {
      id: "parish",
      name: "Parish",
      pitch: "Faith gathers at the shrine. Crowds undo it. Nothing here is a dungeon.",
      systemIds: ["devotion", "drift"],
      mapW: parishMap.w,
      mapH: parishMap.h,
      tiles: parishMap.tiles,
      spawns: parishSpawns(parishMap.tiles, parishMap.w),
      tickMs: 480,
    },
  ];
  return {
    title: "Floor 1",
    stats,
    assets: [],
    terrains,
    things,
    systems,
    mechanics,
    worldLaws,
    engines,
    activeEngineId: "undercroft",
  };
}
