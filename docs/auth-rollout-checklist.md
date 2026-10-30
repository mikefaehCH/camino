# Shared login rollout checklist (not deployed)

Existing backend: Sommer 2027 Supabase project `kgtowblwixgfdnbgcjeq`.

## Ready in code
- `js/auth-core.js` provides a reusable provider-based OAuth adapter and authenticated membership lookup.
- It is intentionally **not loaded by the live site** until database RLS and redirect configuration are confirmed.
- Google is the first supported provider. Apple and Microsoft (`azure`) are only code options until configured in Supabase and provider consoles.
- Login never implies membership. The Camino membership table is separate from Sommer2027's `family_members`.
- The adapter requires a pinned Supabase JS SDK and public publishable key, passed by the integrating site. Never commit a secret key.

## Backend deployment gate
1. Review and remediate Supabase security advisor findings for existing privileged functions, without breaking Sommer2027 triggers or RLS.
2. Review additive Camino SQL migration and verify no changes to existing family tables.
3. Deploy tables, server-enforced RLS, privileges and database constraints; run negative tests using unauthorized identities.
4. Add Camino callback URL to Auth redirect allowlist; verify Google provider works with existing project.
5. Invite exactly four approved accounts, mapping each identity to the correct pilgrim. Do not guess email addresses or user IDs.
6. Only then wire the adapter into the Camino UI and migrate local expense backups with explicit user confirmation.
7. Test Google OAuth on desktop, Safari, and iPhone home-screen PWA. Do not assume PWA OAuth works identically to Safari.

## Current restrictions
- No production login, shared ledger, membership grants or cross-device synchronization is enabled by this PR.
- Public GitHub Pages HTML is not access-controlled; only database records can be protected with RLS.
- All GitHub Pages project paths on `mikefaehch.github.io` share one origin and potentially browser storage. The backend must enforce cross-project isolation independently.
