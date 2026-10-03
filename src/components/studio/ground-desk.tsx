import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { activeEngine, useStudio } from "@/lib/engine/store";
import type { Pattern, Tone } from "@/lib/engine/types";
import { TONE_BG } from "@/lib/engine/tones";
import { Btn, Field, SelectInput, StageHead, TextInput } from "./ui";
import { YardCanvas } from "./yard-canvas";

const TONES: Tone[] = ["ink", "brass", "brass-deep", "bone", "moss", "moss-deep"];
const PATTERNS: Pattern[] = ["solid", "speck", "hatch", "grid", "wave", "ring"];

export function GroundDesk() {
  const project = useStudio((s) => s.project);
  const engine = activeEngine(project);
  const paintTile = useStudio((s) => s.paintTile);
  const putSpawn = useStudio((s) => s.putSpawn);
  const clearSpawnAt = useStudio((s) => s.clearSpawnAt);
  const bakeYard = useStudio((s) => s.bakeYard);
  const resetYard = useStudio((s) => s.resetYard);
  const addTerrain = useStudio((s) => s.addTerrain);
  const updateTerrain = useStudio((s) => s.updateTerrain);
  const deleteTerrain = useStudio((s) => s.deleteTerrain);
  const [brush, setBrush] = useState(project.terrains.find((t) => t.id === "earth")?.id ?? project.terrains[0]?.id ?? "");
  const [stamp, setStamp] = useState<string | null>(null);
  const [editing, setEditing] = useState(project.terrains[0]?.id ?? "");
  const terrain = project.terrains.find((t) => t.id === editing) ?? project.terrains[0];
  const ghosts = engine.spawns.map((spawn, index) => ({
    id: `sp-${index}`,
    thingId: spawn.thingId,
    x: spawn.x,
    y: spawn.y,
    alive: true,
  }));

  return (
    <div>
      <StageHead
        kicker="Ground"
        title="Blueprint"
        lede="Painting changes the blueprint, not the running yard. Reset the paddock to see it, or bake the paddock back when the diggers have made something you want to keep."
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Btn tone={stamp ? "ghost" : "brass"} onClick={() => setStamp(null)}>
          Paint ground
        </Btn>
        {project.things.map((thing) => (
          <Btn key={thing.id} tone={stamp === thing.id ? "brass" : "ghost"} onClick={() => setStamp(thing.id)}>
            Place {thing.name}
          </Btn>
        ))}
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {project.terrains.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setBrush(item.id);
              setStamp(null);
              setEditing(item.id);
            }}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm ${
              !stamp && brush === item.id ? "border-brass" : "border-line"
            }`}
          >
            <span className={`size-4 rounded-sm border border-line ${TONE_BG[item.tone]}`} />
            {item.name}
          </button>
        ))}
      </div>
      <div className="rounded-md border border-line bg-ink p-2">
        <YardCanvas
          tiles={engine.tiles}
          w={engine.mapW}
          h={engine.mapH}
          entities={ghosts}
          onCell={(x, y) => {
            if (stamp) {
              const existing = engine.spawns.find((spawn) => spawn.x === x && spawn.y === y && spawn.thingId === stamp);
              if (existing) clearSpawnAt(x, y);
              else putSpawn({ thingId: stamp, x, y });
              return;
            }
            paintTile(x, y, brush);
          }}
        />
      </div>
      <p className="mt-2 text-sm text-mute">
        {stamp
          ? "Tap a tile to place. Tap the same body again to lift it."
          : "Tap to paint. Placed bodies are the yard’s opening cast."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn onClick={resetYard}>Reset paddock from this blueprint</Btn>
        <Btn onClick={bakeYard}>Bake paddock into blueprint</Btn>
      </div>

      {terrain ? (
        <div className="mt-6 rounded-md border border-line p-3">
          <h3 className="font-display text-xl">Ground type</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Name">
              <TextInput value={terrain.name} onChange={(e) => updateTerrain(terrain.id, { name: e.target.value })} />
            </Field>
            <Field label="Pattern">
              <SelectInput
                value={terrain.pattern}
                onChange={(e) => updateTerrain(terrain.id, { pattern: e.target.value as Pattern })}
              >
                {PATTERNS.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {pattern}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Digs into">
              <SelectInput
                value={terrain.becomes ?? ""}
                onChange={(e) => updateTerrain(terrain.id, { becomes: e.target.value || undefined })}
              >
                <option value="">Does not change</option>
                {project.terrains.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Yield measure">
              <SelectInput
                value={terrain.yieldStat ?? ""}
                onChange={(e) => updateTerrain(terrain.id, { yieldStat: e.target.value || undefined })}
              >
                <option value="">None</option>
                {project.stats.map((stat) => (
                  <option key={stat.key} value={stat.key}>
                    {stat.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Yield amount">
              <TextInput
                type="number"
                value={terrain.yieldAmt ?? 0}
                onChange={(e) => updateTerrain(terrain.id, { yieldAmt: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                aria-label={tone}
                onClick={() => updateTerrain(terrain.id, { tone })}
                className={`size-11 rounded-md border ${TONE_BG[tone]} ${terrain.tone === tone ? "border-brass" : "border-line"}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn tone={terrain.passable ? "brass" : "ghost"} onClick={() => updateTerrain(terrain.id, { passable: !terrain.passable })}>
              {terrain.passable ? "Passable" : "Blocks"}
            </Btn>
            <Btn tone={terrain.diggable ? "brass" : "ghost"} onClick={() => updateTerrain(terrain.id, { diggable: !terrain.diggable })}>
              {terrain.diggable ? "Diggable" : "Not diggable"}
            </Btn>
            <Btn onClick={addTerrain}>
              <Plus className="size-4" />
              New ground
            </Btn>
            <Btn onClick={() => deleteTerrain(terrain.id)}>
              <Trash2 className="size-4" />
              Remove
            </Btn>
          </div>
        </div>
      ) : null}
    </div>
  );
}
