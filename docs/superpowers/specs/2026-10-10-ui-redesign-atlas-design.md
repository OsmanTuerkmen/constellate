# UI-Redesign „Atlas“ · Design

Stand 10.10.2026. Ansatz A aus dem Brainstorming. Diese Datei ist die Grundlage für den Implementierungsplan.

## Ziel und Erfolgskriterien

Constellate wird ein Vorzeigeprojekt: Wer die App öffnet, versteht in unter 30 Sekunden, was sie macht, und sieht den Wissensgraphen als Herzstück. Heute ist die UI zu textlastig, die Seiten sind zu lang und chaotisch, die Optik ist generisch und der Graph liegt versteckt am Seitenende.

Erfolgskriterien:

1. Ein Fremder versteht ohne Erklärung in unter 30 Sekunden, was die App tut (Startseite: ein Satz, eine Suche, der Sternenhimmel).
2. Die Krankheitsseite passt auf Desktop (ab 1024 px Breite, 800 px Höhe) ohne Seiten-Scroll auf einen Bildschirm; nur die linke Spalte scrollt in sich.
3. Der Graph ist auf der Krankheitsseite rechts groß sichtbar, nicht am Seitenende.
4. Desktop (1280 px) und Handy (375 px) funktionieren ohne horizontales Überlaufen; Dark und Light Mode.
5. `npm run typecheck`, `npm run lint`, die neuen Playwright-Tests und `make validate` sind grün.

## Rahmen

- Pipeline, `app/public/data/` (Datenvertrag) und `pipeline/validate.py` bleiben unverändert.
- Die Datenlogik in `app/lib/` wird wiederverwendet; Seiten und Komponenten werden neu gebaut.
- App-Sprache bleibt Englisch.
- Nicht im Umfang: Vercel-Deploy, neue Datenquellen, neue Pipeline-Schritte.

## 1 · Seiten und Features

| Route | Inhalt |
|---|---|
| `/` | Start: Sternenhimmel (aus `public/world/sky.json`), ein Satz zur Idee, große Suche, 3 Beispiel-Chips (Krabbe disease, metachromatic leukodystrophy, Gaucher disease). |
| `/d/[id]` | Krankheit: Infospalte links, Graph rechts. Edge-Details, Vergleich (Action Card) und Honest Gap ohne Seitenwechsel. Query-Parameter `?edge=<e_id>` öffnet eine Kante, `?compare=<MONDO_…>` öffnet den Vergleich (teilbare Links). |
| `/g/[symbol]` | Gen: gleiches Layout, Gen im Zentrum, links die Krankheiten des Gens. |
| `/about` | Idee, Evidenzstufen (Inhalt aus `/methods` verdichtet), Datenquellen und Lizenzen, Team, Hinweis „Research navigation, not medical advice“. |
| `/api/explain` | bleibt unverändert (Template-Text ohne Key, vorberechnete Antworten). |

Entfernt:

- `/d/[id]/action` → leitet auf `/d/[id]?compare=…` weiter (alte Links funktionieren weiter).
- `/p/[id]` (Phänotyp) und `/o/[slug]` (Organisation): keine eigenen Seiten mehr; Details erscheinen im Knoten-Popover bzw. in der Gruppenliste mit Link zur Website der Organisation.
- `/impact` (10×-Rechner) samt `lib/tenx.ts`, `components/TenXView.tsx`, `public/impact/`, `scripts/build-tenx.mjs`, Make-Ziel `tenx`.
- `/intro` (Story-Video) samt `lib/story.ts`, `components/StoryPlayer.tsx`, `app/story/`, `public/story/`, `playwright.story.config.ts`, npm-Skripte `story:*`.
- `/share` samt `components/share/` und `e2e/share.spec.ts`; ersetzt durch einen Footer-Link „Missing something?“ auf das GitHub-Issue-Template.
- `/methods` (geht in `/about` auf).
- `lib/persona.ts` (nur noch ein Default, ohne Funktion).

Bleibt als Funktion: Suche nach Krankheit, Gen oder Symptom; Graph; Quelle, Datum, Evidenzstufe, Konfidenz und Gegenevidenz je Kante; Action Card (was überträgt sich, was ist anders, was braucht Experten; Export als Markdown, Drucken); offene Studien mit Länderfilter; Patientengruppen; zugelassene Therapien; Honest Gap.

## 2 · Layout

### Krankheitsseite, Desktop (ab 1024 px)

- Kopfzeile (56 px): Logo, Suche, Link „About“, Theme-Umschalter.
- Darunter zwei Spalten in voller Resthöhe:
  - **Infospalte** links, 400 px, scrollt in sich:
    1. Kopf: Name, Mechanismus-Klasse als ein Chip, MONDO-ID klein. Weitere IDs (OMIM, ORPHA) hinter „Identifiers“.
    2. Drei **Antwortkarten**, je höchstens 2 Zeilen Text plus ein Link: „What is it?“ (Definition, gekürzt), „Is there a treatment?“ (zugelassen ja/nein; falls nein und eine verwandte Krankheit hat eine, Hinweis darauf), „What can I do?“ (die ersten 3 Einträge aus `nextSteps`).
    3. **Tabs**: Studies (n) · Groups (n) · Related (n). Jede Zeile eine Zeile: Titel, ein Meta-Text, Aktion.
  - **Graph-Bühne** rechts, Restbreite: Ego-Graph, Filter-Chips (Genes, Symptoms, Related), einklappbare Legende, Knopf „Show as list“.
- Klick auf eine Kante: **Evidence-Drawer** gleitet von rechts über die Graph-Bühne (420 px): Beziehung, Quelle mit Link, Datum, Evidenzstufe, Konfidenz, unabhängige Quellen, Gegenevidenz-Abschnitt (immer sichtbar, auch wenn leer: „No counter-evidence found“).
- Klick auf einen Knoten: **Popover** am Knoten mit Name, Typ und Aktionen („Open“ für Krankheit/Gen, „Compare“ für verwandte Krankheiten).
- „Compare“: **Compare-Overlay** (Modal, max. 960 px breit): Kopf „Krabbe disease ↔ metachromatic leukodystrophy“, Auswahl des Vergleichspartners, drei Spalten bzw. Abschnitte „What transfers / What differs / Needs an expert“, jeder Satz mit Quellen-Marker (Edge-ID, Klick öffnet den Evidence-Drawer), „Explain in plain language“ (bestehender Explain-Stream), Export und Drucken.
- **Honest Gap**: Hat die Krankheit keinen Shard oder keine belegten Leads, zeigt die Infospalte statt der Antwortkarten die Gap-Karte (was wann gesucht wurde, was fehlt, nächstgelegene Communities mit Grund, nächste Frage). Die Graph-Bühne zeigt den einzelnen Knoten mit gestrichelten Linien zu den nächsten Nachbarn, falls vorhanden.

### Krankheitsseite, Handy (unter 1024 px)

- Infospalte in voller Breite; über den Tabs ein Knopf „Show the map“, der den Graph als Vollbild-Sheet öffnet.
- Evidence-Drawer und Compare-Overlay werden zu Bottom-Sheets (max. 90 % Höhe, Wisch- oder Schließen-Knopf).

### Genseite

Gleiches Layout. Infospalte: Gen-Name, voller Name, „What does it do?“ (Pathways), Liste der Krankheiten mit Beziehung (ursächlich / assoziiert). Graph: Gen im Zentrum.

### Startseite

- Vollflächiger Sternenhimmel: `sky.json` (6.657 Sterne, 17 Cluster), 2D-Projektion auf Canvas, langsame Drehung um die Hochachse; Cluster-Hubs leicht heller.
- Mitte: Titel „Every rare disease has neighbours.“, Untersatz „Search a diagnosis. See what is linked, with a source for every line.“, Suche, 3 Beispiel-Chips, Link „How it works“ (→ `/about`).
- Tippen in die Suche: Sterne der Treffer leuchten auf. Auswahl eines Treffers navigiert zur Detailseite.
- Fällt `sky.json` aus oder ist „reduce motion“ aktiv: statischer Verlauf bzw. stehender Himmel.

### Geführte Tour

Beim ersten Besuch einer Krankheitsseite (Flag in `localStorage`, Zugriff in try/catch) drei Hinweise mit „Next“ und „Skip“: (1) Antwortkarten, (2) „Every line is a piece of evidence. Click one.“, (3) „Compare with a neighbour that is further along.“ Danach nie wieder; über „About“ erneut startbar.

## 3 · Look and Feel

- Dark Mode zuerst (Standard, wenn das System nichts vorgibt), Light Mode über den Umschalter; Tokens in `app/globals.css` als CSS-Variablen.
- Farben: Hintergrund Nachtblau `#0A0F1E`; Panels leicht heller und halbtransparent mit Blur; Fokus (gewählte Krankheit, Haupt-Buttons) Sternengold; Gene Türkis; verwandte Krankheiten Violett; Symptome gedämpftes Grau-Blau; Gegenevidenz und „mechanism differs“ Korallrot. Evidenzstufen über den Linienstil (durchgezogen observed/curated, gestrichelt text_mined, gepunktet inferred). Kontrast mindestens WCAG AA.
- Schrift Inter; höchstens drei Schriftgrößen pro Bildschirm (Titel 28, Text 15/16, Meta 13).
- Karten: Radius 16 px, 1-px-Rand, keine schweren Schatten.
- Bewegung: Graph-Aufbau (Nachbarn von der Mitte nach außen, ca. 600 ms), Hover-Leuchten, Drawer gleiten herein (200 ms). `prefers-reduced-motion` schaltet alles ab.
- Ein einziger Disclaimer im Footer: „Research navigation, not medical advice.“
- Tastatur: alle Aktionen erreichbar, sichtbare Fokus-Ringe, `Esc` schließt Drawer/Overlay, Fokus kehrt zum Auslöser zurück.

## 4 · Code-Aufbau

Wiederverwendet (unverändert oder mit kleinen Anpassungen): `lib/types.ts`, `lib/data.ts`, `lib/ids.ts`, `lib/normalize.ts`, `lib/evidence.ts`, `lib/present.ts`, `lib/nextSteps.ts`, `lib/studies.ts`, `lib/actioncard.ts`, `lib/actionv2.ts`, `lib/explain.ts`, `lib/explaincache.ts`, `lib/search.ts`, `lib/ratelimit.ts`, `lib/nextFamily.ts`, `app/api/explain/`, `components/ForceGraphClient.tsx` (Darstellung angepasst: Farben, Aufbau-Animation, Filter).

Neue Komponenten (je Datei ein Zweck):

| Ordner | Komponenten |
|---|---|
| `components/ui/` | `Button`, `Chip`, `Card`, `Tabs`, `Drawer` (rechts auf Desktop, Bottom-Sheet auf Handy), `Modal`, `Popover`, `Skeleton` |
| `components/shell/` | `AppHeader`, `SearchBox` (nutzt `lib/search.ts`), `Footer`, `ThemeToggle` |
| `components/start/` | `SkyCanvas` (Canvas-Projektion von `sky.json`, Highlight-API für Suchtreffer), `StartHero` |
| `components/atlas/` | `AtlasLayout` (Spalten, Handy-Sheet), `GraphStage` (ForceGraphClient + Filter + Legende + Listenansicht), `EvidenceDrawer`, `NodePopover`, `CompareOverlay`, `Tour` |
| `components/disease/` | `DiseaseAtlas` (lädt Daten, Zustände loading/ready/missing/error), `DiseaseInfo`, `AnswerCards`, `StudiesTab`, `GroupsTab`, `RelatedTab`, `GapPanel` |
| `components/gene/` | `GeneAtlas`, `GeneInfo` |

Zustand: Ausgewählte Kante und Vergleichspartner liegen in der URL (`?edge=`, `?compare=`), damit Links teilbar sind und der Zurück-Knopf funktioniert. Theme-Wahl und Tour-Flag in `localStorage` (try/catch, App funktioniert ohne).

Alte Komponenten werden gelöscht, sobald ihre Nachfolger stehen (u. a. `DiseaseView`, `GeneView`, `PhenotypeView`, `OrgView`, `StartView`, `EdgePanel`, `ActionCard*`, `HonestGap`, `OpenStudies`, `Orgs`, `TextMined`, `MethodsView`, `MomentBar`, `components/next/*`). Logik aus diesen Dateien, die noch gebraucht wird, wandert vorher nach `lib/`.

Abhängigkeiten: `three` und `@types/three` werden entfernt (nicht genutzt). Keine neuen Abhängigkeiten.

Fehlerbehandlung: Ladezustände mit Skeletons; fehlender Shard → `GapPanel` mit „not in this dataset“; Netzwerkfehler → Hinweis mit „Try again“; fehlendes `sky.json` → statischer Hintergrund; unbekannte Kanten-ID in `?edge=` → Drawer bleibt zu.

## 5 · Tests

- `e2e/hero.spec.ts` neu für den neuen Ablauf: Start → Suche „Krabbe“ → Krankheitsseite (Antwortkarten, Graph sichtbar) → Kante öffnen (Quelle und Gegenevidenz-Abschnitt sichtbar) → Compare mit MLD (Abschnitte und Quellen-Marker) → Pelizaeus-Merzbacher als „mechanism differs“ → Honest Gap für `MONDO:0012720` bzw. eine unbekannte ID; jeweils bei 1280 und 375 px, plus Dark und Light Mode und keine Console-Errors.
- `e2e/start.spec.ts`: Himmel wird gezeichnet (Canvas vorhanden), Suche liefert Treffer, Chip navigiert.
- `e2e/gene.spec.ts`: GALC-Seite lädt, Krankheitsliste und Graph sichtbar.
- Entfernt: `e2e/impact.spec.ts`, `e2e/intro.spec.ts`, `e2e/share.spec.ts`.
- `playwright.config.ts`: Chrome-Pfad unter Windows automatisch finden (zusätzlich zu `CHROMIUM_PATH`).
- Pipeline-Tests und `make validate` laufen unverändert weiter.
