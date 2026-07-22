"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { hasPermission } from "@/lib/rbac";

type Project = {
  id: string;
  name: string;
  description: string;
  createdByName: string;
  createdAt: string;
};

export default function ProjectsBoard({
  orgSlug,
  role,
  initialProjects
}: {
  orgSlug: string;
  role: Role;
  initialProjects: Project[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canWrite = hasPermission(role, "PROJECT_WRITE");
  const canDelete = hasPermission(role, "PROJECT_DELETE");

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/org/${orgSlug}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Couldn't create the project.");
      return;
    }

    setProjects([{ ...body, createdByName: "You" }, ...projects]);
    setForm({ name: "", description: "" });
    router.refresh();
  }

  async function deleteProject(id: string) {
    const previous = projects;
    setProjects(projects.filter((p) => p.id !== id));

    const res = await fetch(`/api/org/${orgSlug}/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setProjects(previous);
      setError("Couldn't delete the project.");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {canWrite && (
        <form onSubmit={createProject} className="card flex items-start gap-3 p-4">
          <div className="flex-1">
            <input
              required
              placeholder="Project name"
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex-[2]">
            <input
              placeholder="Short description"
              className="field-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Adding…" : "Add"}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-warn">{error}</p>}

      {projects.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink/60">No projects yet. {canWrite ? "Add the first one above." : "Ask an admin to add one."}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line card">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project.name}</p>
                {project.description && (
                  <p className="mt-0.5 truncate text-sm text-ink/55">{project.description}</p>
                )}
                <p className="mt-1 text-xs text-ink/40">Added by {project.createdByName}</p>
              </div>
              {canDelete && (
                <button
                  onClick={() => deleteProject(project.id)}
                  className="shrink-0 text-xs font-medium text-ink/50 hover:text-warn"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
