import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { assertPermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { orgSlug: string; projectId: string } }
) {
  try {
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, params.orgSlug);
    assertPermission(membership.role, "PROJECT_DELETE");

    // deleteMany (not delete) so the organizationId filter is enforced
    // even if a stray/forged projectId from another tenant is passed —
    // it simply matches zero rows instead of throwing a not-found on
    // someone else's data or, worse, deleting it.
    const result = await db.project.deleteMany({
      where: { id: params.projectId, organizationId: organization.id }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
