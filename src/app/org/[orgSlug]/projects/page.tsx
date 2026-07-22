import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { db } from "@/lib/db";
import ProjectsBoard from "@/components/projects-board";

export default async function ProjectsPage({ params }: { params: { orgSlug: string } }) {
  const user = await requireUser();
  const { organization, membership } = await requireMembership(user, params.orgSlug);

  const projects = await db.project.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="font-display text-2xl font-medium">Projects</h1>
      <p className="mt-1 text-sm text-ink/60">Scoped to {organization.name}. No other workspace can see these.</p>

      <ProjectsBoard
        orgSlug={params.orgSlug}
        role={membership.role}
        initialProjects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          createdByName: p.createdBy.name,
          createdAt: p.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
