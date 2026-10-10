import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DiseaseFile, GeneFile, PhenotypeFile } from "./types";
import { buildDiseaseGraph, buildGapGraph, buildGeneGraph, buildSymptomGraph, filterGraph } from "./graph";

const data = join(import.meta.dirname, "..", "public", "data");
const krabbe = JSON.parse(readFileSync(join(data, "disease", "MONDO_0009499.json"), "utf8")) as DiseaseFile;
const galc = JSON.parse(readFileSync(join(data, "gene", "GALC.json"), "utf8")) as GeneFile;
const opts = { phenotypes: 8, labels: {}, expandFamilies: false };

test("krabbe graph has centre, GALC and a PMD counter link", () => {
  const g = buildDiseaseGraph(krabbe, opts);
  assert.ok(g.nodes.some((n) => n.kind === "center" && n.id === "MONDO:0009499"));
  assert.ok(g.nodes.some((n) => n.id === "GALC" && n.kind === "gene"));
  assert.ok(g.links.some((l) => l.counter === true));
});

test("MLD subtypes bundle into one family node", () => {
  const g = buildDiseaseGraph(krabbe, opts);
  const family = g.nodes.find((n) => n.kind === "family");
  assert.ok(family && (family.members ?? 0) >= 2);
});

test("expanded families show no family node", () => {
  const g = buildDiseaseGraph(krabbe, { ...opts, expandFamilies: true });
  assert.equal(g.nodes.filter((n) => n.kind === "family").length, 0);
});

test("filterGraph keeps the centre", () => {
  const g = buildDiseaseGraph(krabbe, opts);
  const only = filterGraph(g, { genes: false, symptoms: false, related: false });
  assert.equal(only.nodes.length, 1);
  assert.equal(only.links.length, 0);
});

test("filterGraph drops only the switched-off kind", () => {
  const g = buildDiseaseGraph(krabbe, opts);
  const noSymptoms = filterGraph(g, { genes: true, symptoms: false, related: true });
  assert.ok(noSymptoms.nodes.every((n) => n.kind !== "phenotype"));
  assert.ok(noSymptoms.nodes.some((n) => n.kind === "gene"));
  const ids = new Set(noSymptoms.nodes.map((n) => n.id));
  assert.ok(noSymptoms.links.every((l) => ids.has(l.source) && ids.has(l.target)));
});

test("gene graph centres the gene and links Krabbe", () => {
  const g = buildGeneGraph(galc, (id) => id);
  assert.ok(g.nodes.some((n) => n.kind === "center" && n.id === "GALC"));
  assert.ok(g.nodes.some((n) => n.id === "MONDO:0009499"));
});

test("symptom graph centres the symptom and links its diseases", () => {
  const seizure = JSON.parse(readFileSync(join(data, "phenotype", "HP_0001250.json"), "utf8")) as PhenotypeFile;
  const g = buildSymptomGraph(seizure, 40);
  assert.ok(g.nodes.some((n) => n.kind === "center" && n.id === "HP:0001250"));
  assert.ok(g.nodes.filter((n) => n.kind === "disease").length > 0);
  assert.ok(g.nodes.length <= 41);
});

test("gap graph links the lone disease to its nearest communities without real edges", () => {
  const lone = JSON.parse(readFileSync(join(data, "disease", "MONDO_0007247.json"), "utf8")) as DiseaseFile;
  const g = buildGapGraph(lone);
  assert.ok(g.nodes.some((n) => n.kind === "center"));
  assert.ok(g.nodes.length > 1);
  assert.ok(g.links.every((l) => l.gapLink === true));
});
