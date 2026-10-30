# Camino 2027 – automatische Web-Push-Erinnerungen

## Zweck und Status
Freiwillige Erinnerungen für die sieben Etappen vom 12.–18. Juni 2027. Die Daten stammen aus `data/trip.js` (DAYS mit `stage:1..7`). Der Server hält die Etappen-Daten in `private.camino_reminder_days` synchron; bei Änderungen der Reisedaten müssen beide aktualisiert werden.

- **Vorabend**: Vorschau auf die morgige Etappe, Standard 19:00.
- **Etappenmorgen**: Erinnerung an die heutige Etappe, Standard 07:00.
- **Zeitzone**: `Europe/Madrid`, auch für den ersten Tag in Valença. Portugal ist im Juni eine Stunde zurück.
- **Opt-in**: standardmässig aus. Pro iPhone separat aktivierbar und deaktivierbar.
- **Gültigkeit**: Bei Aktivierung wird die Subscription bis 1. Juli 2027 aufbewahrt. Das Gerät muss bis zur Reise weiterhin gültig sein; bei ungültigen Push-Endpunkten wird der Versand abgeschaltet.

## Architektur
`js/push-client.js` sendet mit einem lokal generierten, 256-Bit-zufälligen Token `reminder_settings` und `save_reminders` an `camino-push-device`. Die Datenbank speichert nur SHA-256 des Tokens in `public.push_test_devices`. Der Endpoint ist an einen passenden Token gebunden und validiert Zeitfenster.

Supabase `pg_cron` Job `camino-2027-reminder-dispatch` ruft alle fünf Minuten via `pg_net` die Edge Function `camino-push-reminders` auf. Das Cron-Geheimnis steht ausschliesslich in `private.camino_reminder_dispatch_auth`; es wird nicht in Repository oder Browser eingebettet. Die Edge Function validiert das Geheimnis und liest fällige Erinnerungen über service-role-beschränkte RPCs. `private.camino_reminder_log` verhindert doppelte Benachrichtigungen pro Gerät, Datum und Typ.

VAPID-Schlüssel liegen serverseitig in `private.push_credentials`; der private Schlüssel darf niemals in den Client oder ins Git-Repository gelangen. Die Apple-Annahme einer Nachricht garantiert nicht deren Anzeige auf dem iPhone.

## Betrieb und Validierung
- Job: `select jobid,active from cron.job where jobname='camino-2027-reminder-dispatch';`
- Geräte: `select count(*) from public.push_test_devices where reminders_enabled;`
- Zustellung: `select travel_date,kind,status,count(*) from private.camino_reminder_log group by 1,2,3 order by 1,2;`
- Netzwerkfehler: `select status_code,error_msg from net._http_response order by id desc limit 10;`
- Sicherheitsprüfung: Supabase Security Advisors.

Der Test für echte Hintergrundzustellung erfolgt über die Home-Bildschirm-Web-App auf iOS. Ohne ausdrückliche Aktivierung des Schalters werden keine automatischen Erinnerungen versendet.

## Einschränkungen
Es werden nur die sieben fixen Etappen und die zwei gewählten Uhrzeiten unterstützt. Die erste Etappe enthält einen Hinweis zur Zeitverschiebung; der Bootstag einen Hinweis auf die gezeitenabhängige Abfahrtszeit. Dynamische Wetterwarnungen oder automatische Ermittlung der tatsächlichen Abmarschzeit sind nicht enthalten.
