import { diagnose } from "@/lib/engine/sim";
import { lawSentence } from "@/lib/engine/phrase";
import { activeEngine, useStudio } from "@/lib/engine/store";

function barClass(key: string) {
  if (key === "hunger" || key === "faith") return "bg-moss";
  if (key === "nerve") return "bg-bone";
  return "bg-brass";
}

export function Inspector() {
  const project = useStudio((s) => s.project);
  const yard = useStudio((s) => s.yard);
  const selection = useStudio((s) => s.selection);
  const engine = activeEngine(project);
  const mechanic =
    selection?.kind === "mechanic" ? project.mechanics.find((m) => m.id === selection.id) : undefined;
  const entity = selection?.kind === "entity" ? yard.entities.find((e) => e.id === selection.id) : undefined;
  const thing = entity ? project.things.find((t) => t.id === entity.thingId) : undefined;
  const tile = selection?.kind === "tile" ? selection : undefined;
  const terrainId = tile ? (tile.live ? yard.tiles : engine.tiles)[tile.y * engine.mapW + tile.x] : undefined;
  const terrain = terrainId ? project.terrains.find((t) => t.id === terrainId) : undefined;
  const report = entity && entity.alive ? diagnose(yard, project, engine, entity.id) : [];

  return (
    <aside className="border-line bg-panel lg:border-l">
      <div className="flex flex-col gap-4 p-4">
        <div>
          <p className="text-xs tracking-widest text-mute uppercase">Reading</p>
          <h2 className="font-display text-xl text-bone">{engine.name}</h2>
          <p className="mt-1 text-sm text-mute">{engine.pitch}</p>
        </div>

        {mechanic ? (
          <section>
            <p className="text-xs tracking-widest text-mute uppercase">This law</p>
            <p className="mt-1 text-sm text-bone">{lawSentence(mechanic, project)}</p>
            {mechanic.note ? <p className="mt-2 text-sm text-brass">{mechanic.note}</p> : null}
          </section>
        ) : null}

        {entity && thing ? (
          <section>
            <p className="text-xs tracking-widest text-mute uppercase">Body</p>
            <h3 className="font-display text-lg">{thing.name}</h3>
            <p className="text-sm text-mute">{entity.alive ? entity.trace : "Collapsed."}</p>
            <p className="mt-1 text-sm text-bone">{entity.law || "No order yet."}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {project.stats.map((stat) => {
                const value = entity.stats[stat.key] ?? stat.start;
                const span = stat.max - stat.min || 1;
                const pct = Math.max(0, Math.min(100, ((value - stat.min) / span) * 100));
                return (
                  <li key={stat.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{stat.label}</span>
                      <span className="tabular-nums text-mute">{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink">
                      <div className={`h-full ${barClass(stat.key)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            {entity.alive ? (
              <div className="mt-4">
                <p className="text-xs tracking-widest text-mute uppercase">Next beat</p>
                <ul className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {report.map((row) => (
                    <li key={row.id} className={`text-sm ${row.winner ? "text-brass" : row.match ? "text-bone" : "text-mute"}`}>
                      <span className="tabular-nums">{row.priority}</span> {row.name}
                      {row.winner ? " takes it" : ""}
                      <span className="block text-mute">{row.because}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {terrain ? (
          <section>
            <p className="text-xs tracking-widest text-mute uppercase">Ground</p>
            <h3 className="font-display text-lg">{terrain.name}</h3>
            <p className="text-sm text-mute">
              {terrain.passable ? "Passable" : "Blocks movement"}
              {terrain.diggable ? ` · digs into ${project.terrains.find((t) => t.id === terrain.becomes)?.name ?? "nothing"}` : ""}
              {tile ? ` · ${tile.x},${tile.y}` : ""}
            </p>
          </section>
        ) : null}

        {!entity && !mechanic ? (
          <section>
            <p className="text-xs tracking-widest text-mute uppercase">Systems in this engine</p>
            <ul className="mt-2 flex flex-col gap-1">
              {project.systems.map((system) => {
                const on = engine.systemIds.includes(system.id);
                return (
                  <li key={system.id} className={on ? "text-sm text-bone" : "text-sm text-mute"}>
                    {on ? "On" : "Off"} · {system.name}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
