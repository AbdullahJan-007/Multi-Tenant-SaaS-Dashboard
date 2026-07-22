import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleApiError } from "@/lib/api-error";

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const user = await requireUser();

    const invite = await db.invite.findUnique({
      where: { token: params.token },
      include: { organization: true }
    });

    if (!invite || invite.status !== "PENDING") {
      return NextResponse.json({ error: "This invite is no longer valid." }, { status: 410 });
    }

    if (invite.expiresAt < new Date()) {
      await db.invite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }

    if (invite.email !== user.email) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email}. Sign in with that address to accept it.` },
        { status: 403 }
      );
    }

    const organization = await db.$transaction(async (tx) => {
      await tx.membership.upsert({
        where: { userId_organizationId: { userId: user.id, organizationId: invite.organizationId } },
        update: {}, // already a member — leave their existing role alone
        create: { userId: user.id, organizationId: invite.organizationId, role: invite.role }
      });
      await tx.invite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
      return invite.organization;
    });

    return NextResponse.json({ orgSlug: organization.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
