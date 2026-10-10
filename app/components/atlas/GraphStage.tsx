"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Edge } from "@/lib/types";
import { hrefFor } from "@/lib/ids";
import { filterGraph, type Graph, type GraphFilter, type GraphNode } from "@/lib/graph";
import Chip from "../ui/Chip";

const ForceGraphClient = dynamic(() => import("../ForceGraphClient"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[13px] text-ink-2">Drawing the map…</div>,
});

const FILTERS: { key: keyof GraphFilter; label: string; color: string }[] = [
  { key: "genes", label: "Genes", color: "var(--n-gene)" },
  { key: "symptoms", label: "Symptoms", color: "var(--n-phenotype)" },
  { key: "related", label: "Related", color: "var(--n-neighbour)" },
];

const LIST_GROUPS: { kinds: GraphNode["kind"][]; title: string }[] = [
  { kinds: ["gene"], title: "Genes" },
  { kinds: ["neighbour", "disease", "counter", "family"], title: "Diseases" },
  { kinds: ["phenotype"], title: "Symptoms" },
];

export interface GraphStageProps {
  graph: Graph;
  centerShape?: "point" | "ring";
  activeEdge?: string | null;
  onEdge: (edge: Edge) => void;
  onNode: (node: GraphNode, at: { x: number; y: number }) => void;
  /** subtype families that can be bundled; 0 or undefined hides the toggle */
  families?: number;
  expanded?: boolean;
  onToggleFamilies?: () => void;
}

/** The map: fills its parent, with kind filters, a foldable legend and a list view as text alternative. */
export default function GraphStage({ graph, centerShape, activeEdge, onEdge, onNode, families, expanded, onToggleFamilies }: GraphStageProps) {
  const [show, setShow] = useState<GraphFilter>({ genes: true, symptoms: true, related: true });
  const [legend, setLegend] = useState(false);
  const [asList, setAsList] = useState(false);
  const shown = useMemo(() => filterGraph(graph, show), [graph, show]);

  return (
    <div className="relative h-full w-full overflow-hidden" data-testid="graph-stage" data-tour="graph">
      <div className="absolute inset-0">
        {asList ? (
          <NodeList nodes={shown.nodes} />
        ) : (
          <ForceGraphClient nodes={shown.nodes} links={shown.links} centerShape={centerShape} activeEdge={activeEdge} onLinkClick={onEdge} onNodeClick={onNode} />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-center gap-2">
        <div className="pointer-events-auto flex flex-wrap gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] p-1 backdrop-blur">
          {FILTERS.map((f) => (
            <Chip key={f.key} active={show[f.key]} color={f.color} onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}>
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="pointer-events-auto ml-auto flex gap-1.5">
          {Boolean(families) && onToggleFamilies && (
            <button type="button" onClick={onToggleFamilies} aria-pressed={Boolean(expanded)} className="h-8 rounded-full border border-line bg-surface px-3 text-[13px] text-ink-2 hover:text-ink">
              {expanded ? "Group subtypes" : "Show subtypes"}
            </button>
          )}
          <button type="button" onClick={() => setAsList((v) => !v)} aria-pressed={asList} className="h-8 rounded-full border border-line bg-surface px-3 text-[13px] text-ink-2 hover:text-ink">
            {asList ? "Show as map" : "Show as list"}
          </button>
        </div>
      </div>

      {!asList && (
        <div className="absolute bottom-3 left-3 max-w-[calc(100%-24px)]">
          {legend ? (
            <div className="rounded-[14px] border border-line bg-surface p-3 text-[13px] text-ink-2 shadow-[var(--shadow)]">
              <Legend />
              <button type="button" onClick={() => setLegend(false)} className="mt-2 text-ink underline underline-offset-2">
                Hide legend
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setLegend(true)} className="h-8 rounded-full border border-line bg-surface px-3 text-[13px] text-ink-2 hover:text-ink">
              Legend
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Legend() {
  const dot = (color: string, label: string) => (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </li>
  );
  const line = (style: string, color: string, label: string) => (
    <li className="flex items-center gap-2">
      <span className="w-6 border-t-2" style={{ borderStyle: style, borderColor: color }} aria-hidden="true" />
      {label}
    </li>
  );
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
      <ul className="space-y-1">
        {dot("var(--n-center)", "This disease")}
        {dot("var(--n-gene)", "Gene")}
        {dot("var(--n-neighbour)", "Related disease")}
        {dot("var(--n-phenotype)", "Symptom")}
      </ul>
      <ul className="space-y-1">
        {line("solid", "var(--lvl-strong)", "Curated / observed")}
        {line("dashed", "var(--lvl-text)", "Text-mined")}
        {line("dotted", "var(--lvl-inferred)", "Computed")}
        {line("solid", "var(--contra)", "Different mechanism")}
      </ul>
    </div>
  );
}

function NodeList({ nodes }: { nodes: GraphNode[] }) {
  return (
    <div className="h-full overflow-y-auto px-4 pb-6 pt-16">
      {LIST_GROUPS.map((group) => {
        const items = nodes.filter((n) => group.kinds.includes(n.kind));
        if (!items.length) return null;
        return (
          <section key={group.title} className="mb-4">
            <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">
              {group.title} ({items.length})
            </h3>
            <ul className="space-y-0.5">
              {items.map((n) => (
                <li key={n.id} className="text-[15px]">
                  {n.kind === "family" ? (
                    <span className="text-ink-2">{n.label} ({n.members} subtypes)</span>
                  ) : n.kind === "phenotype" ? (
                    <span>{n.label}</span>
                  ) : (
                    <Link href={hrefFor(n.kind === "gene" ? "gene" : "disease", n.id)} className="hover:underline">
                      {n.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
