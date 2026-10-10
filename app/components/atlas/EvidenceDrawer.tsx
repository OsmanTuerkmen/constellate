"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadDisease } from "@/lib/data";
import { allDiseaseEdges } from "@/lib/normalize";
import type { Edge, Evidence } from "@/lib/types";
import { LEVEL_INFO, RELATION_LABEL, formatConfidence, formatDate } from "@/lib/evidence";
import { computedRecordLabel, humanizeRank, isSimilarityEdge, similarityWords } from "@/lib/present";
import { useAtlasParams } from "@/lib/useAtlasParams";
import { useEdgePanel } from "../Providers";
import Drawer from "../ui/Drawer";

/** core.json edges carry at most 3 records without snippets: fetch the complete edge from a disease shard. */
function useFullEdge(given: Edge | undefined): Edge | undefined {
  const [full, setFull] = useState<Edge | null>(null);
  useEffect(() => {
    if (!given?.evidence_omitted) return;
    let alive = true;
    (async () => {
      for (const id of [given.source, given.target].filter((x) => x.startsWith("MONDO:"))) {
        const file = await loadDisease(id).catch(() => null);
        const match = file && allDiseaseEdges(file).find((e) => e.id === given.id);
        if (match) {
          if (alive) setFull(match);
          return;
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [given]);
  return full && given && full.id === given.id ? full : given;
}

/** The evidence for the link in ?edge=. An id the page has not loaded keeps the drawer closed. */
export default function EvidenceDrawer() {
  const { edge: edgeId, setEdge } = useAtlasParams();
  const { getEdge, labelOf, subscribe, version } = useEdgePanel();
  // re-read once the page has registered its edges; the server never knows them, so it renders nothing
  const hydrated = useSyncExternalStore(subscribe, version, () => -1) >= 0;
  const edge = useFullEdge(hydrated && edgeId ? getEdge(edgeId) : undefined);
  if (!edge) return null;

  const similarity = isSimilarityEdge(edge);
  const from = labelOf(edge.source);
  const to = labelOf(edge.target);
  const lead = edge.evidence[0];
  const level = LEVEL_INFO[edge.level];

  return (
    <Drawer open onClose={() => setEdge(null)} title={`Evidence: ${from} → ${to}`}>
      <p className="text-[17px] font-semibold leading-snug">
        {from} <span className="font-normal text-ink-2">{RELATION_LABEL[edge.type] ?? edge.type.replaceAll("_", " ")}</span> {to}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{level?.meaning}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
        <Fact label="Level" value={level?.label ?? edge.level} />
        <Fact label="Date" value={formatDate(lead?.date)} />
        <Fact label={similarity ? "Similarity" : "Confidence"} value={`${formatConfidence(edge.confidence)}${similarity && similarityWords(edge.confidence) ? ` · ${similarityWords(edge.confidence)}` : ""}`} />
        <Fact label="Independent sources" value={String(edge.independent_sources?.length ?? 0)} />
      </dl>

      {edge.formula && (
        <p className="mt-4 break-words rounded-[12px] bg-surface-2 px-3 py-2.5 font-mono text-[13px] leading-relaxed">{humanizeRank(edge.formula, from, to)}</p>
      )}

      <Section title={`Sources (${edge.evidence.length})`}>
        {edge.evidence.length ? (
          <ul className="space-y-2">
            {edge.evidence.map((ev, i) => (
              <EvidenceRow key={i} ev={ev} similarity={similarity} from={from} to={to} />
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-2">No supporting source: this link only has counter-evidence.</p>
        )}
      </Section>

      <Section title="Counter-evidence" danger>
        {edge.contradicting.length ? (
          <ul className="space-y-2">
            {edge.contradicting.map((ev, i) => (
              <EvidenceRow key={i} ev={ev} contra similarity={similarity} from={from} to={to} />
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-2">No counter-evidence found. Absence of a record is not proof that none exists.</p>
        )}
      </Section>

      <p className="mt-6 font-mono text-[12px] text-ink-2 select-all">{edge.id}</p>
    </Drawer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-surface-2 px-3 py-2">
      <dt className="text-ink-2">{label}</dt>
      <dd className="tabular mt-0.5 text-[15px] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function Section({ title, danger = false, children }: { title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className={`mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] ${danger ? "text-contra" : "text-ink-2"}`}>{title}</h3>
      {children}
    </section>
  );
}

function EvidenceRow({ ev, contra = false, similarity, from, to }: { ev: Evidence; contra?: boolean; similarity: boolean; from: string; to: string }) {
  const computed = ev.record ? computedRecordLabel(ev.record) : null;
  const ai = ev.level === "text_mined" || Boolean(ev.model);
  return (
    <li className={`rounded-[12px] border px-3 py-2.5 ${contra ? "border-contra/40 bg-contra-soft" : "border-line"}`}>
      <div className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
        <span className="font-semibold">{ev.db === "computed" ? "Constellate" : ev.db}</span>
        {ev.record &&
          (computed ? (
            <span className="text-ink-2">{computed}</span>
          ) : ev.url ? (
            <a href={ev.url} target="_blank" rel="noreferrer" className="break-all text-focus underline decoration-focus/40 underline-offset-2 hover:decoration-current">
              {ev.record}
            </a>
          ) : (
            <span className="break-all text-ink-2">{ev.record}</span>
          ))}
        <span className="ml-auto text-[13px] text-ink-2">{formatDate(ev.date)}</span>
      </div>
      {ai && <p className="mt-1 text-[13px] text-ink-2">Extracted from text{ev.model ? ` (${ev.model})` : ""}; unverified until a person checks the source.</p>}
      {ev.snippet && <p className="mt-1.5 break-words text-[14px] leading-relaxed text-ink-2">“{similarity ? humanizeRank(ev.snippet, from, to) : ev.snippet}”</p>}
    </li>
  );
}
