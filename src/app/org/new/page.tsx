"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Couldn't create the workspace.");
      return;
    }

    router.push(`/org/${body.slug}/dashboard`);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="mb-1 font-display text-xl font-medium">Name your workspace</h1>
        <p className="mb-6 text-sm text-ink/60">
          This becomes your organization. You'll be its owner and can invite teammates next.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="field-label" htmlFor="name">Workspace name</label>
            <input
              id="name"
              required
              autoFocus
              placeholder="Acme Inc"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-warn">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
