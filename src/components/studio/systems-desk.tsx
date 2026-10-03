import { Plus, Trash2 } from "lucide-react";
import { activeEngine, useStudio } from "@/lib/engine/store";
import { AreaInput, Btn, Field, StageHead, TextInput } from "./ui";

export function SystemsDesk() {
  const project = useStudio((s) => s.project);
  const engine = activeEngine(project);
  const toggleSystem = useStudio((s) => s.toggleSystem);
  const addSystem = useStudio((s) => s.addSystem);
  const updateSystem = useStudio((s) => s.updateSystem);
  const deleteSystem = useStudio((s) => s.deleteSystem);
  const addStat = useStudio((s) => s.addStat);
  const updateStat = useStudio((s) => s.updateStat);
  const deleteStat = useStudio((s) => s.deleteStat);
  const setDesk = useStudio((s) => s.setDesk);
  const setLawFilter = useStudio((s) => s.setLawFilter);

  return (
    <div>
      <StageHead
        kicker="Systems"
        title="Laws of the world"
        lede="A system is a named concern: appetite, toil, nerve. It does nothing alone. Turn it on for this engine, then fill it with laws. Engines disagree about which systems are real."
      />
      <div className="mb-8 flex flex-col gap-3">
        {project.systems.map((system) => {
          const on = engine.systemIds.includes(system.id);
          const laws = project.mechanics.filter((m) => m.systemId === system.id).length;
          const yards = project.worldLaws.filter((w) => w.systemId === system.id).length;
          return (
            <article key={system.id} className="rounded-md border border-line bg-panel p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Btn tone={on ? "brass" : "ghost"} aria-pressed={on} onClick={() => toggleSystem(system.id)}>
                  {on ? "In this engine" : "Off in this engine"}
                </Btn>
                <Btn
                  onClick={() => {
                    setLawFilter(system.id);
                    setDesk("laws");
                  }}
                >
                  {laws} laws · {yards} arrivals
                </Btn>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name">
                  <TextInput value={system.name} onChange={(e) => updateSystem(system.id, { name: e.target.value })} />
                </Field>
                <Field label="Summary">
                  <AreaInput value={system.summary} onChange={(e) => updateSystem(system.id, { summary: e.target.value })} />
                </Field>
              </div>
              <Btn className="mt-3" onClick={() => deleteSystem(system.id)}>
                <Trash2 className="size-4" />
                Remove system
              </Btn>
            </article>
          );
        })}
        <Btn onClick={addSystem}>
          <Plus className="size-4" />
          New system
        </Btn>
      </div>
      <h3 className="font-display text-xl">Measures</h3>
      <p className="mt-1 mb-3 max-w-2xl text-sm text-mute">
        Every body carries the same measures. Laws compare them and push them. Add one when the yard needs a new appetite.
      </p>
      <div className="flex flex-col gap-3">
        {project.stats.map((stat) => (
          <div key={stat.key} className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-[1fr_5rem_5rem_5rem_auto]">
            <Field label="Label">
              <TextInput value={stat.label} onChange={(e) => updateStat(stat.key, { label: e.target.value })} />
            </Field>
            <Field label="Min">
              <TextInput
                type="number"
                value={stat.min}
                onChange={(e) => updateStat(stat.key, { min: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max">
              <TextInput
                type="number"
                value={stat.max}
                onChange={(e) => updateStat(stat.key, { max: Number(e.target.value) })}
              />
            </Field>
            <Field label="Start">
              <TextInput
                type="number"
                value={stat.start}
                onChange={(e) => updateStat(stat.key, { start: Number(e.target.value) })}
              />
            </Field>
            <Btn className="self-end" onClick={() => deleteStat(stat.key)} aria-label={`Remove ${stat.label}`}>
              <Trash2 className="size-4" />
            </Btn>
          </div>
        ))}
        <Btn onClick={addStat}>
          <Plus className="size-4" />
          New measure
        </Btn>
      </div>
    </div>
  );
}
