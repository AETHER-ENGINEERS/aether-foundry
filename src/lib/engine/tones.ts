import type { Tone } from "./types";

/** Canvas twin of the CSS tokens in styles.css. */
export const TONE: Record<Tone | "mute" | "panel" | "line", string> = {
  ink: "#12140f",
  brass: "#d7a15f",
  "brass-deep": "#a06b32",
  bone: "#e7e2d4",
  moss: "#7d9a62",
  "moss-deep": "#3e5340",
  mute: "#9a957f",
  panel: "#1b1e16",
  line: "#3a3f32",
};

export const TONE_BG: Record<Tone, string> = {
  ink: "bg-ink",
  brass: "bg-brass",
  "brass-deep": "bg-brass-deep",
  bone: "bg-bone",
  moss: "bg-moss",
  "moss-deep": "bg-moss-deep",
};

export function markInk(tone: Tone): string {
  return tone === "brass-deep" || tone === "moss-deep" || tone === "ink" ? TONE.bone : TONE.ink;
}
