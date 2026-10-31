# Camino Auth: verbindlicher Rollout-Stand

Backend: `qoensghjemruqafrbmjd` (eu-central-1), siehe SHARED_PLATFORM.md.
Das separate Sommer-2027-Projekt wird nicht verändert.

- PR #28 lädt Auth-Oberfläche und Adapter. Auf main ist dieser Stand noch nicht veröffentlicht.
- Login und Projektmitgliedschaft sind getrennt. Ausschliesslich administrative Freischaltung berechtigt zum Zugriff.
- Gemeinsame Reisekasse: `public.camino_ledger_entries`, serverseitige RLS.
- OAuth: Google, Apple und Microsoft müssen mit eigenen Client-IDs/Secrets im Provider und in Supabase eingerichtet werden. Microsoft fordert den Scope `email` an.
- Callback bei den Anbietern: `https://qoensghjemruqafrbmjd.supabase.co/auth/v1/callback`.
- Camino-Rückleitung in Supabase erlauben: `https://mikefaehch.github.io/camino/`. Bestehende Site URL anderer Projekte nicht überschreiben.
- E-Mail: Versand und Vorlage prüfen; Code-Eingabe ermöglicht Login im selben iPhone-PWA-Fenster.
- Keine Zugangsdaten im Repository. Keine Benutzer oder E-Mail-Adressen erfinden.
- Lokale Ausgaben nur nach ausdrücklicher Bestätigung übernehmen. Bei Abbruch oder Uploadfehler bleibt die lokale Sicherung erhalten; bestehende Servereinträge werden nicht überschrieben.
- Keine automatische Startbuchung: Die leere gemeinsame Reisekasse bleibt leer, bis ein Mitglied Einträge erfasst oder importiert.

## Noch vor Veröffentlichung nachweisen
1. Berechtigten Benutzer anmelden und administrativ als Camino-Mitglied freischalten.
2. Abgemeldet und angemeldet ohne Mitgliedschaft: kein Zugriff; Mitglied: Zugriff.
3. Alle vier Anmeldewege auf Desktop und iPhone-PWA prüfen, einschliesslich Rückleitung und Abmeldung/Kontowechsel.
4. Zwei Geräte: Erfassung, Bearbeitung, Rückzahlung und Import prüfen.
5. Layout bei 390 px und vollständige Website-Prüfung ausführen.
6. Erst nach erfüllten Voraussetzungen und Projektfreigabe veröffentlichen.
