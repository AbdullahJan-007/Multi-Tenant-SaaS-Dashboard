"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Loader2, Plus, Trash2 } from "lucide-react";
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
    <div className="space-y-6">
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
          <button type="submit" disabled={loading} className="btn-primary shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : <Plus className="h-4 w-4" strokeWidth={2} />}
            Add
          </button>
        </form>
      )}

      {error && <p className="text-sm text-warn">{error}</p>}

      {projects.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accentSoft text-accentStrong">
            <FolderKanban className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-ink/55">
            {canWrite ? "No projects yet — add the first one above." : "No projects yet. Ask an admin to add one."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line card">
          {projects.map((project) => (
            <li key={project.id} className="group flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accentSoft text-accentStrong">
                  <FolderKanban className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  {project.description && (
                    <p className="mt-0.5 truncate text-sm text-ink/50">{project.description}</p>
                  )}
                  <p className="mt-1 text-xs text-ink/35">Added by {project.createdByName}</p>
                </div>
              </div>
              {canDelete && (
                <button
                  onClick={() => deleteProject(project.id)}
                  className="shrink-0 rounded-sm p-1.5 text-ink/30 opacity-0 transition-all hover:bg-warnSoft hover:text-warn group-hover:opacity-100"
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
