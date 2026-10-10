"use client";

import { useEffect, useMemo, useState } from "react";
import type { Core, DiseaseFile, IndexEntry, Meta } from "@/lib/types";
import { loadCore, loadDisease, loadIndexMap, loadMeta } from "@/lib/data";
import { allDiseaseEdges, nodeLabels } from "@/lib/normalize";
import { buildDiseaseGraph, buildGapGraph, hasNoLeads, type GraphNode } from "@/lib/graph";
import { pickDefaultVia } from "@/lib/actioncard";
import { toFileKey } from "@/lib/ids";
import { useAtlasParams } from "@/lib/useAtlasParams";
import { useDiseaseSummary } from "@/lib/useDiseaseSummary";
import { useEdgePanel } from "../Providers";
import AtlasLayout from "../atlas/AtlasLayout";
import GraphStage from "../atlas/GraphStage";
import NodePopover from "../atlas/NodePopover";
import CompareOverlay from "../atlas/CompareOverlay";
import Tour from "../atlas/Tour";
import Skeleton from "../ui/Skeleton";
import Button from "../ui/Button";
import DiseaseInfo from "./DiseaseInfo";
import GapPanel, { missingGap, shardGap, type GapContent } from "./GapPanel";
import { coverageSearches } from "@/lib/gap";

type State =
  | { status: "loading" }
  | { status: "ready"; file: DiseaseFile }
  | { status: "missing"; entry: IndexEntry | null; core: Core | null }
  | { status: "error" };

/** The disease page: loads the shard, then info column + map; a missing shard becomes an honest gap. */
export default function DiseaseAtlas({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [meta, setMeta] = useState<Meta | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    loadMeta().then((m) => alive && setMeta(m), () => undefined);
    loadDisease(id)
      .then(async (file) => {
        if (!alive) return;
        if (file) return setState({ status: "ready", file });
        const [index, core] = await Promise.all([loadIndexMap(), loadCore().catch(() => null)]);
        if (alive) setState({ status: "missing", entry: index.get(id) ?? null, core });
      })
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [id, attempt]);

  if (state.status === "loading")
    return (
      <AtlasLayout
        mapTitle="Map"
        info={
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        }
        stage={<div className="grid h-full place-items-center text-[13px] text-ink-2">Loading…</div>}
      />
    );
  if (state.status === "error")
    return (
      <div className="mx-auto max-w-[480px] px-4 py-16 text-center" role="alert">
        <p className="text-[17px] font-semibold">The data for {id} could not be loaded.</p>
        <Button className="mt-4" onClick={() => setAttempt((a) => a + 1)}>
          Try again
        </Button>
      </div>
    );
  if (state.status === "missing")
    return (
      <AtlasLayout
        mapTitle={id}
        info={<GapPanel gap={missingGap(id, state.entry, state.core, meta)} />}
        stage={<div className="grid h-full place-items-center px-6 text-center text-[15px] text-ink-2">No map: this identifier has no mapped neighbourhood.</div>}
      />
    );
  return <DiseaseReady file={state.file} meta={meta} />;
}

function DiseaseReady({ file, meta }: { file: DiseaseFile; meta: Meta | null }) {
  const { openEdge, register } = useEdgePanel();
  const { edge, setCompare } = useAtlasParams();
  const [expandFamilies, setExpandFamilies] = useState(false);
  const [popover, setPopover] = useState<{ node: GraphNode; at: { x: number; y: number } } | null>(null);

  const labels = useMemo(() => nodeLabels(file), [file]);
  useMemo(() => register(allDiseaseEdges(file), labels), [file, labels, register]);
  const noLeads = hasNoLeads(file);
  const graph = useMemo(
    () => (noLeads ? { ...buildGapGraph(file), families: 0 } : buildDiseaseGraph(file, { phenotypes: 8, labels, expandFamilies })),
    [file, labels, expandFamilies, noLeads],
  );
  const summary = useDiseaseSummary(file, pickDefaultVia(file.neighbours));
  const gap = useMemo<GapContent | null>(
    () =>
      shardGap(file) ??
      (noLeads
        ? {
            title: `Nothing linked to ${file.node.label} yet`,
            reason: "No gene, related disease or supported symptom is recorded for it in the sources we use.",
            searched: coverageSearches(file.coverage),
            nearest: [],
            close: ["Phenotype annotations or a curated causal gene for this disease"],
          }
        : null),
    [file, noLeads],
  );

  const compare = (otherId: string) => {
    setPopover(null);
    setCompare(toFileKey(otherId));
  };

  return (
    <AtlasLayout
      mapTitle={`Map of ${file.node.label}`}
      info={
        <div className="space-y-4">
          {noLeads ? (
            <header>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight">{file.node.label}</h1>
              <p className="mt-2 text-[13px] text-ink-2">{file.node.id}</p>
              {file.node.definition && <p className="mt-3 text-[15px] leading-relaxed">{file.node.definition}</p>}
            </header>
          ) : (
            <DiseaseInfo file={file} summary={summary} onCompare={compare} />
          )}
          {gap && <GapPanel gap={gap} />}
          <CompareOverlay disease={file} meta={meta} />
          <Tour />
        </div>
      }
      stage={
        <>
          <GraphStage
            graph={graph}
            activeEdge={edge}
            onEdge={openEdge}
            onNode={(node, at) => (node.kind === "center" ? undefined : setPopover({ node, at }))}
            families={graph.families}
            expanded={expandFamilies}
            onToggleFamilies={() => setExpandFamilies((v) => !v)}
          />
          {popover && (
            <NodePopover
              node={popover.node}
              at={popover.at}
              onClose={() => setPopover(null)}
              onCompare={compare}
              onExpandFamily={() => {
                setPopover(null);
                setExpandFamilies(true);
              }}
            />
          )}
        </>
      }
    />
  );
}
