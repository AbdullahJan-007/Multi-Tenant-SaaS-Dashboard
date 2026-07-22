import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listUserOrganizations } from "@/lib/org";

export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orgs = await listUserOrganizations(user);
  redirect(orgs.length > 0 ? `/org/${orgs[0].slug}/dashboard` : "/org/new");
}
