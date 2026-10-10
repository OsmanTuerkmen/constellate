"use client";

import Link from "next/link";
import type { Neighbour } from "@/lib/types";
import { diseaseHref, refOf } from "@/lib/ids";
import { similarityWords } from "@/lib/present";

function reason(n: Neighbour): string {
  const genes = n.shared_genes.map((g) => refOf(g).id);
  if (genes.length) return `shares ${genes.slice(0, 2).join(", ")}`;
  const words = similarityWords(n.edge.confidence);
  return words ? `similar symptoms, ${words}` : "similar symptoms";
}

/** Neighbours by link strength. A different mechanism is flagged: what helps there may not transfer. */
export default function RelatedTab({ neighbours, onCompare }: { neighbours: Neighbour[]; onCompare: (id: string) => void }) {
  if (!neighbours.length) return <p className="text-[15px] text-ink-2">No related disease is linked in our data.</p>;
  const sorted = [...neighbours].sort((a, b) => b.edge.confidence - a.edge.confidence);
  return (
    <ul className="divide-y divide-line">
      {sorted.map((n) => (
        <li key={n.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <Link href={diseaseHref(n.id)} className="line-clamp-1 text-[15px] font-medium hover:underline">
              {n.label}
            </Link>
            <p className="text-[13px] text-ink-2">
              {reason(n)}
              {n.mechanism_differs && <span className="ml-2 font-medium text-contra">mechanism differs</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCompare(n.id)}
            aria-label={`Compare with ${n.label}`}
            className="h-8 shrink-0 rounded-full border border-line px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            Compare
          </button>
        </li>
      ))}
    </ul>
  );
}
