import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { activeEngine, useStudio } from "@/lib/engine/store";
import { AreaInput, Btn, Field, RowButton, SelectInput, StageHead, TextInput } from "./ui";

export function EnginesDesk() {
  const project = useStudio((s) => s.project);
  const engine = activeEngine(project);
  const selectEngine = useStudio((s) => s.selectEngine);
  const updateEngine = useStudio((s) => s.updateEngine);
  const duplicateEngine = useStudio((s) => s.duplicateEngine);
  const newEngine = useStudio((s) => s.newEngine);
  const deleteEngine = useStudio((s) => s.deleteEngine);
  const restoreSample = useStudio((s) => s.restoreSample);
  const setTitle = useStudio((s) => s.setTitle);
  const setDesk = useStudio((s) => s.setDesk);
  const [confirm, setConfirm] = useState(false);

  return (
    <div>
      <StageHead
        kicker="Engines"
        title="More than one toy"
        lede="An engine is a cast, a set of systems, a blueprint, and a beat. Undercroft and Parish share this studio and almost nothing else. That is the point of a foundry."
      />
      <Field label="Studio name">
        <TextInput value={project.title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-2">
          {project.engines.map((item) => (
            <RowButton key={item.id} on={item.id === engine.id} onClick={() => selectEngine(item.id)}>
              <span>{item.name}</span>
              <span className="text-mute">{item.systemIds.length}</span>
            </RowButton>
          ))}
          <Btn onClick={newEngine}>
            <Plus className="size-4" />
            New engine
          </Btn>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Name">
            <TextInput value={engine.name} onChange={(e) => updateEngine(engine.id, { name: e.target.value })} />
          </Field>
          <Field label="Pitch">
            <AreaInput value={engine.pitch} onChange={(e) => updateEngine(engine.id, { pitch: e.target.value })} />
          </Field>
          <Field label="Beat length">
            <SelectInput
              value={String(engine.tickMs)}
              onChange={(e) => updateEngine(engine.id, { tickMs: Number(e.target.value) })}
            >
              <option value="280">Hasty</option>
              <option value="420">Steady</option>
              <option value="700">Calm</option>
            </SelectInput>
          </Field>
          <p className="text-sm text-mute">
            {engine.mapW} by {engine.mapH} · {engine.spawns.length} opening bodies · {engine.systemIds.length} systems on
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn tone="brass" onClick={() => setDesk("paddock")}>
              Open paddock
            </Btn>
            <Btn onClick={duplicateEngine}>
              <Copy className="size-4" />
              Duplicate
            </Btn>
            <Btn onClick={() => deleteEngine(engine.id)}>
              <Trash2 className="size-4" />
              Remove
            </Btn>
          </div>
        </div>
      </div>
      <div className="mt-8">
        {confirm ? (
          <div className="flex flex-wrap gap-2">
            <Btn tone="brass" onClick={restoreSample}>
              Confirm restore
            </Btn>
            <Btn onClick={() => setConfirm(false)}>Cancel</Btn>
          </div>
        ) : (
          <Btn onClick={() => setConfirm(true)}>Restore the sample studio</Btn>
        )}
        <p className="mt-2 text-sm text-mute">This replaces the studio saved in this browser, including imported sprites.</p>
      </div>
    </div>
  );
}
