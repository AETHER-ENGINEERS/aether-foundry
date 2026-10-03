import { markInk, TONE } from "./tones";
import type { Asset, TerrainDef, ThingDef, Tone } from "./types";

const sprites = new Map<string, HTMLImageElement>();

export function warmSprites(assets: Asset[]) {
  for (const asset of assets) {
    if (!asset.dataUrl) continue;
    const prev = sprites.get(asset.id);
    if (prev && prev.src === asset.dataUrl) continue;
    const img = new Image();
    img.src = asset.dataUrl;
    sprites.set(asset.id, img);
  }
}

export type DrawBody = {
  id: string;
  thingId: string;
  x: number;
  y: number;
  alive: boolean;
};

export type DrawYardInput = {
  tiles: string[];
  w: number;
  h: number;
  cell: number;
  entities: DrawBody[];
  terrains: TerrainDef[];
  things: ThingDef[];
  selectedId?: string | null;
};

function overlay(tone: Tone): string {
  if (tone === "bone" || tone === "brass" || tone === "moss") return "rgba(18,20,15,0.38)";
  return "rgba(231,226,212,0.4)";
}

function paintPattern(
  ctx: CanvasRenderingContext2D,
  pattern: TerrainDef["pattern"],
  x: number,
  y: number,
  cell: number,
  tone: Tone,
) {
  if (pattern === "solid") return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, cell, cell);
  ctx.clip();
  ctx.strokeStyle = overlay(tone);
  ctx.fillStyle = overlay(tone);
  ctx.lineWidth = 1;
  if (pattern === "hatch") {
    ctx.beginPath();
    for (let i = -cell; i < cell * 2; i += 4) {
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i + cell, y + cell);
    }
    ctx.stroke();
  } else if (pattern === "grid") {
    ctx.strokeRect(x + 3, y + 3, cell - 6, cell - 6);
  } else if (pattern === "speck") {
    for (let i = 4; i < cell; i += 6) {
      ctx.fillRect(x + i, y + ((i * 3) % (cell - 4)) + 2, 2, 2);
    }
  } else if (pattern === "wave") {
    ctx.beginPath();
    ctx.moveTo(x + 2, y + cell * 0.45);
    ctx.quadraticCurveTo(x + cell * 0.5, y + cell * 0.2, x + cell - 2, y + cell * 0.45);
    ctx.moveTo(x + 2, y + cell * 0.7);
    ctx.quadraticCurveTo(x + cell * 0.5, y + cell * 0.45, x + cell - 2, y + cell * 0.7);
    ctx.stroke();
  } else if (pattern === "ring") {
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, Math.max(3, cell * 0.28), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function traceMark(ctx: CanvasRenderingContext2D, mark: ThingDef["mark"], cx: number, cy: number, r: number) {
  ctx.beginPath();
  if (mark === "disc") {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (mark === "square") {
    ctx.rect(cx - r, cy - r, r * 2, r * 2);
  } else if (mark === "diamond") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  } else if (mark === "triangle") {
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy + r * 0.8);
    ctx.lineTo(cx - r, cy + r * 0.8);
    ctx.closePath();
  } else {
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}

export function drawYard(ctx: CanvasRenderingContext2D, input: DrawYardInput) {
  const { w, h, cell } = input;
  const terrains = new Map(input.terrains.map((t) => [t.id, t]));
  const things = new Map(input.things.map((t) => [t.id, t]));
  ctx.clearRect(0, 0, w * cell, h * cell);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const terrain = terrains.get(input.tiles[y * w + x]);
      const tone = terrain?.tone ?? "ink";
      ctx.fillStyle = TONE[tone];
      ctx.fillRect(x * cell, y * cell, cell, cell);
      if (terrain) paintPattern(ctx, terrain.pattern, x * cell, y * cell, cell, tone);
    }
  }
  ctx.strokeStyle = "rgba(18,20,15,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x++) {
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, h * cell);
  }
  for (let y = 0; y <= h; y++) {
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(w * cell, y * cell + 0.5);
  }
  ctx.stroke();

  for (const body of input.entities) {
    if (!body.alive) continue;
    const thing = things.get(body.thingId);
    if (!thing) continue;
    const cx = body.x * cell + cell / 2;
    const cy = body.y * cell + cell / 2;
    const r = cell * 0.32;
    const sprite = thing.assetId ? sprites.get(thing.assetId) : undefined;
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const pad = cell * 0.12;
      ctx.drawImage(sprite, body.x * cell + pad, body.y * cell + pad, cell - pad * 2, cell - pad * 2);
    } else {
      ctx.fillStyle = TONE[thing.tone] ?? TONE.brass;
      traceMark(ctx, thing.mark, cx, cy, r);
      ctx.fill();
      ctx.fillStyle = markInk(thing.tone);
      ctx.font = `600 ${Math.max(10, Math.floor(cell * 0.38))}px Outfit, ui-sans-serif, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(thing.name.slice(0, 1).toUpperCase(), cx, cy + 0.5);
    }
    if (body.id === input.selectedId) {
      ctx.strokeStyle = TONE.brass;
      ctx.lineWidth = 2;
      ctx.strokeRect(body.x * cell + 1.5, body.y * cell + 1.5, cell - 3, cell - 3);
    }
  }
}
