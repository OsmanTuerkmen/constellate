"use client";

import { useMemo } from "react";
import { studyFocus, type StudyRow } from "@/lib/nextSteps";
import { trialStatusLabel } from "@/lib/normalize";
import { ALL_COUNTRIES, NO_COUNTRY, NO_COUNTRY_LABEL, ageRange, contactUrl, listsCountry, unlistedCount, useCountryCounts, useTrialDetails } from "@/lib/studies";

const RECRUITING = trialStatusLabel("RECRUITING");

/** Open studies, one row each, with a country filter. The country choice is shared across pages. */
export default function StudiesTab({ label, studies, country, setCountry }: { label: string; studies: StudyRow[]; country: string; setCountry: (c: string) => void }) {
  const ids = useMemo(() => studies.map((s) => s.key), [studies]);
  const details = useTrialDetails(ids);
  const countries = useCountryCounts(details);
  const unlisted = unlistedCount(ids, details);
  const chosen = country === NO_COUNTRY && !unlisted ? ALL_COUNTRIES : country;
  const matching = studies.filter((s) => listsCountry(details[s.key], chosen));

  if (!studies.length) return <p className="text-[15px] text-ink-2">No open study lists {label} on ClinicalTrials.gov right now.</p>;

  return (
    <div className="space-y-3">
      {countries.length > 0 && (
        <label className="flex items-center gap-2 text-[14px] text-ink-2">
          Where do you live?
          <select value={chosen} onChange={(e) => setCountry(e.target.value)} className="h-9 min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-2 text-[14px] text-ink">
            <option value={ALL_COUNTRIES}>All countries</option>
            {unlisted > 0 && (
              <option value={NO_COUNTRY}>
                {NO_COUNTRY_LABEL} ({unlisted})
              </option>
            )}
            {countries.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </select>
        </label>
      )}
      {chosen && chosen !== NO_COUNTRY && !matching.length && (
        <p className="rounded-[12px] bg-warn-soft px-3 py-2 text-[14px] text-warn">No study lists a site in {chosen}. Studies abroad sometimes accept international families: ask the study team.</p>
      )}
      <ul className="divide-y divide-line">
        {(matching.length ? matching : studies).map((s) => {
          const d = details[s.key];
          return (
            <li key={s.key} className="py-2.5">
              <p className="line-clamp-2 text-[15px] font-medium leading-snug">{s.title}</p>
              <p className="mt-0.5 text-[13px] text-ink-2">
                <span className={s.status === RECRUITING ? "text-ok" : ""}>{s.status}</span> · {s.observational ? "observes" : "tests a treatment"} · {ageRange(d).label}
              </p>
              <p className="mt-0.5 text-[13px] text-ink-2">{studyFocus(s, label).text}</p>
              <a href={contactUrl(d, s.href)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[13px] font-medium text-focus hover:underline">
                Contact the study team ↗
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
