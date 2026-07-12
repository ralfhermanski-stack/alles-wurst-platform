"use client";

import { useEffect, useState } from "react";

import AdminConfirmDialog from "@/components/admin/courses/AdminConfirmDialog";
import AdminForumForm, {
  EMPTY_FORUM_FORM,
  type ForumFormValues,
} from "@/components/admin/forums/AdminForumForm";
import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  FORUM_PERMISSION_KIND_LABELS,
} from "@/lib/forums/forum-permission-kinds";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import type {
  AdminForumCourseOption,
  AdminForumEntry,
} from "@/lib/forums/forum-types";
import type { CourseSummary } from "@/lib/courses/course-types";
import {
  inputClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function forumToFormValues(forum: AdminForumEntry): ForumFormValues {
  return {
    title: forum.title,
    description: forum.description ?? "",
    permissionKind: forum.permissionKind,
    courseId: forum.courseId ?? "",
    writeEnabled: forum.writeEnabled,
    isActive: forum.isActive,
    sortOrder: forum.sortOrder,
  };
}

function buildPayload(values: ForumFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    permissionKind: values.permissionKind,
    courseId: values.courseId || null,
    writeEnabled: values.writeEnabled,
    isActive: values.isActive,
    sortOrder: values.sortOrder,
  };
}

export default function AdminForumManager() {
  const [forums, setForums] = useState<AdminForumEntry[]>([]);
  const [courses, setCourses] = useState<AdminForumCourseOption[]>([]);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<ForumFormValues>(EMPTY_FORUM_FORM);
  const [editingForumId, setEditingForumId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ForumFormValues>(EMPTY_FORUM_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminForumEntry | null>(null);
  const [sortOrderDrafts, setSortOrderDrafts] = useState<Record<string, string>>(
    {},
  );

  function getSortOrderDraft(forum: AdminForumEntry): string {
    return sortOrderDrafts[forum.id] ?? String(forum.sortOrder);
  }

  async function loadData() {
    setLoading(true);
    setError(null);

    const [forumsResponse, settingsResponse, coursesResponse] = await Promise.all([
      adminFetch<AdminForumEntry[]>("/api/admin/forums"),
      adminFetch<{ enabled: boolean }>("/api/admin/forums/settings"),
      adminFetch<CourseSummary[]>("/api/admin/courses"),
    ]);

    if (!forumsResponse.success) {
      setError(forumsResponse.error.message);
      setLoading(false);
      return;
    }

    setForums(forumsResponse.data);
    setSortOrderDrafts({});
    setGlobalEnabled(
      settingsResponse.success ? settingsResponse.data.enabled : false,
    );

    if (coursesResponse.success) {
      setCourses(
        coursesResponse.data.map((course) => ({
          id: course.id,
          title: course.title,
          courseType: course.courseType,
        })),
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function showSuccess(message: string) {
    setSuccess(message);
    setError(null);
  }

  async function createForum() {
    const response = await adminFetch<unknown>("/api/admin/forums", {
      method: "POST",
      body: JSON.stringify(buildPayload(createForm)),
    });

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    setCreateForm(EMPTY_FORUM_FORM);
    showSuccess("Forum wurde erstellt.");
    await loadData();
  }

  async function saveForumEdit() {
    if (!editingForumId) {
      return;
    }

    const response = await adminFetch<unknown>(
      `/api/admin/forums/${editingForumId}`,
      {
        method: "PATCH",
        body: JSON.stringify(buildPayload(editForm)),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    setEditingForumId(null);
    showSuccess("Forum wurde gespeichert.");
    await loadData();
  }

  async function toggleGlobalForums(enabled: boolean) {
    const response = await adminFetch<unknown>("/api/admin/forums/settings", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    setGlobalEnabled(enabled);
    showSuccess(
      enabled
        ? "Globale Minikurs-Foren aktiviert."
        : "Globale Minikurs-Foren deaktiviert.",
    );
    await loadData();
  }

  async function saveSortOrder(forum: AdminForumEntry) {
    const parsed = Number.parseInt(getSortOrderDraft(forum), 10);

    if (Number.isNaN(parsed)) {
      setError("Reihenfolge muss eine Zahl sein.");
      setSuccess(null);
      return;
    }

    const response = await adminFetch<unknown>(`/api/admin/forums/${forum.id}`, {
      method: "PATCH",
      body: JSON.stringify({ sortOrder: parsed }),
    });

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    showSuccess(`Reihenfolge für „${forum.title}" gespeichert.`);
    await loadData();
  }

  async function moveForum(forum: AdminForumEntry, direction: "up" | "down") {
    const response = await adminFetch<unknown>(
      `/api/admin/forums/${forum.id}/reorder`,
      {
        method: "POST",
        body: JSON.stringify({ direction }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    showSuccess("Reihenfolge aktualisiert.");
    await loadData();
  }

  async function toggleForumActive(forum: AdminForumEntry) {
    const response = await adminFetch<unknown>(`/api/admin/forums/${forum.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !forum.isActive }),
    });

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    showSuccess(forum.isActive ? "Forum deaktiviert." : "Forum aktiviert.");
    await loadData();
  }

  async function confirmDeleteForum() {
    if (!deleteTarget) {
      return;
    }

    const response = await adminFetch<unknown>(
      `/api/admin/forums/${deleteTarget.id}`,
      { method: "DELETE" },
    );

    setDeleteTarget(null);

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    if (editingForumId === deleteTarget.id) {
      setEditingForumId(null);
    }

    showSuccess("Forum wurde gelöscht.");
    await loadData();
  }

  function startEdit(forum: AdminForumEntry) {
    setEditingForumId(forum.id);
    setEditForm(forumToFormValues(forum));
    setError(null);
    setSuccess(null);
  }

  function membershipLabel(forum: AdminForumEntry): string {
    if (!forum.requiredMembershipRole) {
      return "—";
    }

    return MEMBERSHIP_ROLE_LABELS[forum.requiredMembershipRole];
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Foren</h1>
        <p className="mt-1 text-sm text-aw-muted">
          Foren erstellen, bearbeiten und Berechtigungen verwalten.
        </p>
      </div>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <label className="flex items-center gap-3 text-sm text-aw-cream">
          <input
            type="checkbox"
            className="h-4 w-4 accent-aw-gold"
            checked={globalEnabled}
            onChange={(e) => void toggleGlobalForums(e.target.checked)}
          />
          Gemeinsame Minikurs-Foren verwenden
        </label>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-semibold text-aw-cream">Forum erstellen</h2>
        <div className="mt-4">
          <AdminForumForm
            values={createForm}
            courses={courses}
            submitLabel="Forum anlegen"
            onChange={setCreateForm}
            onSubmit={() => void createForum()}
          />
        </div>
      </section>

      {editingForumId && (
        <section className="rounded-xl border border-aw-gold/40 bg-aw-surface/40 p-5">
          <h2 className="font-semibold text-aw-cream">Forum bearbeiten</h2>
          <div className="mt-4">
            <AdminForumForm
              values={editForm}
              courses={courses}
              submitLabel="Speichern"
              onChange={setEditForm}
              onSubmit={() => void saveForumEdit()}
              onCancel={() => setEditingForumId(null)}
            />
          </div>
        </section>
      )}

      {success && <p className="text-sm text-green-400">{success}</p>}
      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface text-aw-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Reihenfolge</th>
              <th className="px-4 py-3 font-semibold">Forum</th>
              <th className="px-4 py-3 font-semibold">Berechtigung</th>
              <th className="px-4 py-3 font-semibold">Kurs / Club</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Themen</th>
              <th className="px-4 py-3 font-semibold">Beiträge</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-aw-border bg-aw-surface/30">
            {forums.map((forum, index) => (
              <tr key={forum.id} className={forum.isActive ? "" : "opacity-60"}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={index === 0}
                      aria-label="Nach oben"
                      onClick={() => void moveForum(forum, "up")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={index === forums.length - 1}
                      aria-label="Nach unten"
                      onClick={() => void moveForum(forum, "down")}
                    >
                      ↓
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      className={`${inputClassName} w-20`}
                      value={getSortOrderDraft(forum)}
                      onChange={(e) =>
                        setSortOrderDrafts((current) => ({
                          ...current,
                          [forum.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      onClick={() => void saveSortOrder(forum)}
                    >
                      Speichern
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-aw-cream">{forum.title}</p>
                  <p className="text-xs text-aw-muted">/{forum.slug}</p>
                  {forum.description && (
                    <p className="mt-1 text-xs text-aw-muted line-clamp-2">
                      {forum.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-aw-cream">
                  {FORUM_PERMISSION_KIND_LABELS[forum.permissionKind]}
                  <p className="mt-1 text-xs text-aw-muted">
                    {forum.writeRuleLabel}
                  </p>
                </td>
                <td className="px-4 py-3 text-aw-muted">
                  {forum.courseTitle ?? membershipLabel(forum)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      forum.isActive
                        ? "text-green-400"
                        : "text-aw-muted"
                    }
                  >
                    {forum.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-aw-cream">{forum.threadCount}</td>
                <td className="px-4 py-3 text-aw-cream">{forum.postCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      onClick={() => startEdit(forum)}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      onClick={() => void toggleForumActive(forum)}
                    >
                      {forum.isActive ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
                      onClick={() => setDeleteTarget(forum)}
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && forums.length === 0 && (
        <p className="text-sm text-aw-muted">Noch keine Foren vorhanden.</p>
      )}

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Forum löschen?"
        message={
          deleteTarget
            ? `„${deleteTarget.title}" und alle Themen/Beiträge unwiderruflich löschen?`
            : ""
        }
        confirmLabel="Löschen"
        destructive
        onConfirm={() => void confirmDeleteForum()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
