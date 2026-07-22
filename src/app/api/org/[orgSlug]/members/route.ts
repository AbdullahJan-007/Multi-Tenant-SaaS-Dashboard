import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const user = await requireUser();
    const { organization } = await requireMembership(user, params.orgSlug);

    const members = await db.membership.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(members);
  } catch (error) {
    return handleApiError(error);
  }
}
