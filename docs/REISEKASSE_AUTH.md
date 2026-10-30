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

## Wichtige Einschränkung
Die bestehende Reisekasse speichert Ausgaben **lokal im Browser (localStorage)**. Die Login-Schranke schützt die normale UI, **aber nicht die lokal gespeicherten Daten auf einem bereits benutzten Gerät**. Es gibt weiterhin keine Synchronisierung zwischen Geräten, keine serverseitig verschlüsselte Speicherung und keine echte serverseitige Zugriffskontrolle auf diese historischen lokalen Einträge. Für eine echte gemeinsame private Reisekasse ist die Migration auf eine Supabase-Tabelle mit RLS pro Projektmitglied nötig. Vorher keine sensiblen Zahlungsdaten erfassen.

## Freigabe-Checkliste
1. E-Mail-Auth und mindestens einen OAuth-Provider aktivieren, Redirect-URLs konfigurieren.
2. Besitzer mit E-Mail anmelden; `auth.users` ID prüfen und Mitgliedschaft administrativ eintragen.
3. Prüfen: abgemeldet = keine Reisekasse; angemeldet ohne Mitgliedschaft = gesperrt; Mitglied = sichtbar.
4. Auf dem iPhone testen; vorhandene lokale Ausgaben bleiben erhalten.
5. Erst danach PR mergen und veröffentlichen.
