# Camino Portugués 2027 – Reisebegleiter

Private, mobile-first Reise-App für vier Freunde (11.–20. Juni 2027, Porto · Valença · Variante Espiritual · Santiago · A Coruña).
Live: https://mikefaehch.github.io/camino/

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Ganze Seite: Inhalte, Design «Atlas», Funktionen, Bildkonfiguration |
| `sw.js` | Service Worker (Offline). Bei Änderungen `CACHE`-Version hochzählen |
| `manifest.webmanifest`, `icon*` | PWA / «Zum Home-Bildschirm» |
| `images/` | Lokale Bilder (WebP, 800 px und 1600 px) |

Reisedaten (Tage, Hotels, Telefon, Koordinaten) stehen im JavaScript-Array `DAYS` in `index.html`.

## Bilder einsetzen

Alle Bildplätze sind zentral im JSON-Block `<script type="application/json" id="image-map">` konfiguriert:
pro Kapitel (`00-porto` … `09-a-coruna`) ein `hero` und eine `gallery` – insgesamt 53 Plätze aus `image_manifest_original.csv`.

1. Bild als WebP ablegen, z. B. `images/armenteira/combarro-800.webp` und `-1600.webp`.
2. Im passenden Platz `src`, `srcset`, `alt` und `credit` eintragen (Lizenzhinweis Pflicht bei CC BY-SA).
3. Leere `src` = Platzhalter im Atlas-Stil, ohne Layout-Sprung.

Aktuell eingesetzt: 4 Porto-Beispielbilder (Unsplash, Status `EXAMPLE_ONLY_PORTO`). Sie ersetzen nicht die finale Bildauswahl.

## Getestet (Headless Chromium, 11.10.2026)

- 390 px und 1280 px, hell und dunkel, ohne JavaScript-Fehler, kein horizontales Scrollen
- Heute-Modus mit simuliertem Datum (11.06., 15.06.) inkl. Titelbild des Tages
- Etappen aufklappen, Galerien, Porto-Bilder (lazy loading, Hero mit fetchpriority)
- Navigation (5 Punkte, auf dem Handy unten), Touch-Ziele ≥ 44 px (ausser Karten-Attribution)
- Offline: Seite, Heute-Modus, Etappen und Porto-Bilder laden nach erstem Besuch ohne Netz

## Bekannte Grenzen

- Karte, Wetter und Schriften laden von externen Diensten (OpenStreetMap, Open-Meteo, Google Fonts) und sind nur online bzw. nach erstem Laden verfügbar.
- 4 Hotelpins sind ungefähr (im Popup markiert).
- **Kein Zugangsschutz:** GitHub Pages ist öffentlich. Vor sensiblen Inhalten (Buchungsnummern, Gruppenfotos) Schutz auf Hosting-Ebene einrichten, z. B. Cloudflare Pages + Cloudflare Access.
