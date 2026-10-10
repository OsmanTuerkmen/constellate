"use client";

import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadIndex } from "@/lib/data";
import { createSearcher, revealSuggestions, type SearchHit } from "@/lib/search";
import { hrefFor } from "@/lib/ids";
import type { IndexEntry } from "@/lib/types";

type Searcher = ReturnType<typeof createSearcher>;
let searcherPromise: Promise<Searcher> | null = null;
function getSearcher(): Promise<Searcher> {
  searcherPromise ??= loadIndex().then((entries) => createSearcher((entries ?? []) as IndexEntry[]));
  searcherPromise.catch(() => (searcherPromise = null));
  return searcherPromise;
}

const TYPE_DOT: Record<string, string> = { disease: "var(--n-neighbour)", gene: "var(--n-gene)", phenotype: "var(--n-phenotype)", org: "var(--focus)" };
const TYPE_NAME: Record<string, string> = { disease: "Disease", gene: "Gene", phenotype: "Symptom", org: "Group" };

export default function SearchBox({
  size = "md",
  autoFocus = false,
  onQuery,
}: {
  size?: "lg" | "md";
  autoFocus?: boolean;
  /** start page: the current hits light up their stars */
  onQuery?: (query: string, hits: SearchHit[]) => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searcher, setSearcher] = useState<Searcher | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const large = size === "lg";

  const warm = useCallback(() => {
    if (searcher) return;
    // the searcher is a function: wrap it, or React would call it as a state updater
    getSearcher().then((fn) => setSearcher(() => fn), (e: Error) => setLoadError(e.message));
  }, [searcher]);

  useEffect(() => {
    if (large) warm(); // start page: load the index right away
  }, [large, warm]);

  // patient groups have no page of their own: they live in the Groups tab of their disease
  const hits: SearchHit[] = useMemo(() => (searcher ? searcher(deferred, 12).filter((h) => h.entry.type !== "org").slice(0, 8) : []), [searcher, deferred]);
  useEffect(() => onQuery?.(deferred, hits), [deferred, hits, onQuery]);

  const go = (hit: SearchHit | undefined) => {
    if (!hit) return;
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(hrefFor(hit.entry.type, hit.entry.id));
  };

  const showList = open && query.trim().length >= 2;

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[active]);
    } else if (event.key === "Escape") {
      if (showList) {
        event.preventDefault();
        setOpen(false);
      } else setQuery("");
    }
  };

  useEffect(() => {
    if (showList) revealSuggestions(fieldRef.current);
  }, [showList, hits.length]);

  return (
    <div className="relative w-full" role="search">
      <div
        ref={fieldRef}
        className={`relative rounded-full border border-line bg-surface transition-colors focus-within:border-line-strong ${large ? "h-14 shadow-[var(--shadow)] md:h-16" : "h-10"}`}
      >
        <svg
          width={large ? 20 : 16}
          height={large ? 20 : 16}
          viewBox="0 0 20 20"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-2 ${large ? "left-5" : "left-3.5"}`}
          aria-hidden="true"
        >
          <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
          aria-label="Search diseases, genes or symptoms"
          placeholder={large ? "Search a diagnosis, gene or symptom" : "Search…"}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onFocus={() => {
            warm();
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          style={{ borderRadius: 9999 }}
          className={`absolute inset-0 h-full w-full bg-transparent placeholder:text-ink-2 ${large ? "pl-[52px] pr-5 text-[17px] md:text-[19px]" : "pl-10 pr-4 text-[15px]"}`}
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[60vh] overflow-y-auto rounded-[16px] border border-line bg-surface p-1.5 text-left shadow-[var(--shadow)]"
        >
          {!searcher && !loadError && <li className="px-3 py-3 text-[15px] text-ink-2">Loading…</li>}
          {loadError && <li className="px-3 py-3 text-[15px] text-contra">Search is unavailable right now.</li>}
          {searcher && !hits.length && <li className="px-3 py-3 text-[15px] text-ink-2">No match for “{query}”.</li>}
          {hits.map((hit, i) => (
            <li
              key={hit.entry.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(hit)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2 ${i === active ? "bg-surface-2" : ""}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_DOT[hit.entry.type] ?? "var(--ink-2)" }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{hit.entry.label}</span>
                {hit.matched && <span className="block truncate text-[13px] text-ink-2">also called “{hit.matched}”</span>}
              </span>
              <span className="shrink-0 text-[13px] text-ink-2">{TYPE_NAME[hit.entry.type] ?? hit.entry.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
