"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

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
        {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
        {loading ? "Joining…" : "Accept invite"}
      </button>
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-left text-sm text-warn">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      )}
    </div>
  );
}
