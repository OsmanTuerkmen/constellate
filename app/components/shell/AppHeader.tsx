"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "./SearchBox";
import ThemeToggle from "./ThemeToggle";

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <path d="M6 20 L12 8 L20 12 L23 22 Z M12 8 L23 22" fill="none" stroke="var(--line-strong)" strokeWidth="1.2" />
      <circle cx="6" cy="20" r="2.4" fill="var(--n-gene)" />
      <circle cx="12" cy="8" r="3.2" fill="var(--n-center)" />
      <circle cx="20" cy="12" r="2.4" fill="var(--n-neighbour)" />
      <circle cx="23" cy="22" r="2" fill="var(--n-neighbour)" />
    </svg>
  );
}

/** 56 px bar: logo, search (not on the start page, which has its own big field), About, theme. */
export default function AppHeader() {
  const onStart = usePathname() === "/";
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 rounded-[12px] pr-1 font-semibold" aria-label="Constellate home">
          <Logo />
          <span className="hidden text-[16px] tracking-tight sm:inline">Constellate</span>
        </Link>
        <div className="min-w-0 flex-1">{!onStart && <div className="max-w-[520px]"><SearchBox size="md" /></div>}</div>
        <Link href="/about" className="inline-flex h-10 shrink-0 items-center rounded-full px-3 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink">
          About
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
