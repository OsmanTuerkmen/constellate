"use client";

import { useRef } from "react";

export interface TabDef {
  id: string;
  label: string;
}

/** Underlined tabs with arrow-key navigation (WAI-ARIA tabs pattern). Panels are rendered by the caller. */
export default function Tabs({ tabs, active, onChange, idPrefix }: { tabs: TabDef[]; active: string; onChange: (id: string) => void; idPrefix: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const j = (i + step + tabs.length) % tabs.length;
    onChange(tabs[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div role="tablist" className="flex gap-1 border-b border-line">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          role="tab"
          type="button"
          id={`${idPrefix}-tab-${t.id}`}
          aria-controls={`${idPrefix}-panel-${t.id}`}
          aria-selected={active === t.id}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKey(e, i)}
          className={`-mb-px border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors ${active === t.id ? "border-focus text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ idPrefix, id, active, children }: { idPrefix: string; id: string; active: string; children: React.ReactNode }) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} className="pt-3">
      {children}
    </div>
  );
}
