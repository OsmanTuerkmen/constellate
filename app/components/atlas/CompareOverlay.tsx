"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile, GeneFile, Meta } from "@/lib/types";
import { loadDisease, loadGene } from "@/lib/data";
import { actionCardMarkdown, buildActionCard, buildGlance, type CardSentence } from "@/lib/actioncard";
import { buildV2, v2Markdown } from "@/lib/actionv2";
import { toFileKey, toNodeId } from "@/lib/ids";
import { useAtlasParams } from "@/lib/useAtlasParams";
import { useEdgePanel } from "../Providers";
import ExplainStream from "../ExplainStream";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";

const SECTION_TITLE = { transfers: "What transfers", differs: "What differs", review: "Needs an expert" } as const;
const SECTION_COLOR = { transfers: "var(--ok)", differs: "var(--warn)", review: "var(--n-neighbour)" } as const;
const SECTION_GLYPH = { transfers: "✓", differs: "≠", review: "?" } as const;

/** The comparison in ?compare=: what transfers from a related disease, what differs, what needs an expert. */
export default function CompareOverlay({ disease, meta }: { disease: DiseaseFile; meta: Meta | null }) {
  const { compare, setCompare } = useAtlasParams();
  const viaId = compare ? toNodeId(compare) : null;
  const neighbour = viaId ? disease.neighbours.find((n) => n.id === viaId) ?? null : null;
  if (!neighbour) return null;
  return <Overlay disease={disease} meta={meta} viaId={neighbour.id} onChange={(id) => setCompare(toFileKey(id))} onClose={() => setCompare(null)} />;
}

function Overlay({ disease, meta, viaId, onChange, onClose }: { disease: DiseaseFile; meta: Meta | null; viaId: string; onChange: (id: string) => void; onClose: () => void }) {
  const { register } = useEdgePanel();
  const neighbour = disease.neighbours.find((n) => n.id === viaId)!;
  const [loaded, setLoaded] = useState<{ via: string; file: DiseaseFile | null; genes: GeneFile[] } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const file = await loadDisease(viaId).catch(() => null);
      const symbols = [...new Set([...disease.genes, ...(file?.genes ?? [])].map((e) => e.target))].slice(0, 8);
      const genes = (await Promise.all(symbols.map((s) => loadGene(s).catch(() => null)))).filter((g): g is GeneFile => Boolean(g));
      if (alive) setLoaded({ via: viaId, file, genes });
    })();
    return () => {
      alive = false;
    };
  }, [viaId, disease]);

  const ready = loaded?.via === viaId;
  const card = useMemo(() => (ready ? buildActionCard({ disease, neighbour, neighbourFile: loaded!.file, geneFiles: loaded!.genes }) : null), [ready, disease, neighbour, loaded]);
  const glance = useMemo(() => (ready ? buildGlance(disease, loaded!.file, neighbour.label, meta?.built_at) : null), [ready, disease, loaded, neighbour, meta]);
  const v2 = useMemo(() => (ready ? buildV2(disease, loaded!.file, { id: neighbour.id, label: neighbour.label }, meta) : null), [ready, disease, loaded, neighbour, meta]);
  useMemo(() => card && register(card.edges.values(), card.labels), [card, register]);

  const download = () => {
    if (!card) return;
    const md = actionCardMarkdown(card, meta?.built_at, glance ?? []) + (v2 ? `\n# Assets and context\n\n${v2Markdown(v2).replace(/^## /gm, "### ")}` : "");
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `constellate-${toFileKey(disease.node.id)}-vs-${toFileKey(neighbour.id)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = `${disease.node.label} ↔ ${neighbour.label}`;
  return (
    <Modal
      open
      onClose={onClose}
      label={label}
      title={
        <span className="flex flex-wrap items-center gap-x-2">
          <span>{disease.node.label}</span>
          <span className="text-focus" aria-hidden="true">↔</span>
          <select
            value={viaId}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Compare with"
            className="max-w-full min-w-0 truncate rounded-[10px] border border-line bg-surface-2 px-2 py-1 text-[15px] font-semibold"
          >
            {disease.neighbours.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </span>
      }
    >
      {neighbour.mechanism_differs && (
        <p className="mb-4 rounded-[12px] bg-contra-soft px-3 py-2 text-[14px] text-contra">The mechanism differs: what helps {neighbour.label} may not transfer.</p>
      )}

      {glance ? (
        <ul className="space-y-1.5 text-[15px]">
          {glance.map((line) => (
            <li key={line.key} className={line.key === "own" ? "font-semibold" : "text-ink-2"}>
              {line.text}
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton className="h-14" />
      )}

      <div className="mt-5">
        {card ? <ExplainStream edges={[...card.edges.values()]} labels={card.labels} from={disease.node.id} via={neighbour.id} /> : <Skeleton className="h-10" />}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {card
          ? card.sections.map((section) => (
              <section key={section.key} className="rounded-[16px] border border-line p-4">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold">
                  <span className="grid h-6 w-6 place-items-center rounded-full border text-[13px]" style={{ borderColor: SECTION_COLOR[section.key], color: SECTION_COLOR[section.key] }} aria-hidden="true">
                    {SECTION_GLYPH[section.key]}
                  </span>
                  {SECTION_TITLE[section.key]}
                </h3>
                {section.sentences.length ? (
                  <ul className="mt-3 space-y-3">
                    {section.sentences.map((s, i) => (
                      <Sentence key={i} s={s} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[14px] text-ink-2">No supported statement in the data.</p>
                )}
              </section>
            ))
          : [0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <Button variant="primary" onClick={download} disabled={!card}>
          Export
        </Button>
        <Button onClick={() => window.print()}>Print</Button>
      </div>
    </Modal>
  );
}

function Sentence({ s }: { s: CardSentence }) {
  const { openEdge } = useEdgePanel();
  return (
    <li className="text-[14px] leading-relaxed">
      {s.text}.
      <span className="mt-1 flex flex-wrap gap-1">
        {s.edgeIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => openEdge(id)}
            className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-ink-2 hover:border-line-strong hover:text-ink"
          >
            {id}
            <span className="sr-only">: show the evidence</span>
          </button>
        ))}
      </span>
    </li>
  );
}
