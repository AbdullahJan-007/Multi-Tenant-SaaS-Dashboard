import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { assertPermission, isLastOwner } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ role: z.enum(["OWNER", "ADMIN", "MEMBER"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orgSlug: string; memberId: string } }
) {
  try {
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, params.orgSlug);
    assertPermission(membership.role, "MEMBER_CHANGE_ROLE");

    const { role } = schema.parse(await req.json());

    const target = await db.membership.findFirst({
      where: { id: params.memberId, organizationId: organization.id }
    });
    if (!target) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (target.role === "OWNER" && role !== "OWNER") {
      const owners = await db.membership.findMany({
        where: { organizationId: organization.id, role: "OWNER" }
      });
      if (isLastOwner(owners, "OWNER")) {
        return NextResponse.json(
          { error: "Every workspace needs at least one owner. Promote someone else first." },
          { status: 409 }
        );
      }
    }

    const updated = await db.membership.update({
      where: { id: target.id },
      data: { role }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; memberId: string } }
) {
  try {
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, params.orgSlug);
    assertPermission(membership.role, "MEMBER_REMOVE");

    const target = await db.membership.findFirst({
      where: { id: params.memberId, organizationId: organization.id }
    });
    if (!target) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (target.role === "OWNER") {
      const owners = await db.membership.findMany({
        where: { organizationId: organization.id, role: "OWNER" }
      });
      if (isLastOwner(owners, "OWNER")) {
        return NextResponse.json(
          { error: "Every workspace needs at least one owner." },
          { status: 409 }
        );
      }
    }

    await db.membership.delete({ where: { id: target.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
