"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { diseaseHref } from "@/lib/ids";
import type { SearchHit } from "@/lib/search";
import SearchBox from "../shell/SearchBox";
import { Logo } from "../shell/AppHeader";
import SkyCanvas from "./SkyCanvas";

const EXAMPLES = [
  { id: "MONDO:0009499", label: "Krabbe disease" },
  { id: "MONDO:0018868", label: "metachromatic leukodystrophy" },
  { id: "MONDO:0018150", label: "Gaucher disease" },
];

/** One sentence, one search, three examples, over the whole dataset as a sky. */
export default function StartHero() {
  const [lit, setLit] = useState<string[]>([]);
  const onQuery = useCallback((_q: string, hits: SearchHit[]) => {
    const ids = hits.map((h) => h.entry.id);
    setLit((prev) => (prev.length === ids.length && prev.every((id, i) => id === ids[i]) ? prev : ids));
  }, []);

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-56px)] items-center justify-center overflow-hidden px-4 py-16" aria-labelledby="start-title">
      <SkyCanvas highlight={lit} />
      {/* a soft veil behind the text keeps it readable over the brightest part of the sky */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_38%_at_50%_50%,var(--bg)_0%,transparent_100%)] opacity-85" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[680px] text-center">
        <div className="mx-auto mb-6 w-fit">
          <Logo size={44} />
        </div>
        <h1 id="start-title" className="text-[34px] font-bold leading-[1.1] tracking-tight md:text-[48px]">
          Every rare disease has neighbours.
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-relaxed text-ink-2 md:text-[18px]">
          Search a diagnosis. See what is linked, with a source for every line.
        </p>
        <div className="mx-auto mt-8 max-w-[580px]">
          <SearchBox size="lg" onQuery={onQuery} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[14px]">
          <span className="text-ink-2">Try</span>
          {EXAMPLES.map((e) => (
            <Link
              key={e.id}
              href={diseaseHref(e.id)}
              className="rounded-full border border-line bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-3 py-1.5 font-medium backdrop-blur transition-colors hover:border-line-strong"
            >
              {e.label}
            </Link>
          ))}
        </div>
        <Link href="/about" className="mt-8 inline-block text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink">
          How it works
        </Link>
      </div>
    </section>
  );
}
