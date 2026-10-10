"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const KEY = "constellate.tour";

export const TOUR_STEPS = [
  { target: "answers", text: "The three answers, in short." },
  { target: "graph", text: "Every line is a piece of evidence. Click one." },
  { target: "compare", text: "Compare with a neighbour that is further along." },
];

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function write(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, value);
  } catch {
    /* private mode: the tour may show again next time */
  }
}

/** About page: "Restart the tour". */
export function restartTour() {
  write(null);
}

/**
 * Three hints on the first visit of a disease page; Skip or the last Next ends it for good.
 * Automated browsers only get it with ?tour=1, so tests and crawlers see the plain page.
 */
export default function Tour() {
  const params = useSearchParams();
  const forced = params.get("tour") === "1";
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const automated = typeof navigator !== "undefined" && navigator.webdriver;
    if (read() === "done") return;
    if (automated && !forced) return;
    const t = window.setTimeout(() => setStep(0), 600); // after the page has drawn
    return () => window.clearTimeout(t);
  }, [forced]);

  useEffect(() => {
    if (step === null) return;
    const place = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${TOUR_STEPS[step].target}"]`);
      const w = 280;
      if (!el || el.getClientRects().length === 0) return setBox({ left: Math.max(16, window.innerWidth / 2 - w / 2), top: window.innerHeight - 180 });
      const r = el.getBoundingClientRect();
      const right = r.right + 16 + w < window.innerWidth;
      const left = right ? r.right + 16 : Math.min(Math.max(16, r.left), window.innerWidth - w - 16);
      const top = right ? Math.max(72, r.top + 8) : Math.min(r.bottom + 12, window.innerHeight - 170);
      setBox({ left, top });
      el.dataset.tourActive = "true";
    };
    place();
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      document.querySelectorAll<HTMLElement>("[data-tour-active]").forEach((el) => delete el.dataset.tourActive);
    };
  }, [step]);

  if (step === null || !box) return null;
  const end = () => {
    write("done");
    setStep(null);
  };
  const last = step === TOUR_STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Quick tour"
      className="sheet-in fixed z-[45] w-[280px] rounded-[16px] border border-focus/50 bg-surface p-4 shadow-[var(--shadow)]"
      style={{ left: box.left, top: box.top }}
    >
      <p className="text-[13px] font-semibold text-focus">
        {step + 1} of {TOUR_STEPS.length}
      </p>
      <p className="mt-1 text-[15px] leading-snug">{TOUR_STEPS[step].text}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={end} className="h-8 rounded-full px-3 text-[13px] text-ink-2 hover:text-ink">
          Skip
        </button>
        <button type="button" onClick={() => (last ? end() : setStep(step + 1))} className="h-8 rounded-full bg-focus px-3 text-[13px] font-medium text-focus-ink">
          {last ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}
