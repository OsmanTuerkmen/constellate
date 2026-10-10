"use client";

import { useEffect, useMemo, useState } from "react";
import type { GeneFile, IndexEntry } from "@/lib/types";
import { loadGene, loadIndexMap } from "@/lib/data";
import { buildGeneGraph, type GraphNode } from "@/lib/graph";
import { pathwayRefs } from "@/lib/normalize";
import { useAtlasParams } from "@/lib/useAtlasParams";
import { useEdgePanel } from "../Providers";
import AtlasLayout from "../atlas/AtlasLayout";
import GraphStage from "../atlas/GraphStage";
import NodePopover from "../atlas/NodePopover";
import Skeleton from "../ui/Skeleton";
import GeneInfo from "./GeneInfo";

/** The gene page: the gene in the centre, its diseases around it. */
export default function GeneAtlas({ symbol }: { symbol: string }) {
  const [file, setFile] = useState<GeneFile | null | undefined>(undefined);
  const [index, setIndex] = useState<Map<string, IndexEntry> | null>(null);

  useEffect(() => {
    setFile(undefined);
    loadGene(symbol).then(setFile, () => setFile(null));
    loadIndexMap().then(setIndex, () => setIndex(new Map()));
  }, [symbol]);

  if (file === null)
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center">
        <p className="text-[17px] font-semibold">{symbol} is not in this dataset.</p>
        <p className="mt-2 text-[15px] text-ink-2">Only genes linked to the diseases in the current slice have a page.</p>
      </div>
    );
  if (!file || !index)
    return (
      <AtlasLayout
        mapTitle="Map"
        info={
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
          </div>
        }
        stage={<div className="grid h-full place-items-center text-[13px] text-ink-2">Loading…</div>}
      />
    );
  return <GeneReady file={file} index={index} />;
}

function GeneReady({ file, index }: { file: GeneFile; index: Map<string, IndexEntry> }) {
  const { openEdge, register } = useEdgePanel();
  const { edge } = useAtlasParams();
  const [popover, setPopover] = useState<{ node: GraphNode; at: { x: number; y: number } } | null>(null);
  const labelOf = useMemo(() => (id: string) => index.get(id)?.label ?? id, [index]);
  const graph = useMemo(() => buildGeneGraph(file, labelOf), [file, labelOf]);

  useMemo(() => {
    const pathways = [...pathwayRefs(file), ...pathwayRefs(file, "pathways_more")];
    const labels = Object.fromEntries([[file.node.id, file.node.id], ...file.diseases.map((e) => [e.source, labelOf(e.source)]), ...pathways.map((p) => [p.id, p.label])]);
    register([...file.diseases, ...pathways.map((p) => p.edge), ...(file.text_mined ?? [])], labels);
  }, [file, labelOf, register]);

  return (
    <AtlasLayout
      mapTitle={`Map of ${file.node.id}`}
      info={<GeneInfo file={file} labelOf={labelOf} />}
      stage={
        <>
          <GraphStage graph={graph} centerShape="ring" activeEdge={edge} onEdge={openEdge} onNode={(node, at) => (node.kind === "center" ? undefined : setPopover({ node, at }))} />
          {popover && <NodePopover node={popover.node} at={popover.at} onClose={() => setPopover(null)} />}
        </>
      }
    />
  );
}
