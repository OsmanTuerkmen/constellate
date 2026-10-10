import type { DiseaseFile, Edge, GeneFile, Neighbour, PhenotypeFile } from "./types";
import { phenotypeDiseases } from "./normalize";
import { hasCounterEvidence } from "./evidence";
import { refOf } from "./ids";
import { familyKey } from "./nextFamily";

export type GraphNodeKind = "center" | "gene" | "phenotype" | "neighbour" | "counter" | "disease" | "family";

export interface GraphNode {
  id: string;
  label: string;
  kind: GraphNodeKind;
  /** family node: how many subtypes it bundles */
  members?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  edge: Edge;
  secondHop?: boolean;
  /** counter-example: similar phenotypes, different mechanism */
  counter?: boolean;
  /** honest-gap hint to a nearest community: drawn dotted, carries no evidence of its own */
  gapLink?: boolean;
}

export interface Graph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilter {
  genes: boolean;
  symptoms: boolean;
  related: boolean;
}

/**
 * Ego graph of one disease: genes, the strongest phenotypes (plus up to two with counter-evidence), neighbours
 * (subtypes of one family bundled into a family node unless expanded; mechanism counter-examples stay single),
 * second-hop links from neighbours to on-screen genes and phenotypes, and up to 8 text-mined links.
 */
export function buildDiseaseGraph(
  file: DiseaseFile,
  opts: { phenotypes: number; labels: Record<string, string>; expandFamilies: boolean },
): Graph & { families: number } {
  const nodes = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const center = file.node.id;
  nodes.set(center, { id: center, label: file.node.label, kind: "center" });
  for (const e of file.genes) {
    nodes.set(e.target, { id: e.target, label: e.target, kind: "gene" });
    links.push({ source: center, target: e.target, edge: e });
  }
  const positive = file.phenotypes.filter((p) => p.edge.evidence.length).slice(0, opts.phenotypes);
  const contra = file.phenotypes.filter((p) => hasCounterEvidence(p.edge)).slice(0, 2);
  for (const { edge, phenotype } of [...positive, ...contra]) {
    if (nodes.has(phenotype.id)) continue;
    nodes.set(phenotype.id, { id: phenotype.id, label: phenotype.label, kind: "phenotype" });
    links.push({ source: center, target: phenotype.id, edge });
  }

  const byFamily = new Map<string, Neighbour[]>();
  for (const n of file.neighbours) {
    const key = familyKey(n.label);
    byFamily.set(key, [...(byFamily.get(key) ?? []), n]);
  }
  const groupable = new Map([...byFamily].filter(([, m]) => m.length >= 2 && !m.some((x) => x.mechanism_differs)));
  const bundled = opts.expandFamilies ? new Map<string, Neighbour[]>() : groupable;

  const addSecondHop = (id: string, members: Neighbour[], edge: Edge) => {
    const seen = new Set<string>();
    for (const n of members) {
      for (const target of [...n.shared_genes.map((x) => refOf(x).id), ...n.shared_phenotypes.map((p) => p.id)]) {
        if (nodes.has(target) && !seen.has(target)) {
          seen.add(target);
          links.push({ source: id, target, edge, secondHop: true });
        }
      }
    }
  };

  for (const [key, members] of bundled) {
    const strongest = [...members].sort((a, b) => b.edge.confidence - a.edge.confidence)[0];
    const id = `family:${key}`;
    const name = members.find((m) => m.label.toLowerCase() === key)?.label ?? key;
    nodes.set(id, { id, label: name, kind: "family", members: members.length });
    links.push({ source: center, target: id, edge: strongest.edge });
    addSecondHop(id, members, strongest.edge);
  }
  for (const n of file.neighbours) {
    if (bundled.has(familyKey(n.label))) continue;
    nodes.set(n.id, { id: n.id, label: n.label, kind: n.mechanism_differs ? "counter" : "neighbour" });
    links.push({ source: center, target: n.id, edge: n.edge, counter: n.mechanism_differs === true });
    addSecondHop(n.id, [n], n.edge);
  }
  for (const e of (file.text_mined ?? []).slice(0, 8)) {
    const other = e.source === center ? e.target : e.target === center ? e.source : null;
    if (!other) continue;
    if (!nodes.has(other)) {
      const kind = other.startsWith("HP:") ? "phenotype" : other.startsWith("MONDO:") ? "neighbour" : "gene";
      nodes.set(other, { id: other, label: opts.labels[other] ?? other, kind });
    }
    links.push({ source: e.source, target: e.target, edge: e });
  }
  return { nodes: [...nodes.values()], links, families: groupable.size };
}

/** Gene in the centre, its diseases around it (caused_by drawn as disease, other links as neighbour). */
export function buildGeneGraph(file: GeneFile, labelOf: (id: string) => string): Graph {
  const nodes: GraphNode[] = [{ id: file.node.id, label: file.node.id, kind: "center" }];
  const links: GraphLink[] = [];
  const seen = new Set<string>([file.node.id]);
  for (const e of file.diseases) {
    if (!seen.has(e.source)) {
      seen.add(e.source);
      nodes.push({ id: e.source, label: labelOf(e.source), kind: e.type === "caused_by" ? "disease" : "neighbour" });
    }
    links.push({ source: file.node.id, target: e.source, edge: e });
  }
  return { nodes, links };
}

/** Symptom in the centre, the diseases annotated with it around it (strongest links first, at most `max`). */
export function buildSymptomGraph(file: PhenotypeFile, max: number): Graph {
  const nodes: GraphNode[] = [{ id: file.node.id, label: file.node.label, kind: "center" }];
  const links: GraphLink[] = [];
  const rows = phenotypeDiseases(file)
    .sort((a, b) => (b.edge.confidence ?? 0) - (a.edge.confidence ?? 0))
    .slice(0, max);
  for (const d of rows) {
    nodes.push({ id: d.id, label: d.label ?? d.id, kind: "disease" });
    links.push({ source: file.node.id, target: d.id, edge: d.edge });
  }
  return { nodes, links };
}

/** No evidenced lead: the lone disease, with dotted hints to the nearest communities of its gap block. */
export function buildGapGraph(file: DiseaseFile): Graph {
  const center = file.node.id;
  const nodes: GraphNode[] = [{ id: center, label: file.node.label, kind: "center" }];
  const links: GraphLink[] = [];
  for (const c of file.gap?.nearest_communities ?? []) {
    if (c.id === center || nodes.some((n) => n.id === c.id)) continue;
    nodes.push({ id: c.id, label: c.label, kind: c.mechanism_differs ? "counter" : "neighbour" });
    const edge: Edge = { id: `gap_${c.id}`, source: center, target: c.id, type: "nearest_community", evidence: [], contradicting: [], confidence: c.simgic ?? 0, level: "inferred" };
    links.push({ source: center, target: c.id, edge, gapLink: true });
  }
  return { nodes, links };
}

/** True when a shard has nothing evidenced to show: no neighbour, no gene, no supported phenotype. */
export function hasNoLeads(file: DiseaseFile): boolean {
  return !file.neighbours.length && !file.genes.length && !file.phenotypes.some((p) => p.edge.evidence.length);
}

const FILTER_KIND: Record<GraphNodeKind, keyof GraphFilter | null> = {
  center: null,
  gene: "genes",
  phenotype: "symptoms",
  neighbour: "related",
  counter: "related",
  disease: "related",
  family: "related",
};

/** Drops the switched-off kinds and every link that touches them; the centre always stays. */
export function filterGraph<G extends Graph>(graph: G, show: GraphFilter): G {
  const nodes = graph.nodes.filter((n) => {
    const key = FILTER_KIND[n.kind];
    return key === null || show[key];
  });
  const ids = new Set(nodes.map((n) => n.id));
  const links = graph.links.filter((l) => ids.has(l.source) && ids.has(l.target));
  return { ...graph, nodes, links };
}
