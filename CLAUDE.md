# CLAUDE.md · Constellate (Landkarte für jede Claude-Session)

Dieses Repo ist die einzige Quelle der Wahrheit für das Projekt. Wer hier arbeitet, findet alles Wichtige im Repo. Stand der Arbeit: [docs/STATUS.md](docs/STATUS.md). Offene Entscheidungen: [docs/DECISIONS.md](docs/DECISIONS.md).

## Was Constellate ist

Ein evidenzgraduierter Wissensgraph für seltene Krankheiten: Krankheiten, Gene, Phänotype, Studien, Papers, Förderungen und Patientenorganisationen, jede Kante mit Quelle, Datum, Evidenzstufe, Konfidenz und Gegenevidenz. Die App führt eine Patientengruppen-Leitung von ihrer Diagnose zu einer mechanistisch verwandten Community, einem wiederverwendbaren Asset (Register, Natural-History-Studie) und einer belegten Action Card. Wo es keine belegte Spur gibt, zeigt sie die **Honest Gap** (was gesucht wurde, was fehlt, welche Frage als Nächstes zu testen ist), statt zu raten.

- Entstanden beim Hack-Nation 7th Global AI Hackathon (Vienna Hub), Challenge **C5 „AI Atlas for the World's Rare Diseases"** (Buffalo Initiative × OpenAI).
- Hero-Pfad: Krabbe (MONDO:0009499) → GALC / PSAP → MLD → ARSA → Gentherapie und Natural-History-Studie als Präzedenz → Action Card. Gegenbeispiel: Pelizaeus-Merzbacher (PLP1). Details: [docs/SCOPE.md](docs/SCOPE.md).
- Scope: 350 Kernkrankheiten (MONDO-Teilbäume lysosomal storage disease + leukodystrophy) plus 524 Nachbarn.

## Ordnerstruktur

| Ordner / Datei | Inhalt |
|---|---|
| `pipeline/` | Python (uv): `01_fetch` bis `09_metrics`, `validate.py`, `openai_config.py`, `prompts/`, `enrich/`, `enrich_extra/`, `tests/` |
| `data/curated/` | Handgepflegte Daten: `orgs.csv`, `hero_path.yaml`, `assets.csv` plus Entwürfe `*_draft.*` und Prüflisten `*_CHECK.md` |
| `data/` (Rest) | `MANIFEST.md` (Quellen mit URL, Datum, sha256); `raw/`, `cache/`, `enrich/`, `slice.json`, `graph_base.json` sind gitignored und werden von `make` neu erzeugt |
| `app/` | Next.js 15 (App Router, TypeScript, Tailwind 4), react-force-graph-2d; Daten statisch aus `app/public/data/` |
| `app/public/data/` | **Pipeline-Output und Datenvertrag**: `meta.json`, `index.json`, `core.json`, Shards je Krankheit, Gen, Phänotyp. Die App schreibt hier nie |
| `docs/` | Konzept, Status, Entscheidungen, Medizin-Hintergrund, Datenquellen, Sicherheit |
| `BUGS.md` | Bug-Liste, Format `[P1\|P2\|P3] Screen · Schritte · erwartet · gesehen`, erledigt = durchstreichen |

## Befehle (Repo-Root)

```bash
cp .env.example .env.local     # Keys eintragen, nie committen
make setup                     # uv sync + npm install
make fetch      # 01 Bulk-Downloads (HPO, MONDO, Orphanet), Cache in data/raw, Manifest
make slice      # 02 Kern (350) + Nachbarn (524), deterministisch
make build      # 03 Knoten, Kanten, Evidenz (Basisgraph)
make enrich     # 04 ClinicalTrials.gov, Europe PMC, NIH RePORTER, Open Targets, Reactome, ClinVar, mygene
make extract    # 05 OpenAI: Abstracts -> Claims (braucht OPENAI_API_KEY und OPENAI_MODEL_*)
make reconcile  # 06 OpenAI: Org-Namen -> MONDO-IDs (Fuzzy-Fallback ohne Key)
make analytics  # 07 Roll-up, IC, simGIC/Resnik, Gegenbeispiele, Louvain, Export nach app/public/data/
make validate   # prüft app/public/data/ gegen den Datenvertrag (muss grün sein)
make reproduce  # fetch -> ... -> analytics, alles aus den Rohquellen
make dev        # App auf http://localhost:3000
```

## Datenvertrag

Pipeline → `app/public/data/` → App. Format, Felder und Normalisierung: [app/README.md](app/README.md). Kanten haben `id: "e_<12 hex>"`, `evidence[]` (db, origin, record, url, level, date, confidence, snippet), `contradicting[]` (darf leer sein, fehlt nie), `confidence`, `level`, `independent_sources`. Evidenzstufen: `observed` · `curated` · `text_mined` · `inferred` (Modell in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)). Eine Änderung am Vertrag geht nur zusammen mit `pipeline/validate.py` und `app/lib/normalize.ts`.

## Harte Regeln

1. **Primärquelle für jede Zahl und jede medizinische Aussage** (PMID, OMIM, ORPHA, NCT, EMA/FDA), im Produkt wie in Videos und Docs. LLM-Gedächtnis ist keine Quelle. Geprüfter Stand: [docs/MEDICAL-BACKGROUND.md](docs/MEDICAL-BACKGROUND.md), die ⚠️-Marker dort sind offen.
2. **Lücken zeigen statt erfinden.** Was nicht belegbar ist, steht als `UNBELEGT` oder als Honest Gap im Produkt. Das ist ein Feature.
3. **OpenAI an 3 Stellen sichtbar:** Extract, Reconcile, Explain. Modell-IDs nur per Umgebungsvariable (`OPENAI_MODEL_*`), nie hartcodiert, vorher `client.models.list()` prüfen.
4. **Keys nie committen.** Nur `.env.local` (Root) und `app/.env.local`, beide gitignored. Keine Passwörter, API-Keys, privaten Mail-Adressen oder Telefonnummern, keine Server-Interna (IPs, Serverpfade, Tunnel-IDs).
5. **Commits:** Präfix `pipeline:` · `app:` · `data:` · `docs:`, ein Satz. Vor dem Push `git pull --rebase`. Nie `git push --force`. Nur eigene Dateien stagen, nie `git add .`.
6. **Offene Entscheidungen** stehen in [docs/DECISIONS.md](docs/DECISIONS.md); gebaut wird mit den dortigen umkehrbaren Defaults, nichts davon wird als final behauptet.
7. **Nur verifizierte Orgs ins Produkt.** `orgs_draft.csv` ist ein Entwurf; ins Produkt kommt nur, was geprüft und nach `orgs.csv` übernommen wurde. Dasselbe gilt für `hero_path_draft.yaml`.
8. Keine Blockquotes (`>`) in neuen Docs, Texte zum Weiterleiten als Klartext.

## Wo was steht

| Frage | Datei |
|---|---|
| Wie ist der Stand? | [docs/STATUS.md](docs/STATUS.md), Änderungen und offene Punkte: [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| Was ist offen, welche Defaults gelten? | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Cluster, Hero-Journey, Honest-Gap-Journey, Moonshot | [docs/SCOPE.md](docs/SCOPE.md) |
| Stack, Datenmodell, Evidenzstufen, OpenAI-Stellen | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Quellen, Endpunkte, Lizenzen | [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) |
| Medizin, geprüfte Fakten und Primärquellen | [docs/MEDICAL-BACKGROUND.md](docs/MEDICAL-BACKGROUND.md), [docs/GLOSSAR.md](docs/GLOSSAR.md) |
| Datenmanagement | [docs/DATA-MANAGEMENT.md](docs/DATA-MANAGEMENT.md) |
| Sicherheit | [docs/SECURITY.md](docs/SECURITY.md) |
| Datenvertrag und App-Aufbau | [app/README.md](app/README.md) |
| Datei-Herkunft der Rohdaten | [data/MANIFEST.md](data/MANIFEST.md) |

## Arbeitsstil in diesem Projekt

Deutsch, knapp und direkt. Bei Entscheidungen 2 bis 3 Optionen mit Vor- und Nachteilen und einer klaren Empfehlung. Zahlen immer aus Skript oder Datei, nie aus dem Gedächtnis. Große Dateien (`graph_base.json` 26 MB, `slice.json` 1,5 MB) nie ganz in den Kontext laden, nur per Skript auswerten. Nach einer Arbeitseinheit `docs/STATUS.md` nachziehen.
