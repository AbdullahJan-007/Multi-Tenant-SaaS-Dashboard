# Multi-Tenant SaaS Dashboard

A Next.js 14 (App Router) starter for B2B SaaS products: organizations,
team invites, and role-based access control, with tenant isolation
enforced in the data layer — not just hidden in the UI.

## Stack

- **Next.js 14** (App Router, Route Handlers, Edge middleware)
- **Prisma** + **Postgres** (developed and deployed against [Neon](https://neon.tech); any Postgres works)
- **JWT sessions** via `jose` (Edge-runtime compatible, httpOnly cookie)
- **Tailwind CSS**, no component library
- **Zod** for input validation on every mutating route

No auth-as-a-service, no ORM abstraction on top of Prisma, no state
management library. The problem doesn't call for them, and a stack that
size would fight you more than it'd help for a project this shape.

## Getting started

1. Create a free Postgres database (e.g. [Neon](https://neon.tech) or
   [Supabase](https://supabase.com)) and copy its connection string.

2. Install and configure:

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="<generate one below>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Generate a real `JWT_SECRET` (PowerShell doesn't have `openssl` by default —
use whichever of these you have):

```bash
openssl rand -base64 32
# or, if you don't have openssl (e.g. Windows PowerShell):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

3. Create the schema and seed data:

```bash
npx prisma migrate dev --name init
npm run db:seed             # creates owner@acme.test / password123
npm run dev
```

Visit `http://localhost:3000`, sign in with the seeded account, or
register a fresh one and create your own workspace.

## Deploying (Vercel + Neon)

1. Push the repo to GitHub and import it in Vercel.
2. In Vercel → Settings → Environment Variables, set `DATABASE_URL`,
   `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL` (your production domain, e.g.
   `https://your-app.vercel.app`) — same values as your local `.env`,
   pointed at your real database and domain.
3. Redeploy. Migrations aren't run automatically on deploy; run
   `npx prisma migrate deploy` against the production `DATABASE_URL`
   whenever the schema changes (locally, with `.env` pointed at prod, or
   as a one-off Vercel build step).

A SQLite datasource was considered for zero-config local dev, but two
things ruled it out: Prisma's SQLite connector doesn't support native
`enum` types (see the RBAC section below), and — more importantly —
Vercel's serverless functions don't have a persistent filesystem, so a
file-based DB wouldn't survive between requests in production anyway.
Postgres from the start avoids both problems and matches what you'd
actually ship.

## How tenancy actually works

The whole model rests on one join table:

```
User ──< Membership >── Organization
              │
             role: OWNER | ADMIN | MEMBER
```

A user's role is scoped to a *membership*, not to the user record — the
same person can be an OWNER of one workspace and a MEMBER of another.

**Every org-scoped request goes through one function first:**
`requireMembership(user, orgSlug)` in `src/lib/org.ts`. It resolves the
org by slug and proves membership in a single query. There is no code
path where a handler holds an `organizationId` it hasn't verified —
routes never trust a client-supplied org id, only the slug from the URL,
re-checked against the session on every request.

From there, tenant data (`Project` is the example model — copy its
pattern for any new domain model) is always queried with
`where: { organizationId }`. Deletes use `deleteMany` with that filter
rather than `delete` by id, so a forged or stale id from another tenant
simply matches zero rows instead of ever touching someone else's data.

## RBAC

`src/lib/rbac.ts` defines one permission matrix:

```ts
PROJECT_DELETE: "ADMIN"
MEMBER_INVITE: "ADMIN"
MEMBER_CHANGE_ROLE: "OWNER"
```

`hasPermission(role, permission)` does a numeric rank comparison
(`MEMBER < ADMIN < OWNER`), so adding a permission is a one-line change,
not a scattered set of `if (role === 'ADMIN' || role === 'OWNER')`
checks across the codebase. UI uses it to hide actions; API routes use
`assertPermission` to enforce them regardless of what the UI shows —
the team page re-checks server-side even though the sidebar already
hides the link for members.

`Role` and `InviteStatus` are plain `String` columns in the schema
(`src/lib/types.ts` is the source of truth for the valid values), not
Prisma `enum` blocks — enum support varies by connector and this schema
started on SQLite, where enums aren't supported at all. Every value
written to these columns still goes through a zod-validated route, so
this costs nothing in practice. Since the project now runs on Postgres,
which does support native enums, promoting them back to real `enum`
blocks for DB-level constraints is a reasonable follow-up — it's not
required for correctness today.

Edge cases handled on purpose:

- An ADMIN can't mint an invite for the OWNER role (no self-escalation).
- The last OWNER of a workspace can't be demoted or removed by anyone —
  every workspace needs at least one.

## Invites

`Invite` is its own model with a random token, an expiry, and a status
(`PENDING` / `ACCEPTED` / `REVOKED` / `EXPIRED`) rather than a
fire-and-forget email. That's what makes revoke, expiry, and "already
pending" checks possible. Accepting an invite requires being signed in
as the exact invited email — the invite page tells you clearly if
you're signed in as the wrong account instead of silently failing.

There's no email provider wired up: `POST /api/org/[orgSlug]/invites`
logs the invite link to the server console and returns it in the
response, which is enough to test the full flow locally. Swapping in
Resend/Postmark/SES is a few lines in that one route.

## Auth

Passwords are hashed with bcrypt. Sessions are a signed JWT in an
httpOnly, sameSite=lax cookie — `jose` was chosen over `jsonwebtoken`
specifically because Edge middleware can't run Node's crypto module,
and `jose` runs identically in both. Middleware only checks whether the
token is structurally valid and redirects anonymous visitors away from
`/org/*` — it never touches the database (Edge functions shouldn't).
The real authorization check (does this user belong to *this*
organization, and with what role) happens server-side, per request, in
`requireMembership`.

## What's deliberately not here

- Subdomain-per-tenant routing. Path-based (`/org/acme/dashboard`) gets
  you the same isolation without wildcard DNS/local hosts-file setup —
  swap it for subdomains later without touching the RBAC or data layer.
- An email service, billing, audit logs, 2FA. Real needs for a
  production SaaS, but outside what "multi-tenancy, invites, RBAC" asks
  for, and bolting them on speculatively would just be noise on top of
  the pattern this repo is meant to demonstrate.

## Project layout

```
prisma/schema.prisma          data model + tenancy relations
src/lib/auth.ts                password hashing, JWT sign/verify (edge-safe)
src/lib/session.ts             cookie-backed session, Node-only
src/lib/org.ts                 tenant resolution — requireMembership()
src/lib/rbac.ts                permission matrix
src/lib/types.ts               Role / InviteStatus — the app-level source of truth
src/middleware.ts              edge auth gate
src/app/org/[orgSlug]/...      tenant-scoped pages
src/app/api/org/[orgSlug]/...  tenant-scoped API routes
```