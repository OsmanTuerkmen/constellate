"use client";

import { useState } from "react";
import type { DiseaseFile } from "@/lib/types";
import type { DiseaseSummary } from "@/lib/useDiseaseSummary";
import Card from "../ui/Card";

/** Three short answers: what it is, whether a medicine is approved, what to do next. At most two lines each. */
export default function AnswerCards({ file, summary, onCompare }: { file: DiseaseFile; summary: DiseaseSummary; onCompare: (id: string) => void }) {
  return (
    <div className="space-y-3" data-tour="answers">
      <WhatIsIt definition={file.node.definition} label={file.node.label} />
      <Treatment summary={summary} label={file.node.label} onCompare={onCompare} />
      <WhatCanIDo summary={summary} />
    </div>
  );
}

function WhatIsIt({ definition, label }: { definition?: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card title="What is it?">
      {definition ? (
        <>
          <p className={`text-[15px] leading-relaxed ${open ? "" : "line-clamp-2"}`}>{definition}</p>
          {definition.length > 120 && (
            <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 text-[13px] font-medium text-ink-2 hover:text-ink">
              {open ? "Less" : "More"}
            </button>
          )}
        </>
      ) : (
        <p className="text-[15px] text-ink-2">The disease ontology has no short description of {label} yet.</p>
      )}
    </Card>
  );
}

function Treatment({ summary, label, onCompare }: { summary: DiseaseSummary; label: string; onCompare: (id: string) => void }) {
  const { therapy, related } = summary;
  const precedent = related.findings.find((f) => f.therapies.length);
  return (
    <Card title="Is there a treatment?" data-tour="treatment">
      <div data-testid="answer-treatment" className="space-y-2 text-[15px] leading-relaxed">
        {therapy.kind === "approved" ? (
          <p>
            <Mark ok /> {therapy.total === 1 ? "One medicine is" : `${therapy.total} medicines are`} approved: {therapy.items.slice(0, 3).map((t) => t.name).join(", ")}
            {therapy.items.length > 3 ? ", …" : ""}.
          </p>
        ) : therapy.kind === "none" ? (
          <p>
            <Mark /> No approved medicine found in {therapy.authorities} records{therapy.asOf ? ` (${therapy.asOf})` : ""}.
          </p>
        ) : (
          <p className="text-ink-2">Not checked yet against EMA and FDA records.</p>
        )}
        {therapy.kind !== "approved" && precedent && (
          <button
            type="button"
            onClick={() => (precedent.candidate.neighbour ? onCompare(precedent.candidate.id) : undefined)}
            className="block w-full rounded-[12px] bg-focus-soft px-3 py-2 text-left text-[14px] text-ink transition hover:brightness-110"
          >
            <span className="font-semibold">{precedent.candidate.label}</span> has one ({precedent.therapies[0].name}).
            {precedent.candidate.neighbour ? " Compare →" : ""}
            <span className="sr-only">: approved for {precedent.candidate.label}, not for {label}</span>
          </button>
        )}
      </div>
    </Card>
  );
}

function WhatCanIDo({ summary }: { summary: DiseaseSummary }) {
  const steps = summary.steps.slice(0, 3);
  return (
    <Card title="What can I do?">
      {steps.length ? (
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={s.key} className="flex gap-3 text-[15px] leading-snug">
              <span className="tabular mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-surface-2 text-[13px] font-semibold text-ink-2" aria-hidden="true">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2" title={s.text}>
                  {s.text}
                </span>
                {s.link &&
                  (s.link.external ? (
                    <a href={s.link.href} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-focus hover:underline">
                      {s.link.label} ↗
                    </a>
                  ) : (
                    <a href={s.link.href} className="text-[13px] font-medium text-focus hover:underline">
                      {s.link.label}
                    </a>
                  ))}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[15px] text-ink-2">Nothing to suggest from the data yet.</p>
      )}
    </Card>
  );
}

function Mark({ ok = false }: { ok?: boolean }) {
  return (
    <span className={`mr-1 inline-grid h-5 w-5 place-items-center rounded-full align-[-3px] text-[12px] font-bold ${ok ? "bg-ok-soft text-ok" : "bg-contra-soft text-contra"}`} aria-hidden="true">
      {ok ? "✓" : "✕"}
    </span>
  );
}
