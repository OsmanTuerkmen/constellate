import type { Metadata } from "next";
import Link from "next/link";
import { diseaseHref } from "@/lib/ids";
import { Logo } from "@/components/shell/AppHeader";
import Footer from "@/components/shell/Footer";
import RestartTour from "@/components/atlas/RestartTour";

export const metadata: Metadata = {
  title: "About · Constellate",
  description: "An evidence-graded map of rare diseases, organised by shared genes and symptoms instead of names.",
};

const REPO = "https://github.com/Reczec/constellate";

const STEPS = [
  ["Search a diagnosis", "By disease, gene or symptom, in any of its names or IDs."],
  ["See its neighbours", "Diseases are linked by shared genes and symptoms. Every line is a piece of evidence you can open."],
  ["Compare", "What transfers from a related disease, what differs, what needs an expert. Every sentence cites its source."],
];

const LEVELS = [
  ["observed", "Clinically or experimentally observed, with a primary source", "ClinVar, HPO annotations with frequency, trial records", "solid"],
  ["curated", "Statement from an expert-curated database", "OMIM (via HPO), Orphanet, Reactome, MONDO", "solid"],
  ["text_mined", "Extracted from an abstract by a language model, not yet verified", "PubMed / Europe PMC", "dashed"],
  ["inferred", "Computed by Constellate, formula and inputs shown", "Symptom similarity, shared genes, clustering", "dotted"],
] as const;

const SOURCES = [
  ["HPO", "free with attribution"],
  ["MONDO", "CC BY 4.0"],
  ["Orphanet", "CC BY 4.0"],
  ["ClinVar", "public domain"],
  ["ClinicalTrials.gov", "public domain"],
  ["Europe PMC / PubMed", "public domain"],
  ["NIH RePORTER", "public domain"],
  ["Open Targets", "CC0"],
  ["Reactome", "CC0"],
  ["Monarch", "CC BY 4.0"],
] as const;

export default function AboutPage() {
  return (
    <>
      <div className="mx-auto max-w-[880px] space-y-14 px-4 py-12 md:px-6">
        <header>
          <Logo size={36} />
          <h1 className="mt-4 text-[32px] font-bold leading-tight tracking-tight md:text-[44px]">Your family is not the first.</h1>
          <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-ink-2">
            Families with a rare diagnosis often work alone, because the registries, studies and tools they need sit under a neighbouring disease with another name. Constellate is a map of rare diseases that finds those connections and shows the proof for every one of them.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={diseaseHref("MONDO:0009499")} className="inline-flex h-10 items-center rounded-full bg-focus px-4 text-[15px] font-medium text-focus-ink">
              Open Krabbe disease
            </Link>
            <RestartTour />
          </div>
        </header>

        <section aria-labelledby="how">
          <h2 id="how" className="text-[22px] font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="rounded-[16px] border border-line bg-surface p-4">
                <span className="tabular text-[13px] font-semibold text-focus">0{i + 1}</span>
                <h3 className="mt-1 text-[16px] font-semibold">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="levels">
          <h2 id="levels" className="text-[22px] font-semibold">How sure is a line?</h2>
          <p className="mt-2 text-[15px] text-ink-2">Every link carries one of four evidence levels, a confidence, its sources and a counter-evidence field that may be empty but never missing.</p>
          <ul className="mt-4 divide-y divide-line rounded-[16px] border border-line bg-surface">
            {LEVELS.map(([code, meaning, examples, line]) => (
              <li key={code} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="w-8 border-t-2 border-lvl-strong" style={{ borderStyle: line }} aria-hidden="true" />
                <code className="w-[96px] font-mono text-[14px] text-ink">{code}</code>
                <span className="min-w-0 flex-1 text-[15px]">
                  {meaning}
                  <span className="block text-[13px] text-ink-2">{examples}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="gap" className="rounded-[16px] border border-dashed border-line-strong p-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-focus">Honest gap</p>
          <h2 id="gap" className="mt-1 text-[20px] font-semibold">When there is no trail, we say so</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            Where no source supports a link, Constellate does not guess. It shows what was searched and when, which communities are nearest and what would close the gap.
          </p>
        </section>

        <section aria-labelledby="sources" className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 id="sources" className="text-[22px] font-semibold">Data sources</h2>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              {SOURCES.map(([name, licence]) => (
                <li key={name} className="flex justify-between gap-4 border-b border-line pb-1.5">
                  <span>{name}</span>
                  <span className="text-ink-2">{licence}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13px] text-ink-2">OMIM content enters only indirectly, via HPO annotations and Orphanet cross-references.</p>
          </div>
          <div>
            <h2 className="text-[22px] font-semibold">AI inside</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
              Language models extract claims from abstracts, match organisation names to diseases and explain a comparison in plain language. Every such use is marked, every evidence item names its model, and every explanation sentence must cite an evidence line.
            </p>
            <h2 className="mt-8 text-[22px] font-semibold">Team</h2>
            <p className="mt-3 text-[15px] text-ink-2">Hanno Kügler, Osman and Recep.</p>
            <a href={REPO} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[15px] underline underline-offset-4 hover:text-focus">
              Source code on GitHub ↗
            </a>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
