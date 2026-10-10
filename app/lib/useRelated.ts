"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiseaseFile } from "./types";
import { loadDisease } from "./data";
import { hasFindings, rankFindings, relatedCandidates, relatedFinding, type RelatedCandidate, type RelatedFinding } from "./nextSteps";
import { useEdgePanel } from "@/components/Providers";

export interface RelatedState {
  status: "idle" | "loading" | "ready";
  candidates: RelatedCandidate[];
  findings: RelatedFinding[];
  /** checked, but none of the shards carries a medicine, study, registry or group */
  empty: RelatedCandidate[];
}

/** Loads the shards of at most four same-mechanism relatives, only when the page needs them. */
export function useRelated(file: DiseaseFile, enabled: boolean): RelatedState {
  const { register } = useEdgePanel();
  const candidates = useMemo(() => relatedCandidates(file, 4), [file]);
  const [loaded, setLoaded] = useState<{ id: string; findings: RelatedFinding[] } | null>(null);

  useEffect(() => {
    if (!enabled || !candidates.length) return;
    let alive = true;
    Promise.all(candidates.map((c) => loadDisease(c.id).catch(() => null))).then((files) => {
      if (!alive) return;
      const findings: RelatedFinding[] = [];
      files.forEach((f, i) => {
        if (!f) return;
        const finding = relatedFinding(candidates[i], f);
        findings.push(finding);
        register(
          [...(candidates[i].edge ? [candidates[i].edge!] : []), ...finding.therapies.map((t) => t.edge), ...finding.assets.map((a) => a.edge), ...finding.studies.map((s) => s.edge), ...finding.orgs.flatMap((o) => (o.edge ? [o.edge] : []))],
          Object.fromEntries([
            [f.node.id, f.node.label],
            ...finding.therapies.map((t) => [t.key, t.name]),
            ...finding.assets.map((a) => [a.key, a.label]),
            ...finding.studies.map((s) => [s.key, s.title]),
            ...finding.orgs.map((o) => [o.key, o.label]),
          ]),
        );
      });
      setLoaded({ id: file.node.id, findings });
    });
    return () => {
      alive = false;
    };
  }, [enabled, candidates, file.node.id, register]);

  if (!enabled || !candidates.length) return { status: "idle", candidates, findings: [], empty: [] };
  if (loaded?.id !== file.node.id) return { status: "loading", candidates, findings: [], empty: [] };
  const ranked = rankFindings(loaded.findings);
  return { status: "ready", candidates, findings: ranked.filter(hasFindings), empty: ranked.filter((f) => !hasFindings(f)).map((f) => f.candidate) };
}

