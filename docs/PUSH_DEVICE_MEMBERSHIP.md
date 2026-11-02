# Serverseitig geschützter Geräte-Push-Test

Vorbereitet für Issue #38, nicht deployed. Ausgangsquelle: nur lesend bezogene
Edge Function `camino-push-device`, Version 5. Keine Secrets übernommen.

## Schutz
- Browser sendet den aktuellen Access-Token aus der bestehenden Camino-Sitzung;
  ohne Sitzung keine Anfrage und keine neue Benachrichtigungsberechtigung.
- Jede Aktion (auch config/status/Erinnerungen) prüft den Bearer über Supabase Auth
  `getUser`, lehnt anonyme Konten ab und prüft die aktuelle `project_members`-Zeile
  für dieselbe feste Projekt-UUID wie `auth-ui.js`. Ein Geräte-Token ist kein Login.
- Gerätezugriffe filtern auf die verifizierte user_id. Eine bestehende Registrierung
  kann nicht von einem anderen Konto übernommen werden. Bisher unzugeordnete
  Registrierungen werden bei erneuter Aktivierung mit bekanntem Gerätetoken einmalig
  atomar gebunden; keine automatische Zuordnung durch Namen oder E-Mail.
- Der service-only SQL-Aufruf sperrt zuerst das Benutzerlimit, dann das Gerät.
  Zwei Minuten Abstand und drei Tests pro UTC-Tag gelten zusätzlich pro user_id,
  auch bei mehreren Geräten oder neu erzeugten Gerätekennungen. Re-Registrieren
  setzt das Benutzerlimit nicht zurück. Vor der verzögerten Zustellung wird die
  Mitgliedschaft erneut geprüft. Ein verbrauchtes Limit wird bei Versandfehlern
  bewusst nicht zurückgesetzt (kein Umgehen durch wiederholte Fehler).
- Automatische Erinnerungszustellung und bestehende Cron-Konfiguration werden nicht
  verändert. Die Registrierung/Einstellungen dafür verlangen nun ebenfalls Login.
  Eine umfassende Mitgliedschaftsprüfung des separaten Cron-Dispatchers ist damit
  nicht behauptet.

## Manuelle Schritte für Mike
1. SQL-Migration `supabase/migrations/20261102050438_push_device_membership.sql`
   zuerst in isolierter Umgebung prüfen, danach im Camino-Projekt anwenden.
   Sie ergänzt user_id und dauerhafte Benutzerlimits; bestehende Gerätedaten
   werden nicht gelöscht oder pauschal einer Person zugeordnet.
2. `supabase/functions/camino-push-device/index.ts` samt `handler.mjs` als Function
   `camino-push-device` deployen. Vorhandene Servervariablen SUPABASE_URL und
   SUPABASE_SERVICE_ROLE_KEY weiter sicher verwalten. VAPID verbleibt im bisherigen
   service-only RPC. Kein Schlüssel gehört in Browser, URL oder Repository.
3. Frontend-PR nach Review mergen. Unauthentifizierter/abgelaufener Token → 401;
   Nichtmitglied/fremdes Gerät → 403. Als freigeschaltetes Mitglied Gerät erneut
   aktivieren; erst bewusst einen echten Test senden. Zwei Geräte desselben Kontos
   dürfen die gemeinsamen Limits nicht umgehen. Physische iPhone-Anzeige abnehmen.
4. Issue #38 erst nach Merge, Migration, Function-Deployment und Abnahme schliessen.
   Alte Frontends ohne Bearer werden nach Function-Deployment absichtlich abgelehnt.

## Validierung
- `node tests/push-membership.mjs`: tatsächlicher Client-IIFE ohne Sitzung sendet
  nichts; Mock-Handler prüft ungültige JWTs, Mitgliedschaft, Eigentümerfilter,
  verifizierte RPC-Identität, Limitfehler und Entzug vor Zustellung. Kein echter Push.
- `PGLITE_PATH=/pfad/zu/@electric-sql/pglite/dist/index.js node tests/push-membership-sql.mjs`:
  vorhandene Testinstallation verwenden; echte PostgreSQL-Rechte, Limits über
  mehrere Geräte, Tageswechsel und Mitgliedschaftsentzug in flüchtiger Datenbank.
  Keine neue Camino-Laufzeitabhängigkeit. PGlite hat nur eine Verbindung; echte
  parallele Transaktionen bleiben Teil der isolierten gehosteten Abnahme.
- `node tests/cache-isolation.mjs` und `npm run check` bleiben die Projektprüfungen.
