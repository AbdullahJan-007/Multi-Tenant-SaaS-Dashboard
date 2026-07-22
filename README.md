# Multi-Tenant SaaS Dashboard

A Next.js 14 (App Router) starter for B2B SaaS products: organizations,
team invites, and role-based access control, with tenant isolation
enforced in the data layer — not just hidden in the UI.

## Stack

- **Next.js 14** (App Router, Route Handlers, Edge middleware)
- **Prisma** + SQLite for local dev (swap one env var for Postgres in prod)
- **JWT sessions** via `jose` (Edge-runtime compatible, httpOnly cookie)
- **Tailwind CSS**, no component library
- **Zod** for input validation on every mutating route

No auth-as-a-service, no ORM abstraction on top of Prisma, no state
management library. The problem doesn't call for them, and a stack that
size would fight you more than it'd help for a project this shape.

## Getting started

```bash
npm install
cp .env.example .env        # then set JWT_SECRET — see below
npx prisma migrate dev --name init
npm run db:seed             # creates owner@acme.test / password123
npm run dev
```

Generate a real secret instead of the placeholder:

```bash
openssl rand -base64 32
```

Visit `http://localhost:3000`, sign in with the seeded account, or
register a fresh one and create your own workspace.

> This scaffold was built in a sandboxed environment without access to
> Prisma's binary CDN, so `prisma generate` / `next build` could not be
> executed end-to-end here. `npm install` was verified, and every schema
> field, Prisma relation name, and route param was manually cross-checked
> against its usage. Run the commands above locally — they're standard
> Prisma/Next.js commands with nothing unusual in this setup.

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
src/middleware.ts              edge auth gate
src/app/org/[orgSlug]/...      tenant-scoped pages
src/app/api/org/[orgSlug]/...  tenant-scoped API routes
```
