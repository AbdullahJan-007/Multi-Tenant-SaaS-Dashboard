import type { Role } from "@/lib/types";

// Ordered weakest to strongest — lets us do simple >= comparisons instead
// of hardcoding role lists at every call site.
const ROLE_RANK: Record<Role, number> = {
  MEMBER: 0,
  ADMIN: 1,
  OWNER: 2
};

export const Permission = {
  PROJECT_READ: "MEMBER",
  PROJECT_WRITE: "MEMBER",
  PROJECT_DELETE: "ADMIN",
  MEMBER_INVITE: "ADMIN",
  MEMBER_REMOVE: "ADMIN",
  MEMBER_CHANGE_ROLE: "OWNER",
  ORG_SETTINGS_WRITE: "OWNER"
} as const satisfies Record<string, Role>;

export type PermissionKey = keyof typeof Permission;

export function hasPermission(role: Role, permission: PermissionKey): boolean {
  const required = Permission[permission];
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function assertPermission(role: Role, permission: PermissionKey) {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
}

// Owners can't be demoted/removed by anyone but another owner performing
// a deliberate ownership transfer — out of scope here, so we simply
// block role changes and removal targeting the last remaining OWNER.
export function isLastOwner(memberships: { role: string }[], targetRole: Role): boolean {
  if (targetRole !== "OWNER") return false;
  return memberships.filter((m) => m.role === "OWNER").length <= 1;
}
