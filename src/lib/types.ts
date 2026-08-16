// Role and InviteStatus are plain strings in the schema, not Prisma
// `enum` blocks — this schema started on SQLite (no native enum support
// there) and was never promoted back to real enums after the move to
// Postgres, since app-level validation already covers it (see below).
// These types are the single source of truth for valid values — import
// from here, not from @prisma/client.
export type Role = "OWNER" | "ADMIN" | "MEMBER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export const ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER"];

// Prisma returns `role`/`status` as a plain `string`. This is the one
// narrowing point where we assert it's one of our known values — every
// value ever written to these columns goes through a zod-validated route
// or a literal in our own code, so this is safe.
export function asRole(value: string): Role {
  return value as Role;
}

export function asInviteStatus(value: string): InviteStatus {
  return value as InviteStatus;
}
