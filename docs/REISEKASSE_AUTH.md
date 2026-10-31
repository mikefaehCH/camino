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

## Nachweis und Grenzen (31.10.2026)

- SQL-Referenz: [camino-ledger-reference.sql](camino-ledger-reference.sql), direkt gegen
  den Live-Katalog geprüft, keine Migration und keine automatische Ausführung.
- `tests/auth-ui.mjs` prüft mit Mocks: abgemeldet, kein Mitglied, entzogene Mitgliedschaft,
  abgelaufene Session sowie frischer Zustand nach Wiederanmeldung und Kontowechsel.
- `tests/ledger-delete.mjs` klickt den echten Handler: Ausgabe/Rückzahlung, Abbruch,
  Fehler und Filter auf Projekt und Eintrag. Keine produktiven Finanzdaten.
- Ein UI-Mock beweist keine Live-RLS. Vor Freigabe in einer isolierten Testumgebung
  mit echten JWTs SELECT/INSERT/UPDATE/DELETE je Identität prüfen: anon, angemeldeter
  Nichtmitglied-Nutzer, Mitglied, danach entzogene Mitgliedschaft und abgelaufenes JWT.
  Erwartung: nur aktuelles Mitglied erlaubt, übrige ohne Datenzugriff; auch fremde
  project_id und Änderung von payload.id/entry_id prüfen. Keine realen Daten löschen.
- localStorage gilt pro **Origin**, nicht pro Pfad. Alle Seiten unter
  `https://mikefaehch.github.io` teilen denselben Speicherbereich. Schlüsselpräfixe sind
  Kollisionsschutz, keine Sicherheitsgrenze gegen andere Skripte desselben Origins.
- Am 31.10.2026 wurden die unnötigen Client-Rechte auf `project_members` entzogen,
  einschliesslich TRUNCATE. Per `has_table_privilege` bestätigt: SELECT erlaubt,
  INSERT/UPDATE/DELETE/TRUNCATE verweigert. Keine Mitgliedschaft oder Finanzdaten geändert.
- Ablehnen der optionalen Migration lässt die lokale Sicherung unverändert; die Frage
  erscheint beim nächsten Laden erneut (P3 bewusst unverändert).
- PR bleibt Draft: Mike richtet Google/Apple/Microsoft, Rücksprung-Adressen und ein
  Mitglied ein; danach müssen alle Login-Wege und die gemeinsame Reisekasse auf dem
  physischen iPhone bestanden sein. Mock-/Emulationstests ersetzen diesen Nachweis nicht.

## Reisekasse 2.0 (31.10.2026)

- **Anmeldung nur per E-Mail-Code** (`signInWithOtp`, `shouldCreateUser:false`): Nur die vier im Dashboard angelegten Konten erhalten einen Code; fremde Adressen werden abgewiesen. Google/Apple/Microsoft sind aus der Oberfläche entfernt, bis ein Anbieter wirklich eingerichtet ist.
- **Mailversand:** eigener SMTP (Gmail), da der Supabase-Standardversand nur an Team-Adressen liefert (max. 2/h). Vorlage «Magic link or OTP» enthält `{{ .Token }}`.
- **Rechnen:** `js/ledger.js`. Ausgleich immer in CHF; jeder EUR-Eintrag speichert `rate_used`. Der Reisekurs liegt als Eintrag `id:"settings"` in `camino_ledger_entries` und kann von jedem Mitglied geändert werden (keine Schemaänderung nötig; bewusste Abweichung von «nur Admin»).
- **Datenformat v2** im `payload`: `kind` (expense/settlement/settings), `status` (bezahlt/offen, offen erlaubt `cents:null`), `category`, `spent_on`, `rate_used`, `deleted_at` (Soft-Delete, mit Rückgängig), `updated_at`, `updated_by` (Anzeigename, clientseitig gesetzt, nicht serverseitig erzwungen). v1-Einträge bleiben lesbar.
- **Offline:** Änderungen gehen zuerst in `localStorage` (`camino-kasse-outbox-v2:<user>`), werden bei Verbindung hochgeladen; der letzte Stand liegt in `camino-kasse-cache-v2:<user>` und wird beim Abmelden gelöscht. Konflikt: Hat jemand denselben Eintrag inzwischen geändert, gewinnt die Serverfassung und die eigene Änderung wird mit Hinweis verworfen. localStorage gilt pro Origin (`mikefaehch.github.io`), also auch für andere eigene Seiten dort.
- **Keine Browser-Dialoge** (`alert/confirm/prompt`) mehr: Bestätigungen, Löschen und Import laufen im Seitenlayout.
- **Offen:** Die älteren, leeren Tabellen `expense_entries` und `expense_settlements` sind noch vorhanden (siehe #31); echter Zwei-Geräte-Test und Test aus der Home-Bildschirm-App stehen aus.
