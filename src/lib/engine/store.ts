import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSeed } from "./seed";
import { bootRuntime, stepWorld } from "./sim";
import type {
  Asset,
  Condition,
  Desk,
  Effect,
  EngineDef,
  Mechanic,
  Project,
  Selection,
  Spawn,
  StatDef,
  SystemDef,
  TerrainDef,
  ThingDef,
  WorldLaw,
  Yard,
} from "./types";

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function activeEngine(project: Project): EngineDef {
  return project.engines.find((e) => e.id === project.activeEngineId) ?? project.engines[0];
}

function isEngine(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const engine = value as EngineDef;
  return (
    typeof engine.id === "string" &&
    typeof engine.mapW === "number" &&
    engine.mapW > 0 &&
    typeof engine.mapH === "number" &&
    engine.mapH > 0 &&
    Array.isArray(engine.tiles) &&
    Array.isArray(engine.spawns) &&
    Array.isArray(engine.systemIds)
  );
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const p = value as Project;
  return (
    typeof p.title === "string" &&
    Array.isArray(p.engines) &&
    p.engines.length > 0 &&
    p.engines.every(isEngine) &&
    Array.isArray(p.things) &&
    Array.isArray(p.mechanics) &&
    Array.isArray(p.terrains) &&
    Array.isArray(p.stats) &&
    Array.isArray(p.systems) &&
    typeof p.activeEngineId === "string" &&
    (p.worldLaws == null || Array.isArray(p.worldLaws)) &&
    (p.assets == null || Array.isArray(p.assets))
  );
}

function withEngine(project: Project, id: string, patch: (engine: EngineDef) => EngineDef): Project {
  return {
    ...project,
    engines: project.engines.map((engine) => (engine.id === id ? patch(engine) : engine)),
  };
}

function reboot(project: Project): { project: Project; yard: Yard; playing: false } {
  return { project, yard: bootRuntime(project, activeEngine(project)), playing: false };
}

const memory = new Map<string, string>();
const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name: string, value: string) => {
    memory.set(name, value);
    try {
      localStorage.setItem(name, value);
    } catch {
      /* quota — the session copy still holds */
    }
  },
  removeItem: (name: string) => {
    memory.delete(name);
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export type Speed = 1 | 2 | 4;

type StudioState = {
  project: Project;
  yard: Yard;
  desk: Desk;
  playing: boolean;
  speed: Speed;
  selection: Selection;
  lawFilter: string;
  status: string;
  incoming: Project | null;
  setDesk: (desk: Desk) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: Speed) => void;
  setStatus: (status: string) => void;
  setSelection: (selection: Selection) => void;
  setLawFilter: (lawFilter: string) => void;
  tickOnce: () => void;
  resetYard: () => void;
  bakeYard: () => void;
  setTitle: (title: string) => void;
  selectEngine: (id: string) => void;
  updateEngine: (id: string, patch: Partial<EngineDef>) => void;
  toggleSystem: (systemId: string) => void;
  duplicateEngine: () => void;
  newEngine: () => void;
  deleteEngine: (id: string) => void;
  restoreSample: () => void;
  paintTile: (x: number, y: number, terrainId: string) => void;
  putSpawn: (spawn: Spawn) => void;
  clearSpawnAt: (x: number, y: number) => void;
  addThing: () => void;
  updateThing: (id: string, patch: Partial<ThingDef>) => void;
  deleteThing: (id: string) => void;
  addSystem: () => void;
  updateSystem: (id: string, patch: Partial<SystemDef>) => void;
  deleteSystem: (id: string) => void;
  addStat: () => void;
  updateStat: (key: string, patch: Partial<StatDef>) => void;
  deleteStat: (key: string) => void;
  addMechanic: (systemId?: string) => void;
  updateMechanic: (id: string, patch: Partial<Mechanic>) => void;
  deleteMechanic: (id: string) => void;
  duplicateMechanic: (id: string) => void;
  addWorldLaw: (systemId?: string) => void;
  updateWorldLaw: (id: string, patch: Partial<WorldLaw>) => void;
  deleteWorldLaw: (id: string) => void;
  addTerrain: () => void;
  updateTerrain: (id: string, patch: Partial<TerrainDef>) => void;
  deleteTerrain: (id: string) => void;
  addAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  offerIncoming: (project: Project) => void;
  applyIncoming: () => void;
  dismissIncoming: () => void;
};

const seed = createSeed();

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      project: seed,
      yard: bootRuntime(seed, activeEngine(seed)),
      desk: "paddock",
      playing: false,
      speed: 1,
      selection: null,
      lawFilter: "all",
      status: "Sample yards are loaded. Press Run.",
      incoming: null,
      setDesk: (desk) => set({ desk }),
      setPlaying: (playing) => set({ playing }),
      setSpeed: (speed) => set({ speed }),
      setStatus: (status) => set({ status }),
      setSelection: (selection) => set({ selection }),
      setLawFilter: (lawFilter) => set({ lawFilter }),
      tickOnce: () => {
        const { project, yard } = get();
        const engine = activeEngine(project);
        const current = yard.engineId === engine.id ? yard : bootRuntime(project, engine);
        set({ yard: stepWorld(current, project, engine) });
      },
      resetYard: () => {
        const project = get().project;
        set({ yard: bootRuntime(project, activeEngine(project)), playing: false, status: "Yard restored from the blueprint." });
      },
      bakeYard: () => {
        const { project, yard } = get();
        const engine = activeEngine(project);
        if (yard.engineId !== engine.id || yard.tiles.length !== engine.mapW * engine.mapH) {
          set({ status: "This yard does not match the open engine." });
          return;
        }
        const spawns: Spawn[] = yard.entities
          .filter((e) => e.alive)
          .map((e) => ({ thingId: e.thingId, x: e.x, y: e.y }));
        set({
          project: withEngine(project, engine.id, (e) => ({ ...e, tiles: yard.tiles.slice(), spawns })),
          status: "Blueprint took the yard, bodies included.",
        });
      },
      setTitle: (title) => set((s) => ({ project: { ...s.project, title } })),
      selectEngine: (id) => {
        const project = { ...get().project, activeEngineId: id };
        if (!project.engines.some((e) => e.id === id)) return;
        set({ ...reboot(project), selection: null, status: "" });
      },
      updateEngine: (id, patch) =>
        set((s) => ({
          project: withEngine(s.project, id, (engine) => ({ ...engine, ...patch, id: engine.id })),
        })),
      toggleSystem: (systemId) =>
        set((s) => {
          const engine = activeEngine(s.project);
          const has = engine.systemIds.includes(systemId);
          const systemIds = has ? engine.systemIds.filter((id) => id !== systemId) : [...engine.systemIds, systemId];
          return { project: withEngine(s.project, engine.id, (e) => ({ ...e, systemIds })) };
        }),
      duplicateEngine: () => {
        const engine = activeEngine(get().project);
        const copy: EngineDef = {
          ...engine,
          id: uid("engine"),
          name: `${engine.name} copy`,
          tiles: engine.tiles.slice(),
          spawns: engine.spawns.map((sp) => ({ ...sp })),
          systemIds: engine.systemIds.slice(),
        };
        const project = { ...get().project, engines: [...get().project.engines, copy], activeEngineId: copy.id };
        set({ ...reboot(project), status: `Opened ${copy.name}.` });
      },
      newEngine: () => {
        const project0 = get().project;
        const rock = project0.terrains.find((t) => t.id === "rock")?.id ?? project0.terrains[0].id;
        const fill = project0.terrains.find((t) => t.id === "flag")?.id ?? project0.terrains.find((t) => t.passable)?.id ?? rock;
        const w = 16;
        const h = 12;
        const tiles: string[] = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            tiles.push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? rock : fill);
          }
        }
        const engine: EngineDef = {
          id: uid("engine"),
          name: "Untitled engine",
          pitch: "An empty yard. Turn a system on, place a body, run it.",
          systemIds: [],
          mapW: w,
          mapH: h,
          tiles,
          spawns: [],
          tickMs: 420,
        };
        const project = { ...project0, engines: [...project0.engines, engine], activeEngineId: engine.id };
        set({ ...reboot(project), desk: "engines", status: "New engine. Nothing in it runs until you allow a system." });
      },
      deleteEngine: (id) => {
        const project0 = get().project;
        if (project0.engines.length < 2) {
          set({ status: "Keep at least one engine." });
          return;
        }
        const engines = project0.engines.filter((e) => e.id !== id);
        const activeEngineId = project0.activeEngineId === id ? engines[0].id : project0.activeEngineId;
        set(reboot({ ...project0, engines, activeEngineId }));
      },
      restoreSample: () => {
        const project = createSeed();
        safeStorage.removeItem("aether-foundry-v1");
        set({ ...reboot(project), desk: "paddock", selection: null, incoming: null, status: "Sample studio restored." });
      },
      paintTile: (x, y, terrainId) =>
        set((s) => {
          const engine = activeEngine(s.project);
          if (x < 0 || y < 0 || x >= engine.mapW || y >= engine.mapH) return s;
          const tiles = engine.tiles.slice();
          tiles[y * engine.mapW + x] = terrainId;
          return { project: withEngine(s.project, engine.id, (e) => ({ ...e, tiles })) };
        }),
      putSpawn: (spawn) =>
        set((s) => {
          const engine = activeEngine(s.project);
          const spawns = engine.spawns.filter((sp) => sp.x !== spawn.x || sp.y !== spawn.y);
          spawns.push(spawn);
          return { project: withEngine(s.project, engine.id, (e) => ({ ...e, spawns })) };
        }),
      clearSpawnAt: (x, y) =>
        set((s) => {
          const engine = activeEngine(s.project);
          return {
            project: withEngine(s.project, engine.id, (e) => ({
              ...e,
              spawns: e.spawns.filter((sp) => sp.x !== x || sp.y !== y),
            })),
          };
        }),
      addThing: () => {
        const thing: ThingDef = {
          id: uid("thing"),
          name: "New thing",
          blurb: "Say what it wants. The laws decide whether it gets it.",
          tags: ["cast"],
          mark: "disc",
          tone: "brass",
          stats: {},
        };
        set((s) => ({
          project: { ...s.project, things: [...s.project.things, thing] },
          selection: { kind: "thing", id: thing.id },
          desk: "things",
        }));
      },
      updateThing: (id, patch) =>
        set((s) => ({
          project: {
            ...s.project,
            things: s.project.things.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          },
        })),
      deleteThing: (id) =>
        set((s) => {
          if (s.project.things.length < 2) return { ...s, status: "Keep at least one thing." };
          const project: Project = {
            ...s.project,
            things: s.project.things.filter((t) => t.id !== id),
            worldLaws: s.project.worldLaws.filter((w) => w.thingId !== id),
            engines: s.project.engines.map((e) => ({
              ...e,
              spawns: e.spawns.filter((sp) => sp.thingId !== id),
            })),
          };
          const selection = s.selection?.kind === "thing" && s.selection.id === id ? null : s.selection;
          return { project, selection, status: "Thing removed from the cast and the blueprints." };
        }),
      addSystem: () => {
        const system: SystemDef = {
          id: uid("system"),
          name: "New system",
          summary: "A named law of the world. It does nothing until it holds mechanics.",
        };
        set((s) => ({
          project: { ...s.project, systems: [...s.project.systems, system] },
          selection: { kind: "system", id: system.id },
        }));
      },
      updateSystem: (id, patch) =>
        set((s) => ({
          project: {
            ...s.project,
            systems: s.project.systems.map((sys) => (sys.id === id ? { ...sys, ...patch } : sys)),
          },
        })),
      deleteSystem: (id) =>
        set((s) => ({
          project: {
            ...s.project,
            systems: s.project.systems.filter((sys) => sys.id !== id),
            mechanics: s.project.mechanics.filter((m) => m.systemId !== id),
            worldLaws: s.project.worldLaws.filter((w) => w.systemId !== id),
            engines: s.project.engines.map((e) => ({
              ...e,
              systemIds: e.systemIds.filter((sid) => sid !== id),
            })),
          },
        })),
      addStat: () => {
        const key = uid("s").replace(/-/g, "").slice(0, 10);
        const stat: StatDef = { key, label: "New measure", min: 0, max: 100, start: 0 };
        set((s) => ({ project: { ...s.project, stats: [...s.project.stats, stat] } }));
      },
      updateStat: (key, patch) =>
        set((s) => ({
          project: {
            ...s.project,
            stats: s.project.stats.map((stat) => (stat.key === key ? { ...stat, ...patch, key: stat.key } : stat)),
          },
        })),
      deleteStat: (key) =>
        set((s) => {
          if (s.project.stats.length < 2) return { ...s, status: "Keep at least one measure." };
          return { project: { ...s.project, stats: s.project.stats.filter((stat) => stat.key !== key) } };
        }),
      addMechanic: (systemId) => {
        const project = get().project;
        const sid = systemId && systemId !== "all" ? systemId : (project.systems[0]?.id ?? "drift");
        const mechanic: Mechanic = {
          id: uid("law"),
          name: "New law",
          systemId: sid,
          kind: "order",
          priority: 40,
          when: [{ op: "tag", any: ["cast"] }],
          then: [{ op: "wander" }],
          note: "",
        };
        set((s) => ({
          project: { ...s.project, mechanics: [...s.project.mechanics, mechanic] },
          selection: { kind: "mechanic", id: mechanic.id },
          lawFilter: sid,
          desk: "laws",
        }));
      },
      updateMechanic: (id, patch) =>
        set((s) => ({
          project: {
            ...s.project,
            mechanics: s.project.mechanics.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          },
        })),
      deleteMechanic: (id) =>
        set((s) => ({
          project: { ...s.project, mechanics: s.project.mechanics.filter((m) => m.id !== id) },
          selection: s.selection?.kind === "mechanic" && s.selection.id === id ? null : s.selection,
        })),
      duplicateMechanic: (id) => {
        const source = get().project.mechanics.find((m) => m.id === id);
        if (!source) return;
        const mechanic: Mechanic = {
          ...source,
          id: uid("law"),
          name: `${source.name} copy`,
          when: source.when.map((c) => ({ ...c })) as Condition[],
          then: source.then.map((e) => ({ ...e })) as Effect[],
        };
        set((s) => ({
          project: { ...s.project, mechanics: [...s.project.mechanics, mechanic] },
          selection: { kind: "mechanic", id: mechanic.id },
        }));
      },
      addWorldLaw: (systemId) => {
        const project = get().project;
        const law: WorldLaw = {
          id: uid("yard"),
          name: "Arrival",
          systemId: systemId && systemId !== "all" ? systemId : (project.systems[0]?.id ?? "drift"),
          every: 10,
          cap: 3,
          thingId: project.things[0]?.id ?? "",
          onTerrain: project.terrains.find((t) => t.passable)?.id ?? project.terrains[0]?.id ?? "",
        };
        set((s) => ({ project: { ...s.project, worldLaws: [...s.project.worldLaws, law] } }));
      },
      updateWorldLaw: (id, patch) =>
        set((s) => ({
          project: {
            ...s.project,
            worldLaws: s.project.worldLaws.map((w) => (w.id === id ? { ...w, ...patch } : w)),
          },
        })),
      deleteWorldLaw: (id) =>
        set((s) => ({
          project: { ...s.project, worldLaws: s.project.worldLaws.filter((w) => w.id !== id) },
        })),
      addTerrain: () => {
        const terrain: TerrainDef = {
          id: uid("ground"),
          name: "New ground",
          tone: "moss-deep",
          pattern: "solid",
          passable: true,
          diggable: false,
          tags: [],
        };
        set((s) => ({ project: { ...s.project, terrains: [...s.project.terrains, terrain] } }));
      },
      updateTerrain: (id, patch) =>
        set((s) => ({
          project: {
            ...s.project,
            terrains: s.project.terrains.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          },
        })),
      deleteTerrain: (id) =>
        set((s) => {
          const used = s.project.engines.some((e) => e.tiles.includes(id)) || s.project.terrains.some((t) => t.becomes === id);
          if (used) return { ...s, status: "That ground is still on a blueprint." };
          if (s.project.terrains.length < 2) return { ...s, status: "Keep at least one ground." };
          return { project: { ...s.project, terrains: s.project.terrains.filter((t) => t.id !== id) } };
        }),
      addAsset: (asset) => set((s) => ({ project: { ...s.project, assets: [...s.project.assets, asset] } })),
      deleteAsset: (id) =>
        set((s) => ({
          project: {
            ...s.project,
            assets: s.project.assets.filter((a) => a.id !== id),
            things: s.project.things.map((t) => (t.assetId === id ? { ...t, assetId: undefined } : t)),
          },
          selection: s.selection?.kind === "asset" && s.selection.id === id ? null : s.selection,
        })),
      offerIncoming: (remote) => {
        if (!isProject(remote)) return;
        const project: Project = {
          ...remote,
          worldLaws: remote.worldLaws ?? [],
          assets: remote.assets ?? [],
        };
        if (projectSignature(project) === projectSignature(get().project)) return;
        set({ incoming: project });
      },
      applyIncoming: () => {
        const incoming = get().incoming;
        if (!incoming || !isProject(incoming)) return;
        const local = get().project;
        const assets = incoming.assets.map((asset) => {
          const mine = local.assets.find((a) => a.id === asset.id);
          return mine?.dataUrl ? { ...asset, dataUrl: mine.dataUrl } : asset;
        });
        for (const asset of local.assets) {
          if (!assets.some((a) => a.id === asset.id)) assets.push(asset);
        }
        const project = { ...incoming, assets, worldLaws: incoming.worldLaws ?? [] };
        set({ ...reboot(project), incoming: null, status: "Applied the studio snapshot from this chat." });
      },
      dismissIncoming: () => set({ incoming: null }),
    }),
    {
      name: "aether-foundry-v1",
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ project: s.project }),
      merge: (persisted, current) => {
        const saved = persisted as { project?: unknown } | undefined;
        if (!saved?.project || !isProject(saved.project)) return current;
        const project: Project = {
          ...saved.project,
          worldLaws: saved.project.worldLaws ?? [],
          assets: saved.project.assets ?? [],
        };
        return { ...current, project };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const engine = activeEngine(state.project);
        state.yard = bootRuntime(state.project, engine);
        state.playing = false;
        state.incoming = null;
      },
    },
  ),
);

export function projectSignature(project: Project): string {
  const assets = project.assets.map((a) => a.id);
  const { assets: _drop, ...rest } = project;
  return JSON.stringify({ ...rest, assets });
}
