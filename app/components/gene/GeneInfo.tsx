"use client";

import Link from "next/link";
import { useState } from "react";
import type { Edge, GeneFile } from "@/lib/types";
import { diseaseHref } from "@/lib/ids";
import { pathwayRefs } from "@/lib/normalize";
import { useEdgePanel } from "../Providers";
import Card from "../ui/Card";

/** Left column of a gene page: what the gene does (pathways) and the diseases it is linked to. */
export default function GeneInfo({ file, labelOf }: { file: GeneFile; labelOf: (id: string) => string }) {
  const { openEdge } = useEdgePanel();
  const [allPathways, setAllPathways] = useState(false);
  const pathways = pathwayRefs(file);
  // rolled-up edges repeat their subtypes' annotations; each disease once, causal links first
  const byDisease = new Map<string, Edge>();
  for (const e of file.diseases) {
    if (e.rolled_up_from?.length) continue;
    const prev = byDisease.get(e.source);
    if (!prev || (prev.type !== "caused_by" && e.type === "caused_by")) byDisease.set(e.source, e);
  }
  const diseases = [...byDisease.values()].sort((a, b) => Number(b.type === "caused_by") - Number(a.type === "caused_by") || labelOf(a.source).localeCompare(labelOf(b.source)));
  const shown = allPathways ? pathways : pathways.slice(0, 3);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{file.node.id}</h1>
        {file.node.full_name && <p className="mt-1 text-[15px] text-ink-2">{file.node.full_name}</p>}
      </header>

      <Card title="What does it do?">
        {pathways.length ? (
          <>
            <ul className="space-y-1 text-[15px]">
              {shown.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => openEdge(p.edge)} className="text-left hover:underline">
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
            {pathways.length > 3 && (
              <button type="button" onClick={() => setAllPathways((v) => !v)} className="mt-1 text-[13px] font-medium text-ink-2 hover:text-ink">
                {allPathways ? "Less" : `${pathways.length - 3} more`}
              </button>
            )}
          </>
        ) : (
          <p className="text-[15px] text-ink-2">No pathway listed in Reactome.</p>
        )}
      </Card>

      <Card title={`Diseases (${diseases.length})`}>
        <ul className="divide-y divide-line">
          {diseases.map((e) => (
            <li key={e.source} className="flex items-center gap-2 py-2">
              <Link href={diseaseHref(e.source)} className="min-w-0 flex-1 truncate text-[15px] font-medium hover:underline">
                {labelOf(e.source)}
              </Link>
              <button type="button" onClick={() => openEdge(e)} className="shrink-0 text-[13px] text-ink-2 hover:text-ink">
                {e.type === "caused_by" ? "causes" : "associated"}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
