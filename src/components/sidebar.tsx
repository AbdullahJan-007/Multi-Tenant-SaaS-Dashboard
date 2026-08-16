"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronsUpDown, FolderKanban, LayoutDashboard, LogOut, Plus, Users } from "lucide-react";
import type { Role } from "@/lib/types";
import { hasPermission } from "@/lib/rbac";
import Avatar from "@/components/avatar";
import RoleBadge from "@/components/role-badge";

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
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentOrg = orgs.find((org) => org.slug === currentSlug);

  const nav = [
    { href: `/org/${currentSlug}/dashboard`, label: "Dashboard", Icon: LayoutDashboard },
    { href: `/org/${currentSlug}/projects`, label: "Projects", Icon: FolderKanban },
    ...(hasPermission(currentRole, "MEMBER_INVITE")
      ? [{ href: `/org/${currentSlug}/team`, label: "Team", Icon: Users }]
      : [])
  ];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line p-3" ref={switcherRef}>
        <div className="relative">
          <button
            onClick={() => setSwitcherOpen(!switcherOpen)}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-canvas"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accentStrong font-display text-sm font-semibold text-white">
              {currentOrg?.name.trim()[0]?.toUpperCase() ?? "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight">{currentOrg?.name}</span>
              <span className="block text-xs text-ink/45">Workspace</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink/35" strokeWidth={1.75} />
          </button>

          {switcherOpen && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-card">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSwitcherOpen(false);
                    router.push(`/org/${org.slug}/dashboard`);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-canvas ${
                    org.slug === currentSlug ? "text-ink" : "text-ink/70"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accentSoft font-display text-xs font-semibold text-accentStrong">
                    {org.name.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="truncate">{org.name}</span>
                </button>
              ))}
              <div className="my-1 border-t border-line" />
              <Link
                href="/org/new"
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-canvas hover:text-ink"
                onClick={() => setSwitcherOpen(false)}
              >
                <Plus className="h-4 w-4" strokeWidth={1.75} />
                New workspace
              </Link>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-accentSoft text-accentStrong" : "text-ink/65 hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-3 flex items-center gap-2.5 px-1">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">{userName}</p>
            <div className="mt-0.5">
              <RoleBadge role={currentRole} />
            </div>
          </div>
        </div>
        <button onClick={signOut} className="btn-secondary w-full text-xs">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
