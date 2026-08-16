import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { assertPermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; inviteId: string }> }
) {
  try {
    const { orgSlug, inviteId } = await params;
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, orgSlug);
    assertPermission(membership.role, "MEMBER_INVITE");

    const result = await db.invite.updateMany({
      where: { id: inviteId, organizationId: organization.id, status: "PENDING" },
      data: { status: "REVOKED" }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
