# Camino Reisekasse: Login und Freischaltung

## Status
Die private Ansicht und die neue Salden-Darstellung liegen im PR. **Nicht deployen, bevor Auth und Mitgliedschaft eingerichtet und auf iPhone getestet sind.** Aktuell gibt es im gemeinsamen Supabase-Projekt noch keine Auth-Benutzer und keine Camino-Mitgliedschaften.

## Anmeldewege
- **E-Mail:** Supabase Auth `signInWithOtp` (Magic Link oder E-Mail-Code, abhängig von E-Mail-Vorlage). Redirect `https://mikefaehch.github.io/camino/`.
- **Google:** Provider `google`.
- **Apple:** Provider `apple`.
- **Microsoft:** Provider `azure`; Azure App Registration muss die Redirect-URI für Supabase enthalten.
- OAuth-Provider müssen im Supabase Dashboard mit **eigenen OAuth-Client-IDs und Secrets** aktiviert werden. Diese Secrets dürfen niemals in GitHub oder Frontend-Code.
- Im Supabase Dashboard unter Authentication → URL Configuration die Site URL und Redirect Allowlist für `https://mikefaehch.github.io/camino/` setzen.
- Die Mitgliedschaft ist ein separater Schritt: `public.project_members` mit Projekt-ID `45343dda-fa24-4839-ac16-6b111da4ee28`. Ein Login alleine gibt **keinen** Zugriff.

## Gemeinsame Datenbank

Die Reisekasse verwendet `public.camino_ledger_entries` mit Row Level Security. Nur freigeschaltete Camino-Mitglieder können Einträge lesen und bearbeiten. Alte lokale Buchungen werden beim ersten berechtigten Zugriff einmalig übertragen, ohne bereits vorhandene Servereinträge zu überschreiben. Vor erfolgreichem Upload bleiben lokale Daten erhalten. Nach dem Upload werden sie aus localStorage entfernt. Es gibt noch keine Konfliktauflösung für gleichzeitige Bearbeitungen desselben Eintrags.

## Freigabe-Checkliste
1. E-Mail-Auth und mindestens einen OAuth-Provider aktivieren, Redirect-URLs konfigurieren.
2. Besitzer mit E-Mail anmelden; `auth.users` ID prüfen und Mitgliedschaft administrativ eintragen.
3. Prüfen: abgemeldet = keine Reisekasse; angemeldet ohne Mitgliedschaft = gesperrt; Mitglied = sichtbar.
4. Auf dem iPhone testen; vorhandene lokale Ausgaben bleiben erhalten.
5. Erst danach PR mergen und veröffentlichen.
