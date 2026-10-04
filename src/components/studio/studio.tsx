import { useEffect } from "react";
import { Box, Image, Layers, Map, ScrollText, Send, Shapes, Sprout } from "lucide-react";
import type { Desk } from "@/lib/engine/types";
import { activeEngine, useStudio } from "@/lib/engine/store";
import { bootRuntime } from "@/lib/engine/sim";
import type { Project } from "@/lib/engine/types";
import { AssetsDesk } from "./assets-desk";
import { EnginesDesk } from "./engines-desk";
import { GroundDesk } from "./ground-desk";
import { Inspector } from "./inspector";
import { LawsDesk } from "./laws-desk";
import { Paddock } from "./paddock";
import { SystemsDesk } from "./systems-desk";
import { ThingsDesk } from "./things-desk";
import { VectorDesk } from "./vector-desk";
import { LookMenu } from "./look-menu";
import mark from "./mark.jpg";

const DESKS: { id: Desk; label: string; icon: typeof Box }[] = [
  { id: "paddock", label: "Paddock", icon: Sprout },
  { id: "things", label: "Things", icon: Shapes },
  { id: "systems", label: "Systems", icon: Layers },
  { id: "laws", label: "Laws", icon: ScrollText },
  { id: "ground", label: "Ground", icon: Map },
  { id: "assets", label: "Assets", icon: Image },
  { id: "engines", label: "Engines", icon: Box },
  { id: "vector", label: "Vector", icon: Send },
];

export function Studio() {
  const desk = useStudio((s) => s.desk);
  const setDesk = useStudio((s) => s.setDesk);
  const project = useStudio((s) => s.project);
  const engine = activeEngine(project);
  const status = useStudio((s) => s.status);
  const selectEngine = useStudio((s) => s.selectEngine);
  const incoming = useStudio((s) => s.incoming);
  const applyIncoming = useStudio((s) => s.applyIncoming);
  const dismissIncoming = useStudio((s) => s.dismissIncoming);
  const playing = useStudio((s) => s.playing);
  const speed = useStudio((s) => s.speed);
  const tickMs = engine.tickMs;

  useEffect(() => {
    const unsub = useStudio.persist.onFinishHydration((state) => {
      if (!state) return;
      const next = activeEngine(state.project);
      useStudio.setState({ yard: bootRuntime(state.project, next), playing: false, incoming: null });
      const api = window.webxdc;
      if (!api) return;
      api.setUpdateListener((update) => {
        const payload = update.payload as { type?: string; project?: Project } | null;
        if (payload?.type === "studio" && payload.project) {
          useStudio.getState().offerIncoming(payload.project);
        }
      }, 0);
    });
    void useStudio.persist.rehydrate();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const ms = Math.max(70, Math.round(tickMs / speed) || 70);
    const id = window.setInterval(() => useStudio.getState().tickOnce(), ms);
    return () => window.clearInterval(id);
  }, [playing, speed, tickMs]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-line px-3 py-2">
        <img src={mark} alt="" width={40} height={40} className="size-10 shrink-0 rounded-md border border-line object-cover" />
        <div className="min-w-0">
          <p className="text-xs tracking-widest text-mute uppercase">Systems first</p>
          <h1 className="truncate font-display text-lg leading-none text-bone">
            Aether <em className="text-brass">Foundry</em>
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <LookMenu />
          <label className="min-w-0">
            <span className="sr-only">Open engine</span>
            <select
              className="h-11 max-w-40 rounded-md border border-line bg-ink px-2 text-sm text-bone md:max-w-56"
              value={engine.id}
              onChange={(e) => selectEngine(e.target.value)}
            >
              {project.engines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      {status ? <p className="border-b border-line px-3 py-2 text-sm text-mute">{status}</p> : null}
      {incoming ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-2">
          <p className="text-sm">A peer sent studio laws for {incoming.title}.</p>
          <button type="button" className="h-11 rounded-md bg-brass px-3 text-sm text-on-accent" onClick={applyIncoming}>
            Apply
          </button>
          <button type="button" className="h-11 rounded-md border border-line px-3 text-sm" onClick={dismissIncoming}>
            Dismiss
          </button>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-24 shrink-0 flex-col gap-1 border-r border-line bg-panel p-2 lg:flex" aria-label="Desks">
          {DESKS.map((item) => (
            <DeskButton key={item.id} item={item} current={desk} onSelect={setDesk} stacked />
          ))}
        </nav>
        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          {desk === "paddock" ? <Paddock /> : null}
          {desk === "things" ? <ThingsDesk /> : null}
          {desk === "systems" ? <SystemsDesk /> : null}
          {desk === "laws" ? <LawsDesk /> : null}
          {desk === "ground" ? <GroundDesk /> : null}
          {desk === "assets" ? <AssetsDesk /> : null}
          {desk === "engines" ? <EnginesDesk /> : null}
          {desk === "vector" ? <VectorDesk /> : null}
          <div className="mt-6 lg:hidden">
            <Inspector />
          </div>
        </main>
        <div className="hidden w-80 shrink-0 overflow-y-auto lg:block">
          <Inspector />
        </div>
      </div>
      <nav className="safe-b flex gap-1 overflow-x-auto border-t border-line bg-panel px-2 py-2 lg:hidden" aria-label="Desks">
        {DESKS.map((item) => (
          <DeskButton key={item.id} item={item} current={desk} onSelect={setDesk} />
        ))}
      </nav>
    </div>
  );
}

function DeskButton({
  item,
  current,
  onSelect,
  stacked = false,
}: {
  item: (typeof DESKS)[number];
  current: Desk;
  onSelect: (desk: Desk) => void;
  stacked?: boolean;
}) {
  const Icon = item.icon;
  const on = current === item.id;
  return (
    <button
      type="button"
      aria-current={on ? "page" : undefined}
      onClick={() => onSelect(item.id)}
      className={`flex shrink-0 items-center gap-2 rounded-md px-3 text-sm ${
        stacked ? "w-full flex-col gap-1 px-1 py-2" : "h-11"
      } ${on ? "bg-brass text-on-accent" : "text-bone"}`}
    >
      <Icon className="size-4" />
      {item.label}
    </button>
  );
}
