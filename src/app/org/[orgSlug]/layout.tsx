import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { requireMembership, listUserOrganizations, OrgNotFoundError } from "@/lib/org";
import Sidebar from "@/components/sidebar";

export default async function OrgLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const user = await requireUser();

  let membership;
  let organization;
  try {
    ({ membership, organization } = await requireMembership(user, orgSlug));
  } catch (error) {
    if (error instanceof OrgNotFoundError) notFound();
    throw error;
  }

  const orgs = await listUserOrganizations(user);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        currentSlug={organization.slug}
        currentRole={membership.role}
        orgs={orgs}
        userName={user.name}
      />
      <main className="flex-1 bg-canvas">{children}</main>
    </div>
  );
}
