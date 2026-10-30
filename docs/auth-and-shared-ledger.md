# Camino: private sign-in and shared Reisekasse

## Goal
Four invited travellers (Mike, Ante, Kevin, Luis) can sign in with existing accounts and use one shared expense ledger. Splitwise is **only design inspiration**, never a service dependency.

## Proposed architecture (not yet deployed)
- Static UI remains on GitHub Pages; identity and data require a separate managed backend.
- Evaluate Supabase Auth (Google, Apple, Microsoft/Azure) + Postgres and row-level security, or Firebase Authentication + Firestore Security Rules. Choose **one** after owner approves provider and creates a project.
- OAuth authorization code with PKCE; provider-managed sign-in, no password handling in the website. Redirect URI must match the GitHub Pages production origin. Google login is not Gmail mailbox access: request only minimal identity scopes.
- All expense reads and writes require an authenticated session, membership in the specific private Camino group, and server-enforced authorization. Never use client-side name checks as access control.
- Invitations by authenticated email identity; owner explicitly approves all four accounts. Do not hardcode personal emails, tokens, credentials or secrets in GitHub.
- DB schema: groups, memberships (role and auth user ID), expenses (id, description, currency, amount in integer cents, payer member ID, created_by, timestamps), expense_participants (member ID, split amount cents), settlements (from, to, amount cents), and audit events. Prefer soft delete/versioning and immutable settlement audit.
- Row-level rules: read only if member of the expense group; insert/update only if authenticated group member; member administration owner-only. Validate all IDs belong to same group and all monetary sums in a server-side transaction.
- Concurrency: versioned updates, conflict feedback, idempotent writes, offline queued changes with conflict resolution. Backups and explicit consent before migrating localStorage ledger to shared storage.
- No publicly accessible financial JSON in GitHub Pages, GitHub repository, static assets, or client bundle. Public anon API keys are not secrets but **never** replace access-control rules; privileged keys must stay server-side.
- Respect Swiss/EU privacy expectations: retention, account removal, access logging, provider region and data processing review.

## Implementation stages
1. Owner selects hosting/auth provider and provisions a private project. Configure Google sign-in first; Apple and Microsoft require separate provider registrations and validation.
2. Implement identity UI, OAuth callback handling, logout, session refresh and authenticated membership checks.
3. Deploy schema, access rules, migrations and automated unauthorized-access tests **before** connecting live financial data.
4. Add shared ledger API, sync, conflict handling and safe import of existing local backups; validate with four test identities.
5. Mobile Safari/PWA sign-in, sign-out, offline, denied-invite and multi-device end-to-end acceptance.

## Current status
The independent Reisekasse is currently **local-only**. No OAuth provider, backend, cross-device sync or invitation flow is live. Do not display a working sign-in button until the backend is provisioned and tested.
