# Änderungsprotokoll

## 10.10.2026 · Atlas-UI und Aufräumen

Stand: lokal auf `main`, gepusht nach `Reczec/constellate`.

### Aufräumen (Repo)
- Rollen-, Teamboard-, Orchestrator-, Prompt-, Briefing- und Mentoring-Dateien, `tools/board.py`, Projekt-Skill `/constellate`, `pitch/`, `videos/`, `memes/`, Review-Berichte und die Challenge-PDF entfernt.
- `CLAUDE.md`, `docs/STATUS.md`, README und Verweise bereinigt; Repo-Links zeigen auf `github.com/Reczec/constellate`.
- Namen im `LICENSE`, in der README und auf `/about` bleiben ohne Rollenbeschreibung.

### Pipeline (Windows)
- Alle Text-Datei-Zugriffe mit `encoding="utf-8"` (72 Stellen); `make` setzt `PYTHONUTF8=1`; neues Ziel `make test`.
- `test_openai_steps.py`: Extract-Test unabhängig von `data/slice.json`.

### Neue Oberfläche („Atlas“)
- Spec: `docs/superpowers/specs/2026-10-10-ui-redesign-atlas-design.md`; Plan: `docs/superpowers/plans/2026-10-10-ui-redesign-atlas.md`.
- Routen: `/` (Sternenhimmel + Suche), `/d/[id]` (Infospalte + Graph, `?edge=`, `?compare=`), `/g/[symbol]`, `/p/[id]` (Symptom), `/about`, `/api/explain`.
- Entfernt: `/impact`, `/intro`, `/share`, `/methods`, `/o/[slug]`, alte Komponenten, 10×- und Story-Assets, Persona-Linse, `three`.
- Komponenten: `components/{ui,shell,start,atlas,disease,gene,symptom}/`; Logik: `lib/{graph,sky,useAtlasParams,useDiseaseSummary,useRelated,gap}.ts`.
- Tests: `npm run test:unit` (11), `npm run e2e` (Playwright, 32; unter Windows nutzt die Config Chrome/Edge automatisch).
- Review-Befunde behoben: Honest-Gap-Ansicht für Krankheiten ohne Verbindungen; Zurück-Knopf schließt Seitenleiste/Overlay ohne tote History-Einträge.

### Offen (klein)
- Sternenhimmel zeichnet mit 60 fps alles neu (drosseln, Puffer wiederverwenden); im Reduced-Motion-Modus läuft ein Intervall dauerhaft.
- Handy-Kartenblatt (`AtlasLayout`) ohne Esc/Fokus-Verwaltung (`useDialog` nutzen).
- `Popover` kann auf 375 px rechts aus dem Bild ragen.
- Tour erscheint bei gesperrtem `localStorage` auf jeder Krankheitsseite wieder.
- Gen- und Symptomseite: Netzwerkfehler wird als „not in this dataset“ gezeigt, kein „Try again“.
- `docs/DATA-MANAGEMENT.md` verweist noch auf `/methods`; Build-Datum der Daten nirgends sichtbar (auf `/about` ergänzen).
- `orgHref` / `hrefFor("org")` in `lib/ids.ts` zeigen auf das entfernte `/o/`.
- Keine Redirects für alte Lesezeichen `/methods`, `/o/*`.
- Graph-Labels können über Nachbarknoten liegen.
- Vercel-Deploy nicht eingerichtet (bewusst übersprungen).

### Lokal starten
```bash
cd app && npm install && npm run dev      # http://localhost:3000
npm run typecheck && npm run lint && npm run test:unit
E2E_BASE_URL=http://localhost:3000 npx playwright test
make test && make validate                # Python-Tests, Datenvertrag
```
