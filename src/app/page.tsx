import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listUserOrganizations } from "@/lib/org";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = await listUserOrganizations(user);
  const firstOrg = orgs[0];
  redirect(firstOrg ? `/org/${firstOrg.slug}/dashboard` : "/org/new");
}