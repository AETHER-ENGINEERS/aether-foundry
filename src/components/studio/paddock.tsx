import { useMemo } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { activeEngine, useStudio } from "@/lib/engine/store";
import { Btn, StageHead } from "./ui";
import { YardCanvas } from "./yard-canvas";

export function Paddock() {
  const project = useStudio((s) => s.project);
  const yard = useStudio((s) => s.yard);
  const playing = useStudio((s) => s.playing);
  const speed = useStudio((s) => s.speed);
  const selection = useStudio((s) => s.selection);
  const setPlaying = useStudio((s) => s.setPlaying);
  const setSpeed = useStudio((s) => s.setSpeed);
  const tickOnce = useStudio((s) => s.tickOnce);
  const resetYard = useStudio((s) => s.resetYard);
  const setSelection = useStudio((s) => s.setSelection);
  const engine = activeEngine(project);
  const live = yard.engineId === engine.id ? yard : null;
  const counts = useMemo(() => {
    const next = new Map<string, number>();
    for (const body of live?.entities ?? []) {
      if (body.alive) next.set(body.thingId, (next.get(body.thingId) ?? 0) + 1);
    }
    return next;
  }, [live]);

  return (
    <div>
      <StageHead
        kicker="Paddock"
        title={engine.name}
        lede="This is the test yard, not the game. Run it. Then change a law and see what the bodies do instead."
      />
      <div className="mb-3 flex flex-wrap gap-2">
        <Btn tone="brass" onClick={() => setPlaying(!playing)} className={!playing && (live?.tick ?? 0) === 0 ? "nudge" : ""}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pause" : "Run"}
        </Btn>
        <Btn
          onClick={() => {
            setPlaying(false);
            tickOnce();
          }}
        >
          <SkipForward className="size-4" />
          Step
        </Btn>
        <Btn onClick={resetYard}>
          <RotateCcw className="size-4" />
          Reset
        </Btn>
        {([1, 2, 4] as const).map((value) => (
          <Btn key={value} tone={speed === value ? "brass" : "ghost"} onClick={() => setSpeed(value)} aria-pressed={speed === value}>
            {value === 1 ? "Steady" : value === 2 ? "Brisk" : "Hasty"}
          </Btn>
        ))}
      </div>
      <p className="mb-3 text-sm text-mute tabular-nums">
        Beat {live?.tick ?? 0} · Hoard {live?.hoard ?? 0} · Slipped {live?.stolen ?? 0}
      </p>
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {project.things
          .filter((thing) => counts.has(thing.id) || engine.spawns.some((sp) => sp.thingId === thing.id))
          .map((thing) => (
            <span key={thing.id} className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-sm tabular-nums">
              {counts.get(thing.id) ?? 0} {thing.name}
            </span>
          ))}
      </div>
      <div className="rounded-md border border-line bg-ink p-2">
        <YardCanvas
          tiles={live?.tiles ?? engine.tiles}
          w={engine.mapW}
          h={engine.mapH}
          entities={live?.entities ?? []}
          selectedId={selection?.kind === "entity" ? selection.id : null}
          onCell={(x, y) => {
            const hit = [...(live?.entities ?? [])].reverse().find((body) => body.alive && body.x === x && body.y === y);
            if (hit) setSelection({ kind: "entity", id: hit.id });
            else setSelection({ kind: "tile", x, y, live: true });
          }}
        />
      </div>
      <p className="mt-2 text-sm text-mute">Tap a body. The reading tells you which law takes the next beat, and which ones lost.</p>
      <ol className="mt-3 max-h-48 overflow-y-auto rounded-md border border-line" aria-live="polite">
        {(live?.log ?? []).slice(-12).map((line, index) => (
          <li key={`${line.tick}-${index}`} className="border-t border-line px-3 py-2 text-sm first:border-t-0">
            <span className="mr-2 inline-block w-8 text-brass tabular-nums">{line.tick}</span>
            {line.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
