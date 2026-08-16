import { Crown, ShieldCheck, User } from "lucide-react";
import type { Role } from "@/lib/types";

const CONFIG: Record<Role, { label: string; className: string; Icon: typeof Crown }> = {
  OWNER: { label: "Owner", className: "badge-owner", Icon: Crown },
  ADMIN: { label: "Admin", className: "badge-admin", Icon: ShieldCheck },
  MEMBER: { label: "Member", className: "badge-member", Icon: User }
};

export default function RoleBadge({ role }: { role: Role }) {
  const { label, className, Icon } = CONFIG[role];
  return (
    <span className={`badge ${className}`}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
