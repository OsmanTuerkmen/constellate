"use client";

import { countryName, inCountryFirst, type OrgRow } from "@/lib/nextSteps";
import { useEdgePanel } from "../Providers";

/** Patient groups, one row each; when the diagnosis has none, groups of related diseases with a note. */
export default function GroupsTab({ label, orgs, own, country }: { label: string; orgs: OrgRow[]; own: number; country: string }) {
  const { openEdge } = useEdgePanel();
  if (!orgs.length) return <p className="text-[15px] text-ink-2">No patient group for {label} or a related disease is in our list yet.</p>;
  const rows = inCountryFirst(orgs, (o) => o.country, country);
  return (
    <div>
      {!own && <p className="mb-2 text-[14px] text-ink-2">No group for {label} itself. These support families with a related disease:</p>}
      <ul className="divide-y divide-line">
        {rows.map((o) => (
          <li key={o.key} className="py-2.5">
            <p className="text-[15px] font-medium leading-snug">
              {o.site ? (
                <a href={o.site} target="_blank" rel="noreferrer" className="hover:underline">
                  {o.label} ↗
                </a>
              ) : (
                o.label
              )}
            </p>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-[13px] text-ink-2">
              {o.forDisease && <span>for {o.forDisease.label}</span>}
              {o.country && <span>{countryName(o.country)}</span>}
              {o.aiMatched ? <span>matched by AI, not yet confirmed</span> : o.verified ? <span>checked {o.verified}</span> : null}
              {o.contact && (
                <a href={o.contact} target="_blank" rel="noreferrer" className="text-focus hover:underline">
                  Contact
                </a>
              )}
              {o.edge && (
                <button type="button" onClick={() => openEdge(o.edge!)} className="text-ink-2 underline underline-offset-2 hover:text-ink">
                  Source
                </button>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
