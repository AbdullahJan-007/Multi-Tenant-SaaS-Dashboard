"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { hasPermission } from "@/lib/rbac";

type OrgSummary = { id: string; name: string; slug: string; role: Role };

export default function Sidebar({
  currentSlug,
  currentRole,
  orgs,
  userName
}: {
  currentSlug: string;
  currentRole: Role;
  orgs: OrgSummary[];
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const nav = [
    { href: `/org/${currentSlug}/dashboard`, label: "Dashboard" },
    { href: `/org/${currentSlug}/projects`, label: "Projects" },
    ...(hasPermission(currentRole, "MEMBER_INVITE")
      ? [{ href: `/org/${currentSlug}/team`, label: "Team" }]
      : [])
  ];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-white">
      <div className="border-b border-line p-4">
        <label className="field-label text-xs uppercase tracking-wide">Workspace</label>
        <select
          className="field-input text-sm"
          value={currentSlug}
          onChange={(e) => router.push(`/org/${e.target.value}/dashboard`)}
        >
          {orgs.map((org) => (
            <option key={org.id} value={org.slug}>
              {org.name}
            </option>
          ))}
        </select>
        <Link
          href="/org/new"
          className="mt-2 inline-block text-xs font-medium text-ink/50 hover:text-ink"
        >
          + New workspace
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-accentSoft text-accent" : "text-ink/70 hover:bg-canvas hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="truncate text-sm text-ink/70">{userName}</span>
          <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink/50">
            {currentRole}
          </span>
        </div>
        <button onClick={signOut} className="btn-secondary w-full text-xs">
          Sign out
        </button>
      </div>
    </aside>
  );
}
