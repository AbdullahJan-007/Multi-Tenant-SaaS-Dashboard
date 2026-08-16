"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronDown, Copy, Loader2, Mail, UserPlus, X } from "lucide-react";
import type { Role } from "@/lib/types";
import { hasPermission } from "@/lib/rbac";
import Avatar from "@/components/avatar";
import RoleBadge from "@/components/role-badge";

type Member = { id: string; role: Role; userId: string; name: string; email: string };
type Invite = { id: string; email: string; role: Role; expiresAt: string };

function RoleSelect({
  value,
  onChange,
  includeOwner
}: {
  value: Role;
  onChange: (role: Role) => void;
  includeOwner?: boolean;
}) {
  return (
    <div className="relative">
      <select
        className="field-input appearance-none py-1.5 pl-3 pr-8 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value as Role)}
      >
        {includeOwner && <option value="OWNER">Owner</option>}
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/35" strokeWidth={2} />
    </div>
  );
}

export default function TeamPanel({
  orgSlug,
  currentUserId,
  currentRole,
  initialMembers,
  initialInvites
}: {
  orgSlug: string;
  currentUserId: string;
  currentRole: Role;
  initialMembers: Member[];
  initialInvites: Invite[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [form, setForm] = useState<{ email: string; role: Role }>({ email: "", role: "MEMBER" });
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const canChangeRoles = hasPermission(currentRole, "MEMBER_CHANGE_ROLE");
  const canRemove = hasPermission(currentRole, "MEMBER_REMOVE");
  const canInviteAsAdmin = currentRole === "OWNER";

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteUrl(null);
    setLoading(true);

    const res = await fetch(`/api/org/${orgSlug}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Couldn't send the invite.");
      return;
    }

    setInvites([{ id: body.id, email: body.email, role: body.role, expiresAt: body.expiresAt }, ...invites]);
    setInviteUrl(body.inviteUrl);
    setForm({ email: "", role: "MEMBER" });
  }

  function copyInviteUrl() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function revokeInvite(id: string) {
    const previous = invites;
    setInvites(invites.filter((i) => i.id !== id));
    const res = await fetch(`/api/org/${orgSlug}/invites/${id}`, { method: "DELETE" });
    if (!res.ok) setInvites(previous);
  }

  async function changeRole(memberId: string, role: Role) {
    const previous = members;
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role } : m)));

    const res = await fetch(`/api/org/${orgSlug}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });

    if (!res.ok) {
      setMembers(previous);
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't change that member's role.");
    }
  }

  async function removeMember(memberId: string) {
    const previous = members;
    setMembers(members.filter((m) => m.id !== memberId));

    const res = await fetch(`/api/org/${orgSlug}/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) {
      setMembers(previous);
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't remove that member.");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={sendInvite} className="card space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <UserPlus className="h-4 w-4 text-ink/50" strokeWidth={1.75} />
          Invite someone
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" strokeWidth={1.75} />
            <input
              required
              type="email"
              placeholder="teammate@company.com"
              className="field-input pl-9"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="w-32">
            <RoleSelect
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
              includeOwner={false}
            />
            {!canInviteAsAdmin && (
              <span className="sr-only">Only an owner can invite someone as an admin.</span>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary shrink-0">
            {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {loading ? "Sending…" : "Send invite"}
          </button>
        </div>
        {!canInviteAsAdmin && (
          <p className="text-xs text-ink/40">Only an owner can invite someone in as an admin.</p>
        )}

        {error && (
          <p className="flex items-start gap-1.5 text-sm text-warn">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            {error}
          </p>
        )}

        {inviteUrl && (
          <div className="flex items-center gap-2 rounded-md bg-accentSoft px-3 py-2 text-xs text-accentStrong">
            <span className="min-w-0 flex-1 truncate">{inviteUrl}</span>
            <button
              type="button"
              onClick={copyInviteUrl}
              className="flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-1 font-medium transition-colors hover:bg-white/50"
            >
              {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </form>

      {invites.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink/70">Pending invites</p>
          <ul className="divide-y divide-line card">
            {invites.map((invite) => (
              <li key={invite.id} className="group flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/30">
                    <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-ink/40">
                      {invite.role === "ADMIN" ? "Admin" : "Member"} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite(invite.id)}
                  className="shrink-0 rounded-sm p-1.5 text-ink/30 opacity-0 transition-all hover:bg-warnSoft hover:text-warn group-hover:opacity-100"
                  aria-label={`Revoke invite to ${invite.email}`}
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink/70">Members</p>
        <ul className="divide-y divide-line card">
          {members.map((member) => (
            <li key={member.id} className="group flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} />
                <div>
                  <p className="text-sm">
                    {member.name} {member.userId === currentUserId && <span className="text-ink/40">(you)</span>}
                  </p>
                  <p className="text-xs text-ink/40">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canChangeRoles ? (
                  <RoleSelect value={member.role} onChange={(role) => changeRole(member.id, role)} includeOwner />
                ) : (
                  <RoleBadge role={member.role} />
                )}

                {canRemove && member.userId !== currentUserId && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="shrink-0 rounded-sm p-1.5 text-ink/30 opacity-0 transition-all hover:bg-warnSoft hover:text-warn group-hover:opacity-100"
                    aria-label={`Remove ${member.name}`}
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
