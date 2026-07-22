// SQLite (our local dev DB) has no native enum type, so Role and
// InviteStatus are plain strings in the schema. These types are the
// single source of truth for valid values everywhere in the app —
// import from here, not from @prisma/client.
export type Role = "OWNER" | "ADMIN" | "MEMBER";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export const ROLES: Role[] = ["OWNER", "ADMIN", "MEMBER"];

// Prisma returns `role`/`status` as a plain `string` (SQLite has no enum
// type). This is the one narrowing point where we assert it's one of our
// known values — every value ever written to these columns goes through
// a zod-validated route or a literal in our own code, so this is safe.
export function asRole(value: string): Role {
  return value as Role;
}

export function asInviteStatus(value: string): InviteStatus {
  return value as InviteStatus;
}
