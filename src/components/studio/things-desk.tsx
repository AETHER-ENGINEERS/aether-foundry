import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Mark, Tone } from "@/lib/engine/types";
import { useStudio } from "@/lib/engine/store";
import { TONE_BG } from "@/lib/engine/tones";
import { AreaInput, Btn, Field, RowButton, StageHead, TextInput } from "./ui";

const MARKS: Mark[] = ["disc", "diamond", "square", "triangle", "hex"];
const TONES: Tone[] = ["brass", "moss", "bone", "brass-deep"];

function MarkIcon({ mark }: { mark: Mark }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
      {mark === "disc" ? <circle cx="12" cy="12" r="7" /> : null}
      {mark === "square" ? <rect x="5" y="5" width="14" height="14" /> : null}
      {mark === "diamond" ? <polygon points="12,3 21,12 12,21 3,12" /> : null}
      {mark === "triangle" ? <polygon points="12,4 21,20 3,20" /> : null}
      {mark === "hex" ? <polygon points="12,3 20,8 20,16 12,21 4,16 4,8" /> : null}
    </svg>
  );
}

export function ThingsDesk() {
  const things = useStudio((s) => s.project.things);
  const stats = useStudio((s) => s.project.stats);
  const assets = useStudio((s) => s.project.assets);
  const selection = useStudio((s) => s.selection);
  const setSelection = useStudio((s) => s.setSelection);
  const addThing = useStudio((s) => s.addThing);
  const updateThing = useStudio((s) => s.updateThing);
  const deleteThing = useStudio((s) => s.deleteThing);
  const selectedId = selection?.kind === "thing" ? selection.id : things[0]?.id;
  const thing = things.find((item) => item.id === selectedId);

  return (
    <div>
      <StageHead
        kicker="Things"
        title="The cast"
        lede="A thing is a body the yard can be full of. Tags decide which laws can see it. Measures are what those laws push around."
      />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-2">
          {things.map((item) => (
            <RowButton key={item.id} on={item.id === thing?.id} onClick={() => setSelection({ kind: "thing", id: item.id })}>
              <span>{item.name}</span>
              <span className="text-mute">{item.tags[0] ?? ""}</span>
            </RowButton>
          ))}
          <Btn onClick={addThing}>
            <Plus className="size-4" />
            New thing
          </Btn>
        </div>
        {thing ? (
          <div className="flex flex-col gap-3">
            <Field label="Name">
              <TextInput value={thing.name} onChange={(e) => updateThing(thing.id, { name: e.target.value })} />
            </Field>
            <Field label="What it is for">
              <AreaInput value={thing.blurb} onChange={(e) => updateThing(thing.id, { blurb: e.target.value })} />
            </Field>
            <TagsField tags={thing.tags} onCommit={(tags) => updateThing(thing.id, { tags })} />
            <div>
              <p className="mb-1 text-sm text-mute">Mark</p>
              <div className="flex flex-wrap gap-2">
                {MARKS.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    aria-label={mark}
                    aria-pressed={thing.mark === mark}
                    onClick={() => updateThing(thing.id, { mark })}
                    className={`inline-flex size-11 items-center justify-center rounded-md border ${thing.mark === mark ? "border-brass text-brass" : "border-line text-bone"}`}
                  >
                    <MarkIcon mark={mark} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-sm text-mute">Tone</p>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    aria-label={tone}
                    aria-pressed={thing.tone === tone}
                    onClick={() => updateThing(thing.id, { tone })}
                    className={`size-11 rounded-md border ${TONE_BG[tone]} ${thing.tone === tone ? "border-brass" : "border-line"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {stats.map((stat) => {
                const value = thing.stats[stat.key] ?? stat.start;
                return (
                  <label key={stat.key} className="text-sm">
                    <span className="flex justify-between">
                      <span className="text-mute">Starts with {stat.label}</span>
                      <span className="tabular-nums">{value}</span>
                    </span>
                    <input
                      type="range"
                      min={stat.min}
                      max={stat.max}
                      value={value}
                      onChange={(e) =>
                        updateThing(thing.id, { stats: { ...thing.stats, [stat.key]: Number(e.target.value) } })
                      }
                    />
                  </label>
                );
              })}
            </div>
            <div>
              <p className="mb-1 text-sm text-mute">Imported sprite</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateThing(thing.id, { assetId: "" })}
                  className={`h-11 rounded-md border px-3 text-sm ${!thing.assetId ? "border-brass" : "border-line"}`}
                >
                  Mark only
                </button>
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => updateThing(thing.id, { assetId: asset.id })}
                    className={`h-11 rounded-md border px-2 ${thing.assetId === asset.id ? "border-brass" : "border-line"}`}
                  >
                    <img src={asset.dataUrl} alt={asset.name} className="size-8" />
                  </button>
                ))}
              </div>
            </div>
            <Btn onClick={() => deleteThing(thing.id)}>
              <Trash2 className="size-4" />
              Remove thing
            </Btn>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TagsField({ tags, onCommit }: { tags: string[]; onCommit: (tags: string[]) => void }) {
  const serialized = tags.join(", ");
  const [text, setText] = useState(serialized);
  useEffect(() => setText(serialized), [serialized]);
  return (
    <Field label="Tags, comma separated">
      <TextInput
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() =>
          onCommit(
            text
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean),
          )
        }
      />
    </Field>
  );
}
