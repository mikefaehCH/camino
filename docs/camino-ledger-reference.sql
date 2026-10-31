-- REFERENZ, KEINE MIGRATION. Wird von keinem Workflow automatisch ausgeführt.
-- Nur Katalogabfragen am 31.10.2026 in qoensghjemruqafrbmjd; keine Reise-/Finanzdaten.
-- Voraussetzung: vorhandene public.app_projects, auth.users und Schema private.
-- Ausschnitt des Live-Schemas, kein vollständiges Backup und keine Rollout-Anweisung.
CREATE TABLE public.project_members (
  project_id uuid NOT NULL REFERENCES public.app_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE TABLE public.camino_ledger_entries (
  project_id uuid NOT NULL REFERENCES public.app_projects(id) ON DELETE CASCADE,
  entry_id text NOT NULL CHECK (length(entry_id) BETWEEN 1 AND 120),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 4096),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, entry_id)
);
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camino_ledger_entries ENABLE ROW LEVEL SECURITY;
-- Live: RLS aktiv, FORCE ROW LEVEL SECURITY nicht gesetzt. Eigentümer umgehen RLS.
-- Definer nötig, um die rekursive RLS-Prüfung von project_members zu vermeiden.
-- Funktion liegt im nicht exponierten Schema, leerer search_path, auth.uid() geprüft.
CREATE OR REPLACE FUNCTION private.is_project_member(p uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.project_members WHERE project_id = p AND user_id = (SELECT auth.uid())
) $$;
REVOKE ALL ON FUNCTION private.is_project_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_project_member(uuid) TO authenticated;
CREATE POLICY "members can read roster" ON public.project_members FOR SELECT TO authenticated
USING (private.is_project_member(project_id));
CREATE POLICY "camino ledger members read" ON public.camino_ledger_entries FOR SELECT TO authenticated
USING (private.is_project_member(project_id));
CREATE POLICY "camino ledger members insert" ON public.camino_ledger_entries FOR INSERT TO authenticated
WITH CHECK (private.is_project_member(project_id) AND payload ->> 'id' = entry_id);
CREATE POLICY "camino ledger members update" ON public.camino_ledger_entries FOR UPDATE TO authenticated
USING (private.is_project_member(project_id))
WITH CHECK (private.is_project_member(project_id) AND payload ->> 'id' = entry_id);
CREATE POLICY "camino ledger members delete" ON public.camino_ledger_entries FOR DELETE TO authenticated
USING (private.is_project_member(project_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camino_ledger_entries TO authenticated;
-- Live hat anon keine Tabellenrechte auf diesen beiden Tabellen.
-- Am 31.10.2026 durch Migration restrict_project_members_client_privileges gehärtet:
-- authenticated hat auf project_members nur SELECT; keine Client-Schreib-/TRUNCATE-Rechte.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON public.project_members FROM authenticated;
-- Mitgliedschaft muss administrativ freigeschaltet werden, nie durch Selbstregistrierung.
-- Negativtests mit echten JWTs sind vor Freigabe separat nötig, siehe REISEKASSE_AUTH.md.
