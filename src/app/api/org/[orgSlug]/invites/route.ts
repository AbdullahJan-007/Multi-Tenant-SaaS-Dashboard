import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { assertPermission } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER")
});

const INVITE_TTL_DAYS = 7;

export async function GET(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, params.orgSlug);
    assertPermission(membership.role, "MEMBER_INVITE");

    const invites = await db.invite.findMany({
      where: { organizationId: organization.id, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(invites);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  try {
    const user = await requireUser();
    const { organization, membership } = await requireMembership(user, params.orgSlug);
    assertPermission(membership.role, "MEMBER_INVITE");

    const { email, role } = schema.parse(await req.json());

    // A non-owner can't mint an invite for a role higher than their own —
    // an ADMIN inviting someone as OWNER would be a privilege escalation.
    if (role === "ADMIN" && membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins and owners can invite admins." }, { status: 403 });
    }

    const alreadyMember = await db.membership.findFirst({
      where: { organizationId: organization.id, user: { email } }
    });
    if (alreadyMember) {
      return NextResponse.json({ error: "This person is already a member." }, { status: 409 });
    }

    const existingPending = await db.invite.findFirst({
      where: { organizationId: organization.id, email, status: "PENDING" }
    });
    if (existingPending) {
      return NextResponse.json({ error: "An invite is already pending for this email." }, { status: 409 });
    }

    const invite = await db.invite.create({
      data: {
        email,
        role,
        organizationId: organization.id,
        invitedById: user.id,
        token: nanoid(32),
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;

    // Swap this for a real email provider (Resend, Postmark) in production.
    // Logging keeps the demo runnable with zero external config.
    console.log(`[invite] ${email} invited to ${organization.name}: ${inviteUrl}`);

    return NextResponse.json({ ...invite, inviteUrl }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
