"use client";

import Link from "next/link";
import type { GraphNode } from "@/lib/graph";
import { hrefFor } from "@/lib/ids";
import Popover from "../ui/Popover";

const KIND_NAME: Record<GraphNode["kind"], string> = {
  center: "This disease",
  gene: "Gene",
  phenotype: "Symptom",
  neighbour: "Related disease",
  counter: "Related, but a different mechanism",
  disease: "Disease",
  family: "Group of subtypes",
};

/** What a click on a map point offers: open it (disease, gene) or compare (related diseases). */
export default function NodePopover({
  node,
  at,
  onClose,
  onCompare,
  onExpandFamily,
}: {
  node: GraphNode;
  at: { x: number; y: number };
  onClose: () => void;
  onCompare?: (id: string) => void;
  onExpandFamily?: () => void;
}) {
  const openable = node.kind === "gene" || node.kind === "neighbour" || node.kind === "counter" || node.kind === "disease";
  const comparable = onCompare && (node.kind === "neighbour" || node.kind === "counter");
  return (
    <Popover anchor={at} onClose={onClose}>
      <p className="text-[13px] text-ink-2">{KIND_NAME[node.kind]}</p>
      <p className="mt-0.5 text-[15px] font-semibold leading-snug">{node.label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {openable && (
          <Link href={hrefFor(node.kind === "gene" ? "gene" : "disease", node.id)} className="inline-flex h-8 items-center rounded-full border border-line px-3 text-[13px] font-medium hover:bg-surface-2">
            Open
          </Link>
        )}
        {comparable && (
          <button type="button" onClick={() => onCompare!(node.id)} className="inline-flex h-8 items-center rounded-full bg-focus px-3 text-[13px] font-medium text-focus-ink">
            Compare
          </button>
        )}
        {node.kind === "family" && onExpandFamily && (
          <button type="button" onClick={onExpandFamily} className="inline-flex h-8 items-center rounded-full border border-line px-3 text-[13px] font-medium hover:bg-surface-2">
            Show the {node.members} subtypes
          </button>
        )}
      </div>
    </Popover>
  );
}
