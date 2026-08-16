import { requireUser } from "@/lib/session";
import { requireMembership } from "@/lib/org";
import { db } from "@/lib/db";
import ProjectsBoard from "@/components/projects-board";
import PageHeader from "@/components/page-header";

export default async function ProjectsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const user = await requireUser();
  const { organization, membership } = await requireMembership(user, orgSlug);

  const projects = await db.project.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <PageHeader
        title="Projects"
        description={`Scoped to ${organization.name}. No other workspace can see these.`}
      />

      <ProjectsBoard
        orgSlug={orgSlug}
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
