"use client";

import { useState, type ReactNode } from "react";
import { CloseButton } from "../ui/Button";

/**
 * Desktop (lg): info column (400 px, scrolls on its own) beside the map, together exactly one screen high.
 * Below lg: the info column alone; "Show the map" opens the map full screen.
 */
export default function AtlasLayout({ info, stage, mapTitle }: { info: ReactNode; stage: ReactNode; mapTitle: string }) {
  const [mapOpen, setMapOpen] = useState(false);
  return (
    <div className="lg:grid lg:h-[calc(100dvh-56px)] lg:grid-cols-[400px_1fr]">
      <aside className="min-w-0 border-line px-4 pb-10 pt-5 lg:overflow-y-auto lg:border-r lg:px-5 lg:pb-6">
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface text-[15px] font-medium lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="3" cy="12" r="2" fill="var(--n-gene)" />
            <circle cx="8" cy="4" r="2.5" fill="var(--n-center)" />
            <circle cx="13" cy="11" r="2" fill="var(--n-neighbour)" />
            <path d="M3 12L8 4l5 7" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
          Show the map
        </button>
        {info}
        <p className="mt-8 text-[13px] text-ink-2">Research navigation, not medical advice.</p>
      </aside>

      <section className="relative hidden min-w-0 lg:block" aria-label={mapTitle}>
        {stage}
      </section>

      {mapOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg lg:hidden" role="dialog" aria-modal="true" aria-label={mapTitle}>
          <div className="flex h-14 items-center gap-3 border-b border-line px-4">
            <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{mapTitle}</h2>
            <CloseButton onClick={() => setMapOpen(false)} label="Close the map" />
          </div>
          <div className="relative min-h-0 flex-1">{stage}</div>
        </div>
      )}
    </div>
  );
}
