# Camino Portugués 2027 – Reisebegleiter

Private, mobile-first Reise-App für vier Freunde (11.–20. Juni 2027, Porto · Valença · Variante Espiritual · Santiago · A Coruña).
Live: https://mikefaehch.github.io/camino/

## Aufbau

| Datei | Zweck |
|---|---|
| `index.html` | Ganze Seite: Inhalte, Design «Camino Journal» (v12), Funktionen, Bildkonfiguration |
| `sw.js` | Service Worker (Offline). Bei Änderungen `CACHE`-Version hochzählen |
| `manifest.webmanifest`, `icon*` | PWA / «Zum Home-Bildschirm» |
| `images/` | Lokale Bilder (WebP, 800 px und 1600 px) |
| `vendor/` | Schriften (Fraunces, DM Sans, OFL) und Leaflet 1.9.4 – lokal statt von Google/CDN |

Reisedaten (Tage, Hotels, Telefon, Koordinaten) stehen im JavaScript-Array `DAYS` in `index.html`.

## Bilder einsetzen

Alle Bildplätze sind zentral im JSON-Block `<script type="application/json" id="image-map">` konfiguriert:
pro Kapitel (`00-porto` … `09-a-coruna`) ein `hero` und eine `gallery` – insgesamt 53 Plätze aus `image_manifest_original.csv`.

1. Bild als WebP ablegen, z. B. `images/armenteira/combarro-800.webp` und `-1600.webp`.
2. Im passenden Platz `src`, `srcset`, `alt` und `credit` eintragen (Lizenzhinweis Pflicht bei CC BY-SA).
3. Leere `src` = Platzhalter im Atlas-Stil, ohne Layout-Sprung.

Aktuell eingesetzt: 35 Bilder (Unsplash und Wikimedia Commons). Ort jedes Unsplash-Bilds auf der Unsplash-Seite geprüft. Wikimedia-Bilder haben Status `WIKIMEDIA_ATTRIBUTION_PENDING`: Urheber und Lizenz noch von der Commons-Seite (Link im Bildnachweis) ergänzen. Galerien zeigen nur vorhandene Bilder; Platzhalter erscheinen nur, solange ein Kapitel noch gar kein Bild hat. `pos` setzt den Bildausschnitt (CSS object-position).

## Unterwegs-Funktionen (v7)

- **Wo bin ich?** (Karte und Heute-Karte): GPS-Standort auf der Karte, Luftlinie zum Hotel des gewählten Tags, Link zur Fussnavigation in Google Maps.
- **Start-Tipp** pro Etappe: Sonnenauf-/-untergang (offline berechnet), Gehzeit (km/4,3 + 1,8 h pro 1000 Hm, plus Pausen) und nur noch Gehzeit, Hitzehinweis ab 28° und Sonderfälle (keine tägliche Abmarschzeit). Sonderfälle Tag 1 (Transfer) und Bootstag in `PLAN_FIX`.
- **Abstecher** pro Tag in `DETOURS` (Name, Aufwand, Text, Google-Maps-Suche).
- **Abends (ab 18 Uhr)** zeigt die Heute-Ansicht den nächsten Tag, mit «Am Morgen»-Hinweisen (Koffer bis 8:00, Frühstück, Check-out, Ankunft vor Check-in).
- **Bootstag**: Betreiber, Preise (Pilgerforum), Gezeitenlink, Plan B.
- **GPX**: Dateien in `routes/` ablegen und in `GPX_FILES` eintragen (z. B. `{1:'routes/etappe-1.gpx'}`) – zeichnet die echte Route, ersetzt das geschätzte Höhenprofil und «Wo bin ich?» rechnet die Kilometer entlang des Wegs.
- **Teilen**: Tagesinfos als Text über das Teilen-Menü des Handys bzw. WhatsApp.
- **Splitwise**: Einladungslink in `SPLITWISE_URL` (oben im Script-Teil «v7: Konfiguration») eintragen.
- **Compostela & Pilgermesse**: eigener Abschnitt unter «Infos» (Stand Oktober 2026, vor der Reise prüfen).
- **Reisebuch**: Knopf unter «Infos» erzeugt ein A5-Heft (Drucken oder «Als PDF sichern»).

## Getestet (Headless Chromium, 11.10.2026)

- 390 px und 1280 px, hell und dunkel, ohne JavaScript-Fehler, kein horizontales Scrollen
- Heute-Modus mit simuliertem Datum (11.06., 15.06.) inkl. Titelbild des Tages
- Etappen aufklappen, Galerien, Porto-Bilder (lazy loading, Hero mit fetchpriority)
- Navigation (5 Punkte, auf dem Handy unten), Touch-Ziele ≥ 44 px (ausser Karten-Attribution)
- Offline: Seite, Heute-Modus, Etappen und Porto-Bilder laden nach erstem Besuch ohne Netz

## Bekannte Grenzen

- Kartenkacheln und Wetter laden von OpenStreetMap bzw. Open-Meteo und sind nur online bzw. nach erstem Laden verfügbar. Schriften und Kartenbibliothek liegen lokal.
- 4 Hotelpins sind ungefähr (im Popup markiert).
- **Kein Zugangsschutz:** GitHub Pages ist öffentlich. Vor sensiblen Inhalten (Buchungsnummern, Gruppenfotos) Schutz auf Hosting-Ebene einrichten, z. B. Cloudflare Pages + Cloudflare Access.

## Design «Camino Journal» (v12)

- Farben: Ivory #F7F5EF, Charcoal #252923, Forest #344D41, Sage #9CA99A, Sandstone #C5A789, Stone #ECE9E1 (Variablen ganz unten im Style-Block, Dunkelmodus inklusive).
- Schriften: Fraunces (Titel), DM Sans (Text), lokal in `vendor/fonts/`.
- Aufbau: Hero → Einführung mit 4 Kennzahlen → «Zehn Tage, ein Weg» (Bildkarten aus `DAYS` + `IMAGE_MAP`) → Karte → Heute → Etappen im Detail → «Reise organisieren» → Buchungen, Anreise, Restaurants, Infos → Crew.
- Während der Reise (oder abends davor) rückt «Heute» direkt unter die Navigation.
- Etappendetail-Reihenfolge per JS: Bild, Einführung, Fakten, Route & Höhenprofil, Sehenswertes, Galerie, Essen, Unterkunft, Praktisch.
- Bilder mit Status `WIKIMEDIA_ATTRIBUTION_PENDING` werden nicht angezeigt, bis Urheber und Lizenz eingetragen sind (Status dann auf `WIKIMEDIA_OK` setzen und `credit` ergänzen).

## Feinschliff (v13)

- Gesamtdistanz ~140 km (vorläufiger Planungswert); Etappendistanzen unverändert.
- Kennzahl «6 + Boot» entfernt, Simon entfernt (Crew, Footer, Tipps).
- Keine Standard-Emojis mehr; funktionale Symbole als Lucide-Icons (Sprite `#i-…`, Funktion `ICON(name)`).
- Bildquellen als Fussnote (10,5 px, gedämpft, Unterstreichung nur bei Hover/Fokus).
- Redundanzen entfernt: tägliche Abmarschzeit, Check-out- und Gepäckzeilen im Morgenblock, Höhen-/Zeit-Pills, Tags, doppelte Restaurantbox, Fülltexte.

## Optimierung V3 (v14)

- Etappen: kurze Einleitung (2–3 Sätze), Höhenmeter nur im Etappenkopf, Highlights aus `DETOURS`, ausführlicher Text unter «Mehr zur Etappe». Fehler korrigiert (Santa Marta = Capela de Santa Marta, 1617; nicht Ribarteme).
- Fitness-Abschnitt entfernt; «Vorbereitung» ohne unbelegte Preise und pauschale Medikamente.
- Wetter mit AEMET-Normwerten (Santiago, 1981–2010). Compostela: Anrechnung der Bootsstrecke vor der Reise beim Pilgerbüro klären.
- Planen: «Flüge & Unterkünfte bestätigt», Notfall oben, Aufgaben nach «Später / Vor der Abreise / Optional», Kosten gebucht/offen/geschätzt mit nachvollziehbarer Summe.
- Restaurants: eine Quelle (Abschnitt «Wo ihr esst»); Reservationsstatus per `data-status="geplant|bestätigt"` am `.ri`-Element.
