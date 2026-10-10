"use client";

import type { ReactNode } from "react";
import { useDialog } from "./useDialog";
import { CloseButton } from "./Button";

/**
 * Desktop (lg): a 420 px panel sliding in at the right edge, below the header, over the map.
 * Below lg: a bottom sheet over the page, at most 90 % of the screen height.
 */
export default function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useDialog<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[55] bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        tabIndex={-1}
        className="sheet-in fixed inset-x-0 bottom-0 z-[60] flex max-h-[90dvh] flex-col rounded-t-[20px] border border-line bg-surface shadow-[var(--shadow)] outline-none lg:drawer-in lg:top-[68px] lg:right-3 lg:bottom-3 lg:left-auto lg:max-h-none lg:w-[420px] lg:rounded-[16px]"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}
