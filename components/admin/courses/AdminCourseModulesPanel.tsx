"use client";

import { useState } from "react";

import AdminConfirmDialog from "@/components/admin/courses/AdminConfirmDialog";
import {
  createLessonApi,
  createModuleApi,
  deleteLessonApi,
  deleteModuleApi,
  reorderLessonsApi,
  reorderModulesApi,
  updateLessonApi,
  updateModuleApi,
  uploadLessonDownloadApi,
} from "@/lib/courses/admin-course-client";
import { COURSE_LESSON_TYPE_LABELS } from "@/lib/courses/course-labels";
import type {
  AdminCourseModuleEntry,
  AdminCourseRecord,
  AdminLessonEntry,
  CertificateProofType,
} from "@/lib/courses/course-types";
import type { CourseLessonType } from "@prisma/client";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminLessonTypeOption =
  | CourseLessonType
  | "certificate_participation"
  | "certificate_achievement";

const LESSON_TYPE_OPTIONS: Array<{
  value: AdminLessonTypeOption;
  label: string;
}> = [
  { value: "video", label: COURSE_LESSON_TYPE_LABELS.video },
  { value: "text", label: COURSE_LESSON_TYPE_LABELS.text },
  { value: "download", label: COURSE_LESSON_TYPE_LABELS.download },
  { value: "recipe", label: COURSE_LESSON_TYPE_LABELS.recipe },
  { value: "certificate_participation", label: "Teilnahmeurkunde" },
  { value: "certificate_achievement", label: "Zertifikat" },
];

const requiredMark = (
  <span className="text-aw-warning" aria-hidden="true">
    {" "}
    *
  </span>
);

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);

  return copy;
}

function parseLessonTypeOption(
  option: AdminLessonTypeOption,
): {
  lessonType: CourseLessonType;
  certificateProofType?: CertificateProofType;
} {
  if (option === "certificate_participation") {
    return { lessonType: "certificate", certificateProofType: "participation" };
  }

  if (option === "certificate_achievement") {
    return { lessonType: "certificate", certificateProofType: "achievement" };
  }

  return { lessonType: option };
}

function lessonTypeOptionFromLesson(
  lesson: AdminLessonEntry,
  courseCertificateType: AdminCourseRecord["certificateType"],
): AdminLessonTypeOption {
  if (lesson.lessonType !== "certificate") {
    return lesson.lessonType;
  }

  if (
    courseCertificateType === "achievement" ||
    courseCertificateType === "masterclass"
  ) {
    return "certificate_achievement";
  }

  return "certificate_participation";
}

type ModuleEditDraft = {
  title: string;
  description: string;
  sortOrder: number;
};

type LessonEditDraft = {
  title: string;
  lessonType: AdminLessonTypeOption;
  vimeoVideoId: string;
  textContent: string;
  recipeTitle: string;
  recipeContent: string;
  certificateProofType: CertificateProofType;
};

type AdminCourseModulesPanelProps = {
  courseId: string;
  course: AdminCourseRecord;
  onReload: () => Promise<void>;
  onError: (message: string) => void;
};

export default function AdminCourseModulesPanel({
  courseId,
  course,
  onReload,
  onError,
}: AdminCourseModulesPanelProps) {
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<AdminLessonTypeOption>("video");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleDraft, setModuleDraft] = useState<ModuleEditDraft | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonEditDraft | null>(null);
  const [pendingModuleDelete, setPendingModuleDelete] =
    useState<AdminCourseModuleEntry | null>(null);
  const [pendingLessonDelete, setPendingLessonDelete] = useState<{
    moduleId: string;
    lesson: AdminLessonEntry;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const lessonTargetModuleId =
    selectedModuleId ?? course.modules[0]?.id ?? null;

  async function handleAddModule() {
    if (!moduleTitle.trim()) {
      return;
    }

    const response = await createModuleApi(courseId, { title: moduleTitle.trim() });

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    setModuleTitle("");
    await onReload();
  }

  async function handleAddLesson() {
    if (!lessonTargetModuleId || !lessonTitle.trim()) {
      return;
    }

    const parsed = parseLessonTypeOption(lessonType);
    const response = await createLessonApi(courseId, lessonTargetModuleId, {
      title: lessonTitle.trim(),
      lessonType: parsed.lessonType,
      certificateProofType: parsed.certificateProofType,
    });

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    setLessonTitle("");
    setExpandedModuleIds((current) => new Set(current).add(lessonTargetModuleId));
    await onReload();
  }

  function startModuleEdit(module: AdminCourseModuleEntry) {
    setEditingModuleId(module.id);
    setModuleDraft({
      title: module.title,
      description: module.description ?? "",
      sortOrder: module.sortOrder,
    });
    setExpandedModuleIds((current) => new Set(current).add(module.id));
  }

  function cancelModuleEdit() {
    setEditingModuleId(null);
    setModuleDraft(null);
  }

  async function saveModuleEdit(moduleId: string) {
    if (!moduleDraft) {
      return;
    }

    setSaving(true);
    const response = await updateModuleApi(courseId, moduleId, {
      title: moduleDraft.title.trim(),
      description: moduleDraft.description.trim() || null,
      sortOrder: moduleDraft.sortOrder,
    });
    setSaving(false);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    cancelModuleEdit();
    await onReload();
  }

  async function confirmModuleDelete() {
    if (!pendingModuleDelete) {
      return;
    }

    setSaving(true);
    const response = await deleteModuleApi(courseId, pendingModuleDelete.id);
    setSaving(false);
    setPendingModuleDelete(null);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    if (editingModuleId === pendingModuleDelete.id) {
      cancelModuleEdit();
    }

    setExpandedModuleIds((current) => {
      const next = new Set(current);
      next.delete(pendingModuleDelete.id);
      return next;
    });
    await onReload();
  }

  function startLessonEdit(lesson: AdminLessonEntry) {
    setEditingLessonId(lesson.id);
    setLessonDraft({
      title: lesson.title,
      lessonType: lessonTypeOptionFromLesson(lesson, course.certificateType),
      vimeoVideoId: lesson.vimeoVideoId ?? "",
      textContent: lesson.textContent ?? "",
      recipeTitle: lesson.recipeTitle ?? "",
      recipeContent: lesson.recipeContent
        ? JSON.stringify(lesson.recipeContent, null, 2)
        : "",
      certificateProofType:
        course.certificateType === "achievement" ||
        course.certificateType === "masterclass"
          ? "achievement"
          : "participation",
    });
  }

  function cancelLessonEdit() {
    setEditingLessonId(null);
    setLessonDraft(null);
  }

  async function saveLessonEdit(moduleId: string, lessonId: string) {
    if (!lessonDraft) {
      return;
    }

    const parsed = parseLessonTypeOption(lessonDraft.lessonType);
    let recipeContent: Record<string, unknown> | null = null;

    if (parsed.lessonType === "recipe" && lessonDraft.recipeContent.trim()) {
      try {
        recipeContent = JSON.parse(lessonDraft.recipeContent) as Record<
          string,
          unknown
        >;
      } catch {
        onError("Rezeptdaten müssen gültiges JSON sein.");
        return;
      }
    }

    setSaving(true);
    const response = await updateLessonApi(courseId, moduleId, lessonId, {
      title: lessonDraft.title.trim(),
      lessonType: parsed.lessonType,
      vimeoVideoId: lessonDraft.vimeoVideoId.trim() || null,
      textContent: lessonDraft.textContent.trim() || null,
      recipeTitle: lessonDraft.recipeTitle.trim() || null,
      recipeContent: parsed.lessonType === "recipe" ? recipeContent : null,
      certificateProofType:
        parsed.lessonType === "certificate"
          ? parsed.certificateProofType ?? lessonDraft.certificateProofType
          : undefined,
    });
    setSaving(false);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    cancelLessonEdit();
    await onReload();
  }

  async function confirmLessonDelete() {
    if (!pendingLessonDelete) {
      return;
    }

    setSaving(true);
    const response = await deleteLessonApi(
      courseId,
      pendingLessonDelete.moduleId,
      pendingLessonDelete.lesson.id,
    );
    setSaving(false);
    setPendingLessonDelete(null);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    if (editingLessonId === pendingLessonDelete.lesson.id) {
      cancelLessonEdit();
    }

    await onReload();
  }

  async function handleMoveModule(moduleId: string, direction: "up" | "down") {
    const index = course.modules.findIndex((module) => module.id === moduleId);

    if (index < 0) {
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = moveItem(course.modules, index, nextIndex);
    const moduleIds = reordered.map((module) => module.id);

    const response = await reorderModulesApi(courseId, moduleIds);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    await onReload();
  }

  async function handleMoveLesson(
    moduleId: string,
    lessonId: string,
    direction: "up" | "down",
  ) {
    const courseModule = course.modules.find((module) => module.id === moduleId);

    if (!courseModule) {
      return;
    }

    const index = courseModule.lessons.findIndex((lesson) => lesson.id === lessonId);

    if (index < 0) {
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = moveItem(courseModule.lessons, index, nextIndex);
    const lessonIds = reordered.map((lesson) => lesson.id);

    const response = await reorderLessonsApi(courseId, moduleId, lessonIds);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    await onReload();
  }

  async function handleUpload(
    moduleId: string,
    lessonId: string,
    file: File,
  ) {
    const formData = new FormData();
    formData.set("file", file);

    const response = await uploadLessonDownloadApi(
      courseId,
      moduleId,
      lessonId,
      formData,
    );

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    await onReload();
  }

  function toggleModule(moduleId: string) {
    setExpandedModuleIds((current) => {
      const next = new Set(current);

      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }

      return next;
    });
  }

  function expandAllModules() {
    setExpandedModuleIds(new Set(course.modules.map((module) => module.id)));
  }

  function collapseAllModules() {
    setExpandedModuleIds(new Set());
  }

  function renderLessonFields(
    moduleId: string,
    lesson: AdminLessonEntry,
    isEditing: boolean,
  ) {
    if (isEditing && lessonDraft) {
      const parsed = parseLessonTypeOption(lessonDraft.lessonType);

      return (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-aw-muted">Titel{requiredMark}</label>
            <input
              className={`${inputClassName} mt-1`}
              value={lessonDraft.title}
              onChange={(e) =>
                setLessonDraft({ ...lessonDraft, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-aw-muted">Typ</label>
            <select
              className={`${selectClassName} mt-1`}
              value={lessonDraft.lessonType}
              onChange={(e) =>
                setLessonDraft({
                  ...lessonDraft,
                  lessonType: e.target.value as AdminLessonTypeOption,
                })
              }
            >
              {LESSON_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {parsed.lessonType === "video" && (
            <div>
              <label className="text-xs text-aw-muted">
                Vimeo-ID oder Embed-URL{requiredMark}
              </label>
              <input
                className={`${inputClassName} mt-1`}
                value={lessonDraft.vimeoVideoId}
                onChange={(e) =>
                  setLessonDraft({
                    ...lessonDraft,
                    vimeoVideoId: e.target.value,
                  })
                }
              />
            </div>
          )}
          {parsed.lessonType === "text" && (
            <div>
              <label className="text-xs text-aw-muted">Textinhalt</label>
              <textarea
                className={`${inputClassName} mt-1 min-h-32`}
                value={lessonDraft.textContent}
                onChange={(e) =>
                  setLessonDraft({
                    ...lessonDraft,
                    textContent: e.target.value,
                  })
                }
              />
            </div>
          )}
          {parsed.lessonType === "download" && (
            <div>
              {lesson.downloadFileName && (
                <p className="text-xs text-aw-muted">
                  Aktuell: {lesson.downloadFileName}
                </p>
              )}
              <input
                type="file"
                className="mt-2 text-sm text-aw-muted"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    void handleUpload(moduleId, lesson.id, file);
                  }
                }}
              />
            </div>
          )}
          {parsed.lessonType === "recipe" && (
            <>
              <div>
                <label className="text-xs text-aw-muted">Rezepttitel</label>
                <input
                  className={`${inputClassName} mt-1`}
                  value={lessonDraft.recipeTitle}
                  onChange={(e) =>
                    setLessonDraft({
                      ...lessonDraft,
                      recipeTitle: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-aw-muted">Rezeptdaten (JSON)</label>
                <textarea
                  className={`${inputClassName} mt-1 min-h-32 font-mono text-xs`}
                  value={lessonDraft.recipeContent}
                  onChange={(e) =>
                    setLessonDraft({
                      ...lessonDraft,
                      recipeContent: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}
          {parsed.lessonType === "certificate" && (
            <div>
              <label className="text-xs text-aw-muted">Abschlussnachweis</label>
              <select
                className={`${selectClassName} mt-1`}
                value={
                  parsed.certificateProofType ?? lessonDraft.certificateProofType
                }
                onChange={(e) =>
                  setLessonDraft({
                    ...lessonDraft,
                    lessonType:
                      e.target.value === "achievement"
                        ? "certificate_achievement"
                        : "certificate_participation",
                    certificateProofType: e.target.value as CertificateProofType,
                  })
                }
              >
                <option value="participation">Teilnahmeurkunde</option>
                <option value="achievement">Zertifikat</option>
              </select>
              <p className="mt-1 text-xs text-aw-muted">
                Der passende Nachweis wird automatisch für den Kurs gesetzt.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={saving}
              onClick={() => void saveLessonEdit(moduleId, lesson.id)}
            >
              Speichern
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={saving}
              onClick={cancelLessonEdit}
            >
              Abbrechen
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {lesson.lessonType === "video" && lesson.vimeoVideoId && (
          <p className="mt-2 text-xs text-aw-muted">
            Vimeo: {lesson.vimeoVideoId}
          </p>
        )}
        {lesson.lessonType === "text" && lesson.textContent && (
          <p className="mt-2 line-clamp-3 text-xs text-aw-muted">
            {lesson.textContent}
          </p>
        )}
        {lesson.lessonType === "download" && lesson.downloadFileName && (
          <p className="mt-2 text-xs text-aw-muted">
            Download: {lesson.downloadFileName}
          </p>
        )}
        {lesson.lessonType === "recipe" && lesson.recipeTitle && (
          <p className="mt-2 text-xs text-aw-muted">
            Rezept: {lesson.recipeTitle}
          </p>
        )}
        {lesson.lessonType === "certificate" && (
          <p className="mt-2 text-xs text-aw-muted">
            Abschlussnachweis:{" "}
            {lessonTypeOptionFromLesson(lesson, course.certificateType) ===
            "certificate_achievement"
              ? "Zertifikat"
              : "Teilnahmeurkunde"}
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-semibold text-aw-cream">
          Modul hinzufügen{requiredMark}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className={inputClassName}
            placeholder="Modultitel *"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
          />
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => void handleAddModule()}
          >
            Modul anlegen
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-semibold text-aw-cream">
          Lektion hinzufügen{requiredMark}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            className={selectClassName}
            value={lessonTargetModuleId ?? ""}
            onChange={(e) => setSelectedModuleId(e.target.value || null)}
          >
            <option value="">Modul wählen</option>
            {course.modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
          <input
            className={inputClassName}
            placeholder="Lektionstitel"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
          />
          <select
            className={selectClassName}
            value={lessonType}
            onChange={(e) =>
              setLessonType(e.target.value as AdminLessonTypeOption)
            }
          >
            {LESSON_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => void handleAddLesson()}
          >
            Lektion anlegen
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-aw-cream">Module & Lektionen</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={expandAllModules}
            >
              Alle öffnen
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={collapseAllModules}
            >
              Alle schließen
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModuleIds.has(module.id);
            const isEditing = editingModuleId === module.id;

            return (
              <div
                key={module.id}
                className="rounded-xl border border-aw-border bg-aw-bg/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => toggleModule(module.id)}
                    aria-expanded={isExpanded}
                  >
                    <span className="text-aw-gold" aria-hidden="true">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                    <span className="font-display text-lg font-bold text-aw-gold">
                      {module.title}
                    </span>
                    <span className="text-xs text-aw-muted">
                      ({module.lessons.length} Lektionen)
                    </span>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() => startModuleEdit(module)}
                      >
                        ✏ Bearbeiten
                      </button>
                    )}
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={moduleIndex === 0}
                      onClick={() => void handleMoveModule(module.id, "up")}
                      aria-label="Modul nach oben"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={moduleIndex === course.modules.length - 1}
                      onClick={() => void handleMoveModule(module.id, "down")}
                      aria-label="Modul nach unten"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                      onClick={() => setPendingModuleDelete(module)}
                    >
                      🗑 Modul löschen
                    </button>
                  </div>
                </div>

                {isEditing && moduleDraft && (
                  <div className="border-t border-aw-border px-4 pb-4">
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-xs text-aw-muted">
                          Modultitel{requiredMark}
                        </label>
                        <input
                          className={`${inputClassName} mt-1`}
                          value={moduleDraft.title}
                          onChange={(e) =>
                            setModuleDraft({
                              ...moduleDraft,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-aw-muted">
                          Modulbeschreibung
                        </label>
                        <textarea
                          className={`${inputClassName} mt-1 min-h-20`}
                          value={moduleDraft.description}
                          onChange={(e) =>
                            setModuleDraft({
                              ...moduleDraft,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-aw-muted">Sortierung</label>
                        <input
                          type="number"
                          className={`${inputClassName} mt-1`}
                          value={moduleDraft.sortOrder}
                          onChange={(e) =>
                            setModuleDraft({
                              ...moduleDraft,
                              sortOrder:
                                Number.parseInt(e.target.value, 10) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={primaryButtonClassName}
                          disabled={saving}
                          onClick={() => void saveModuleEdit(module.id)}
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={saving}
                          onClick={cancelModuleEdit}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="space-y-3 border-t border-aw-border px-4 pb-4 pt-3">
                    {module.lessons.length === 0 ? (
                      <p className="text-sm text-aw-muted">
                        Noch keine Lektionen in diesem Modul.
                      </p>
                    ) : (
                      module.lessons.map((lesson, lessonIndex) => {
                        const lessonEditing = editingLessonId === lesson.id;

                        return (
                          <div
                            key={lesson.id}
                            className="rounded-lg border border-aw-border p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-aw-cream">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-aw-muted">
                                  {lesson.lessonType === "certificate"
                                    ? lessonTypeOptionFromLesson(
                                        lesson,
                                        course.certificateType,
                                      ) === "certificate_achievement"
                                      ? "Zertifikat"
                                      : "Teilnahmeurkunde"
                                    : COURSE_LESSON_TYPE_LABELS[lesson.lessonType]}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {!lessonEditing && (
                                  <button
                                    type="button"
                                    className={secondaryButtonClassName}
                                    onClick={() => {
                                      startLessonEdit(lesson);
                                      setExpandedModuleIds((current) =>
                                        new Set(current).add(module.id),
                                      );
                                    }}
                                  >
                                    ✏ Bearbeiten
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={secondaryButtonClassName}
                                  disabled={lessonIndex === 0}
                                  onClick={() =>
                                    void handleMoveLesson(
                                      module.id,
                                      lesson.id,
                                      "up",
                                    )
                                  }
                                  aria-label="Lektion nach oben"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  className={secondaryButtonClassName}
                                  disabled={
                                    lessonIndex === module.lessons.length - 1
                                  }
                                  onClick={() =>
                                    void handleMoveLesson(
                                      module.id,
                                      lesson.id,
                                      "down",
                                    )
                                  }
                                  aria-label="Lektion nach unten"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
                                  onClick={() =>
                                    setPendingLessonDelete({
                                      moduleId: module.id,
                                      lesson,
                                    })
                                  }
                                >
                                  🗑 Löschen
                                </button>
                              </div>
                            </div>
                            {renderLessonFields(
                              module.id,
                              lesson,
                              lessonEditing,
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <AdminConfirmDialog
        open={pendingModuleDelete !== null}
        title="Modul löschen"
        message={
          pendingModuleDelete
            ? pendingModuleDelete.lessons.length > 0
              ? `Möchtest du dieses Modul wirklich löschen?\n\nMöchtest du auch alle ${pendingModuleDelete.lessons.length} enthaltenen Lektionen löschen?`
              : "Möchtest du dieses Modul wirklich löschen?"
            : ""
        }
        confirmLabel="Modul löschen"
        destructive
        onCancel={() => setPendingModuleDelete(null)}
        onConfirm={() => void confirmModuleDelete()}
      />

      <AdminConfirmDialog
        open={pendingLessonDelete !== null}
        title="Lektion löschen"
        message="Möchtest du diese Lektion wirklich löschen?"
        confirmLabel="Lektion löschen"
        destructive
        onCancel={() => setPendingLessonDelete(null)}
        onConfirm={() => void confirmLessonDelete()}
      />
    </>
  );
}
