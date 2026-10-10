"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Edge } from "@/lib/types";
import EvidenceDrawer from "./atlas/EvidenceDrawer";
import { writeAtlasParam } from "@/lib/useAtlasParams";

// ---------------------------------------------------------------------------------------------------
// Theme (per-viewer convenience, kept in localStorage, failures ignored)

export type ThemeChoice = "light" | "dark";

interface Prefs {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
}

const PrefsContext = createContext<Prefs | null>(null);

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: preference just does not persist */
  }
}

// ---------------------------------------------------------------------------------------------------
// Edge panel: any view registers the edges and labels it shows; [e_xxx] links open the drawer by id.

interface EdgePanelApi {
  openEdge: (edge: Edge | string) => void;
  register: (edges: Iterable<Edge>, labels: Record<string, string>) => void;
  hasEdge: (id: string) => boolean;
  getEdge: (id: string) => Edge | undefined;
  /** registry changes, for useSyncExternalStore (only the drawer listens; the tree does not re-render) */
  subscribe: (listener: () => void) => () => void;
  version: () => number;
  labelOf: (id: string) => string;
}

const EdgeContext = createContext<EdgePanelApi | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("dark");

  useEffect(() => {
    // restoring the stored theme after hydration is intentional (server render has no localStorage); an old stored persona is ignored
    const storedTheme = readStorage("constellate.theme");
    if (storedTheme === "light" || storedTheme === "dark") setThemeState(storedTheme);
  }, []);

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    writeStorage("constellate.theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const prefs = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  // edge registry: views register the edges they show; the drawer reads them by the id in ?edge=
  const edgesRef = useRef(new Map<string, Edge>());
  const labelsRef = useRef<Record<string, string>>({});
  const versionRef = useRef(0);
  const listeners = useRef(new Set<() => void>());

  const register = useCallback((edges: Iterable<Edge>, labels: Record<string, string>) => {
    let added = false;
    for (const e of edges) {
      if (!edgesRef.current.has(e.id)) added = true;
      edgesRef.current.set(e.id, e);
    }
    Object.assign(labelsRef.current, labels);
    // registration happens during render: re-render the drawer afterwards, never inside another component's render
    if (added)
      setTimeout(() => {
        versionRef.current += 1;
        for (const l of listeners.current) l();
      }, 0);
  }, []);

  const openEdge = useCallback((edge: Edge | string) => {
    if (typeof edge !== "string") edgesRef.current.set(edge.id, edge);
    const id = typeof edge === "string" ? edge : edge.id;
    writeAtlasParam("edge", id);
  }, []);

  const api = useMemo<EdgePanelApi>(
    () => ({
      openEdge,
      register,
      hasEdge: (id) => edgesRef.current.has(id),
      getEdge: (id) => edgesRef.current.get(id),
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
      version: () => versionRef.current,
      labelOf: (id) => labelsRef.current[id] ?? id,
    }),
    [openEdge, register],
  );

  return (
    <PrefsContext.Provider value={prefs}>
      <EdgeContext.Provider value={api}>
        {children}
        <Suspense fallback={null}>
          <EvidenceDrawer />
        </Suspense>
      </EdgeContext.Provider>
    </PrefsContext.Provider>
  );
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs outside Providers");
  return ctx;
}

export function useEdgePanel(): EdgePanelApi {
  const ctx = useContext(EdgeContext);
  if (!ctx) throw new Error("useEdgePanel outside Providers");
  return ctx;
}
