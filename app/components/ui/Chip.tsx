import type { ReactNode } from "react";

/** A pill. With onClick it is a toggle (aria-pressed); without, a static label. */
export default function Chip({ active, onClick, color, children }: { active?: boolean; onClick?: () => void; color?: string; children: ReactNode }) {
  const dot = color ? <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" /> : null;
  const base = "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium";
  if (!onClick) return <span className={`${base} border-line text-ink-2`}>{dot}{children}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      className={`${base} transition-colors ${active ? "border-line-strong bg-surface-2 text-ink" : "border-line text-ink-2 opacity-60 hover:opacity-100"}`}
    >
      {dot}
      {children}
    </button>
  );
}
