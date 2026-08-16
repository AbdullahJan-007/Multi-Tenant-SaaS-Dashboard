import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { asRole } from "@/lib/types";
import TeamPanel from "@/components/team-panel";
import PageHeader from "@/components/page-header";

export default async function TeamPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const user = await requireUser();
  const { organization, membership } = await requireMembership(user, orgSlug);

  // Defense in depth: the sidebar already hides this link for members,
  // but the page itself must not trust that — always re-check server-side.
  if (!hasPermission(membership.role, "MEMBER_INVITE")) {
    redirect(`/org/${orgSlug}/dashboard`);
  }

  const [members, invites] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" }
    }),
    db.invite.findMany({
      where: { organizationId: organization.id, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <PageHeader title="Team" description={`Manage who has access to ${organization.name}.`} />

      <TeamPanel
        orgSlug={orgSlug}
        currentUserId={user.id}
        currentRole={membership.role}
        initialMembers={members.map((m) => ({
          id: m.id,
          role: asRole(m.role),
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email
        }))}
        initialInvites={invites.map((i) => ({
          id: i.id,
          email: i.email,
          role: asRole(i.role),
          expiresAt: i.expiresAt.toISOString()
        }))}
      />
    </div>
  );
}
