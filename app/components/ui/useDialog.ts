"use client";

import { useEffect, useRef } from "react";

// open dialogs, newest last: Esc closes only the top one (an evidence drawer above the compare overlay)
const stack: { current: () => void }[] = [];
let listening = false;
function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape" || !stack.length) return;
  e.preventDefault();
  stack[stack.length - 1].current();
}

/** Esc closes; focus moves into the panel on open and back to the trigger on close. */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const panel = useRef<T>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    stack.push(close);
    if (!listening) {
      window.addEventListener("keydown", onKey);
      listening = true;
    }
    return () => {
      const i = stack.lastIndexOf(close);
      if (i >= 0) stack.splice(i, 1);
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [open]);

  return panel;
}
