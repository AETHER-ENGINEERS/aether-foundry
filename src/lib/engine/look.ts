export type ThemeId = "foundry" | "undercroft" | "daybook" | "custom";
export type FontId = "studio" | "plain" | "serif" | "mono" | "named";

export type CustomColors = {
  ink: string;
  accent: string;
  second: string;
  bone: string;
};

export type Look = {
  theme: ThemeId;
  custom: CustomColors;
  font: FontId;
  namedFont: string;
};

type Tokens = {
  ink: string;
  panel: string;
  panel2: string;
  line: string;
  bone: string;
  mute: string;
  brass: string;
  brassDeep: string;
  moss: string;
  mossDeep: string;
  onAccent: string;
};

const FOUNDRY: Tokens = {
  ink: "#07060a",
  panel: "#110e18",
  panel2: "#1a1524",
  line: "#322844",
  bone: "#f4eefc",
  mute: "#a396b8",
  brass: "#7c3aed",
  brassDeep: "#4c1d95",
  moss: "#1f7a45",
  mossDeep: "#0f3d24",
  onAccent: "#f7f3ff",
};

const PRESETS: Record<Exclude<ThemeId, "custom">, Tokens> = {
  foundry: FOUNDRY,
  undercroft: {
    ink: "#12140f",
    panel: "#1b1e16",
    panel2: "#24281e",
    line: "#3a3f32",
    bone: "#e7e2d4",
    mute: "#9a957f",
    brass: "#d7a15f",
    brassDeep: "#a06b32",
    moss: "#7d9a62",
    mossDeep: "#3e5340",
    onAccent: "#12140f",
  },
  daybook: {
    ink: "#f3eee4",
    panel: "#e7e0d2",
    panel2: "#ddd4c2",
    line: "#c9bda6",
    bone: "#1c140c",
    mute: "#6d6254",
    brass: "#5b2d91",
    brassDeep: "#3d1d66",
    moss: "#1d5c38",
    mossDeep: "#0e3320",
    onAccent: "#f7f3ff",
  },
};

const FONTS: Record<Exclude<FontId, "named">, { sans: string; display: string }> = {
  studio: {
    sans: 'ui-sans-serif, system-ui, sans-serif',
    display: '"Iowan Old Style", Palatino, Georgia, serif',
  },
  plain: {
    sans: 'ui-sans-serif, system-ui, sans-serif',
    display: 'ui-sans-serif, system-ui, sans-serif',
  },
  serif: {
    sans: 'Palatino, Georgia, serif',
    display: 'Palatino, Georgia, serif',
  },
  mono: {
    sans: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace',
    display: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace',
  },
};

const KEY = "aether-foundry-look";

export const THEMES: { id: Exclude<ThemeId, "custom">; label: string; note: string }[] = [
  { id: "foundry", label: "Foundry", note: "Royal purple and forest green on black." },
  { id: "undercroft", label: "Undercroft", note: "Brass and moss, the first room." },
  { id: "daybook", label: "Daybook", note: "Paper, with the same purple and green." },
];

export const FONT_CHOICES: { id: FontId; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "plain", label: "Plain" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
  { id: "named", label: "A font I have" },
];

export function defaultLook(): Look {
  return {
    theme: "foundry",
    custom: { ink: FOUNDRY.ink, accent: FOUNDRY.brass, second: FOUNDRY.moss, bone: FOUNDRY.bone },
    font: "studio",
    namedFont: "",
  };
}

export function loadLook(): Look {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultLook();
    const parsed = JSON.parse(raw) as Partial<Look>;
    const base = defaultLook();
    const theme = parsed.theme;
    return {
      theme: theme === "undercroft" || theme === "daybook" || theme === "custom" ? theme : "foundry",
      custom: {
        ink: typeof parsed.custom?.ink === "string" ? parsed.custom.ink : base.custom.ink,
        accent: typeof parsed.custom?.accent === "string" ? parsed.custom.accent : base.custom.accent,
        second: typeof parsed.custom?.second === "string" ? parsed.custom.second : base.custom.second,
        bone: typeof parsed.custom?.bone === "string" ? parsed.custom.bone : base.custom.bone,
      },
      font: FONT_CHOICES.some((item) => item.id === parsed.font) ? (parsed.font as FontId) : "studio",
      namedFont: typeof parsed.namedFont === "string" ? parsed.namedFont : "",
    };
  } catch {
    return defaultLook();
  }
}

export function saveLook(look: Look) {
  try {
    localStorage.setItem(KEY, JSON.stringify(look));
  } catch {
    /* a private window can refuse the write; the room still changes for this visit */
  }
}

function hexOf(value: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const part = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

function mix(a: string, b: string, t: number): string {
  const left = hexOf(a);
  const right = hexOf(b);
  if (!left || !right) return a;
  return toHex(
    left[0] + (right[0] - left[0]) * t,
    left[1] + (right[1] - left[1]) * t,
    left[2] + (right[2] - left[2]) * t,
  );
}

function light(hex: string): boolean {
  const rgb = hexOf(hex);
  if (!rgb) return false;
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150;
}

function fromCustom(colors: CustomColors): Tokens {
  const ink = hexOf(colors.ink) ? colors.ink : FOUNDRY.ink;
  const accent = hexOf(colors.accent) ? colors.accent : FOUNDRY.brass;
  const second = hexOf(colors.second) ? colors.second : FOUNDRY.moss;
  const bone = hexOf(colors.bone) ? colors.bone : FOUNDRY.bone;
  return {
    ink,
    panel: mix(ink, bone, 0.08),
    panel2: mix(ink, bone, 0.14),
    line: mix(ink, accent, 0.38),
    bone,
    mute: mix(bone, ink, 0.42),
    brass: accent,
    brassDeep: mix(accent, "#000000", 0.35),
    moss: second,
    mossDeep: mix(second, "#000000", 0.4),
    onAccent: light(accent) ? ink : bone,
  };
}

export function resolveTokens(look: Look): Tokens {
  if (look.theme === "custom") return fromCustom(look.custom);
  return PRESETS[look.theme];
}

export function customFromTokens(tokens: Tokens): CustomColors {
  return { ink: tokens.ink, accent: tokens.brass, second: tokens.moss, bone: tokens.bone };
}

function fontFamily(look: Look): { sans: string; display: string } {
  if (look.font !== "named") return FONTS[look.font];
  const name = look.namedFont.replace(/[^a-zA-Z0-9 -]/g, "").trim();
  if (!name) return FONTS.studio;
  const stack = `"${name}", ui-sans-serif, system-ui, sans-serif`;
  return { sans: stack, display: stack };
}

export function applyLook(look: Look) {
  const tokens = resolveTokens(look);
  const root = document.documentElement;
  const set = (name: string, value: string) => root.style.setProperty(name, value);
  set("--color-ink", tokens.ink);
  set("--color-panel", tokens.panel);
  set("--color-panel-2", tokens.panel2);
  set("--color-line", tokens.line);
  set("--color-bone", tokens.bone);
  set("--color-mute", tokens.mute);
  set("--color-brass", tokens.brass);
  set("--color-brass-deep", tokens.brassDeep);
  set("--color-moss", tokens.moss);
  set("--color-moss-deep", tokens.mossDeep);
  set("--color-on-accent", tokens.onAccent);
  const fonts = fontFamily(look);
  set("--font-sans", fonts.sans);
  set("--font-display", fonts.display);
  root.style.colorScheme = light(tokens.ink) ? "light" : "dark";
}
