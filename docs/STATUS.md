# Status · Constellate

Stand des Projekts nach der Hackathon-Abgabe (04.10.2026). Offene Entscheidungen: [DECISIONS.md](DECISIONS.md). Aufbau: [ARCHITECTURE.md](ARCHITECTURE.md).

## Auf einen Blick

| Bereich | Stand |
|---|---|
| App | Neue Atlas-Oberfläche (10.10.2026): Sternenhimmel-Start mit Suche; Krankheits-, Gen- und Symptomseite als Zwei-Spalten-Atlas (Infospalte mit drei Antworten und Tabs, Graph rechts); Evidenz-Drawer (`?edge=`), Vergleich als Overlay (`?compare=`), Honest Gap, geführte Tour, Dark/Light |
| Daten | 874 Krankheiten, 1.066 Gene, 4.717 Phänotype im Index (5.642 Phänotypknoten gesamt), 6.660 Dateien; Kanten nach Stufe: 14.512 observed, 27.066 curated, 4.181 inferred, 488 contradicted (Quelle: `app/public/data/meta.json`) |
| Validator | `make validate` grün |
| Tests | `npm run test:unit` (Graph-Modell, Himmel-Projektion), Playwright-E2E (Start, Atlas inkl. 1280/375 px und Light Mode, Gen, Symptom, About/Tour, Shell); Python-Tests mit `make test` |
| Hero-Pfad | Krabbe, GALC und PSAP, MLD, ARSA komplett; Pelizaeus-Merzbacher als Gegenbeispiel |
| Sicherheit | `/api/explain` mit Limits und Security-Header, Details in [SECURITY.md](SECURITY.md) |

## Pipeline

| Schritt | Stand |
|---|---|
| 01 bis 03 | 8 Bulk-Quellen (HPO, MONDO, Orphanet) mit sha256 im Manifest; Slice deterministisch: 350 Kern plus 524 Nachbarn; Basisgraph mit stabilen 12-hex-Edge-IDs |
| 04 Enrichment | 1.055 Studien, 1.855 Papers, 1.687 Grants, dazu Open Targets, Reactome, ClinVar; Coverage-Records für 350 Krankheiten (Basis für Honest Gap) |
| 04b data-v2 | 135 Beobachtungsstudien und 9 Outcome-Skalen, 39 Medikamente (u. a. Libmeldy/Lenmeldy, keine Krabbe-Zulassung), Neugeborenenscreening 11 belegt / 11 UNBELEGT, Prävalenz 638 Einträge, Monarch-Abgleich ρ = 0,661 |
| 05 und 06 OpenAI | Extract (Structured Outputs, wörtliches Snippet, PMID, Entität im Abstract) und Reconcile (Embeddings plus Judge, Fuzzy-Fallback); Modell-IDs nur per Env; Tests mit Mock |
| 07 Analytics | Subtyp-Roll-up, IC, simGIC und Resnik, Gegenbeispiele über Mechanismus-Klassen (251 Paare), Louvain (17 Cluster, Modularität 0,68), Export |
| 08 und 09 | Studiendetails (Länder, Zentren, Einschlusskriterien) und Metriken in `meta.json` |

## OpenAI: wofür und wo

Die Challenge vergibt Track-Preise nur, wenn OpenAI-Modelle im Produkt arbeiten (Extract, Reconcile, Explain). Extract und Reconcile laufen in der Pipeline (lokal), Explain wird für den Hero-Pfad und die wichtigsten Paare vorberechnet (`make explain`) und als statisches JSON ausgeliefert, die Webseite braucht keinen Key. Ohne Key läuft die App, Explain zeigt dann Template-Text.

## Offen

- `data/curated/orgs.csv` und `data/curated/hero_path.yaml` sind noch Platzhalter, bis die Entwürfe (`*_draft.*`, Prüflisten `*_CHECK.md`) geprüft sind. Das Produkt zeigt bis dahin keine Orgs und keinen kuratierten Hero-Beleg (Regel: nur Verifiziertes).
- Reconcile mit verifizierten Orgs laufen lassen, sobald `orgs.csv` Zeilen mit `verified_date` hat: `make reconcile && make analytics && make validate`.
- Reactome-Lizenz ist laut reactome.org/license CC0; die Quellenliste in `app/public/data/meta.json` (geschrieben von `pipeline/07_analytics.py`) sagt noch CC-BY 4.0 und wird beim nächsten Export korrigiert.
- Slice-Zahl: ältere Docs nennen 517 oder 519 Nachbarn. Aktuell gelten 524 Nachbarn und 874 Krankheiten (350 plus 524).
- Demo-Krankheit für den Honest Gap: `MONDO:0012720` (Krabbe disease due to saposin A deficiency), siehe [DECISIONS.md](DECISIONS.md).

## Bekannte Polish-Punkte

- Graph: einzelne Beschriftungen liegen über Nachbarknoten (Label-Kollision prüft nur Labels, nicht Knoten).
- Text-mined-Endpunkte außerhalb des Index zeigen nur die ID.
- `app/README.md` um `orgs`, `gap`, `text_mined` und `NEXT_PUBLIC_DATA_BASE` ergänzen.
