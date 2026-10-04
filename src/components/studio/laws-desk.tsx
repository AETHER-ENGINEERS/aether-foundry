import { Plus, Trash2 } from "lucide-react";
import { CONDITION_OPS, EFFECT_OPS, freshCondition, freshEffect } from "@/lib/engine/drafts";
import { lawSentence } from "@/lib/engine/phrase";
import { activeEngine, useStudio } from "@/lib/engine/store";
import type { Condition, Effect, Mechanic } from "@/lib/engine/types";
import { AreaInput, Btn, Field, RowButton, SelectInput, StageHead, TextInput } from "./ui";

export function LawsDesk() {
  const project = useStudio((s) => s.project);
  const engine = activeEngine(project);
  const filter = useStudio((s) => s.lawFilter);
  const setLawFilter = useStudio((s) => s.setLawFilter);
  const selection = useStudio((s) => s.selection);
  const setSelection = useStudio((s) => s.setSelection);
  const addMechanic = useStudio((s) => s.addMechanic);
  const updateMechanic = useStudio((s) => s.updateMechanic);
  const deleteMechanic = useStudio((s) => s.deleteMechanic);
  const duplicateMechanic = useStudio((s) => s.duplicateMechanic);
  const addWorldLaw = useStudio((s) => s.addWorldLaw);
  const updateWorldLaw = useStudio((s) => s.updateWorldLaw);
  const deleteWorldLaw = useStudio((s) => s.deleteWorldLaw);

  const visible = project.mechanics.filter((m) => filter === "all" || m.systemId === filter);
  const selected = selection?.kind === "mechanic" ? project.mechanics.find((m) => m.id === selection.id) : undefined;
  const world = project.worldLaws.filter((w) => filter === "all" || w.systemId === filter);

  return (
    <div>
      <StageHead
        kicker="Laws"
        title="When, then"
        lede="Pulses always happen. Orders compete, and the lowest number that can actually act wins the beat. Hunger should outrank gold. If it does not, change the number and watch the paddock."
      />
      <div className="mb-3 flex gap-2 overflow-x-auto">
        <FilterChip on={filter === "all"} label="All" onClick={() => setLawFilter("all")} />
        {project.systems.map((system) => (
          <FilterChip
            key={system.id}
            on={filter === system.id}
            label={`${system.name}${engine.systemIds.includes(system.id) ? "" : " · off"}`}
            onClick={() => setLawFilter(system.id)}
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-2">
          {visible
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map((mechanic) => (
              <RowButton
                key={mechanic.id}
                on={mechanic.id === selected?.id}
                onClick={() => setSelection({ kind: "mechanic", id: mechanic.id })}
              >
                <span>
                  <span className="mr-2 text-mute tabular-nums">{mechanic.priority}</span>
                  {mechanic.name}
                </span>
                <span className="text-mute">{mechanic.kind === "pulse" ? "Pulse" : "Order"}</span>
              </RowButton>
            ))}
          <Btn onClick={() => addMechanic(filter)}>
            <Plus className="size-4" />
            New law
          </Btn>
        </div>
        {selected ? (
          <LawEditor
            mechanic={selected}
            onChange={(patch) => updateMechanic(selected.id, patch)}
            onDelete={() => deleteMechanic(selected.id)}
            onDuplicate={() => duplicateMechanic(selected.id)}
          />
        ) : (
          <p className="text-mute">Choose a law, or write a new one.</p>
        )}
      </div>

      <h3 className="mt-8 font-display text-xl">Arrivals</h3>
      <p className="mt-1 mb-3 text-sm text-mute">Yard laws are not carried by a body. Every few beats, if the cap allows, someone shows up on a ground.</p>
      <div className="flex flex-col gap-3">
        {world.map((law) => (
          <div key={law.id} className="grid gap-2 rounded-md border border-line p-3 md:grid-cols-2">
            <Field label="Name">
              <TextInput value={law.name} onChange={(e) => updateWorldLaw(law.id, { name: e.target.value })} />
            </Field>
            <Field label="System">
              <SelectInput value={law.systemId} onChange={(e) => updateWorldLaw(law.id, { systemId: e.target.value })}>
                {project.systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Every n beats">
              <TextInput
                type="number"
                min={1}
                value={law.every}
                onChange={(e) => updateWorldLaw(law.id, { every: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Field>
            <Field label="Cap">
              <TextInput
                type="number"
                min={0}
                value={law.cap}
                onChange={(e) => updateWorldLaw(law.id, { cap: Math.max(0, Number(e.target.value) || 0) })}
              />
            </Field>
            <Field label="Thing">
              <SelectInput value={law.thingId} onChange={(e) => updateWorldLaw(law.id, { thingId: e.target.value })}>
                {project.things.map((thing) => (
                  <option key={thing.id} value={thing.id}>
                    {thing.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="On ground">
              <SelectInput value={law.onTerrain} onChange={(e) => updateWorldLaw(law.id, { onTerrain: e.target.value })}>
                {project.terrains.map((terrain) => (
                  <option key={terrain.id} value={terrain.id}>
                    {terrain.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Btn onClick={() => deleteWorldLaw(law.id)}>
              <Trash2 className="size-4" />
              Remove arrival
            </Btn>
          </div>
        ))}
        <Btn onClick={() => addWorldLaw(filter)}>
          <Plus className="size-4" />
          New arrival
        </Btn>
      </div>
    </div>
  );
}

function FilterChip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 shrink-0 rounded-md border px-3 text-sm ${on ? "border-brass bg-brass text-on-accent" : "border-line text-bone"}`}
    >
      {label}
    </button>
  );
}

function LawEditor({
  mechanic,
  onChange,
  onDelete,
  onDuplicate,
}: {
  mechanic: Mechanic;
  onChange: (patch: Partial<Mechanic>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const project = useStudio((s) => s.project);
  const setWhen = (when: Condition[]) => onChange({ when });
  const setThen = (then: Effect[]) => onChange({ then });
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-panel p-3">
      <p className="text-sm text-bone">{lawSentence(mechanic, project)}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name">
          <TextInput value={mechanic.name} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>
        <Field label="System">
          <SelectInput value={mechanic.systemId} onChange={(e) => onChange({ systemId: e.target.value })}>
            {project.systems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Kind">
          <SelectInput
            value={mechanic.kind}
            onChange={(e) => onChange({ kind: e.target.value === "pulse" ? "pulse" : "order" })}
          >
            <option value="pulse">Pulse — always, if the tests hold</option>
            <option value="order">Order — competes for the beat</option>
          </SelectInput>
        </Field>
        <Field label="Priority (lower wins)">
          <TextInput
            type="number"
            value={mechanic.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <Field label="Note, shown on the body">
        <AreaInput value={mechanic.note} onChange={(e) => onChange({ note: e.target.value })} />
      </Field>

      <div>
        <p className="mb-2 text-sm text-mute">Tests, all of them</p>
        <div className="flex flex-col gap-2">
          {mechanic.when.map((condition, index) => (
            <ConditionRow
              key={index}
              condition={condition}
              onChange={(next) => setWhen(mechanic.when.map((item, i) => (i === index ? next : item)))}
              onRemove={() => setWhen(mechanic.when.filter((_, i) => i !== index))}
            />
          ))}
        </div>
        <Btn className="mt-2" onClick={() => setWhen([...mechanic.when, freshCondition("stat", project)])}>
          <Plus className="size-4" />
          Add test
        </Btn>
      </div>

      <div>
        <p className="mb-2 text-sm text-mute">Acts, in order. One move, then it stops.</p>
        <div className="flex flex-col gap-2">
          {mechanic.then.map((effect, index) => (
            <EffectRow
              key={index}
              effect={effect}
              onChange={(next) => setThen(mechanic.then.map((item, i) => (i === index ? next : item)))}
              onRemove={() => setThen(mechanic.then.filter((_, i) => i !== index))}
            />
          ))}
        </div>
        <Btn className="mt-2" onClick={() => setThen([...mechanic.then, freshEffect("wander", project)])}>
          <Plus className="size-4" />
          Add act
        </Btn>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={onDuplicate}>Duplicate</Btn>
        <Btn onClick={onDelete}>
          <Trash2 className="size-4" />
          Remove law
        </Btn>
      </div>
    </div>
  );
}

function ConditionRow({
  condition,
  onChange,
  onRemove,
}: {
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}) {
  const project = useStudio((s) => s.project);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-ink p-2">
      <Field label="Test">
        <SelectInput
          value={condition.op}
          onChange={(e) => onChange(freshCondition(e.target.value as Condition["op"], project))}
        >
          {CONDITION_OPS.map((op) => (
            <option key={op.op} value={op.op}>
              {op.label}
            </option>
          ))}
        </SelectInput>
      </Field>
      <ConditionFields condition={condition} onChange={onChange} />
      <Btn onClick={onRemove} aria-label="Remove test">
        <Trash2 className="size-4" />
      </Btn>
    </div>
  );
}

function ConditionFields({ condition, onChange }: { condition: Condition; onChange: (condition: Condition) => void }) {
  const project = useStudio((s) => s.project);
  if (condition.op === "tag") {
    return (
      <Field label="Any of these tags">
        <TextInput
          value={condition.any.join(", ")}
          onChange={(e) =>
            onChange({
              ...condition,
              any: e.target.value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
    );
  }
  if (condition.op === "stat") {
    return (
      <>
        <Field label="Measure">
          <SelectInput value={condition.stat} onChange={(e) => onChange({ ...condition, stat: e.target.value })}>
            {project.stats.map((stat) => (
              <option key={stat.key} value={stat.key}>
                {stat.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Compare">
          <SelectInput
            value={condition.cmp}
            onChange={(e) => onChange({ ...condition, cmp: e.target.value === "lte" ? "lte" : "gte" })}
          >
            <option value="gte">At least</option>
            <option value="lte">At most</option>
          </SelectInput>
        </Field>
        <Num label="Value" value={condition.value} onChange={(value) => onChange({ ...condition, value })} />
      </>
    );
  }
  if (condition.op === "on" || condition.op === "nearTerrain") {
    return (
      <>
        <Field label="Ground">
          <SelectInput
            value={condition.terrain}
            onChange={(e) => onChange({ ...condition, terrain: e.target.value })}
          >
            {project.terrains.map((terrain) => (
              <option key={terrain.id} value={terrain.id}>
                {terrain.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        {condition.op === "nearTerrain" ? (
          <Num label="Within" value={condition.radius} onChange={(radius) => onChange({ ...condition, radius })} />
        ) : null}
      </>
    );
  }
  if (condition.op === "nearThing" || condition.op === "awayThing") {
    return (
      <>
        <Field label="Tag">
          <TextInput value={condition.tag} onChange={(e) => onChange({ ...condition, tag: e.target.value.trim() })} />
        </Field>
        <Num label="Within" value={condition.radius} onChange={(radius) => onChange({ ...condition, radius })} />
      </>
    );
  }
  if (condition.op === "crowd") {
    return (
      <>
        <Field label="Tag">
          <TextInput value={condition.tag} onChange={(e) => onChange({ ...condition, tag: e.target.value.trim() })} />
        </Field>
        <Num label="Within" value={condition.radius} onChange={(radius) => onChange({ ...condition, radius })} />
        <Field label="Compare">
          <SelectInput
            value={condition.cmp}
            onChange={(e) => onChange({ ...condition, cmp: e.target.value === "lte" ? "lte" : "gte" })}
          >
            <option value="gte">At least</option>
            <option value="lte">At most</option>
          </SelectInput>
        </Field>
        <Num label="Count" value={condition.value} onChange={(value) => onChange({ ...condition, value })} />
      </>
    );
  }
  if (condition.op === "every") return <Num label="Beats" value={condition.n} onChange={(n) => onChange({ ...condition, n })} />;
  if (condition.op === "chance") return <Num label="Percent" value={condition.pct} onChange={(pct) => onChange({ ...condition, pct })} />;
  return null;
}

function EffectRow({
  effect,
  onChange,
  onRemove,
}: {
  effect: Effect;
  onChange: (effect: Effect) => void;
  onRemove: () => void;
}) {
  const project = useStudio((s) => s.project);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-line bg-ink p-2">
      <Field label="Act">
        <SelectInput value={effect.op} onChange={(e) => onChange(freshEffect(e.target.value as Effect["op"], project))}>
          {EFFECT_OPS.map((op) => (
            <option key={op.op} value={op.op}>
              {op.label}
            </option>
          ))}
        </SelectInput>
      </Field>
      <EffectFields effect={effect} onChange={onChange} />
      <Btn onClick={onRemove} aria-label="Remove act">
        <Trash2 className="size-4" />
      </Btn>
    </div>
  );
}

function EffectFields({ effect, onChange }: { effect: Effect; onChange: (effect: Effect) => void }) {
  const project = useStudio((s) => s.project);
  if (effect.op === "stat" || effect.op === "deposit") {
    return (
      <>
        <StatPick value={effect.stat} onChange={(stat) => onChange({ ...effect, stat })} />
        {effect.op === "stat" ? (
          <Num label="By" value={effect.delta} onChange={(delta) => onChange({ ...effect, delta })} />
        ) : null}
      </>
    );
  }
  if (effect.op === "seekThing" || effect.op === "fleeThing" || effect.op === "removeNearest") {
    return (
      <Field label="Tag">
        <TextInput value={effect.tag} onChange={(e) => onChange({ ...effect, tag: e.target.value.trim() })} />
      </Field>
    );
  }
  if (effect.op === "seekTerrain" || effect.op === "digToward") {
    return (
      <Field label="Ground">
        <SelectInput value={effect.terrain} onChange={(e) => onChange({ ...effect, terrain: e.target.value })}>
          {project.terrains.map((terrain) => (
            <option key={terrain.id} value={terrain.id}>
              {terrain.name}
            </option>
          ))}
        </SelectInput>
      </Field>
    );
  }
  if (effect.op === "hurt") {
    return (
      <>
        <Field label="Tag">
          <TextInput value={effect.tag} onChange={(e) => onChange({ ...effect, tag: e.target.value.trim() })} />
        </Field>
        <StatPick value={effect.stat} onChange={(stat) => onChange({ ...effect, stat })} />
        <Num label="Amount" value={effect.amount} onChange={(amount) => onChange({ ...effect, amount })} />
      </>
    );
  }
  if (effect.op === "withdraw") {
    return (
      <>
        <StatPick value={effect.stat} onChange={(stat) => onChange({ ...effect, stat })} />
        <Num label="Amount" value={effect.amount} onChange={(amount) => onChange({ ...effect, amount })} />
      </>
    );
  }
  if (effect.op === "vanishIf") {
    return (
      <>
        <StatPick value={effect.stat} onChange={(stat) => onChange({ ...effect, stat })} />
        <Field label="Compare">
          <SelectInput
            value={effect.cmp}
            onChange={(e) => onChange({ ...effect, cmp: e.target.value === "lte" ? "lte" : "gte" })}
          >
            <option value="gte">At least</option>
            <option value="lte">At most</option>
          </SelectInput>
        </Field>
        <Num label="Value" value={effect.value} onChange={(value) => onChange({ ...effect, value })} />
        <Field label="Tally">
          <SelectInput
            value={effect.tally}
            onChange={(e) => onChange({ ...effect, tally: e.target.value === "left" ? "left" : "stolen" })}
          >
            <option value="stolen">Slipped</option>
            <option value="left">Left</option>
          </SelectInput>
        </Field>
      </>
    );
  }
  return null;
}

function StatPick({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const stats = useStudio((s) => s.project.stats);
  return (
    <Field label="Measure">
      <SelectInput value={value} onChange={(e) => onChange(e.target.value)}>
        {stats.map((stat) => (
          <option key={stat.key} value={stat.key}>
            {stat.label}
          </option>
        ))}
      </SelectInput>
    </Field>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <TextInput type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </Field>
  );
}
