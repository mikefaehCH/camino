# Camino Portugués 2027 – Reisebegleiter

Private, mobile-first Reise-Webseite für vier Freunde: Camino Portugués 11.–20. Juni 2027,
Porto · Valença · Variante Espiritual · Translatio · Santiago · A Coruña.
Live: https://mikefaehch.github.io/camino/

## Aufbau
| Datei | Zweck |
|---|---|
| `index.html` | Markup und Texte |
| `css/site.css` | Gestaltung |
| `js/app.js` | Funktionen (Tagesansicht, Karte, GPX, Höhenprofile, Wetter, Offline, Reisebuch) |
| `data/trip.js` | Reisedaten: Etappen, Hotels, Umwege, Bilder |
| `routes/` | GPX pro Etappe (Komoot) |
| `images/` | Bilder in 800/1600 px (WebP) |
| `vendor/` | Leaflet und Schriften lokal (Lizenzen im Ordner) |
| `sw.js`, `manifest.webmanifest` | Offline und «Zum Home-Bildschirm» |
| `tests/check.mjs` | Prüfskript: `npm run check` (ohne Installation, braucht Node + Playwright) |

Details für die Weiterentwicklung: [`CLAUDE.md`](CLAUDE.md).

## Hinweise
- Statisch auf GitHub Pages, kein Build. Nach Änderungen `CACHE`-Version in `sw.js` hochzählen.
- Kein Zugangsschutz: Die Seite ist mit Link öffentlich. Keine Preise, Buchungsnummern oder Zugangsdaten eintragen.
- Bilder: Unsplash oder Wikimedia Commons mit Autor und Lizenz; ungeklärte Bilder bleiben ausgeblendet.
- Karte © OpenStreetMap-Mitwirkende, Wetter: Open-Meteo, Klimadaten: AEMET / tutiempo.net.
