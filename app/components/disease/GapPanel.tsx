import Link from "next/link";
import type { Core, DiseaseFile, Edge, IndexEntry, Meta } from "@/lib/types";
import { diseaseHref } from "@/lib/ids";
import { RELATION_LABEL, formatDate } from "@/lib/evidence";
import { coverageSearches, gapProps, type GapNeighbour, type GapSearch } from "@/lib/gap";
import Card from "../ui/Card";

export interface GapContent {
  title: string;
  reason: string;
  searched: GapSearch[];
  asOf?: string;
  nearest: GapNeighbour[];
  close: string[];
}

/** No shard: what the dataset knows from the overview graph (core.json) and the source list in meta. */
export function missingGap(id: string, entry: IndexEntry | null, core: Core | null, meta: Meta | null): GapContent {
  const labels = new Map((core?.nodes ?? []).map((n) => [n.id, n.label]));
  const nearest = (core?.edges ?? [])
    .filter((e) => (e.source === id || e.target === id) && e.type !== "caused_by" && e.type !== "associated_gene")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5)
    .map((e) => {
      const other = e.source === id ? e.target : e.source;
      return { id: other, label: labels.get(other) ?? other, via: RELATION_LABEL[e.type] ?? e.type, confidence: e.confidence, edge: e as Edge };
    });
  const label = entry?.label ?? id;
  return {
    title: entry ? `${label}: no mapped neighbourhood yet` : `${id} is not in this dataset`,
    reason: entry
      ? `${label} is in the search index, but there is no detail file for it. We do not show a guess instead.`
      : "This identifier does not match any disease in the current slice (lysosomal storage diseases, leukodystrophies and their neighbours).",
    searched: (meta?.sources ?? []).map((s) => ({ source: s.db, query: s.version ? `version ${s.version}` : undefined })),
    asOf: meta?.built_at,
    nearest,
    close: ["Phenotype annotations or a curated causal gene for this disease", "A patient organisation confirmed on its own website"],
  };
}

/** A disease with a shard but without a patient group: the pipeline's gap block plus the searches behind the studies. */
export function shardGap(file: DiseaseFile): GapContent | null {
  if (!file.gap) return null;
  const props = gapProps(file.gap, file.node.label);
  return {
    title: `No patient group for ${file.node.label} yet`,
    reason: "Where the sources are silent, Constellate says so instead of guessing.",
    searched: [...props.searched, ...coverageSearches(file.coverage, ["ctgov", "reporter", "europepmc"])],
    asOf: props.asOf,
    nearest: props.nearest ?? [],
    close: props.close,
  };
}

/** Honest Gap: what was searched, what is missing, the nearest communities and the next question. */
export default function GapPanel({ gap }: { gap: GapContent }) {
  return (
    <Card className="border-dashed" data-tour="gap">
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-focus">Honest gap</p>
      <h2 className="mt-1 text-[17px] font-semibold leading-snug">{gap.title}</h2>
      <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{gap.reason}</p>

      <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">What we searched</h3>
      <ul className="mt-1 space-y-1 text-[14px]">
        {gap.searched.slice(0, 8).map((s, i) => (
          <li key={`${s.source}-${i}`} className="flex gap-2">
            <span className="min-w-0 flex-1 truncate">
              {s.source}
              {s.query ? <span className="text-ink-2"> · {s.query}</span> : null}
            </span>
            {typeof s.hits === "number" && <span className="tabular shrink-0 text-ink-2">{s.hits} hits</span>}
          </li>
        ))}
        {!gap.searched.length && <li className="text-ink-2">No search log available.</li>}
      </ul>
      {gap.asOf && <p className="mt-1 text-[13px] text-ink-2">as of {formatDate(gap.asOf)}</p>}

      {gap.nearest.length > 0 && (
        <>
          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">Nearest communities</h3>
          <ul className="mt-1 space-y-1 text-[14px]">
            {gap.nearest.slice(0, 4).map((n) => (
              <li key={n.id}>
                <Link href={diseaseHref(n.id)} className="font-medium hover:underline">
                  {n.label}
                </Link>
                <span className="text-ink-2"> · {n.via}</span>
                {n.mechanismDiffers && <span className="ml-1 text-contra">(mechanism differs)</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {gap.close.length > 0 && (
        <>
          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-2">What would close the gap</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[14px] text-ink-2">
            {gap.close.slice(0, 3).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
