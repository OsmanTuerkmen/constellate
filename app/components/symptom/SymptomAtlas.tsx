"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PhenotypeFile } from "@/lib/types";
import { loadPhenotype } from "@/lib/data";
import { buildSymptomGraph, type GraphNode } from "@/lib/graph";
import { diseaseHref } from "@/lib/ids";
import { phenotypeDiseases } from "@/lib/normalize";
import { useAtlasParams } from "@/lib/useAtlasParams";
import { useEdgePanel } from "../Providers";
import AtlasLayout from "../atlas/AtlasLayout";
import GraphStage from "../atlas/GraphStage";
import NodePopover from "../atlas/NodePopover";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";

const MAP_MAX = 40;

/** A symptom: which diseases in the dataset are annotated with it. */
export default function SymptomAtlas({ id }: { id: string }) {
  const [file, setFile] = useState<PhenotypeFile | null | undefined>(undefined);
  useEffect(() => {
    setFile(undefined);
    loadPhenotype(id).then(setFile, () => setFile(null));
  }, [id]);

  if (file === null)
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center">
        <p className="text-[17px] font-semibold">{id} is not in this dataset.</p>
      </div>
    );
  if (!file)
    return (
      <AtlasLayout
        mapTitle="Map"
        info={
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-48" />
          </div>
        }
        stage={<div className="grid h-full place-items-center text-[13px] text-ink-2">Loading…</div>}
      />
    );
  return <SymptomReady file={file} />;
}

function SymptomReady({ file }: { file: PhenotypeFile }) {
  const { openEdge, register } = useEdgePanel();
  const { edge } = useAtlasParams();
  const [popover, setPopover] = useState<{ node: GraphNode; at: { x: number; y: number } } | null>(null);
  const diseases = useMemo(() => phenotypeDiseases(file), [file]);
  const graph = useMemo(() => buildSymptomGraph(file, MAP_MAX), [file]);
  useMemo(
    () => register(diseases.map((d) => d.edge), Object.fromEntries([[file.node.id, file.node.label], ...diseases.map((d) => [d.id, d.label ?? d.id])])),
    [file, diseases, register],
  );
  const total = file.diseases_total ?? diseases.length;

  return (
    <AtlasLayout
      mapTitle={`Map of ${file.node.label}`}
      info={
        <div className="space-y-4">
          <header>
            <p className="text-[13px] text-ink-2">Symptom · {file.node.id}</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{file.node.label}</h1>
          </header>
          <Card title={`Diseases with this symptom (${total})`}>
            <ul className="divide-y divide-line">
              {diseases.map((d) => (
                <li key={d.id} className="flex items-center gap-2 py-2">
                  <Link href={diseaseHref(d.id)} className="min-w-0 flex-1 truncate text-[15px] hover:underline">
                    {d.label ?? d.id}
                  </Link>
                  <button type="button" onClick={() => openEdge(d.edge)} className="shrink-0 text-[13px] text-ink-2 hover:text-ink">
                    Source
                  </button>
                </li>
              ))}
            </ul>
            {total > diseases.length && <p className="mt-2 text-[13px] text-ink-2">{diseases.length} of {total} shown.</p>}
          </Card>
        </div>
      }
      stage={
        <>
          <GraphStage graph={graph} activeEdge={edge} onEdge={openEdge} onNode={(node, at) => (node.kind === "center" ? undefined : setPopover({ node, at }))} />
          {popover && <NodePopover node={popover.node} at={popover.at} onClose={() => setPopover(null)} />}
        </>
      }
    />
  );
}
