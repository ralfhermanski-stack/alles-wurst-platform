"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  createCourseGroupApi,
  createCourseSubgroupApi,
  deleteCourseGroupApi,
  deleteCourseSubgroupApi,
  listCourseGroupsApi,
  listCourseSubgroupsApi,
  updateCourseGroupApi,
  updateCourseSubgroupApi,
  uploadCourseGroupImageApi,
  uploadCourseSubgroupImageApi,
} from "@/lib/course-groups/course-group-admin-client";
import type {
  CourseGroupRecord,
  CourseSubgroupRecord,
} from "@/lib/course-groups/course-group-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import AdminGroupImageUpload from "@/components/admin/courses/AdminGroupImageUpload";

type GroupDraft = {
  name: string;
  slug: string;
  shortDescription: string;
  levelLabel: string;
  sortOrder: number;
  isActive: boolean;
};

type SubgroupDraft = {
  courseGroupId: string;
  name: string;
  slug: string;
  shortDescription: string;
  sortOrder: number;
  isActive: boolean;
};

function emptyGroupDraft(): GroupDraft {
  return {
    name: "",
    slug: "",
    shortDescription: "",
    levelLabel: "",
    sortOrder: 100,
    isActive: true,
  };
}

function groupToDraft(group: CourseGroupRecord): GroupDraft {
  return {
    name: group.name,
    slug: group.slug,
    shortDescription: group.shortDescription ?? "",
    levelLabel: group.levelLabel ?? "",
    sortOrder: group.sortOrder,
    isActive: group.isActive,
  };
}

function subgroupToDraft(subgroup: CourseSubgroupRecord): SubgroupDraft {
  return {
    courseGroupId: subgroup.courseGroupId,
    name: subgroup.name,
    slug: subgroup.slug,
    shortDescription: subgroup.shortDescription ?? "",
    sortOrder: subgroup.sortOrder,
    isActive: subgroup.isActive,
  };
}

export default function AdminCourseGroupManager() {
  const [groups, setGroups] = useState<CourseGroupRecord[]>([]);
  const [subgroups, setSubgroups] = useState<CourseSubgroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState<GroupDraft>(emptyGroupDraft());
  const [newSubgroup, setNewSubgroup] = useState<SubgroupDraft>({
    ...emptyGroupDraft(),
    courseGroupId: "",
  });
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingSubgroupId, setEditingSubgroupId] = useState<string | null>(
    null,
  );
  const [groupDraft, setGroupDraft] = useState<GroupDraft>(emptyGroupDraft());
  const [subgroupDraft, setSubgroupDraft] = useState<SubgroupDraft>({
    ...emptyGroupDraft(),
    courseGroupId: "",
  });
  const [imageVersion, setImageVersion] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [groupsResult, subgroupsResult] = await Promise.all([
      listCourseGroupsApi(),
      listCourseSubgroupsApi(),
    ]);

    if (!groupsResult.success) {
      setError(groupsResult.error.message);
      setLoading(false);
      return;
    }

    if (!subgroupsResult.success) {
      setError(subgroupsResult.error.message);
      setLoading(false);
      return;
    }

    setGroups(groupsResult.data);
    setSubgroups(subgroupsResult.data);
    setSelectedGroupId((current) => current ?? groupsResult.data[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError(null);

      const [groupsResult, subgroupsResult] = await Promise.all([
        listCourseGroupsApi(),
        listCourseSubgroupsApi(),
      ]);

      if (!active) {
        return;
      }

      if (!groupsResult.success) {
        setError(groupsResult.error.message);
        setLoading(false);
        return;
      }

      if (!subgroupsResult.success) {
        setError(subgroupsResult.error.message);
        setLoading(false);
        return;
      }

      setGroups(groupsResult.data);
      setSubgroups(subgroupsResult.data);
      setSelectedGroupId(
        (current) => current ?? groupsResult.data[0]?.id ?? null,
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const visibleSubgroups = selectedGroupId
    ? subgroups.filter((subgroup) => subgroup.courseGroupId === selectedGroupId)
    : [];

  async function handleCreateGroup() {
    if (!newGroup.name.trim()) {
      return;
    }

    const result = await createCourseGroupApi({
      name: newGroup.name.trim(),
      slug: newGroup.slug.trim() || undefined,
      shortDescription: newGroup.shortDescription.trim() || null,
      levelLabel: newGroup.levelLabel.trim() || null,
      sortOrder: newGroup.sortOrder,
      isActive: newGroup.isActive,
    });

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setNewGroup(emptyGroupDraft());
    await loadData();
    setSelectedGroupId(result.data.id);
  }

  async function handleSaveGroup(groupId: string) {
    const result = await updateCourseGroupApi(groupId, {
      name: groupDraft.name.trim(),
      slug: groupDraft.slug.trim() || undefined,
      shortDescription: groupDraft.shortDescription.trim() || null,
      levelLabel: groupDraft.levelLabel.trim() || null,
      sortOrder: groupDraft.sortOrder,
      isActive: groupDraft.isActive,
    });

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setEditingGroupId(null);
    await loadData();
  }

  async function handleDeleteGroup(group: CourseGroupRecord) {
    if (group.courseCount > 0) {
      const result = await updateCourseGroupApi(group.id, { isActive: false });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      await loadData();
      return;
    }

    if (!window.confirm(`Lernpfad „${group.name}" wirklich löschen?`)) {
      return;
    }

    const result = await deleteCourseGroupApi(group.id);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    if (selectedGroupId === group.id) {
      setSelectedGroupId(null);
    }

    await loadData();
  }

  async function handleGroupImageUpload(groupId: string, file: File): Promise<boolean> {
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadCourseGroupImageApi(groupId, formData);

    if (!result.success) {
      setError(result.error.message);
      return false;
    }

    setImageVersion((value) => value + 1);
    await loadData();
    return true;
  }

  async function handleCreateSubgroup() {
    const groupId = newSubgroup.courseGroupId || selectedGroupId;

    if (!groupId || !newSubgroup.name.trim()) {
      return;
    }

    const result = await createCourseSubgroupApi({
      courseGroupId: groupId,
      name: newSubgroup.name.trim(),
      slug: newSubgroup.slug.trim() || undefined,
      shortDescription: newSubgroup.shortDescription.trim() || null,
      sortOrder: newSubgroup.sortOrder,
      isActive: newSubgroup.isActive,
    });

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setNewSubgroup({ ...emptyGroupDraft(), courseGroupId: groupId });
    await loadData();
  }

  async function handleSaveSubgroup(subgroupId: string) {
    const result = await updateCourseSubgroupApi(subgroupId, {
      courseGroupId: subgroupDraft.courseGroupId,
      name: subgroupDraft.name.trim(),
      slug: subgroupDraft.slug.trim() || undefined,
      shortDescription: subgroupDraft.shortDescription.trim() || null,
      sortOrder: subgroupDraft.sortOrder,
      isActive: subgroupDraft.isActive,
    });

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setEditingSubgroupId(null);
    await loadData();
  }

  async function handleDeleteSubgroup(subgroup: CourseSubgroupRecord) {
    if (subgroup.courseCount > 0) {
      const result = await updateCourseSubgroupApi(subgroup.id, {
        isActive: false,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      await loadData();
      return;
    }

    if (!window.confirm(`Modul „${subgroup.name}" wirklich löschen?`)) {
      return;
    }

    const result = await deleteCourseSubgroupApi(subgroup.id);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    await loadData();
  }

  async function handleSubgroupImageUpload(
    subgroupId: string,
    file: File,
  ): Promise<boolean> {
    const formData = new FormData();
    formData.set("file", file);

    const result = await uploadCourseSubgroupImageApi(subgroupId, formData);

    if (!result.success) {
      setError(result.error.message);
      return false;
    }

    setImageVersion((value) => value + 1);
    await loadData();
    return true;
  }

  async function moveGroup(group: CourseGroupRecord, direction: -1 | 1) {
    const index = groups.findIndex((entry) => entry.id === group.id);
    const neighbor = groups[index + direction];

    if (!neighbor) {
      return;
    }

    const [first, second] =
      direction === -1 ? [neighbor, group] : [group, neighbor];

    const [firstResult, secondResult] = await Promise.all([
      updateCourseGroupApi(first.id, { sortOrder: second.sortOrder }),
      updateCourseGroupApi(second.id, { sortOrder: first.sortOrder }),
    ]);

    if (!firstResult.success || !secondResult.success) {
      const message = !firstResult.success
        ? firstResult.error.message
        : !secondResult.success
          ? secondResult.error.message
          : "Sortierung konnte nicht gespeichert werden.";

      setError(message);
      return;
    }

    await loadData();
  }

  async function moveSubgroup(
    subgroup: CourseSubgroupRecord,
    direction: -1 | 1,
  ) {
    const siblings = subgroups.filter(
      (entry) => entry.courseGroupId === subgroup.courseGroupId,
    );
    const index = siblings.findIndex((entry) => entry.id === subgroup.id);
    const neighbor = siblings[index + direction];

    if (!neighbor) {
      return;
    }

    const [first, second] =
      direction === -1 ? [neighbor, subgroup] : [subgroup, neighbor];

    const [firstResult, secondResult] = await Promise.all([
      updateCourseSubgroupApi(first.id, { sortOrder: second.sortOrder }),
      updateCourseSubgroupApi(second.id, { sortOrder: first.sortOrder }),
    ]);

    if (!firstResult.success || !secondResult.success) {
      const message = !firstResult.success
        ? firstResult.error.message
        : !secondResult.success
          ? secondResult.error.message
          : "Sortierung konnte nicht gespeichert werden.";

      setError(message);
      return;
    }

    await loadData();
  }

  if (loading) {
    return <p className="p-8 text-sm text-aw-muted">Gruppen werden geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-aw-muted">
            <Link href="/admin/kurse" className="hover:text-aw-gold">
              Kurse
            </Link>
            {" / Lernpfade"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-aw-cream">
            Lernpfade verwalten
          </h1>
          <p className="mt-2 text-sm text-aw-muted">
            Lernpfade erscheinen auf der Akademie-Seite. Pro Pfad kannst du ein
            Titelbild, optional Module und zugeordnete Kurse pflegen (beim Kurs
            unter Gruppe wählen). Ohne eigenes Bild wird ein Platzhalter angezeigt.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-semibold text-aw-cream">Neuer Lernpfad</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className={labelClassName} htmlFor="new-group-name">
              Name
            </label>
            <input
              id="new-group-name"
              className={`${inputClassName} mt-2`}
              value={newGroup.name}
              onChange={(e) =>
                setNewGroup((draft) => ({ ...draft, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="new-group-slug">
              Slug (optional)
            </label>
            <input
              id="new-group-slug"
              className={`${inputClassName} mt-2`}
              value={newGroup.slug}
              onChange={(e) =>
                setNewGroup((draft) => ({ ...draft, slug: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="new-group-level">
              Level-Badge
            </label>
            <input
              id="new-group-level"
              className={`${inputClassName} mt-2`}
              value={newGroup.levelLabel}
              placeholder="z. B. Einsteiger"
              onChange={(e) =>
                setNewGroup((draft) => ({ ...draft, levelLabel: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClassName} htmlFor="new-group-sort">
              Sortierung
            </label>
            <input
              id="new-group-sort"
              type="number"
              className={`${inputClassName} mt-2`}
              value={newGroup.sortOrder}
              onChange={(e) =>
                setNewGroup((draft) => ({
                  ...draft,
                  sortOrder: Number.parseInt(e.target.value, 10) || 0,
                }))
              }
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={() => void handleCreateGroup()}
            >
              Anlegen
            </button>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClassName} htmlFor="new-group-desc">
            Kurzbeschreibung
          </label>
          <textarea
            id="new-group-desc"
            className={`${inputClassName} mt-2 min-h-20`}
            value={newGroup.shortDescription}
            onChange={(e) =>
              setNewGroup((draft) => ({
                ...draft,
                shortDescription: e.target.value,
              }))
            }
          />
          <p className="mt-2 text-xs text-aw-muted">
            Das Titelbild lädst du nach dem Anlegen im jeweiligen Lernpfad hoch.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-aw-cream">Lernpfade</h2>

        {groups.length === 0 ? (
          <p className="text-sm text-aw-muted">Noch keine Lernpfade angelegt.</p>
        ) : (
          groups.map((group, index) => {
            const isEditing = editingGroupId === group.id;
            const isSelected = selectedGroupId === group.id;

            return (
              <article
                key={group.id}
                className={`rounded-xl border p-5 ${
                  isSelected
                    ? "border-aw-gold/50 bg-aw-surface/60"
                    : "border-aw-border bg-aw-surface/30"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <h3 className="font-display text-lg font-bold text-aw-cream">
                      {group.name}
                    </h3>
                    <p className="mt-1 text-xs text-aw-muted">
                      /{group.slug}
                      {group.levelLabel ? ` · ${group.levelLabel}` : ""} ·{" "}
                      {group.subgroupCount} Module · {group.courseCount} Kurse
                      {!group.isActive && " · inaktiv"}
                    </p>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={index === 0}
                      onClick={() => void moveGroup(group, -1)}
                      aria-label="Nach oben"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={index === groups.length - 1}
                      onClick={() => void moveGroup(group, 1)}
                      aria-label="Nach unten"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setGroupDraft(groupToDraft(group));
                      }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      onClick={() => void handleDeleteGroup(group)}
                    >
                      {group.courseCount > 0 ? "Deaktivieren" : "Löschen"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <AdminGroupImageUpload
                    title="Lernpfad-Bild"
                    entityName={group.name}
                    imageUrl={`/api/course-groups/${group.id}/image?v=${imageVersion}`}
                    imageFileName={group.imageFileName}
                    hasImage={group.hasImage}
                    onUpload={(file) => handleGroupImageUpload(group.id, file)}
                  />
                </div>

                {isEditing && (
                  <div className="mt-4 grid gap-4 border-t border-aw-border pt-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClassName}>Name</label>
                      <input
                        className={`${inputClassName} mt-2`}
                        value={groupDraft.name}
                        onChange={(e) =>
                          setGroupDraft((draft) => ({
                            ...draft,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Slug</label>
                      <input
                        className={`${inputClassName} mt-2`}
                        value={groupDraft.slug}
                        onChange={(e) =>
                          setGroupDraft((draft) => ({
                            ...draft,
                            slug: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Level-Badge</label>
                      <input
                        className={`${inputClassName} mt-2`}
                        value={groupDraft.levelLabel}
                        placeholder="z. B. Fortgeschritten"
                        onChange={(e) =>
                          setGroupDraft((draft) => ({
                            ...draft,
                            levelLabel: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Sortierung</label>
                      <input
                        type="number"
                        className={`${inputClassName} mt-2`}
                        value={groupDraft.sortOrder}
                        onChange={(e) =>
                          setGroupDraft((draft) => ({
                            ...draft,
                            sortOrder: Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <input
                        id={`group-active-${group.id}`}
                        type="checkbox"
                        checked={groupDraft.isActive}
                        onChange={(e) =>
                          setGroupDraft((draft) => ({
                            ...draft,
                            isActive: e.target.checked,
                          }))
                        }
                      />
                      <label
                        htmlFor={`group-active-${group.id}`}
                        className="text-sm text-aw-cream"
                      >
                        Aktiv
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClassName}>Kurzbeschreibung</label>
                      <textarea
                        className={`${inputClassName} mt-2 min-h-20`}
                        value={groupDraft.shortDescription}
                        onChange={(e) =>
                          setGroupDraft((draft) => ({
                            ...draft,
                            shortDescription: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <button
                        type="button"
                        className={primaryButtonClassName}
                        onClick={() => void handleSaveGroup(group.id)}
                      >
                        Speichern
                      </button>
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() => setEditingGroupId(null)}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {selectedGroupId && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-semibold text-aw-cream">
            Module von{" "}
            {groups.find((g) => g.id === selectedGroupId)?.name ?? "Gruppe"}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClassName}>Name</label>
              <input
                className={`${inputClassName} mt-2`}
                value={newSubgroup.name}
                onChange={(e) =>
                  setNewSubgroup((draft) => ({ ...draft, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClassName}>Slug (optional)</label>
              <input
                className={`${inputClassName} mt-2`}
                value={newSubgroup.slug}
                onChange={(e) =>
                  setNewSubgroup((draft) => ({ ...draft, slug: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClassName}>Sortierung</label>
              <input
                type="number"
                className={`${inputClassName} mt-2`}
                value={newSubgroup.sortOrder}
                onChange={(e) =>
                  setNewSubgroup((draft) => ({
                    ...draft,
                    sortOrder: Number.parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className={primaryButtonClassName}
                onClick={() => void handleCreateSubgroup()}
              >
                Modul anlegen
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {visibleSubgroups.length === 0 ? (
              <p className="text-sm text-aw-muted">
                Noch keine Module in diesem Lernpfad.
              </p>
            ) : (
              visibleSubgroups.map((subgroup, index) => {
                const isEditing = editingSubgroupId === subgroup.id;

                return (
                  <article
                    key={subgroup.id}
                    className="rounded-lg border border-aw-border bg-aw-bg/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-aw-cream">
                          {subgroup.name}
                        </h3>
                        <p className="mt-1 text-xs text-aw-muted">
                          /{subgroup.slug} · {subgroup.courseCount} Kurse
                          {!subgroup.isActive && " · inaktiv"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={index === 0}
                          onClick={() => void moveSubgroup(subgroup, -1)}
                          aria-label="Nach oben"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={index === visibleSubgroups.length - 1}
                          onClick={() => void moveSubgroup(subgroup, 1)}
                          aria-label="Nach unten"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          onClick={() => {
                            setEditingSubgroupId(subgroup.id);
                            setSubgroupDraft(subgroupToDraft(subgroup));
                          }}
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          onClick={() => void handleDeleteSubgroup(subgroup)}
                        >
                          {subgroup.courseCount > 0 ? "Deaktivieren" : "Löschen"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <AdminGroupImageUpload
                        title="Modulbild"
                        entityName={subgroup.name}
                        imageUrl={`/api/course-subgroups/${subgroup.id}/image?v=${imageVersion}`}
                        imageFileName={subgroup.imageFileName}
                        hasImage={subgroup.hasImage}
                        onUpload={(file) =>
                          handleSubgroupImageUpload(subgroup.id, file)
                        }
                      />
                    </div>

                    {isEditing && (
                      <div className="mt-4 grid gap-4 border-t border-aw-border pt-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClassName}>Name</label>
                          <input
                            className={`${inputClassName} mt-2`}
                            value={subgroupDraft.name}
                            onChange={(e) =>
                              setSubgroupDraft((draft) => ({
                                ...draft,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Slug</label>
                          <input
                            className={`${inputClassName} mt-2`}
                            value={subgroupDraft.slug}
                            onChange={(e) =>
                              setSubgroupDraft((draft) => ({
                                ...draft,
                                slug: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Lernpfad</label>
                          <select
                            className={`${inputClassName} mt-2`}
                            value={subgroupDraft.courseGroupId}
                            onChange={(e) =>
                              setSubgroupDraft((draft) => ({
                                ...draft,
                                courseGroupId: e.target.value,
                              }))
                            }
                          >
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-8">
                          <input
                            id={`subgroup-active-${subgroup.id}`}
                            type="checkbox"
                            checked={subgroupDraft.isActive}
                            onChange={(e) =>
                              setSubgroupDraft((draft) => ({
                                ...draft,
                                isActive: e.target.checked,
                              }))
                            }
                          />
                          <label
                            htmlFor={`subgroup-active-${subgroup.id}`}
                            className="text-sm text-aw-cream"
                          >
                            Aktiv
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClassName}>Kurzbeschreibung</label>
                          <textarea
                            className={`${inputClassName} mt-2 min-h-20`}
                            value={subgroupDraft.shortDescription}
                            onChange={(e) =>
                              setSubgroupDraft((draft) => ({
                                ...draft,
                                shortDescription: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex gap-2 sm:col-span-2">
                          <button
                            type="button"
                            className={primaryButtonClassName}
                            onClick={() => void handleSaveSubgroup(subgroup.id)}
                          >
                            Speichern
                          </button>
                          <button
                            type="button"
                            className={secondaryButtonClassName}
                            onClick={() => setEditingSubgroupId(null)}
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
