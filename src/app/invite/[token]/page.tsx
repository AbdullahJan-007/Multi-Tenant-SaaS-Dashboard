import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import AcceptInviteButton from "@/components/accept-invite-button";
import Link from "next/link";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invite = await db.invite.findUnique({
    where: { token: params.token },
    include: { organization: true, invitedBy: { select: { name: true } } }
  });

  const user = await getCurrentUser();

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-sm p-6 text-center">
          <h1 className="font-display text-lg font-medium">Invite not found</h1>
          <p className="mt-2 text-sm text-ink/60">
            This invite link has expired, been revoked, or already used.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-sm p-6 text-center">
        <h1 className="font-display text-lg font-medium">
          Join {invite.organization.name}
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          {invite.invitedBy.name} invited <span className="font-medium text-ink">{invite.email}</span> to
          join as <span className="font-medium text-ink">{invite.role.toLowerCase()}</span>.
        </p>

        <div className="mt-6">
          {!user ? (
            <div className="space-y-2">
              <p className="text-xs text-ink/50">Sign in or create an account with this email to continue.</p>
              <Link href={`/login?next=/invite/${invite.token}`} className="btn-primary w-full">
                Sign in
              </Link>
              <Link href={`/register?next=/invite/${invite.token}`} className="btn-secondary w-full">
                Create account
              </Link>
            </div>
          ) : user.email !== invite.email ? (
            <p className="text-sm text-warn">
              You're signed in as {user.email}, but this invite is for {invite.email}.
            </p>
          ) : (
            <AcceptInviteButton token={invite.token} />
          )}
        </div>
      </div>
    </div>
  );
}
