"use client";

import { usePrefs } from "../Providers";

/** Dark (default) ↔ light. The choice is kept in localStorage when that is available. */
export default function ThemeToggle() {
  const { theme, setTheme } = usePrefs();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
      title={`Switch to ${next} mode`}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path d="M14.5 11.5A6 6 0 0 1 6.5 3.5a6 6 0 1 0 8 8z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
