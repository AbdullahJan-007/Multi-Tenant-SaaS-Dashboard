import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { db } from "@/lib/db";

export default async function DashboardPage({ params }: { params: { orgSlug: string } }) {
  const user = await requireUser();
  const { organization, membership } = await requireMembership(user, params.orgSlug);

  const [projectCount, memberCount, pendingInviteCount] = await Promise.all([
    db.project.count({ where: { organizationId: organization.id } }),
    db.membership.count({ where: { organizationId: organization.id } }),
    db.invite.count({ where: { organizationId: organization.id, status: "PENDING" } })
  ]);

  const stats = [
    { label: "Projects", value: projectCount },
    { label: "Members", value: memberCount },
    { label: "Pending invites", value: pendingInviteCount }
  ];

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">{organization.name}</h1>
      <p className="mt-1 text-sm text-ink/60">
        Signed in as {user.name} · role <span className="font-medium text-ink">{membership.role}</span>
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="text-2xl font-semibold">{stat.value}</div>
            <div className="mt-1 text-sm text-ink/60">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-5">
        <h2 className="mb-1 text-sm font-medium">Data isolation, by construction</h2>
        <p className="text-sm text-ink/60">
          These numbers come from queries filtered by organization ID{" "}
          <code className="rounded-sm bg-canvas px-1 py-0.5 text-xs">{organization.id}</code>.
          No org can read another org's projects, members, or invites — the tenant
          boundary is enforced in the data layer, not just the UI.
        </p>
      </div>
    </div>
  );
}
