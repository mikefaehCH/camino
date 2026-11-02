# Camino – autonomer Release mit Schutzregeln

- Die ausdrückliche Freigabe des Product Owners für den **konkreten Entwicklungsauftrag** deckt die Umsetzung bis zur Live-Prüfung ab. Kein pauschales Einverständnis für andere offene PRs oder unbestätigte Reise-/Buchungsdaten.
- Implementierung ausschliesslich über Aufgabenbranch und PR; keine direkten `main`-Pushes, kein Force-Push, keine Secrets oder produktiven Finanz- und Buchungsänderungen.
- Vor Start: aktuellen Main-Commit, fremde Übernahmen, offene PRs/Issues, Regeln und CI prüfen; Arbeit im Issue dokumentieren. Claude reviewt standardmässig unabhängig den konkreten PR-HEAD.
- Auto-Merge wird **nur** für PRs mit einer eigenen Zeile `Autonomy-Release: true` im PR-Text berücksichtigt. Diesen Marker setzt der Agent ausschliesslich bei bereits genehmigtem Umfang. Alte PRs bleiben unberührt.
- `Autonomous merge` wartet auf den erfolgreichen `Camino quality`-PR-Lauf (Chromium und WebKit) und prüft den aktuellen SHA, PR-Zustand, gleichen Repository-Ursprung, keine offenen Änderungswünsche und eine unabhängige GitHub-Approval auf **dem aktuellen SHA**. GitHubs Merge-API prüft den erwarteten SHA und bestehende Branchschutzregeln.
- GitHub Pages veröffentlicht die Website bereits aus `main`; diese bestehende Veröffentlichungsquelle wird nicht ungeprüft umgestellt. `Production smoke` prüft nach jedem Main-Push die tatsächlich veröffentlichten Bytes von `index.html`, `js/app.js`, `sw.js` und `manifest.webmanifest` auf Übereinstimmung mit dem Release-Commit.
- Bei fehlgeschlagenen Qualitäts- oder Produktionschecks **nicht** durchwinken: Befund untersuchen, Korrektur-PR oder sicheren Revert vorbereiten, erneute CI. Keine automatischen destruktiven Rollbacks.
- Wesentliche Änderungen der Produktfunktion, kostenpflichtige Dienste, Datenlöschung, reale Reise-, Buchungs- oder Finanzdaten und erhebliches Sicherheits-/Datenschutzrisiko erfordern eine gesonderte Entscheidung.
- PR-Kommentare: Agent, Ausgangs- und HEAD-Commit, Resultat, Validierung, Risiken, nächster Schritt. Keine doppelten Statusdateien.

**Grenze:** Der GitHub-Workflow ist ein Merge-Runner, kein unabhängiger Claude-Reviewer; dieser muss separat konfiguriert sein und eine echte GitHub-Approval abgeben. Die App-Verbindung kann GitHub-Einstellungen wie `allow_auto_merge` nicht bearbeiten. Der Workflow führt deshalb den geprüften SHA-gesperrten Merge selbst durch, ohne Branchschutz zu umgehen.
