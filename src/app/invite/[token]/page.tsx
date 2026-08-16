import { MailX, TriangleAlert } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { asRole } from "@/lib/types";
import AcceptInviteButton from "@/components/accept-invite-button";
import RoleBadge from "@/components/role-badge";
import Link from "next/link";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await db.invite.findUnique({
    where: { token },
    include: { organization: true, invitedBy: { select: { name: true } } }
  });

  const user = await getCurrentUser();

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="card max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-warnSoft text-warn">
            <MailX className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-lg font-medium">Invite not found</h1>
          <p className="mt-2 text-sm text-ink/55">
            This invite link has expired, been revoked, or already been used.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card max-w-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accentSoft font-display text-lg font-semibold text-accentStrong">
          {invite.organization.name.trim()[0]?.toUpperCase() ?? "?"}
        </div>
        <h1 className="font-display text-lg font-medium">
          Join {invite.organization.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          {invite.invitedBy.name} invited <span className="font-medium text-ink">{invite.email}</span> to this workspace.
        </p>
        <div className="mt-3 flex justify-center">
          <RoleBadge role={asRole(invite.role)} />
        </div>

        <div className="mt-7">
          {!user ? (
            <div className="space-y-2">
              <p className="mb-3 text-xs text-ink/45">Sign in or create an account with this email to continue.</p>
              <Link href={`/login?next=/invite/${invite.token}`} className="btn-primary w-full">
                Sign in
              </Link>
              <Link href={`/register?next=/invite/${invite.token}`} className="btn-secondary w-full">
                Create account
              </Link>
            </div>
          ) : user.email !== invite.email ? (
            <p className="flex items-start gap-1.5 text-left text-sm text-warn">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              You&rsquo;re signed in as {user.email}, but this invite is for {invite.email}.
            </p>
          ) : (
            <AcceptInviteButton token={invite.token} />
          )}
        </div>
      </div>
    </div>
  );
}
