-- Add restrictive owner guards; existing permissive membership rules remain intact.
create policy camino_ledger_owner_only on public.camino_ledger_entries as restrictive for all to authenticated
using ((select auth.uid()) = '829dfa95-6722-4b08-aa1b-843e38a06ba7'::uuid)
with check ((select auth.uid()) = '829dfa95-6722-4b08-aa1b-843e38a06ba7'::uuid);
create policy expenses_owner_only on public.expense_entries as restrictive for all to authenticated
using ((select auth.uid()) = '829dfa95-6722-4b08-aa1b-843e38a06ba7'::uuid)
with check ((select auth.uid()) = '829dfa95-6722-4b08-aa1b-843e38a06ba7'::uuid);
create policy settlements_owner_only on public.expense_settlements as restrictive for all to authenticated
using ((select auth.uid()) = '829dfa95-6722-4b08-aa1b-843e38a06ba7'::uuid)
with check ((select auth.uid()) = '829dfa95-6722-4b08-aa1b-843e38a06ba7'::uuid);
