import { FolderKanban, ShieldCheck, UserPlus, Users } from "lucide-react";
import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { db } from "@/lib/db";
import Avatar from "@/components/avatar";
import PageHeader from "@/components/page-header";

export default async function DashboardPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const user = await requireUser();
  const { organization, membership } = await requireMembership(user, orgSlug);

  const [projectCount, memberCount, pendingInviteCount] = await Promise.all([
    db.project.count({ where: { organizationId: organization.id } }),
    db.membership.count({ where: { organizationId: organization.id } }),
    db.invite.count({ where: { organizationId: organization.id, status: "PENDING" } })
  ]);

  const stats = [
    { label: "Projects", value: projectCount, Icon: FolderKanban },
    { label: "Members", value: memberCount, Icon: Users },
    { label: "Pending invites", value: pendingInviteCount, Icon: UserPlus }
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div>
          <p className="text-sm text-ink/50">
            {greeting}, {user.name.split(" ")[0]}
          </p>
          <h1 className="font-display text-2xl font-medium tracking-tight">{organization.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accentSoft text-accentStrong">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="mt-3 font-display text-2xl font-semibold">{value}</div>
            <div className="mt-0.5 text-sm text-ink/55">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-surface p-5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accentSoft text-accentStrong">
          <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-sm font-medium">Data isolation, by construction</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/55">
            These numbers come from queries filtered by organization ID{" "}
            <code className="rounded-sm bg-canvas px-1 py-0.5 font-mono text-xs text-ink/70">{organization.id}</code>.
            No org can read another org&rsquo;s projects, members, or invites — the tenant
            boundary is enforced in the data layer, not just the interface.
          </p>
        </div>
      </div>
    </div>
  );
}
