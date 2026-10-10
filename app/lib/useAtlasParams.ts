"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Key = "edge" | "compare";

/**
 * Opens or closes ?edge= / ?compare= in the URL. Opening adds one history entry (switching to another edge replaces
 * it), so Back closes the drawer; closing goes back over that entry when it is ours, so no dead entries pile up.
 * Next's router follows window.history.
 */
export function writeAtlasParam(key: Key, value: string | null) {
  const next = new URLSearchParams(window.location.search);
  if (value) next.set(key, value);
  else next.delete(key);
  const query = next.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  const ours = (window.history.state as { __atlas?: string } | null)?.__atlas === key;
  if (value) {
    // only our own marker as state: handing Next its internal state back would stop the router from syncing
    if (ours) window.history.replaceState({ __atlas: key }, "", url);
    else window.history.pushState({ __atlas: key }, "", url);
  } else if (ours) window.history.back();
  else window.history.replaceState(null, "", url);
}

/** The open evidence drawer (?edge=) and the open comparison (?compare=): shareable links, Back closes them. */
export function useAtlasParams() {
  const params = useSearchParams();
  return {
    edge: params.get("edge"),
    compare: params.get("compare"),
    setEdge: useCallback((id: string | null) => writeAtlasParam("edge", id), []),
    setCompare: useCallback((id: string | null) => writeAtlasParam("compare", id), []),
  };
}
