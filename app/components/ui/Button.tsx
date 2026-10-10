import type { ButtonHTMLAttributes } from "react";

const VARIANT = {
  primary: "bg-focus text-focus-ink hover:brightness-110",
  ghost: "border border-line text-ink hover:bg-surface-2",
} as const;

export default function Button({ variant = "ghost", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANT }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium transition disabled:opacity-50 ${VARIANT[variant]} ${className}`}
    />
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
