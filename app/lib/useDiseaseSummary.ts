"use client";

import { useMemo } from "react";
import type { DiseaseFile } from "./types";
import {
  cardPartner,
  citedEdges,
  citedLabels,
  familyAssets,
  gapOrgs,
  nextSteps,
  ownOrgs,
  ownStudies,
  therapyState,
  type AssetRow,
  type NextStep,
  type OrgRow,
  type StudyRow,
  type TherapyState,
} from "./nextSteps";
import { ageRange, useCountry, useTrialDetails } from "./studies";
import { useRelated, type RelatedState } from "./useRelated";
import { useEdgePanel } from "@/components/Providers";

export interface DiseaseSummary {
  therapy: TherapyState;
  /** groups for this diagnosis; when there are none, groups of related diseases (forDisease set) */
  orgs: OrgRow[];
  ownOrgCount: number;
  studies: StudyRow[];
  assets: AssetRow[];
  related: RelatedState;
  /** same-mechanism neighbour with a medicine or a reusable asset: the natural comparison */
  compareWith: { id: string; label: string } | null;
  steps: NextStep[];
  country: string;
  setCountry: (value: string) => void;
}

/** Everything the info column says about one disease, from its shard plus the shards of up to four relatives. */
export function useDiseaseSummary(file: DiseaseFile, defaultVia: string | null): DiseaseSummary {
  const { register } = useEdgePanel();
  useMemo(() => register(citedEdges(file), citedLabels(file)), [file, register]);

  const therapy = useMemo(() => therapyState(file), [file]);
  const own = useMemo(() => ownOrgs(file), [file]);
  const studies = useMemo(() => ownStudies(file), [file]);
  const assets = useMemo(() => familyAssets(file), [file]);
  const related = useRelated(file, true);

  const orgs = useMemo<OrgRow[]>(() => {
    if (own.length) return own;
    const fromGap = gapOrgs(file);
    if (fromGap.length) return fromGap.slice(0, 4);
    const seen = new Set<string>();
    return related.findings.flatMap((f) => f.orgs).filter((o) => !seen.has(o.key) && seen.add(o.key)).slice(0, 4);
  }, [own, file, related.findings]);

  const compareWith = useMemo(() => cardPartner(file, related.findings, defaultVia), [file, related.findings, defaultVia]);

  const [country, setCountry] = useCountry();
  const details = useTrialDetails(useMemo(() => studies.map((s) => s.key), [studies]));
  const studyCountries = useMemo(() => Object.fromEntries(Object.entries(details).map(([id, d]) => [id, d ? d.countries.map((c) => c.country) : null])), [details]);
  const studyAges = useMemo(() => Object.fromEntries(Object.entries(details).map(([id, d]) => [id, ageRange(d)])), [details]);
  const steps = nextSteps({ file, therapy, orgs, studies, assets, related: related.findings, actionVia: compareWith, country, studyCountries, studyAges });

  return { therapy, orgs, ownOrgCount: own.length, studies, assets, related, compareWith, steps, country, setCountry };
}
