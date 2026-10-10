import type { ReactNode } from "react";

export default function Card({ title, icon, children, className = "", ...rest }: { title?: ReactNode; icon?: ReactNode; children: ReactNode; className?: string; "data-tour"?: string }) {
  return (
    <section className={`rounded-[16px] border border-line bg-surface p-4 ${className}`} {...rest}>
      {title && (
        <h3 className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">
          {icon}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
