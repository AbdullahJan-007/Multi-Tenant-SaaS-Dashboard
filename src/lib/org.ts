import "server-only";
import { db } from "@/lib/db";
import type { User } from "@prisma/client";
import { asRole } from "@/lib/types";

export class OrgNotFoundError extends Error {
  constructor() {
    super("Organization not found or you're not a member.");
    this.name = "OrgNotFoundError";
  }
}

// This is the single choke point every org-scoped API route and page
// must call before reading or writing tenant data. It resolves the slug
// AND proves membership in one query, so there's no window where a
// request holds an organizationId it hasn't been authorized for.
export async function requireMembership(user: User, orgSlug: string) {
  const organization = await db.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: user.id }
      }
    }
  });

  const rawMembership = organization?.memberships[0];
  if (!organization || !rawMembership) {
    throw new OrgNotFoundError();
  }

  const membership = { ...rawMembership, role: asRole(rawMembership.role) };

  return { organization, membership };
}

export async function listUserOrganizations(user: User) {
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" }
  });

  return memberships.map((m) => ({ ...m.organization, role: asRole(m.role) }));
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "org";
  let candidate = base;
  let suffix = 1;

  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
