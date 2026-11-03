# Serverseitig geschützter Geräte-Push-Test

Produktionsstand am 2026-11-03 verifiziert: Migration `20261102050438_push_device_membership.sql` ist angewendet; Edge Function `camino-push-device` ist Version 9. Die öffentliche Camino-Reiseübersicht bleibt öffentlich. Die Anmeldung und Mitgliedschaft schützen Push-Geräteaktionen; die bestehende Reisekasse bleibt durch ihre vorhandenen RLS-Regeln geschützt.

## Schutz
- Der Browser sendet den aktuellen Access-Token aus der bestehenden Camino-Sitzung; ohne Sitzung werden keine Push-Endpunktaktionen ausgeführt.
- Jede Aktion (auch config/status/Erinnerungen) prüft den Bearer über Supabase Auth `getUser`, lehnt anonyme Konten ab und prüft die aktuelle `project_members`-Zeile für dieselbe feste Projekt-UUID wie `auth-ui.js`. Ein Geräte-Token ist kein Login.
- Die Funktion verwendet `verify_jwt=false`, weil die Authentifizierung im Handler mit Supabase Auth `getUser` und Mitgliedschaftsprüfung erfolgt. Die Einstellung überspringt keine Anwendungsprüfung; der Live-Aufruf ohne Bearer liefert `401 auth_required`.
- Gerätezugriffe filtern auf die verifizierte `user_id`. Eine bestehende Registrierung kann nicht von einem anderen Konto übernommen werden. Bisher unzugeordnete Registrierungen werden bei erneuter Aktivierung mit bekanntem Gerätetoken einmalig gebunden; keine automatische Zuordnung durch Namen oder E-Mail.
- Der service-only SQL-Aufruf sperrt zuerst das Benutzerlimit, dann das Gerät. Zwei Minuten Abstand und drei Tests pro UTC-Tag gelten zusätzlich pro `user_id`, auch bei mehreren Geräten oder neu erzeugten Gerätekennungen. Re-Registrieren setzt das Benutzerlimit nicht zurück. Vor der verzögerten Zustellung wird die Mitgliedschaft erneut geprüft. Ein verbrauchtes Limit wird bei Versandfehlern bewusst nicht zurückgesetzt.
- Automatische Erinnerungszustellung und bestehende Cron-Konfiguration wurden nicht geändert. Registrierung und Erinnerungseinstellungen am Geräte-Endpunkt benötigen nun ebenfalls Login. Eine umfassende Mitgliedschaftsprüfung des separaten Cron-Dispatchers ist damit nicht behauptet.
- Vorhandene Gerätezeilen bleiben bei der Migration bestehen. Eine noch unzugeordnete Zeile wird erst beim erneuten Aktivieren mit demselben lokalen Gerätetoken nach erfolgreichem Login gebunden.

## Produktivstatus und Abnahme
- Migration und Funktion wurden am 2026-11-03 im Camino-Supabase-Projekt produktiv bereitgestellt.
- Verifiziert: Funktion Version 9 aktiv; `push_test_devices.user_id` und `camino_push_test_limits` vorhanden; RLS auf beiden Tabellen aktiv.
- Live-Smokes: erlaubter Origin ohne Bearer → `401 auth_required`; fremder Origin → `403 origin_denied`.
- Keine echte Push-Mitteilung wurde bei dieser Bereitstellung ausgelöst. Der authentifizierte iPhone-End-to-End-Test und die sichtbare Zustellung bleiben noch offen.
- Nächster Geräteschritt: Als freigeschaltetes Mitglied anmelden und das iPhone über «Push aktivieren» erneut registrieren, damit eine bestehende unzugeordnete Registrierung dem Konto zugeordnet wird. Erst danach kann ein bewusst ausgelöster Push-Test stattfinden.

## Validierung
- `node tests/push-membership.mjs`: Client ohne Sitzung sendet nichts; Mock-Handler prüft ungültige JWTs, Mitgliedschaft, Eigentümerfilter, verifizierte RPC-Identität, Limitfehler und Entzug vor Zustellung. Kein echter Push.
- `PGLITE_PATH=/pfad/zu/@electric-sql/pglite/dist/index.js node tests/push-membership-sql.mjs`: PostgreSQL-Rechte, Eigentümerbindung, Limits über Geräte, Tageswechsel und Mitgliedschaftsentzug in flüchtiger Datenbank.
- `node tests/cache-isolation.mjs` und die Chromium-/WebKit-Regressionsläufe in GitHub CI bleiben Teil der Projektprüfungen.
