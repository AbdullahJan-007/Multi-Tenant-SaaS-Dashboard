"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { hasPermission } from "@/lib/rbac";

type Member = { id: string; role: Role; userId: string; name: string; email: string };
type Invite = { id: string; email: string; role: Role; expiresAt: string };

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
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canChangeRoles = hasPermission(currentRole, "MEMBER_CHANGE_ROLE");
  const canRemove = hasPermission(currentRole, "MEMBER_REMOVE");

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
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
    setNotice(`Invite link (also logged server-side): ${body.inviteUrl}`);
    setForm({ email: "", role: "MEMBER" });
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
    <div className="mt-8 space-y-8">
      <form onSubmit={sendInvite} className="card space-y-3 p-4">
        <p className="text-sm font-medium">Invite someone</p>
        <div className="flex gap-3">
          <input
            required
            type="email"
            placeholder="teammate@company.com"
            className="field-input flex-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <select
            className="field-input w-32"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={loading} className="btn-primary shrink-0">
            {loading ? "Sending…" : "Send invite"}
          </button>
        </div>
        {error && <p className="text-sm text-warn">{error}</p>}
        {notice && <p className="break-all text-xs text-ink/50">{notice}</p>}
      </form>

      {invites.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Pending invites</p>
          <ul className="divide-y divide-line card">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm">{invite.email}</p>
                  <p className="text-xs text-ink/40">
                    {invite.role.toLowerCase()} · expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => revokeInvite(invite.id)}
                  className="text-xs font-medium text-ink/50 hover:text-warn"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Members</p>
        <ul className="divide-y divide-line card">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm">
                  {member.name} {member.userId === currentUserId && <span className="text-ink/40">(you)</span>}
                </p>
                <p className="text-xs text-ink/40">{member.email}</p>
              </div>

              <div className="flex items-center gap-3">
                {canChangeRoles ? (
                  <select
                    className="field-input w-28 py-1"
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value as Role)}
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <span className="rounded-sm bg-canvas px-2 py-1 text-xs font-medium uppercase text-ink/50">
                    {member.role}
                  </span>
                )}

                {canRemove && member.userId !== currentUserId && (
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-xs font-medium text-ink/50 hover:text-warn"
                  >
                    Remove
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
