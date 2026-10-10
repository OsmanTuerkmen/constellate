"use client";

import type { ReactNode } from "react";
import { useDialog } from "./useDialog";
import { CloseButton } from "./Button";

/** Centered overlay, max 960 px wide; a bottom sheet below lg. */
export default function Modal({ open, onClose, title, label, children }: { open: boolean; onClose: () => void; title: ReactNode; label: string; children: ReactNode }) {
  const panel = useDialog<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 lg:items-center lg:p-6" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="sheet-in flex max-h-[90dvh] w-full flex-col rounded-t-[20px] border border-line bg-surface shadow-[var(--shadow)] outline-none lg:max-w-[960px] lg:rounded-[20px]"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4 lg:px-7">
          <div className="min-w-0 flex-1 text-[17px] font-semibold">{title}</div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-7">{children}</div>
      </div>
    </div>
  );
}
