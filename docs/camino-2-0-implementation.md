# Camino 2.0 – Umsetzungskonzept (inkrementell)

Status: Architektur- und UX-Leitplanken, **keine** implementierte Neugestaltung.

## Produktentscheidung
Camino 2.0 ist zuerst ein inspirierendes Reisemagazin und unterwegs ein schneller Reisebegleiter. Die Reisekasse, Gruppenabstimmungen, Login und Push sind optional und dürfen die Navigation nicht dominieren.

## Informationsarchitektur
1. **Entdecken** – Titelgeschichte, Reisebogen Porto → Santiago → A Coruña, Menschen, Atmosphäre, Fotostrecken.
2. **Etappen** – sieben nummerierte Kapitel; jeweils Story, Distanz, Höhenprofil, Karte, GPX, Abstecher, praktische Hinweise.
3. **Unterwegs / Heute** – datumsgesteuerter Tagesbegleiter mit Start/Ziel, nächstem Hotel, Offline-Status und wichtigen Aktionen.
4. **Orte & Genuss** – kuratierte Orte, Restaurants und lohnende Umwege, mit stabilen IDs aus `data/trip.js` oder bestehenden redaktionellen Inhalten.
5. **Reiseinfos** – Anreise, Übernachtungen, Boot, Compostela, Packen, Kontakte, Quellen.

## Mobile UX
- Vor der Reise: Magazin-Startseite mit emotionalem Hero und direktem Einstieg in Etappen.
- Während der Reise: `Heute` als prominenter Schnellzugriff, aber nicht als alleiniger Startbildschirm.
- Offline: bestehende GPX, Reiseinfos und explizit gespeicherte Fotos erhalten; fehlende Netzfunktionen klar kennzeichnen.
- Keine zusätzliche Anmeldehürde für reine Reiseinformationen.
- Farben, Schrift, Bildsprache und vorhandenes App-Icon zunächst bewahren; Designänderungen anhand echter Screenshots testen.

## Technische Grenzen
- Kein Framework-Wechsel, kein Monorepo und keine Migration der Sommer2027-Datenbank.
- `data/trip.js` bleibt die Quelle für Reisedaten; keine parallele kanonische DB.
- Bestehende `openStage`- und `renderToday`-Logik nicht ohne Regressionstests ersetzen.
- Keine privaten Buchungsnummern, Zahlungsdaten oder Tokens im öffentlichen Repo.
- Service-Worker-Caches nur unter eigenem Namenspräfix verwalten.
- Änderungen in kleinen Commits; `npm run check` und Cache-Regression müssen grün sein, bevor nach `main` gemergt wird.

## Umsetzung in Lieferpaketen
1. **Stabilität:** Cache-Isolation, CI und bestehende E2E-Tests stabilisieren.
2. **Navigation:** bestehende Sektionen inventarisieren, eindeutige primäre Navigation definieren, mobile Usability prüfen.
3. **Magazin:** Hero, Etappen-Einstiege und Bild-/Text-Hierarchie redaktionell verbessern, ohne Reiseinformationen zu verändern.
4. **Unterwegs:** Tagesansicht für schlechten Empfang optimieren, Offline-Status sichtbar machen.
5. **Abnahme:** 375/390/430 px und Desktop, iPhone/Android real, Offline-Szenarien, Links, GPX, Barrierefreiheit.

## Bewusste Nicht-Ziele 2027
Multi-Tenant-Supabase, automatische Google-Photos-Synchronisation, Web-Push, Reisekasse, Reisegenerator und vollständiger TypeScript-Umbau.

## Offene Risiken
- GitHub Pages teilen sich einen Origin; private Authentifizierung braucht gesonderte Sicherheitsbewertung.
- Service-Worker-Offline-Tests müssen auf tatsächlichen Geräten bestätigt werden.
- Ein technischer CI-Erfolg ersetzt keine visuelle Abnahme.
