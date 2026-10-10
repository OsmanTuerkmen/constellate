/** Honest-gap data: what was searched, the nearest communities, what would close the gap. */
import type { Coverage, Edge, Gap } from "./types";
import { closingList, tierLabel } from "./normalize";

export interface GapSearch {
  source: string;
  query?: string;
  /** one row per saved query: text, link to the stored query URL and its own hit count */
  queries?: { query: string; url?: string | null; total_hits?: number }[];
  hits?: number;
  fetched_at?: string;
  note?: string | null;
  draft?: boolean;
}

/** What the organisation list is, in words a family can check: an agent compared each entry with the organisation's own website. */
export const ORG_LIST_NAME = "Organisation list, checked against each organisation's website";

const SOURCE_NAME: Record<string, string> = {
  "curated org list": ORG_LIST_NAME,
  "Curated organisation list (hand-checked)": ORG_LIST_NAME,
  "04_enrich_apis": "Public research databases",
  ctgov: "ClinicalTrials.gov",
  clinvar: "ClinVar",
  europepmc: "Europe PMC",
  reporter: "NIH RePORTER",
  opentargets: "Open Targets",
  reactome: "Reactome",
};

/** Pipeline source codes ("ctgov") as names a reader knows. */
export function sourceName(source: string): string {
  return SOURCE_NAME[source] ?? source;
}

type RawCoverage = Coverage & { queries?: { query: string; url?: string | null; total_hits?: number }[]; hits_kept?: number };

/** Shard coverage → rows for the "what was searched" table, keeping the stored query links. */
export function coverageSearches(coverage: Coverage[] | undefined, only?: string[]): GapSearch[] {
  return ((coverage ?? []) as RawCoverage[])
    .filter((c) => !only || only.includes(c.source))
    .map((c) => ({
      source: sourceName(c.source),
      query: c.query,
      queries: c.queries?.length ? c.queries : undefined,
      hits: c.hits ?? c.hits_raw,
      fetched_at: c.fetched_at ?? c.retrieved,
      note: c.note ?? (c.hits_kept !== undefined && c.hits_raw !== undefined && c.hits_kept !== c.hits_raw ? `${c.hits_kept} of ${c.hits_raw} kept after filtering` : null),
    }));
}

export interface GapNeighbour {
  id: string;
  label: string;
  via: string;
  confidence?: number;
  edge?: Edge;
  tier?: string | null;
  mechanismDiffers?: boolean | null;
  orgs?: { id: string; label: string }[];
}

const ORG_SOURCE = /\borg/i;
const REPO_PATH = /\b(data|app|pipeline)\/[\w./-]+|\b[\w-]+\.(csv|ya?ml|json)\b/i;
const HAND_CHECKED = /\bhand[- ](checked|verified)\b/i;

/** "What would close this gap" in plain words: no repository paths, no claim that a person checked something an agent checked. */
export function plainClose(text: string): string {
  if (REPO_PATH.test(text) && /org/i.test(text)) return "A patient organisation for this diagnosis, confirmed on its own website";
  if (REPO_PATH.test(text)) return text.replace(REPO_PATH, "the public data set");
  if (HAND_CHECKED.test(text)) return "A patient organisation for this diagnosis, confirmed on its own website, with the date it was checked";
  return text;
}

/** The pipeline's `gap` block in display form.
 *  The gap is about patient organisations, so the table shows only the organisation search: what was looked for, not unrelated database hits. */
export function gapProps(gap: Gap, diseaseLabel?: string): { searched: GapSearch[]; nearest: GapNeighbour[]; close: string[]; asOf?: string } {
  const orgSearches = gap.searched.filter((s) => ORG_SOURCE.test(s.source));
  const dates = orgSearches.map((s) => s.retrieved ?? s.verified).filter((d): d is string => Boolean(d)).sort();
  return {
    searched: orgSearches.map((s) => {
      const size = s.n_orgs;
      return {
        source: sourceName(s.source),
        query: diseaseLabel ? `organisations naming ${diseaseLabel}` : "organisations naming this diagnosis",
        hits: gap.orgs === "none_in_curated_list" ? 0 : undefined,
        fetched_at: s.retrieved ?? s.verified ?? undefined,
        note: typeof size === "number" ? `${size.toLocaleString("en")} organisations in the list` : null,
        draft: s.draft,
      };
    }),
    nearest: gap.nearest_communities.map((n) => ({
      id: n.id,
      label: n.label,
      via: n.relation,
      confidence: n.simgic,
      tier: tierLabel(n.tier),
      mechanismDiffers: n.mechanism_differs,
      orgs: n.orgs,
    })),
    close: closingList(gap).map(plainClose),
    asOf: dates[dates.length - 1],
  };
}
