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

## Reusable multi-site foundation

This is a **shared identity and authorization platform**, not a Camino-specific login. The same authenticated user can participate in multiple applications while every application keeps separate permissions and data.

### Recommended repository boundaries
- A standalone `web-auth-kit` repository/package (created only after owner approves repository name and shared ownership) contains Supabase client initialization, login/logout/callback helpers, session events, accessible UI, and common authorization helpers.
- Each website imports a pinned, versioned release of that package; avoid unpinned CDN scripts and copy/paste forks.
- Backend SQL migrations, RLS tests and environment templates live in a separate infrastructure folder/repository. Never commit credentials.
- Camino owns its expense UI and business rules; Sommer2027 owns its planning domain. Shared package never reads or writes project-specific tables.

### Suggested data separation
- `auth.users` is the single identity source.
- `app_projects` identifies sites such as `camino`, `sommer2027`, `zuerich`.
- `project_memberships` maps authenticated user IDs to project IDs and roles.
- `groups` and `group_memberships` grant access to private groups *within* each project.
- Project-specific tables include `project_id` and `group_id` and have server-enforced RLS with group membership checks; never trust `project_id` from client-side input alone.
- RLS must prevent cross-project reads, writes and membership enumeration. Admin changes must be audited and protected.

### OAuth across GitHub Pages origins
All current GitHub Pages project sites share the origin `https://mikefaehch.github.io` but have different paths. OAuth redirect allowlists must include explicit per-app callback URLs (or one carefully validated common callback). Auth redirect return paths must be allowlisted to prevent open redirects. If a future project uses a custom domain, its callback must be registered separately.

**Important isolation detail:** Browser localStorage is origin-scoped, **not path-scoped**. Apps on different GitHub Pages paths can access each other's localStorage. Do not store sensitive shared-session or financial data there under a false assumption of per-project isolation. Use well-scoped keys only to avoid accidental collisions; rely on backend authorization for actual isolation. Review whether all sites on this origin are equally trusted before enabling a common browser session.

### Reuse and delivery contract
1. Define a small public API: `initAuth(config)`, `signIn(provider, returnTo)`, `signOut()`, `onSessionChange(handler)`, `getCurrentUser()`, `getMembership(projectId)`.
2. No service-role key in browser. No mailbox scope for Google sign-in. Only public project URL and anon/publishable key in static configuration.
3. Automated tests: unauthorized user, uninvited account, cross-project read/write, tampered membership, revoked access, expired session, and OAuth redirect manipulation.
4. Each site can opt in without migrating unrelated data or exposing its existing private state.
5. Roll out first to Camino test accounts; only then promote the versioned package to other sites.

### Deployment prerequisites
A real Supabase project, configured OAuth providers, redirect URLs, RLS policies, and an owner-approved invitation roster are necessary before production login can be switched on. A design-only PR is not a working sign-in service.
