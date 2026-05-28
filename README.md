# Haushalt – gemeinsame Haushaltsverwaltung (PWA)

Eine installierbare Progressive Web App für einen 2‑Personen‑Haushalt:

- 🛒 **Einkaufszettel** – gemeinsam, sortiert nach Bereich im Laden (Kühlregal, Obst & Gemüse …)
- 💶 **Gemeinschaftskonto & Budget** – Einzahlungen je Person, Fixkosten mit Rhythmus &
  nächster Abbuchung, Rücklagen‑Töpfe, Monatsbilanz, Abbuchungskalender
- ✅ **Aufgaben & Putzplan** – wiederkehrende Aufgaben, fest zugewiesen an Person A, B oder beide
- 🏠 **Dashboard** – Überblick über Bilanz, fällige Aufgaben und anstehende Abbuchungen

Zugang per gemeinsamem **PIN** + Namenswahl. Dunkles/helles Design, mobil‑optimiert,
zum Startbildschirm hinzufügbar.

## Architektur

- **Frontend:** React + TypeScript + Vite + Tailwind, PWA via `vite-plugin-pwa`,
  Datenhaltung mit TanStack Query (optimistische Updates + Polling)
- **Backend:** Google Apps Script Web‑App auf einem Google Sheet (kostenlos, Daten in der
  Tabelle einsehbar). Ohne Backend läuft die App im **Demo‑Modus** (Daten nur im Browser).
- **Hosting:** GitHub Pages (statisch, HTTPS) via GitHub Actions

## Lokal starten

```bash
npm install
npm run dev        # http://localhost:5180  (Demo-Modus, beliebige PIN)
npm run build      # Production-Build nach dist/
npm run preview    # Production-Build lokal testen
```

Im Demo‑Modus könnt ihr in den **Einstellungen → Daten → Beispieldaten** einen kompletten
Beispiel‑Haushalt laden.

## Schritt 1 – Google Sheet + Apps Script (für die gemeinsame Nutzung)

1. Neues **Google Sheet** anlegen → Menü **Erweiterungen → Apps Script**.
2. Inhalt von [`apps-script/Code.gs`](apps-script/Code.gs) komplett einfügen.
3. Oben `HOUSEHOLD_PIN` auf euren gewünschten PIN ändern, speichern.
4. **Bereitstellen → Neue Bereitstellung → Web‑App**
   - *Ausführen als:* **Ich**
   - *Zugriff:* **Jede:r (auch anonym)**
5. **Web‑App‑URL** kopieren (Form `https://script.google.com/macros/s/…/exec`).

Die benötigten Tabs (`Members`, `Shopping`, `FixedCosts`, …) werden beim ersten Aufruf
automatisch angelegt.

> Hinweis zur Sicherheit: Das Frontend ist öffentlich, geschützt wird der Zugriff durch die
> serverseitige PIN‑Prüfung. Für einen privaten Haushalt ausreichend – wählt einen ausreichend
> langen PIN.

## Schritt 2 – Auf GitHub Pages veröffentlichen

Quellcode liegt auf `main`; veröffentlicht wird der gebaute Stand auf dem `gh-pages`-Branch.

Für die **gemeinsame Nutzung** zuerst die Web‑App‑URL aus Schritt 1 hinterlegen:

```bash
cp .env.example .env
# in .env:  VITE_API_URL=<deine Apps-Script-Web-App-URL>
```

Dann veröffentlichen:

```bash
npm run deploy        # baut die App und pusht dist/ nach gh-pages
```

Danach ist die App unter `https://<dein-user>.github.io/<repo-name>/` erreichbar
(GitHub Pages-Quelle: `gh-pages`-Branch). Ohne `.env` läuft der veröffentlichte Stand im
**Demo‑Modus**.

> `npm run deploy` leitet Repo‑Name (Basis‑Pfad) automatisch aus dem git‑Remote ab und legt
> `404.html` (Deep‑Link‑Fallback) sowie `.nojekyll` an.

Auf dem Handy: Seite öffnen → Browser‑Menü → **Zum Startbildschirm hinzufügen**.

### Optional: Auto‑Deploy via GitHub Actions

Statt `npm run deploy` könnt ihr Pushes auf `main` automatisch deployen. Dazu eine Datei
`.github/workflows/deploy.yml` über die GitHub‑Weboberfläche anlegen (Actions‑Workflows
brauchen den `workflow`‑Token‑Scope), Pages‑Quelle auf **GitHub Actions** stellen und die
URL als Repo‑Secret `VITE_API_URL` hinterlegen. Eine fertige Workflow‑Vorlage liegt der
Projekt‑Historie bei bzw. kann auf Anfrage erzeugt werden.

## Projektstruktur

```
src/
  lib/         Typen, Backend (Demo + Apps Script), Auth, Budget-/Datums-Logik, State
  components/  UI-Bausteine, Layout, Navigation, Sheets
  features/    auth, dashboard, shopping, budget, tasks, settings
apps-script/   Code.gs (Backend zum Einfügen ins Apps Script)
.github/workflows/deploy.yml
```
