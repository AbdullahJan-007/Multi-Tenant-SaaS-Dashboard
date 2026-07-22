import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { assertPermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).default("")
});

export async function GET(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const user = await requireUser();
    const { organization } = await requireMembership(user, params.orgSlug);

    // The scoping filter is not optional and not an afterthought — it's
    // the entire tenancy model in one line.
    const projects = await db.project.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } }
    });

    return NextResponse.json(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, params.orgSlug);
    assertPermission(membership.role, "PROJECT_WRITE");

    const { name, description } = schema.parse(await req.json());

    const project = await db.project.create({
      data: { name, description, organizationId: organization.id, createdById: user.id }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
