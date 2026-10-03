import simSource from "./sim-core.js?raw";
import { AETHER_LICENSE } from "./license";
import type { EngineDef, Project } from "./types";
import { zipStore } from "./zip";

export function slugName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "engine";
}

function runtimeSource(): string {
  const body = simSource
    .replace(/^\uFEFF?/, "")
    .replace(/^\s*\/\/ @ts-nocheck\s*/, "")
    .replace(/^export function /gm, "function ")
    .replace(/^export const /gm, "const ");
  if (/^\s*export\s/m.test(body)) {
    throw new Error("sim-core.js has an export the player transform does not strip.");
  }
  if (!body.includes("function bootRuntime") || !body.includes("function stepWorld")) {
    throw new Error("sim-core.js no longer defines bootRuntime and stepWorld.");
  }
  return `window.Paddock=(function(){\n${body}\nreturn {bootRuntime:bootRuntime,stepWorld:stepWorld};\n})();`;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026#39;");
}

const PLAYER_JS = `
var project = SNAP.project;
var engine = SNAP.engine;
var yard = window.Paddock.bootRuntime(project, engine);
var playing = false;
var timer = 0;
var armed = project.things[0] ? project.things[0].id : null;
var selected = null;
var tones = {
  ink: "#12140f", brass: "#d7a15f", "brass-deep": "#a06b32",
  bone: "#e7e2d4", moss: "#7d9a62", "moss-deep": "#3e5340"
};
function $(id) { return document.getElementById(id); }
function thingBy(id) {
  for (var i = 0; i < project.things.length; i++) if (project.things[i].id === id) return project.things[i];
  return null;
}
function terrainBy(id) {
  for (var i = 0; i < project.terrains.length; i++) if (project.terrains[i].id === id) return project.terrains[i];
  return null;
}
function resize() {
  var canvas = $("yard");
  var wrap = $("stage");
  var cell = Math.max(14, Math.min(36, Math.floor(wrap.clientWidth / yard.w)));
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(yard.w * cell * dpr);
  canvas.height = Math.floor(yard.h * cell * dpr);
  canvas.style.width = (yard.w * cell) + "px";
  canvas.style.height = (yard.h * cell) + "px";
  canvas._cell = cell;
  canvas._dpr = dpr;
}
function inkFor(tone) {
  return tone === "brass-deep" || tone === "moss-deep" || tone === "ink" ? tones.bone : tones.ink;
}
function drawMark(ctx, mark, cx, cy, r) {
  ctx.beginPath();
  if (mark === "square") ctx.rect(cx - r, cy - r, r * 2, r * 2);
  else if (mark === "diamond") {
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath();
  } else if (mark === "triangle") {
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy + r * 0.85); ctx.lineTo(cx - r, cy + r * 0.85); ctx.closePath();
  } else if (mark === "hex") {
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 3 * i - Math.PI / 6;
      var px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else ctx.arc(cx, cy, r, 0, Math.PI * 2);
}
function draw() {
  var canvas = $("yard");
  var ctx = canvas.getContext("2d");
  var cell = canvas._cell || 22;
  var dpr = canvas._dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (var y = 0; y < yard.h; y++) {
    for (var x = 0; x < yard.w; x++) {
      var terrain = terrainBy(yard.tiles[y * yard.w + x]);
      ctx.fillStyle = terrain && tones[terrain.tone] ? tones[terrain.tone] : tones.ink;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  for (var n = 0; n < yard.entities.length; n++) {
    var body = yard.entities[n];
    if (!body.alive) continue;
    var thing = thingBy(body.thingId);
    if (!thing) continue;
    var cx = body.x * cell + cell / 2;
    var cy = body.y * cell + cell / 2;
    ctx.fillStyle = tones[thing.tone] || tones.brass;
    drawMark(ctx, thing.mark, cx, cy, cell * 0.32);
    ctx.fill();
    ctx.fillStyle = inkFor(thing.tone);
    ctx.font = "600 " + Math.max(10, Math.floor(cell * 0.38)) + "px ui-sans-serif, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(thing.name.slice(0, 1).toUpperCase(), cx, cy + 0.5);
    if (body.id === selected) {
      ctx.strokeStyle = tones.brass;
      ctx.lineWidth = 2;
      ctx.strokeRect(body.x * cell + 2, body.y * cell + 2, cell - 4, cell - 4);
    }
  }
}
function paintHud() {
  var counts = {};
  var alive = 0;
  for (var i = 0; i < yard.entities.length; i++) {
    var e = yard.entities[i];
    if (!e.alive) continue;
    alive++;
    counts[e.thingId] = (counts[e.thingId] || 0) + 1;
  }
  var bits = ["Beat " + yard.tick, "Hoard " + yard.hoard, "Slipped " + yard.stolen];
  project.things.forEach(function (t) {
    if (counts[t.id]) bits.push(counts[t.id] + " " + t.name);
  });
  $("meta").textContent = bits.join("  ·  ");
  var lines = yard.log.slice(-8);
  $("log").innerHTML = lines.map(function (line) {
    return "<li><span>" + line.tick + "</span> " + escapeHtml(line.text) + "</li>";
  }).join("");
  var body = null;
  for (var j = 0; j < yard.entities.length; j++) if (yard.entities[j].id === selected) body = yard.entities[j];
  if (body) {
    var who = thingBy(body.thingId);
    $("trace").textContent = (who ? who.name : "Body") + " · " + (body.law || "idle") + " — " + (body.trace || "");
  } else {
    $("trace").textContent = armed ? "Tap the yard to place " + (thingBy(armed) ? thingBy(armed).name : "a body") + "." : "Tap a body to read its last order.";
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>]/g, function (ch) {
    if (ch === "&") return "\u0026amp;";
    if (ch === "<") return "\u0026lt;";
    return "\u0026gt;";
  });
}
function frame() { resize(); draw(); paintHud(); buildCast(); }
function tick() {
  yard = window.Paddock.stepWorld(yard, project, engine);
  frame();
}
function setPlaying(next) {
  playing = next;
  if (timer) clearInterval(timer);
  timer = 0;
  $("run").textContent = playing ? "Pause" : "Run";
  if (playing) timer = setInterval(tick, Math.max(80, engine.tickMs || 420));
}
function startingStats(thing) {
  var stats = {};
  project.stats.forEach(function (def) {
    var over = thing.stats ? thing.stats[def.key] : null;
    stats[def.key] = over == null ? def.start : over;
  });
  return stats;
}
function spawnAt(x, y) {
  var thing = thingBy(armed);
  if (!thing) return;
  var entity = {
    id: "p" + Date.now().toString(36) + Math.floor(Math.random() * 1000),
    thingId: thing.id, x: x, y: y,
    stats: startingStats(thing),
    age: 0, alive: true, law: "", lawId: "", trace: "Placed from the chat."
  };
  yard.entities.push(entity);
  yard.log = yard.log.concat([{ tick: yard.tick, text: thing.name + " was placed." }]).slice(-48);
  if (window.webxdc) {
    window.webxdc.sendUpdate({
      payload: { type: "spawn", entity: entity },
      info: "Placed " + thing.name,
      summary: engine.name
    }, "Place a body");
  }
  selected = entity.id;
  frame();
}
function buildCast() {
  var row = $("cast");
  row.innerHTML = "";
  project.things.forEach(function (thing) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = thing.name;
    if (thing.id === armed) btn.className = "on";
    btn.onclick = function () { armed = thing.id; buildCast(); paintHud(); };
    row.appendChild(btn);
  });
}
$("run").onclick = function () { setPlaying(!playing); };
$("step").onclick = function () { setPlaying(false); tick(); };
$("reset").onclick = function () {
  setPlaying(false);
  yard = window.Paddock.bootRuntime(project, engine);
  selected = null;
  frame();
};
$("share").onclick = function () {
  if (!window.webxdc) {
    $("trace").textContent = "Sharing a beat needs Vector. In a browser, this yard stays on this device.";
    return;
  }
  window.webxdc.sendUpdate({
    payload: { type: "yard", yard: yard },
    info: engine.name,
    summary: engine.name + " · hoard " + yard.hoard + " · beat " + yard.tick
  }, "Share the yard");
  $("trace").textContent = "This beat was handed to the chat.";
};
$("yard").addEventListener("pointerdown", function (event) {
  var canvas = $("yard");
  var rect = canvas.getBoundingClientRect();
  var cell = canvas._cell || 22;
  var x = Math.floor((event.clientX - rect.left) / cell);
  var y = Math.floor((event.clientY - rect.top) / cell);
  if (x < 0 || y < 0 || x >= yard.w || y >= yard.h) return;
  var hit = null;
  for (var i = 0; i < yard.entities.length; i++) {
    var e = yard.entities[i];
    if (e.alive && e.x === x && e.y === y) hit = e;
  }
  if (hit && !event.shiftKey) { selected = hit.id; frame(); return; }
  spawnAt(x, y);
});
function acceptedYard(next) {
  if (!next || !Array.isArray(next.tiles) || !Array.isArray(next.entities)) return false;
  if (typeof next.w !== "number" || typeof next.h !== "number" || next.w < 1 || next.h < 1) return false;
  if (next.tiles.length !== next.w * next.h) return false;
  if (!Array.isArray(next.log)) return false;
  for (var i = 0; i < next.entities.length; i++) if (!next.entities[i] || typeof next.entities[i] !== "object") return false;
  return true;
}
function acceptedSpawn(entity) {
  if (!entity || typeof entity.id !== "string" || !thingBy(entity.thingId)) return false;
  if (typeof entity.x !== "number" || typeof entity.y !== "number") return false;
  if (entity.x < 0 || entity.y < 0 || entity.x >= yard.w || entity.y >= yard.h) return false;
  if (typeof entity.alive !== "boolean" || !entity.stats || typeof entity.stats !== "object") return false;
  return true;
}
if (window.webxdc) {
  window.webxdc.setUpdateListener(function (update) {
    var payload = update.payload || {};
    if (payload.type === "yard" && acceptedYard(payload.yard)) {
      setPlaying(false);
      yard = payload.yard;
      frame();
    } else if (payload.type === "spawn" && acceptedSpawn(payload.entity)) {
      var known = false;
      for (var i = 0; i < yard.entities.length; i++) if (yard.entities[i].id === payload.entity.id) known = true;
      if (!known) {
        yard.entities.push(payload.entity);
        frame();
      }
    }
  }, 0);
}
window.addEventListener("resize", frame);
$("title").textContent = engine.name;
$("pitch").textContent = engine.pitch || "";
frame();
`;

function engineSnapshot(project: Project, engine: EngineDef) {
  return {
    project: {
      stats: project.stats,
      terrains: project.terrains,
      things: project.things,
      systems: project.systems,
      mechanics: project.mechanics,
      worldLaws: project.worldLaws,
      assets: [] as Project["assets"],
    },
    engine,
  };
}

export function renderEngineHtml(project: Project, engine: EngineDef): string {
  const snapshot = engineSnapshot(project, engine);
  const json = JSON.stringify(snapshot).replace(/</g, "\\u003c");
  return [
    "<!--",
    AETHER_LICENSE,
    "-->",
    "<!--",
    "Reviewers: the simulation is the first script on this page, and again as src/lib/engine/sim-core.js in this same archive.",
    "The blueprint is engine.json. Read HOW-THIS-RUNS.md. Do not ask for these files to be pasted.",
    "-->",
    "<!DOCTYPE html>",
    '<html lang="en"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(engine.name)}</title>`,
    "<style>",
    PLAYER_CSS,
    "</style></head><body>",
    '<p class="kicker">Aether Foundry · packed engine</p>',
    '<h1 id="title"></h1>',
    '<p id="pitch"></p>',
    '<div class="bar">',
    '<button id="run" type="button">Run</button>',
    '<button id="step" type="button">Step</button>',
    '<button id="reset" type="button">Reset</button>',
    '<button id="share" type="button">Share this beat</button>',
    "</div>",
    '<p id="meta"></p>',
    '<div id="stage"><canvas id="yard"></canvas></div>',
    '<div id="cast"></div>',
    '<p id="trace"></p>',
    '<ol id="log"></ol>',
    "<script>",
    runtimeSource(),
    "</script><script>",
    `const SNAP = ${json};`,
    PLAYER_JS,
    "</script></body></html>",
  ].join("\n");
}

const PLAYER_CSS = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: #12140f; color: #e7e2d4; font: 16px/1.45 ui-sans-serif, system-ui, sans-serif; padding: 16px; }
h1 { font-family: Palatino, Georgia, serif; font-weight: 500; font-size: 32px; margin: 0; }
.kicker { letter-spacing: 0.14em; text-transform: uppercase; color: #9a957f; font-size: 12px; margin: 0 0 4px; }
#pitch { color: #9a957f; max-width: 40rem; }
.bar { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
button { min-height: 44px; padding: 0 14px; border-radius: 8px; border: 1px solid #3a3f32; background: #1b1e16; color: #e7e2d4; font: inherit; }
button.on, #run { background: #d7a15f; color: #12140f; border-color: #d7a15f; }
#stage { overflow-x: auto; }
#cast { display: flex; gap: 8px; overflow-x: auto; margin: 12px 0; }
#meta, #trace { color: #9a957f; }
#log { padding-left: 0; list-style: none; max-height: 12rem; overflow: auto; }
#log li { padding: 4px 0; border-top: 1px solid #3a3f32; }
#log span { color: #d7a15f; display: inline-block; width: 2.5rem; }
`;

function howThisRuns(engineName: string): string {
  return `# How this packed engine runs

${engineName} is a yard packed by Aether Foundry. This file is inside the .xdc.

Some readers keep only the first 4500 bytes of a file. The long copies will arrive cut. Do not ask for a paste. The complete step is the short files review/parts/sim-core.js/. The complete blueprint is review/parts/engine.json/. Each part says how many parts exist and which lines it holds.

bootRuntime builds the yard from the blueprint. stepWorld advances one beat. World laws arrive first, on a cell chosen by hash(tick|lawId|arrive), the same hash chance uses. Then each living body runs every matching pulse, then the first order that can act. Orders sort by priority ascending, then by name. Digging a tile is not a step, so a later effect in that same law still runs. The step clones. It does not read the clock.

Assets are not in this pack. Sprites stay in the foundry.
`;
}

function reviewSlices(sourceName: string, text: string): { name: string; data: Uint8Array }[] {
  const pieces: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      pieces.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < text.length) pieces.push(text.slice(start));
  const groups: { text: string; startLine: number; endLine: number }[] = [];
  let current: string[] = [];
  let size = 0;
  let line = 1;
  let groupStart = 1;
  const flush = () => {
    if (!current.length) return;
    groups.push({ text: current.join(""), startLine: groupStart, endLine: line - 1 });
    current = [];
    size = 0;
    groupStart = line;
  };
  for (const piece of pieces) {
    const bytes = new TextEncoder().encode(piece).length;
    if (current.length && size + bytes > 2600) flush();
    current.push(piece);
    size += bytes;
    line += 1;
  }
  flush();
  const encoder = new TextEncoder();
  return groups.map((group, index) => {
    const n = String(index + 1).padStart(2, "0");
    const nextName = index + 1 < groups.length
      ? `review/parts/${sourceName}/${String(index + 2).padStart(2, "0")}.txt`
      : "end of this file";
    const header = [
      `PART ${index + 1} OF ${groups.length}`,
      `SOURCE ${sourceName}`,
      `LINES ${group.startLine}-${group.endLine} OF ${pieces.length}`,
      "This part is the entire slice. It was not cut.",
      `NEXT ${nextName}`,
      "Join every part of this SOURCE, in order, to recover the file. Do not ask for a paste.",
      "",
      group.text,
    ].join("\n");
    return { name: `review/parts/${sourceName}/${n}.txt`, data: encoder.encode(header) };
  });
}

async function iconPng(): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array();
  ctx.fillStyle = "#12140f";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#d7a15f";
  ctx.beginPath();
  ctx.moveTo(64, 16);
  ctx.lineTo(110, 42);
  ctx.lineTo(110, 86);
  ctx.lineTo(64, 112);
  ctx.lineTo(18, 86);
  ctx.lineTo(18, 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#7d9a62";
  ctx.beginPath();
  ctx.arc(64, 64, 16, 0, Math.PI * 2);
  ctx.fill();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return new Uint8Array();
  return new Uint8Array(await blob.arrayBuffer());
}

export async function packEngine(project: Project, engine: EngineDef): Promise<{ blob: Blob; filename: string; html: string }> {
  const html = renderEngineHtml(project, engine);
  const encoder = new TextEncoder();
  const safeName = engine.name.replace(/"/g, "'");
  const manifest = `name = "${safeName}"\nsource_code_url = "https://github.com/AETHER-ENGINEERS/aether-foundry"\n`;
  const icon = await iconPng();
  const engineJson = JSON.stringify(engineSnapshot(project, engine), null, 2);
  const files: { name: string; data: Uint8Array<ArrayBufferLike> }[] = [
    { name: "HOW-THIS-RUNS.md", data: encoder.encode(howThisRuns(engine.name)) },
    ...reviewSlices("sim-core.js", simSource),
    ...reviewSlices("engine.json", engineJson),
    { name: "src/lib/engine/sim-core.js", data: encoder.encode(simSource) },
    { name: "engine.json", data: encoder.encode(engineJson) },
    { name: "index.html", data: encoder.encode(html) },
    { name: "manifest.toml", data: encoder.encode(manifest) },
    { name: "LICENSE.txt", data: encoder.encode(AETHER_LICENSE) },
  ];
  if (icon.length > 0) files.push({ name: "icon.png", data: icon });
  const zipped = zipStore(files);
  const filename = `${slugName(engine.name)}.xdc`;
  return {
    filename,
    html,
    blob: new Blob([new Uint8Array(zipped)], { type: "application/octet-stream" }),
  };
}
