# Wiederverwendbare Webseiten-Plattform

## Ziel
Eine gemeinsame Supabase-Instanz fuer mehrere eigenstaendige Webseiten. Ein zentraler Auth-Dienst; strikt projektgebundene Datenberechtigungen. Keine Abhaengigkeit von Splitwise.

## Bestand
Supabase-Projekt `qoensghjemruqafrbmjd` (eu-central-1). Migrationen `shared_platform_camino_foundation` und `secure_membership_policy_no_recursion` sind angewendet. `Sommer 2027` bleibt auf seiner bestehenden Instanz und wird **nicht** automatisch migriert.

## Datenmodell (v1)
- `public.app_projects`: Projekt-Registry mit stabilem Slug.
- `public.project_members`: Zuordnung zwischen Auth-User und Projekt; kein automatischer Zugang durch Login.
- `public.expense_entries`: Ausgaben pro Projekt, Betrag als Integer-Cents, Waehrung, Zahler, Teilnehmende, Ersteller.
- RLS ist fuer alle drei Tabellen aktiv. `private.is_project_member(uuid)` prueft Mitgliedschaft serverseitig; Zugriff auf die Funktion ist auf authentifizierte Benutzer begrenzt.
- Mitgliedschaften werden ausschliesslich durch vertrauenswuerdige Administration vergeben. Keine oeffentliche Selbstregistrierung fuer ein Projekt.

## Login
Ziel: Google, Apple, Microsoft (Azure) und E-Mail-Magic-Link ueber Supabase Auth. Jeder Provider braucht seine eigene OAuth-Konfiguration und Redirect-Freigaben. Provider sind **noch nicht** als einsatzbereit bestaetigt.

## Modularitaet
- Shared Auth und Projektberechtigung getrennt von fachlichen Modulen.
- Pro Modul eigene Tabellen/Policies und versionierte Migrationen.
- Frontend-Konfiguration enthaelt nur Projekt-Slug, API-URL und **publishable** Key; niemals service-role/secret Keys.
- Die gemeinsame Plattform ist nicht gleichbedeutend mit globalem Datenzugriff.
- Keine Projekt-spezifischen Geheimnisse oder Ausgabendaten im oeffentlichen GitHub-Repository.

## Naechste Schritte
1. Provider-Konfiguration, Redirect-URLs und Login auf iPhone/Desktop testen.
2. Sicheres Einladungs-/Provisionierungsverfahren fuer die vier Pilger definieren; keine Namen mit unbestaetigten Accounts verbinden.
3. Projektmitgliedschaft und Teilnehmerzuordnung pruefen; Datenzugriff mit zwei Testidentitaeten positiv und negativ testen.
4. Bestehende lokale Reisekasse an Supabase anbinden, mit explizitem Import, Konfliktbehandlung, Offline-Verhalten und Backup.
5. Betragsteilung und Rueckzahlungen als getrennte, nachvollziehbare Operationen modellieren; E2E-Tests.
6. Sicherheits- und Performance-Advisors nach jeder Migration pruefen.

## Betrieb
Keine Migration anderer Webseiten ohne Daten- und Rechteaudit. Bei Auth-Ausfall muss die oeffentliche Reiseinformation weiterhin lesbar bleiben. Keine automatische Uebertragung lokal gespeicherter Ausgaben ohne explizite Bestaetigung.
