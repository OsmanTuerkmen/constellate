# UI-Redesign „Atlas“ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Constellate-App (`app/`) bekommt eine neue, graph-zentrierte Oberfläche: Sternenhimmel-Start, Krankheits- und Genseite als Zwei-Spalten-Atlas, Evidenz-Drawer, Vergleich als Overlay; überflüssige Seiten fliegen raus.

**Architecture:** Neue Komponenten in `components/{ui,shell,start,atlas,disease,gene}/` werden neben den alten gebaut und Route für Route eingehängt; die Datenlogik bleibt in `lib/` (reine Funktionen, neu mit Unit-Tests über `node:test` + `tsx`). Kante und Vergleich liegen in der URL (`?edge=`, `?compare=`). Zum Schluss werden alte Routen, Komponenten und Assets gelöscht.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5.9, Tailwind 4, react-force-graph-2d, Fuse.js, Playwright, node:test über `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-10-ui-redesign-atlas-design.md`

## Global Constraints

- `app/public/data/`, `pipeline/` und der Datenvertrag bleiben unverändert; die App schreibt nie in `public/data/`.
- Keine neuen npm-Abhängigkeiten; `three` und `@types/three` werden entfernt.
- App-Texte auf Englisch. Einziger Disclaimer: Footer „Research navigation, not medical advice.“
- Farben (Dark, Standard): Hintergrund `#0A0F1E`; Fokus Sternengold; Gene Türkis; verwandte Krankheiten Violett; Symptome gedämpftes Grau-Blau; Gegenevidenz/„mechanism differs“ Korallrot. Light Mode über `data-theme="light"`. Kontrast WCAG AA.
- Schrift Inter; Größen 28 (Titel), 15/16 (Text), 13 (Meta).
- Karten: Radius 16 px, 1-px-Rand, keine schweren Schatten. Drawer-Animation 200 ms, Graph-Aufbau ca. 600 ms; `prefers-reduced-motion` schaltet Animationen ab.
- Desktop-Breakpoint 1024 px (`lg:`); Infospalte 400 px; Evidence-Drawer 420 px; Compare-Overlay max. 960 px; Bottom-Sheets max. 90 % Höhe.
- Kopfzeile 56 px: Logo, Suche, „About“, Theme-Umschalter.
- Startseite: Titel „Every rare disease has neighbours.“, Untersatz „Search a diagnosis. See what is linked, with a source for every line.“, Beispiel-Chips Krabbe disease, metachromatic leukodystrophy, Gaucher disease.
- Antwortkarten-Titel: „What is it?“, „Is there a treatment?“, „What can I do?“. Tabs: „Studies (n)“, „Groups (n)“, „Related (n)“.
- Leere Gegenevidenz zeigt „No counter-evidence found“.
- `localStorage` nur in try/catch (Theme `constellate.theme`, Tour `constellate.tour`).
- Commits: Präfix `app:` bzw. `docs:`, Abschluss-Zeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Krankheit ohne Shard oder ohne Nachbarn (z. B. `MONDO:9999999`, `MONDO:0012720`): Seite zeigt Gap-Panel, kein leerer Graph, kein Crash. Test in Task 6.
2. `?edge=` mit unbekannter ID bzw. `?compare=` mit einer ID, die kein Nachbar ist: Drawer/Overlay bleibt zu, keine Console-Errors. Tests in Task 4 und Task 7.
3. Handy 375 px: kein horizontales Überlaufen auf Start-, Krankheits- und Genseite; Drawer/Overlay als Bottom-Sheet schließbar. Tests in Task 6, 7, 8, 9.
4. `localStorage` gesperrt (Privatmodus): Theme-Umschalter und Tour werfen nicht. Test in Task 1 (Theme) und Task 10 (Tour).
5. `sky.json` nicht ladbar oder `prefers-reduced-motion`: Startseite bleibt bedienbar, Himmel steht still bzw. fällt auf Verlauf zurück. Test in Task 9.

---

### Task 1: Fundament: Tokens, Shell, UI-Bausteine, Test-Setup

**Files:**
- Modify: `app/app/globals.css` (Tokens neu, Dark zuerst), `app/app/layout.tsx` (neue Shell, `themeColor` `#0A0F1E`), `app/components/Providers.tsx` (Theme-Logik bleibt; Persona und Edge-Panel-Rendering raus, siehe Task 4), `app/package.json` (Skript `test:unit`, `three`/`@types/three` raus), `app/playwright.config.ts` (Chrome unter Windows finden)
- Create: `app/components/shell/{AppHeader,SearchBox,Footer,ThemeToggle}.tsx`, `app/components/ui/{Button,Chip,Card,Tabs,Drawer,Modal,Popover,Skeleton}.tsx`
- Test: `app/e2e/shell.spec.ts`

**Interfaces:**
- Produces: `Button({variant: "primary"|"ghost", ...ButtonHTMLAttributes})`; `Chip({active?, onClick?, children})`; `Card({title?, children, className?})`; `Tabs({tabs: {id: string; label: string}[], active: string, onChange(id: string): void})` mit `role="tablist"`; `Drawer({open, onClose, title, children})` (ab `lg` rechts 420 px über dem Elternelement, darunter Bottom-Sheet; `Esc` schließt; Fokus zurück zum Auslöser); `Modal({open, onClose, title, children})` (max. 960 px; unter `lg` Bottom-Sheet); `Popover({anchor: {x: number; y: number}, onClose, children})`; `SearchBox({autoFocus?, size?: "lg"|"md", onQuery?(q: string, hits: SearchHit[]): void})` nutzt `createSearcher` aus `lib/search.ts` und navigiert per `hrefFor(entry.type, entry.id)`.
- Tailwind-Farbnamen über CSS-Variablen: `bg`, `panel`, `ink`, `ink-2`, `line`, `focus` (Gold), `gene`, `related`, `symptom`, `contra`.

- [ ] **Step 1: Failing test** `e2e/shell.spec.ts`: „header has search and about“ (auf `/about`-freier Seite `/` sichtbar: `getByRole("search")`, Link „About“); „theme toggle switches data-theme“ (Klick → `html[data-theme="light"]`, nochmal → `dark`); „theme toggle survives blocked localStorage“ (`page.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); })`, Klick wirft keinen Page-Error).
- [ ] **Step 2:** `npx playwright test e2e/shell.spec.ts` → FAIL (kein Theme-Button mit neuem Label „Toggle theme“).
- [ ] **Step 3: Implementieren.** `playwright.config.ts`: `chromiumPath()` prüft zusätzlich `C:/Program Files/Google/Chrome/Application/chrome.exe` und `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. `package.json`: `"test:unit": "node --import tsx --test lib/*.test.ts"`. Theme: Standard dark, Toggle wechselt dark↔light.
- [ ] **Step 4:** `npx playwright test e2e/shell.spec.ts`, `npm run typecheck`, `npm run lint` → PASS.
- [ ] **Step 5: Commit** `app: design tokens, app shell and UI primitives`

### Task 2: Graph-Modell in `lib/graph.ts`

**Files:**
- Create: `app/lib/graph.ts`, `app/lib/graph.test.ts`
- Modify: `app/components/DiseaseView.tsx`, `app/components/GeneView.tsx` (nutzen vorübergehend `lib/graph.ts`)

**Interfaces:**
- Produces: Typen `GraphNodeKind`, `GraphNode`, `GraphLink` (wandern aus `ForceGraphClient.tsx` hierher, dort re-exportiert); `buildDiseaseGraph(file: DiseaseFile, opts: {phenotypes: number; labels: Record<string,string>; expandFamilies: boolean}): {nodes: GraphNode[]; links: GraphLink[]; families: number}` (Logik 1:1 aus `DiseaseView.tsx` `buildGraph`); `buildGeneGraph(file: GeneFile): {nodes: GraphNode[]; links: GraphLink[]}` (aus `GeneView.tsx` ab Zeile 61); `filterGraph(g, show: {genes: boolean; symptoms: boolean; related: boolean})` entfernt Knoten der abgeschalteten Arten samt Links, der Zentrumsknoten bleibt immer.

- [ ] **Step 1: Failing tests** in `lib/graph.test.ts` (lesen `public/data/disease/MONDO_0009499.json` per `fs`): „krabbe graph has centre, GALC and a PMD counter link“ (`nodes` enthält `{kind:"center"}` mit id `MONDO:0009499`, einen Knoten id `GALC` kind `gene`, und einen Link mit `counter === true`); „MLD subtypes bundle into one family node“ (bei `expandFamilies:false` existiert ein Knoten `kind:"family"` mit `members >= 2`); „filterGraph keeps the centre“ (`filterGraph(g,{genes:false,symptoms:false,related:false}).nodes` hat Länge 1).
- [ ] **Step 2:** `npm run test:unit` → FAIL (Modul fehlt).
- [ ] **Step 3:** Implementieren, alte Aufrufer umstellen.
- [ ] **Step 4:** `npm run test:unit`, `npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `app: graph model in lib/graph.ts with unit tests`

### Task 3: Graph-Bühne

**Files:**
- Create: `app/components/atlas/GraphStage.tsx`
- Modify: `app/components/ForceGraphClient.tsx` (neue Palette-Variablen, Aufbau-Animation, `EDGE_PANEL_EVENT`-Import raus, Größe aus Elternelement statt `height`-Prop)

**Interfaces:**
- Consumes: `GraphNode`, `GraphLink`, `filterGraph` (Task 2).
- Produces: `GraphStage({graph: {nodes; links}, centerShape?: "point"|"ring", onEdge(edge: Edge): void, onNode(node: GraphNode, at: {x: number; y: number}): void, families?: number, expanded?: boolean, onToggleFamilies?(): void})`. Enthält Filter-Chips „Genes“, „Symptoms“, „Related“ (alle an), einklappbare Legende (Knotenarten + Linienstile), Knopf „Show as list“ (Liste aller Knoten als Links, gruppiert wie bisher `EgoGraph` `NodeList`). Füllt die Höhe des Elternelements. `data-testid="graph-stage"`.

- [ ] **Step 1:** Temporär `GraphStage` in `DiseaseView` statt `EgoGraph` einsetzen; e2e-Assertion in neuem `e2e/atlas.spec.ts`: „graph stage renders a canvas and filters“ (auf `/d/MONDO_0009499`: `getByTestId("graph-stage").locator("canvas")` sichtbar; Klick auf Chip „Symptoms“ setzt `aria-pressed="false"`).
- [ ] **Step 2:** Test → FAIL.
- [ ] **Step 3:** Implementieren. Aufbau-Animation: Knoten starten bei `(0,0)` und werden vom Force-Layout nach außen gezogen; bei reduced motion `cooldownTicks` sofort, keine Startposition-Animation.
- [ ] **Step 4:** Test + typecheck + lint → PASS.
- [ ] **Step 5: Commit** `app: graph stage with filters, legend and list view`

### Task 4: URL-Zustand und Evidence-Drawer

**Files:**
- Create: `app/lib/useAtlasParams.ts`, `app/components/atlas/EvidenceDrawer.tsx`
- Modify: `app/components/Providers.tsx` (Edge-Registry bleibt; `openEdge` schreibt `?edge=` über `useAtlasParams`; altes `EdgePanel`-Rendering entfällt)

**Interfaces:**
- Produces: `useAtlasParams(): {edge: string | null; compare: string | null; setEdge(id: string | null): void; setCompare(id: string | null): void}` (nutzt `useSearchParams`/`router.replace` ohne Scroll; `setEdge(null)` entfernt den Parameter). `EvidenceDrawer({edgeId: string | null, onClose(): void})` liest die Kante über die Registry (`useEdgePanel().hasEdge/…`, neue Methode `getEdge(id): Edge | undefined`), zeigt Beziehung (`RELATION_LABEL`), Quelle mit Link (`sourceHref`), Datum (`formatDate`), Evidenzstufe (`LEVEL_INFO`), Konfidenz (`formatConfidence`), `independent_sources`, `formula` falls vorhanden, Abschnitt „Counter-evidence“ (leer: „No counter-evidence found“). Unbekannte ID → Drawer bleibt zu.

- [ ] **Step 1: Failing tests** in `e2e/atlas.spec.ts`: „edge param opens the drawer“ (`/d/MONDO_0009499?edge=e_3dbc42738b5a` → Dialog mit Text „Counter-evidence“ und einem Quell-Link); „unknown edge id keeps the drawer closed“ (`?edge=e_000000000000` → kein `role="dialog"`, keine Console-Errors); „Esc closes and clears the param“.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementieren; Logik aus `components/EdgePanel.tsx` übernehmen, Darstellung kompakt neu.
- [ ] **Step 4:** → PASS (+ typecheck, lint).
- [ ] **Step 5: Commit** `app: evidence drawer driven by ?edge=`

### Task 5: Infospalte der Krankheit

**Files:**
- Create: `app/lib/useDiseaseSummary.ts`, `app/components/disease/{DiseaseInfo,AnswerCards,StudiesTab,GroupsTab,RelatedTab}.tsx`

**Interfaces:**
- Consumes: `therapyState`, `ownOrgs`, `ownStudies`, `familyAssets`, `relatedCandidates`, `relatedFinding`, `cardPartner`, `nextSteps` aus `lib/nextSteps.ts`; `useCountry`, `useTrialDetails` aus `lib/studies.ts`.
- Produces: `useDiseaseSummary(file: DiseaseFile, defaultVia: string | null): {definition: string | null; therapy: TherapyState; steps: NextStep[]; studies: StudyRow[]; orgs: OrgRow[]; related: RelatedFinding[]; compareWith: {id: string; label: string} | null}` (Ablauf wie `components/next/WhatNow.tsx` Zeilen 44–71, ohne JSX). `DiseaseInfo({file, summary, onCompare(id: string): void})` rendert Kopf (Name, ein Mechanismus-Chip, MONDO-ID; „Identifiers“ als `<details>`), `AnswerCards` (Titel siehe Global Constraints, je max. 2 Zeilen; „What can I do?“ = erste 3 `steps`), dann `Tabs` mit `StudiesTab` (Länderauswahl wie bisher, eine Zeile je Studie, Link „Contact the study team“), `GroupsTab` (eine Zeile je Gruppe: Name, Land, Link zur Website), `RelatedTab` (eine Zeile je Nachbar: Name, Grund z. B. „shares PSAP“, Knopf „Compare“; `mechanism_differs` mit Korall-Hinweis „mechanism differs“).

- [ ] **Step 1: Failing test** in `e2e/atlas.spec.ts`: „info column shows three answers and tabs“ (Krabbe: Überschriften „What is it?“, „Is there a treatment?“, „What can I do?“; `role="tab"` mit Namen `/Studies \(\d+\)/`, `/Groups \(\d+\)/`, `/Related \(\d+\)/`; Treatment-Karte enthält „No approved medicine“).
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementieren (in `DiseaseView` vorübergehend einhängen).
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `app: disease info column with answer cards and tabs`

### Task 6: Atlas-Layout, Knoten-Popover, Gap-Panel, Route `/d/[id]`

**Files:**
- Create: `app/components/atlas/{AtlasLayout,NodePopover}.tsx`, `app/components/disease/{DiseaseAtlas,GapPanel}.tsx`
- Modify: `app/app/d/[id]/page.tsx` (rendert `DiseaseAtlas`)

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: `AtlasLayout({info: ReactNode, stage: ReactNode})`: ab `lg` zwei Spalten in Höhe `calc(100dvh - 56px)`, Infospalte 400 px mit eigenem Scroll; darunter Infospalte voll breit plus Knopf „Show the map“, der die Bühne als Vollbild-Sheet öffnet. `DiseaseAtlas({id: string})`: Zustände loading (Skeleton), ready, missing (→ `GapPanel`), error („Try again“). `GapPanel({id: string; file: DiseaseFile | null; core: Core | null; entry: IndexEntry | null})`: Logik aus `components/HonestGap.tsx` (`gapProps`, `coverageSearches`) mit Abschnitten „What we searched“, „What is missing“, „Nearest communities“, „Next question“. `NodePopover`: Name, Typ, „Open“ (Krankheit/Gen über `hrefFor`), „Compare“ (nur für Nachbarn → `setCompare`).

- [ ] **Step 1: Failing tests** in `e2e/atlas.spec.ts`: „desktop: info and graph side by side without page scroll“ (1280×800: `document.documentElement.scrollHeight <= innerHeight + 1`, Graph-Bühne `boundingBox().x > 400`); „mobile: map opens as sheet, no horizontal overflow“ (375×812: `scrollWidth === innerWidth`; Klick „Show the map“ → Canvas sichtbar); „unknown disease shows the gap panel“ (`/d/MONDO_9999999` → Text „not in this dataset“); „gap case MONDO:0012720 renders without errors“ (keine Console-Errors, Text „What we searched“); „light mode renders the atlas“ (`data-theme="light"` gesetzt, Antwortkarten und Canvas sichtbar, keine Console-Errors).
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `app: atlas layout for diseases with popover and gap panel`

### Task 7: Compare-Overlay

**Files:**
- Create: `app/components/atlas/CompareOverlay.tsx`
- Modify: `app/app/d/[id]/action/page.tsx` (Server-Redirect auf `/d/[id]?compare=<via>`; ohne `via`: `/d/[id]`), `app/components/ExplainStream.tsx` (Stil an neue Tokens)

**Interfaces:**
- Consumes: `buildV2`, `v2Markdown` (`lib/actionv2.ts`), `buildGlance` (`lib/actioncard.ts`), `loadDisease`, `loadGene`; Lade-Ablauf wie `components/ActionCard.tsx` Zeilen 94–128; `useAtlasParams`.
- Produces: `CompareOverlay({disease: DiseaseFile; meta: Meta | null})`: offen, wenn `compare` ein Nachbar von `disease` ist; Kopf „<A> ↔ <B>“ mit Auswahl (Select über `disease.neighbours`), Abschnitte „What transfers“, „What differs“, „Needs an expert“, jeder Satz mit Quellen-Marker (Klick → `setEdge(id)`), „Explain in plain language“ (`ExplainStream`), Knöpfe „Export“ (Markdown-Download aus `v2Markdown`) und „Print“.

- [ ] **Step 1: Failing tests** in `e2e/atlas.spec.ts`: „compare with MLD“ (`/d/MONDO_0009499?compare=MONDO_0018868` → Dialog mit „What transfers“, „What differs“, „Needs an expert“, mindestens ein Quellen-Marker `e_…`; Klick auf Marker öffnet Evidence-Drawer); „old action URL redirects“ (`/d/MONDO_0009499/action?via=MONDO_0018868` → URL enthält `compare=MONDO_0018868`); „compare param that is no neighbour stays closed“ (`?compare=MONDO_9999999` → kein Dialog); „mobile compare is a closable sheet“ (375 px, Schließen-Knopf funktioniert).
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `app: compare overlay replaces the action card page`

### Task 8: Genseite

**Files:**
- Create: `app/components/gene/{GeneAtlas,GeneInfo}.tsx`, `app/e2e/gene.spec.ts`
- Modify: `app/app/g/[symbol]/page.tsx`

**Interfaces:**
- Consumes: `buildGeneGraph` (Task 2), `AtlasLayout`, `GraphStage`, `pathwayRefs` (`lib/normalize.ts`).
- Produces: `GeneAtlas({symbol: string})`; `GeneInfo({file: GeneFile})`: Symbol, voller Name, Karte „What does it do?“ (Pathways, max. 3, Rest hinter „more“), Liste der Krankheiten mit Beziehung „causes“ bzw. „associated with“.

- [ ] **Step 1: Failing tests** `e2e/gene.spec.ts`: „GALC page shows diseases and graph“ (Text „Krabbe disease“, Canvas sichtbar, `centerShape` ring egal); „mobile gene page has no horizontal overflow“.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `app: gene page in the atlas layout`

### Task 9: Startseite mit Sternenhimmel

**Files:**
- Create: `app/lib/sky.ts`, `app/lib/sky.test.ts`, `app/components/start/{SkyCanvas,StartHero}.tsx`, `app/e2e/start.spec.ts`
- Modify: `app/app/page.tsx`

**Interfaces:**
- Produces: `type Sky = {ids: string[]; labels: string[]; kind: number[]; degree: number[]; cluster: number[]; pos: number[]; edges: number[]; clusters: {id: number; size: number; hub: number}[]}` (Format `constellate-sky/1`, `pos` flach x,y,z in 1/10-Einheiten); `project(sky: Sky, angle: number, width: number, height: number): Float32Array` (2D-Koordinaten je Stern, Drehung um die Hochachse, Perspektive einfach `scale = f / (f + z)`); `matchStars(sky: Sky, ids: string[]): number[]` (Indizes der Sterne mit diesen IDs). `SkyCanvas({highlight: string[]})`: lädt `/world/sky.json`; zeichnet Sterne nach `kind` (Krankheit/Gen heller, Symptome Staub), Hub-Sterne heller, hervorgehobene Sterne gold mit Glühen; dreht mit ca. 0,02 rad/s; bei reduced motion stehend; bei Ladefehler nur CSS-Verlauf. `StartHero`: Titel, Untersatz, `SearchBox size="lg"` (`onQuery` liefert Treffer-IDs an `SkyCanvas.highlight`), Chips, Link „How it works“.

- [ ] **Step 1: Failing tests** `lib/sky.test.ts`: „project returns two numbers per star inside the canvas“ (für das echte `public/world/sky.json`, Breite 800, Höhe 600: Länge `2 * ids.length`, alle Werte endlich); „matchStars finds Krabbe“ (`matchStars(sky, ["MONDO:0009499"]).length === 1`). `e2e/start.spec.ts`: „start shows title, search and chips“ (Text „Every rare disease has neighbours.“, Canvas sichtbar); „typing Krabbe and choosing it opens the disease“; „chip opens metachromatic leukodystrophy“; „sky failure keeps the page usable“ (`page.route("**/world/sky.json", r => r.abort())` → Suche funktioniert, keine unbehandelten Fehler); „mobile start has no horizontal overflow“.
- [ ] **Step 2:** `npm run test:unit`, `npx playwright test e2e/start.spec.ts` → FAIL.
- [ ] **Step 3:** Implementieren (Canvas mit `devicePixelRatio`, `requestAnimationFrame`, Pause bei `document.hidden`).
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `app: start page with the star map`

### Task 10: About-Seite, Footer-Link, geführte Tour

**Files:**
- Create: `app/components/atlas/Tour.tsx`, `app/e2e/about.spec.ts`
- Modify: `app/app/about/page.tsx` (neu: Idee, Evidenzstufen aus `MethodsView`/`LEVEL_INFO`, Datenquellen und Lizenzen, Team „Hanno Kügler, Osman and Recep“, Knopf „Restart the tour“), `app/components/shell/Footer.tsx` (Link „Missing something?“ → `https://github.com/Reczec/constellate/issues/new?template=share-what-you-know.yml`), `app/components/disease/DiseaseAtlas.tsx` (Tour einhängen)

**Interfaces:**
- Produces: `Tour({steps: {target: string; text: string}[]})` (Ziel per `data-tour="answers" | "graph" | "compare"`); zeigt sich, wenn `constellate.tour` nicht `"done"` ist; „Next“, „Skip“; setzt `"done"` am Ende/bei Skip. Texte: (1) „The three answers, in short.“ (2) „Every line is a piece of evidence. Click one.“ (3) „Compare with a neighbour that is further along.“ Export `restartTour()` setzt das Flag zurück.

- [ ] **Step 1: Failing tests** `e2e/about.spec.ts`: „about lists evidence levels and sources“ (Texte „observed“, „curated“, „text_mined“, „inferred“, „HPO“); „tour shows once“ (frischer Kontext auf Krabbe: Text „The three answers, in short.“ sichtbar; „Skip“; Reload → nicht mehr sichtbar); „tour with blocked localStorage does not throw“.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `app: about page, footer link and guided tour`

### Task 11: Altlasten entfernen, Doku, Gesamtprüfung

**Files:**
- Delete: `app/app/{impact,intro,share,methods,p,o}/`, `app/components/{DiseaseView,GeneView,PhenotypeView,OrgView,StartView,EdgePanel,ActionCard,ActionCardPage,ActionCardV2,HonestGap,OpenStudies,Orgs,TextMined,MethodsView,MomentBar,TenXView,StoryPlayer,EgoGraph,Header,DataFooter,SearchBox,Badges,CiteLink,Skeleton}.tsx` (nur soweit nicht mehr importiert), `app/components/{next,share,brand}/`, `app/lib/{tenx,story,persona}.ts`, `app/story/`, `app/public/{impact,story}/`, `app/scripts/build-tenx.mjs`, `app/playwright.story.config.ts`, `app/e2e/{hero,impact,intro,share}.spec.ts`
- Modify: `app/package.json` (Skripte `story:*` raus), `Makefile` (Ziel `tenx` und aus `reproduce` raus), `app/README.md`, `docs/STATUS.md`, `CLAUDE.md`, `README.md` (Seitenliste, Tests)

**Interfaces:**
- Consumes: alles Vorige; `lib/search.ts` verliert den `persona`-Parameter (`search(query, limit = 8)`).

- [ ] **Step 1:** Löschen, Importe reparieren; `grep -rn "persona\|tenx\|story\|EdgePanel" app/components app/lib app/app` → nur noch erwartete Treffer (keine).
- [ ] **Step 2:** Verifikation: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run build`, `npx playwright test` (alle Specs), `uv run --project pipeline python pipeline/validate.py` → alles grün.
- [ ] **Step 3:** Doku nachziehen (Seiten, Komponenten-Ordner, `npm run test:unit`, Windows-Chrome im Playwright-Config).
- [ ] **Step 4: Commit** `app: remove old pages, components and assets` und `docs: update for the atlas UI`
