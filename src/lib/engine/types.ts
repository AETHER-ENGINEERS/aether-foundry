export type Mark = "disc" | "diamond" | "square" | "triangle" | "hex";

export type Tone =
  | "ink"
  | "brass"
  | "brass-deep"
  | "bone"
  | "moss"
  | "moss-deep";

export type Pattern = "solid" | "speck" | "hatch" | "grid" | "wave" | "ring";

export type Asset = {
  id: string;
  name: string;
  kind: "sprite" | "tile";
  dataUrl: string;
};

export type StatDef = {
  key: string;
  label: string;
  min: number;
  max: number;
  start: number;
};

export type TerrainDef = {
  id: string;
  name: string;
  tone: Tone;
  pattern: Pattern;
  passable: boolean;
  diggable: boolean;
  becomes?: string;
  yieldStat?: string;
  yieldAmt?: number;
  tags: string[];
};

export type ThingDef = {
  id: string;
  name: string;
  blurb: string;
  tags: string[];
  mark: Mark;
  tone: Tone;
  assetId?: string;
  stats: Record<string, number>;
};

export type Cmp = "gte" | "lte";

export type Condition =
  | { op: "always" }
  | { op: "tag"; any: string[] }
  | { op: "stat"; stat: string; cmp: Cmp; value: number }
  | { op: "on"; terrain: string }
  | { op: "nearThing"; tag: string; radius: number }
  | { op: "awayThing"; tag: string; radius: number }
  | { op: "nearTerrain"; terrain: string; radius: number }
  | { op: "crowd"; tag: string; radius: number; cmp: Cmp; value: number }
  | { op: "onEdge" }
  | { op: "every"; n: number }
  | { op: "chance"; pct: number };

export type Effect =
  | { op: "stat"; stat: string; delta: number }
  | { op: "seekThing"; tag: string }
  | { op: "seekTerrain"; terrain: string }
  | { op: "digToward"; terrain: string }
  | { op: "fleeThing"; tag: string }
  | { op: "fleeEdge" }
  | { op: "wander" }
  | { op: "excavate" }
  | { op: "hurt"; tag: string; stat: string; amount: number }
  | { op: "removeNearest"; tag: string }
  | { op: "deposit"; stat: string }
  | { op: "withdraw"; stat: string; amount: number }
  | { op: "vanishIf"; stat: string; cmp: Cmp; value: number; tally: "stolen" | "left" };

export type Mechanic = {
  id: string;
  name: string;
  systemId: string;
  kind: "pulse" | "order";
  priority: number;
  when: Condition[];
  then: Effect[];
  note: string;
};

export type WorldLaw = {
  id: string;
  name: string;
  systemId: string;
  every: number;
  cap: number;
  thingId: string;
  onTerrain: string;
};

export type SystemDef = {
  id: string;
  name: string;
  summary: string;
};

export type Spawn = { thingId: string; x: number; y: number };

export type EngineDef = {
  id: string;
  name: string;
  pitch: string;
  systemIds: string[];
  mapW: number;
  mapH: number;
  tiles: string[];
  spawns: Spawn[];
  tickMs: number;
};

export type Project = {
  title: string;
  stats: StatDef[];
  assets: Asset[];
  terrains: TerrainDef[];
  things: ThingDef[];
  systems: SystemDef[];
  mechanics: Mechanic[];
  worldLaws: WorldLaw[];
  engines: EngineDef[];
  activeEngineId: string;
};

export type Entity = {
  id: string;
  thingId: string;
  x: number;
  y: number;
  stats: Record<string, number>;
  age: number;
  alive: boolean;
  law: string;
  lawId: string;
  trace: string;
};

export type LogLine = { tick: number; text: string };

export type Yard = {
  engineId: string;
  tick: number;
  w: number;
  h: number;
  tiles: string[];
  entities: Entity[];
  hoard: number;
  stolen: number;
  left: number;
  log: LogLine[];
};

export type Diagnosis = {
  id: string;
  name: string;
  kind: "pulse" | "order";
  priority: number;
  match: boolean;
  winner: boolean;
  because: string;
};

export type Desk =
  | "paddock"
  | "things"
  | "systems"
  | "laws"
  | "ground"
  | "assets"
  | "engines"
  | "vector";

export type Selection =
  | { kind: "entity"; id: string }
  | { kind: "tile"; x: number; y: number; live: boolean }
  | { kind: "thing"; id: string }
  | { kind: "mechanic"; id: string }
  | { kind: "system"; id: string }
  | { kind: "asset"; id: string }
  | null;
