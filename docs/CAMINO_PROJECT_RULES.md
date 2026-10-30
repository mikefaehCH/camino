# Camino 2027 – bestehende technische Projektregeln

Private Reise-Webseite (Reisejournal + Tagesbegleiter) für Ante, Kevin, Mike und Luis,
Camino Portugués 11.–20. Juni 2027. Live: https://mikefaehch.github.io/camino/ (GitHub Pages, Pfad `/camino/`).
Statisch, ohne Build, ohne npm-Abhängigkeiten. Sprache der Seite: Deutsch, Schweizer Schreibweise (kein ß).

## Dateien
| Datei | Inhalt | Wann lesen |
|---|---|---|
| `data/trip.js` | **Einzige Datenquelle**: `DAYS`, `JLINES`, `PLAN_FIX`, `DETOURS`, `GPX_FILES`, `GPX_EXTRA`, `IMAGE_DATA` | Daten ändern |
| `index.html` | Markup: Etappentexte (`<!-- TAG n -->`, `.s-lead`, `.s-prose`, `.ibox`), Unterkunftskarten, Restaurants (`#restaurants .rest-city`), Compostela, Klima | Texte ändern |
| `css/site.css` | Gestaltung «Camino Journal». Spätere Regeln überschreiben frühere | Design |
| `js/app.js` | Funktionen, in Abschnitten `/* ===== … ===== */` | Logik |
| `routes/*.gpx` | Komoot-Exporte pro Etappe (6a/6b getrennt) | GPX |
| `images/<kapitel>/*-800.webp, -1600.webp` | Bilder, eingebunden über `IMAGE_DATA` | Bilder |
| `sw.js` | Service Worker (Offline) | Offline |
| `tests/check.mjs` | Prüfskript, `tests/snapshot.txt` = Text-Schnappschuss | nach jeder Änderung |

Nur die Datei lesen, die man braucht. `index.html` nicht komplett laden, wenn nur Daten betroffen sind.

## Datenmodell (`DAYS`)
- `d` Datum, `stage` 1–7 Etappen, 8 = Santiago → A Coruña; Reisetage ohne `stage` (11.06., 20.06.).
- `km`, `up`, `dn`, `kt` (Gehzeit Min.) = **Komoot-Werte** der Tour. Summe = Gesamtdistanz (`TOTAL_KM`, 143 km).
- `hotel`, `addr`, `tel`, `ci`/`co`, `bf` (Frühstück), `lat`/`lon` = Hotel (Koordinaten aus Google Places geprüft).
- `boat:true` (Etappe 6): Boot ist keine Gehstrecke; `km` = 6a + 6b zu Fuss.
- Distanz/Höhenmeter **nur in `DAYS` ändern**. Etappenköpfe, Reisekarten, Tagesansicht, Teilen-Text, Reisebuch lesen daraus.
  Ausnahme: die statischen Kopfwerte in `index.html` (`.skm`/`.sele`) und `#intro .facts` sind Fallback ohne JS → mitpflegen.

## Regeln
- **Keine Daten erfinden**: Distanzen, Höhenmeter, Adressen, Öffnungszeiten, Michelin-Angaben nur mit Quelle.
- Bestätigte Buchungen, Namen, Daten, Hotels nicht eigenmächtig ändern.
- **Keine Preise und kein Zahlungsstatus** (Hotels, Flüge) und keine Buchungsnummern, PINs, Kartendaten auf der Seite oder im Repo.
  Private Details stehen im Claude-Projekt-Dokument `claude/website-geschuetzte-inhalte.md`, nicht hier.
- GPX: nur echte Komoot-Tracks. Boot = gestrichelte, als «schematisch» beschriftete Linie. Keine Luftlinien als Wanderweg.
  Bei jedem Update die Komoot-Touren auf Änderungen prüfen (Links mit `share_token` in `index.html`, `.mbtn.k`).
- Bilder: nur mit klarer Lizenz. Wikimedia ohne Autor/Lizenz → `status:"WIKIMEDIA_ATTRIBUTION_PENDING"` (wird ausgeblendet).
  Credit-Format: `Foto: Name`, `license`, `licenseUrl`, `edited:true`.
- Design bewahren: Farben Ivory/Forest/Sage/Charcoal, Fraunces + DM Sans (lokal), Lucide-SVG-Icons (`ICON('name')`), **keine Emojis**.
- Externe Dienste: Open-Meteo (Wetter, ohne Schlüssel, ein Abruf pro Laden), OpenStreetMap-Kacheln, Links zu Google Maps/Komoot.
  Keine neuen Dienste, Frameworks oder npm-Pakete ohne Freigabe.
- Mobile first (iPhone). Touch-Ziele ≥ 44 px, kein horizontaler Überlauf.

## Wie `js/app.js` aufgebaut ist
Gewachsen in Versionen (v3 … v27). Spätere Abschnitte **erweitern** frühere, statt sie zu ersetzen:
- `renderToday(i)` wird mehrfach umhüllt (`_renderToday`, `_renderToday2`, `3`, `24`). Neue Teile der Tagesansicht
  als weitere Hülle am Ende ergänzen oder die passende bestehende Hülle anpassen – nicht doppelt bauen.
- `openStage(n)` wird in v18 auf die zusammengeführte Ansicht (Reise-Karte + Etappe) umgeleitet.
- GPX: `loadGPX()` (v9) lädt `GPX_FILES`/`GPX_EXTRA` erst nach dem Seitenaufbau (einmal, parallel), zeichnet Karte und Höhenprofil;
  `window.AFTER_GPX` = Rückrufe danach (v26). Wer GPX braucht: `loadGPX().then(…)`.
- Wetter: `loadWX()` cached das Promise (nur ein Abruf); `wxFor(place,date)` liefert nur innerhalb des 16-Tage-Horizonts eine Prognose.
- Anreise/Heimreise (v25) nimmt den versteckten Abschnitt `#anreise` und hängt ihn an die Reise-Karten 11.06./20.06.
- v28: `IN_TRIP` → `body.in-trip` (kleines Startbild, «Heute» oben, Karte auf heutige Etappe). Tageskarte: 4 Hauptknöpfe,
  Rest unter «Mehr». Hotel-Adressen in den Etappen kommen aus `DAYS`. Knopf «Fotos offline speichern» (Cache `camino-fotos`).

## Offline (`sw.js`)
- Seite, CSS, JS, Daten, GPX, Schriften, wichtigste Bilder: vorab gespeichert (`CORE`). Rest beim ersten Abruf.
- Seite: Netz zuerst (3 s Timeout), dann Cache. Gespeichert werden nur erfolgreiche Antworten. Kartenkacheln und Wetter:
  nur was schon geladen wurde (kein Massen-Download, OSM-Regeln). Fotos: nur nach Knopf «Fotos offline speichern»;
  fehlt offline die 1600er-Version, liefert der SW die 800er.
- **Bei jeder Änderung `CACHE`-Version in `sw.js` hochzählen** (`camino-vNN`). Neue Dateien in `CORE` eintragen.

## Ablauf pro Änderung
1. Verstehen: nur betroffene Datei/Abschnitt lesen.
2. Kleine Änderung, keine Umbauten nebenbei.
3. `npm run check` (= `node tests/check.mjs`) – muss «Alles in Ordnung» melden. Ändert sich Text gewollt: `npm run check:update`.
4. Bei Layout-Änderungen Screenshot bei 390 px ansehen.
5. `sw.js` Version hochzählen, committen (Identität `mikefaehCH <mikefaehCH@users.noreply.github.com>`), pushen.
   GitHub Pages braucht bis ~10 Min; Nutzer evtl. Tab neu öffnen.

`tests/check.mjs` prüft: 7 Etappen in Datumsfolge, Summe = Anzeige, Hoteldaten vollständig, GPX gültig ohne Sprünge
und passend zu `DAYS`, keine Script-Fehler, kein Überlauf bei 375/390/430/768/1440 px, Sprunglinks, Bilder,
Tagesansicht vor/während/nach der Reise, Offline-Neuladen inkl. gespeicherter Fotos, doppelte IDs, Touch-Ziele ≥ 44 px,
Hotelnamen der Etappen = `DAYS`, Text-Schnappschuss. Braucht Node + Playwright.

## Morgennachricht
Geplante Aufgabe «Camino: Tagesablauf am Morgen» (11.–20.06.2027, 06:50) liest die Tagesdaten aus
`https://mikefaehch.github.io/camino/data/trip.js`; die Daten im Prompt sind nur Fallback.
Ändern sich Hotels oder Etappen grundlegend, Prompt-Fallback ebenfalls anpassen.

## Typische Fehlerquellen
- Werte nur im HTML geändert, nicht in `DAYS` (oder umgekehrt bei den statischen Fallbacks).
- `sw.js`-Version vergessen → Nutzer sehen alte Seite.
- Zusätzlicher `renderToday`-Wrapper, der Buttons doppelt einfügt.
- Lange Ortsnamen sprengen Zeilen auf 375 px (Restaurants, Etappenköpfe).
- iOS erkennt Ortsnamen als Adressen → `format-detection` nicht entfernen.
