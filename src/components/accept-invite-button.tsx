"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Couldn't accept this invite.");
      return;
    }

    router.push(`/org/${body.orgSlug}/dashboard`);
    router.refresh();
  }

  return (
    <div>
      <button onClick={accept} disabled={loading} className="btn-primary w-full">
        {loading ? "Joining…" : "Accept invite"}
      </button>
      {error && <p className="mt-2 text-sm text-warn">{error}</p>}
    </div>
  );
}
