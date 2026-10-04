import { useLayoutEffect, useState } from "react";
import { Palette } from "lucide-react";
import {
  FONT_CHOICES,
  THEMES,
  applyLook,
  customFromTokens,
  loadLook,
  resolveTokens,
  saveLook,
  type CustomColors,
  type FontId,
  type Look,
  type ThemeId,
} from "@/lib/engine/look";

const FIELDS: { key: keyof CustomColors; label: string }[] = [
  { key: "ink", label: "Ground" },
  { key: "accent", label: "Accent" },
  { key: "second", label: "Second" },
  { key: "bone", label: "Type" },
];

export function LookMenu() {
  const [look, setLook] = useState(loadLook);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    applyLook(look);
    saveLook(look);
  }, [look]);

  const colors = look.theme === "custom" ? look.custom : customFromTokens(resolveTokens(look));

  function chooseTheme(theme: ThemeId) {
    setLook((prev) => ({ ...prev, theme }));
  }

  function paint(key: keyof CustomColors, value: string) {
    setLook((prev) => {
      const base = prev.theme === "custom" ? prev.custom : customFromTokens(resolveTokens(prev));
      return { ...prev, theme: "custom", custom: { ...base, [key]: value } };
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="look-panel"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-ink px-3 text-sm text-bone"
      >
        <Palette className="size-4 text-brass" />
        Look
      </button>
      {open ? (
        <div
          id="look-panel"
          className="absolute top-12 right-0 z-20 w-[min(22rem,calc(100vw-1.5rem))] rounded-md border border-line bg-panel p-3 shadow-lg"
        >
          <p className="text-xs tracking-widest text-mute uppercase">The room</p>
          <p className="mt-1 text-sm text-mute">
            The yard keeps the colours of the ground and the bodies. This is only the room you work in.
          </p>
          <div className="mt-3 grid gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                aria-pressed={look.theme === theme.id}
                onClick={() => chooseTheme(theme.id)}
                className={`flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm ${
                  look.theme === theme.id ? "border-brass bg-panel-2" : "border-line"
                }`}
              >
                <Swatch theme={theme.id} />
                <span>
                  <span className="block text-bone">{theme.label}</span>
                  <span className="block text-mute">{theme.note}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="mb-1 block text-mute">{field.label}</span>
                <span className="flex h-11 items-center gap-2 rounded-md border border-line bg-ink px-2">
                  <input
                    type="color"
                    aria-label={`${field.label} picker`}
                    value={safePicker(colors[field.key])}
                    onChange={(e) => paint(field.key, e.target.value)}
                    className="size-7 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    value={colors[field.key]}
                    spellCheck={false}
                    aria-label={`${field.label} hex`}
                    onChange={(e) => paint(field.key, e.target.value)}
                    className="w-full bg-transparent font-mono text-sm text-bone outline-none"
                  />
                </span>
              </label>
            ))}
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-mute">Typeface</span>
            <select
              className="h-11 w-full rounded-md border border-line bg-ink px-2 text-bone"
              value={look.font}
              onChange={(e) => setLook((prev) => ({ ...prev, font: e.target.value as FontId }))}
            >
              {FONT_CHOICES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {look.font === "named" ? (
            <label className="mt-2 block text-sm">
              <span className="mb-1 block text-mute">Font name on this device</span>
              <input
                value={look.namedFont}
                placeholder="Iowan Old Style"
                onChange={(e) => setLook((prev) => ({ ...prev, namedFont: e.target.value }))}
                className="h-11 w-full rounded-md border border-line bg-ink px-3 text-bone outline-none"
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Swatch({ theme }: { theme: Exclude<ThemeId, "custom"> }) {
  const tokens = resolveTokens({ theme, custom: { ink: "", accent: "", second: "", bone: "" }, font: "studio", namedFont: "" });
  return (
    <span className="flex shrink-0" aria-hidden>
      <span className="size-5 rounded-l-sm border border-line" style={{ background: tokens.brass }} />
      <span className="size-5 rounded-r-sm border border-l-0 border-line" style={{ background: tokens.moss }} />
    </span>
  );
}

function safePicker(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#7c3aed";
}
