import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function StageHead({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <header className="mb-4">
      <p className="text-xs tracking-widest text-mute uppercase">{kicker}</p>
      <h2 className="font-display text-2xl text-bone md:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-mute">{lede}</p>
    </header>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-mute">{label}</span>
      {children}
    </label>
  );
}

const control =
  "h-11 w-full rounded-md border border-line bg-ink px-3 text-bone outline-none focus:border-brass";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function AreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 w-full rounded-md border border-line bg-ink px-3 py-2 text-bone outline-none focus:border-brass ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Btn({
  tone = "ghost",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "brass" | "ghost" }) {
  const toneClass = tone === "brass" ? "border-brass bg-brass text-ink" : "border-line bg-panel text-bone";
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm disabled:opacity-40 ${toneClass} ${className}`}
    />
  );
}

export function RowButton({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm ${
        on ? "border-brass bg-panel-2 text-bone" : "border-line bg-ink text-bone"
      }`}
    >
      {children}
    </button>
  );
}
