import { deflateSync, crc32 } from "node:zlib";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
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
rmSync(outDir, { recursive: true, force: true });
console.log("wrote index.html", page.length, "bytes");

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
