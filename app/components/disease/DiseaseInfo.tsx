"use client";

import { useId, useState } from "react";
import type { DiseaseFile } from "@/lib/types";
import { xrefUrl } from "@/lib/ids";
import type { DiseaseSummary } from "@/lib/useDiseaseSummary";
import Tabs, { TabPanel } from "../ui/Tabs";
import AnswerCards from "./AnswerCards";
import StudiesTab from "./StudiesTab";
import GroupsTab from "./GroupsTab";
import RelatedTab from "./RelatedTab";

/** Left column of the atlas: name, three answers, then the details in tabs. */
export default function DiseaseInfo({ file, summary, onCompare }: { file: DiseaseFile; summary: DiseaseSummary; onCompare: (id: string) => void }) {
  const node = file.node;
  const prefix = useId();
  const [tab, setTab] = useState("studies");
  const mechanism = node.mechanism_classes?.[0];
  const tabs = [
    { id: "studies", label: `Studies (${summary.studies.length})` },
    { id: "groups", label: `Groups (${summary.orgs.length})` },
    { id: "related", label: `Related (${file.neighbours.length})` },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{node.label}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
          {mechanism && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-ink">{mechanism.label.replace(/\s*\(.*\)$/, "")}</span>}
          <span>{node.id}</span>
          {node.xrefs.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none underline underline-offset-2 hover:text-ink">Identifiers</summary>
              <div className="mt-1 flex flex-wrap gap-2">
                {node.xrefs.map((x) => {
                  const href = xrefUrl(x);
                  return href ? (
                    <a key={x} href={href} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                      {x}
                    </a>
                  ) : (
                    <span key={x}>{x}</span>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      </header>

      <AnswerCards file={file} summary={summary} onCompare={onCompare} />

      <div data-tour="compare">
        <Tabs tabs={tabs} active={tab} onChange={setTab} idPrefix={prefix} />
        <TabPanel idPrefix={prefix} id="studies" active={tab}>
          <StudiesTab label={node.label} studies={summary.studies} country={summary.country} setCountry={summary.setCountry} />
        </TabPanel>
        <TabPanel idPrefix={prefix} id="groups" active={tab}>
          <GroupsTab label={node.label} orgs={summary.orgs} own={summary.ownOrgCount} country={summary.country} />
        </TabPanel>
        <TabPanel idPrefix={prefix} id="related" active={tab}>
          <RelatedTab neighbours={file.neighbours} onCompare={onCompare} />
        </TabPanel>
      </div>
    </div>
  );
}
