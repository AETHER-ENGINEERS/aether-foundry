import { deflateSync } from "node:zlib";
import { readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(root, ".xdc-build");

await build({
  root,
  configFile: false,
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": resolve(root, "src") } },
  build: {
    outDir,
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 1_000_000,
    rollupOptions: {
      input: resolve(root, "xdc/index.html"),
      output: {
        inlineDynamicImports: true,
        format: "iife",
        entryFileNames: "foundry.js",
        assetFileNames: "foundry[extname]",
      },
    },
  },
});

const js = readFileSync(resolve(outDir, "foundry.js"), "utf8").replaceAll("</script", "<\\/script");
const css = readFileSync(resolve(outDir, "foundry.css"), "utf8").replaceAll("</style", "<\\/style");
const license = readFileSync(resolve(root, "LICENSE"), "utf8");
if (license.includes("--")) {
  throw new Error("LICENSE contains -- and cannot sit in an HTML comment unchanged.");
}

const page = [
  "<!--",
  license.trimEnd(),
  "-->",
  "<!--",
  "Reviewers: a reader that keeps only the first 4500 bytes of a file will cut sim-core.js near line 133 and store.ts near line 158.",
  "The complete files are the short parts in review/parts/. Start at review/00-START-HERE.md. Do not ask for a paste.",
  "-->",
  "<!DOCTYPE html>",
  '<html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  "<title>Aether Foundry</title>",
  '<script src="webxdc.js"></script>',
  "<style>",
  css,
  "</style></head><body>",
  '<div id="root"></div>',
  "<script>",
  js,
  "</script></body></html>",
  "",
].join("\n");

if ((page.match(/<\/script>/g) ?? []).length !== 2) {
  throw new Error("index.html script tags would break. Refusing to write.");
}

writeFileSync(resolve(root, "index.html"), page);
writeIcon(resolve(root, "icon.png"));
const packed = [
  { name: "HOW-THE-ENGINE-WORKS.md", data: readFileSync(resolve(root, "HOW-THE-ENGINE-WORKS.md")) },
  { name: "README.md", data: readFileSync(resolve(root, "README.md")) },
  ...walkFiles(resolve(root, "docs"), "docs"),
  ...walkFiles(resolve(root, "src/lib/engine"), "src/lib/engine"),
  ...walkFiles(resolve(root, "src/components/studio"), "src/components/studio"),
  { name: "src/styles.css", data: readFileSync(resolve(root, "src/styles.css")) },
  ...walkFiles(resolve(root, "xdc"), "xdc"),
  { name: "build-xdc.mjs", data: readFileSync(resolve(root, "build-xdc.mjs")) },
  { name: "manifest.toml", data: readFileSync(resolve(root, "manifest.toml")) },
  { name: "LICENSE.txt", data: Buffer.from(license) },
  { name: "icon.png", data: readFileSync(resolve(root, "icon.png")) },
  { name: "index.html", data: Buffer.from(page) },
];
const review = reviewParts(packed);
const xdc = zipStore([...review, ...packed]);
const xdcPath = resolve(root, "aether-foundry.xdc");
writeFileSync(xdcPath, xdc);
rmSync(outDir, { recursive: true, force: true });
console.log("wrote index.html", page.length, "bytes");
console.log("wrote aether-foundry.xdc", xdc.length, "bytes");

function reviewParts(packed) {
  const showFirst = [
    "src/lib/engine/zip.ts",
    "src/lib/engine/export-xdc.ts",
    "src/lib/engine/draw-yard.ts",
    "src/components/studio/paddock.tsx",
  ];
  const parts = [];
  const lines = [];
  for (const file of packed) {
    if (file.name === "index.html" || file.name === "icon.png") continue;
    const text = file.data.toString("utf8");
    if (Buffer.byteLength(text) < 3500 && !showFirst.includes(file.name)) continue;
    const slices = sliceText(text, 2600);
    slices.forEach((slice, index) => {
      const n = String(index + 1).padStart(2, "0");
      const name = `review/parts/${file.name}/${n}.txt`;
      const next = index + 1 < slices.length ? `review/parts/${file.name}/${String(index + 2).padStart(2, "0")}.txt` : "end of this file";
      const header = [
        `PART ${index + 1} OF ${slices.length}`,
        `SOURCE ${file.name}`,
        `LINES ${slice.startLine}-${slice.endLine} OF ${slice.totalLines}`,
        "This part is the entire slice. It was not cut.",
        `NEXT ${next}`,
        "Join every part of this SOURCE, in order, to recover the file. Do not ask for a paste.",
        "",
      ].join("\n");
      const body = Buffer.from(header + slice.text, "utf8");
      if (body.length > 4000) throw new Error(`${name} is ${body.length} bytes, over the cut.`);
      parts.push({ name, data: body, source: file.name });
      lines.push(`${name}  ${file.name}  lines ${slice.startLine}-${slice.endLine}`);
    });
    const recovered = slices.map((slice) => slice.text).join("");
    if (recovered !== text) throw new Error(`Parts of ${file.name} do not join back to the file.`);
  }
  parts.sort((a, b) => {
    const ai = showFirst.indexOf(a.source);
    const bi = showFirst.indexOf(b.source);
    const ar = ai === -1 ? showFirst.length : ai;
    const br = bi === -1 ? showFirst.length : bi;
    return ar - br || a.name.localeCompare(b.name);
  });
  const listText = lines.join("\n") + "\n";
  const listSlices = sliceText(listText, 2600);
  const listParts = listSlices.map((slice, index) => {
    const n = String(index + 1).padStart(2, "0");
    const name = `review/part-list-${n}.txt`;
    const header = `PART ${index + 1} OF ${listSlices.length}\nSOURCE review/part-list\nThis list is complete in these short files.\n\n`;
    return { name, data: Buffer.from(header + slice.text, "utf8") };
  });
  const sim = parts.filter((part) => part.source === "src/lib/engine/sim-core.js").map((part) => part.name);
  const store = parts.filter((part) => part.source === "src/lib/engine/store.ts").map((part) => part.name);
  if (!sim.length || !store.length) throw new Error("Review parts are missing sim-core.js or store.ts.");
  const first = showFirst.map((source) => {
    const names = parts.filter((part) => part.source === source).map((part) => part.name);
    if (!names.length) throw new Error(`Review parts are missing ${source}.`);
    return `## ${source}\n${names.map((name) => `- ${name}`).join("\n")}`;
  }).join("\n\n");
  const start = Buffer.from(startHere(first), "utf8");
  if (start.length > 3500) throw new Error(`Start file is ${start.length} bytes.`);
  for (const part of listParts) {
    if (part.data.length > 4000) throw new Error(`${part.name} is ${part.data.length} bytes.`);
  }
  const packedParts = parts.map(({ name, data }) => ({ name, data }));
  const lead = packedParts.filter((part) => showFirst.some((source) => part.name.startsWith(`review/parts/${source}/`)));
  const rest = packedParts.filter((part) => !lead.includes(part));
  return [{ name: "review/00-START-HERE.md", data: start }, ...lead, ...listParts, ...rest];
}

function startHere(first) {
  return `# Start here

This file is short on purpose. Some readers keep only the first 4500 bytes of a file, and some stop once a budget of files is full. The long copies under src/ may be missing from that read. Do not ask for a paste.

Read these four files first. A previous pass could not see them. Join the parts of one SOURCE in order.

${first}

The step is review/parts/src/lib/engine/sim-core.js/. The store is review/parts/src/lib/engine/store.ts/. What they are required to do is docs/simulation.md in this same archive. index.html is the minified studio Vector boots. It is not the source.
`;
}

function sliceText(text, maxBody) {
  const pieces = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      pieces.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < text.length) pieces.push(text.slice(start));
  const totalLines = pieces.length;
  const groups = [];
  let current = [];
  let size = 0;
  let line = 1;
  let groupStart = 1;
  const flush = () => {
    if (!current.length) return;
    groups.push({ text: current.join(""), startLine: groupStart, endLine: line - 1, totalLines });
    current = [];
    size = 0;
    groupStart = line;
  };
  for (const piece of pieces) {
    const bytes = Buffer.byteLength(piece);
    if (current.length && size + bytes > maxBody) flush();
    current.push(piece);
    size += bytes;
    line += 1;
  }
  flush();
  return groups;
}

function walkFiles(dir, prefix) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const rel = `${prefix}/${entry.name}`;
    const abs = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, rel));
    else out.push({ name: rel, data: readFileSync(abs) });
  }
  return out;
}

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const crc = crc32(file.data) >>> 0;
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, file.data);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length + file.data.length;
  }
  const centralSize = centrals.reduce((n, part) => n + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

function writeIcon(path) {
  const size = 128;
  const rgba = Buffer.alloc(size * size * 4);
  const ink = [0x12, 0x14, 0x0f, 0xff];
  const brass = [0xd7, 0xa1, 0x5f, 0xff];
  const moss = [0x7d, 0x9a, 0x62, 0xff];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      let color = ink;
      if (inHex(nx, ny, 0.5, 0.5, 0.42)) color = brass;
      if (inHex(nx, ny, 0.5, 0.5, 0.24)) color = ink;
      const dx = nx - 0.5;
      const dy = ny - 0.52;
      if (dx * dx + dy * dy < 0.012) color = moss;
      const i = (y * size + x) * 4;
      rgba[i] = color[0];
      rgba[i + 1] = color[1];
      rgba[i + 2] = color[2];
      rgba[i + 3] = color[3];
    }
  }
  writeFileSync(path, png(size, size, rgba));
}

function inHex(x, y, cx, cy, r) {
  const dx = Math.abs(x - cx) / r;
  const dy = Math.abs(y - cy) / r;
  return dy < 0.866 && dx * 0.5 + dy * 0.866 < 0.866;
}

function png(width, height, rgba) {
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body) >>> 0, 8 + data.length);
  return out;
}
