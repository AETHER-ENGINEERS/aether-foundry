import { useEffect, useRef, useState } from "react";
import { drawYard, warmSprites, type DrawBody } from "@/lib/engine/draw-yard";
import { useStudio } from "@/lib/engine/store";

export function YardCanvas({
  tiles,
  w,
  h,
  entities,
  selectedId,
  onCell,
}: {
  tiles: string[];
  w: number;
  h: number;
  entities: DrawBody[];
  selectedId?: string | null;
  onCell: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(18);
  const terrains = useStudio((s) => s.project.terrains);
  const things = useStudio((s) => s.project.things);
  const assets = useStudio((s) => s.project.assets);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      if (!width) return;
      setCell(Math.max(14, Math.min(34, Math.floor(width / w))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [w]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(w * cell * dpr);
    canvas.height = Math.floor(h * cell * dpr);
    canvas.style.width = `${w * cell}px`;
    canvas.style.height = `${h * cell}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    warmSprites(assets);
    drawYard(ctx, { tiles, w, h, cell, entities, terrains, things, selectedId });
  }, [tiles, w, h, cell, entities, terrains, things, assets, selectedId]);

  return (
    <div ref={wrapRef} className="w-full overflow-x-auto">
      <canvas
        ref={ref}
        className="touch-none"
        aria-label="Yard"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = Math.floor((event.clientX - rect.left) / cell);
          const y = Math.floor((event.clientY - rect.top) / cell);
          if (x < 0 || y < 0 || x >= w || y >= h) return;
          onCell(x, y);
        }}
      />
    </div>
  );
}
