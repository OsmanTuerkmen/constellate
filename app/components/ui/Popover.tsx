"use client";

import type { ReactNode } from "react";
import { useDialog } from "./useDialog";

/** Small card at a point inside a positioned parent (e.g. a clicked graph node). Esc or a click outside closes it. */
export default function Popover({ anchor, onClose, children }: { anchor: { x: number; y: number }; onClose: () => void; children: ReactNode }) {
  const panel = useDialog<HTMLDivElement>(true, onClose);
  return (
    <>
      <div className="absolute inset-0 z-10" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        tabIndex={-1}
        className="absolute z-20 w-[240px] -translate-x-1/2 rounded-[14px] border border-line bg-surface p-3 shadow-[var(--shadow)] outline-none"
        style={{ left: anchor.x, top: anchor.y + 14 }}
      >
        {children}
      </div>
    </>
  );
}
