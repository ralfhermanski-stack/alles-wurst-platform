"use client";

import {
  FORUM_PERMISSION_KIND_LABELS,
  FORUM_PERMISSION_KINDS,
  permissionKindAllowsOptionalCourse,
  permissionKindRequiresCourse,
  type ForumPermissionKind,
} from "@/lib/forums/forum-permission-kinds";
import type { AdminForumCourseOption } from "@/lib/forums/forum-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export type ForumFormValues = {
  title: string;
  description: string;
  permissionKind: ForumPermissionKind;
  courseId: string;
  writeEnabled: boolean;
  isActive: boolean;
  sortOrder: number;
};

export const EMPTY_FORUM_FORM: ForumFormValues = {
  title: "",
  description: "",
  permissionKind: "general_registered",
  courseId: "",
  writeEnabled: true,
  isActive: true,
  sortOrder: 100,
};

type AdminForumFormProps = {
  values: ForumFormValues;
  courses: AdminForumCourseOption[];
  submitLabel: string;
  cancelLabel?: string;
  onChange: (values: ForumFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

export default function AdminForumForm({
  values,
  courses,
  submitLabel,
  cancelLabel = "Abbrechen",
  onChange,
  onSubmit,
  onCancel,
}: AdminForumFormProps) {
  const showCourseSelect = permissionKindRequiresCourse(values.permissionKind);
  const showOptionalCourseSelect = permissionKindAllowsOptionalCourse(
    values.permissionKind,
  );

  const courseOptions = courses.filter((course) => {
    if (values.permissionKind === "course") {
      return course.courseType !== "minikurs";
    }

    if (values.permissionKind === "mini_course_global") {
      return course.courseType === "minikurs";
    }

    return true;
  });

  function updateField<K extends keyof ForumFormValues>(
    key: K,
    value: ForumFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-aw-muted">Forumname *</label>
        <input
          className={inputClassName}
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="z. B. Vorstellungsforum"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-aw-muted">Beschreibung</label>
        <textarea
          className={`${inputClassName} min-h-20`}
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Kurzbeschreibung für die Community-Übersicht"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-aw-muted">
          Berechtigungsart *
        </label>
        <select
          className={inputClassName}
          value={values.permissionKind}
          onChange={(e) =>
            updateField("permissionKind", e.target.value as ForumPermissionKind)
          }
        >
          {FORUM_PERMISSION_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {FORUM_PERMISSION_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>

      {(showCourseSelect || showOptionalCourseSelect) && (
        <div>
          <label className="mb-1 block text-sm text-aw-muted">
            {showCourseSelect ? "Kurs *" : "Minikurs (optional)"}
          </label>
          <select
            className={inputClassName}
            value={values.courseId}
            onChange={(e) => updateField("courseId", e.target.value)}
          >
            <option value="">
              {showOptionalCourseSelect
                ? "Alle Minikurs-Teilnehmer"
                : "Kurs wählen …"}
            </option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
                {course.courseType === "minikurs" ? " (Minikurs)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            className="h-4 w-4 accent-aw-gold"
            checked={values.writeEnabled}
            onChange={(e) => updateField("writeEnabled", e.target.checked)}
          />
          Schreiben erlaubt
        </label>

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            className="h-4 w-4 accent-aw-gold"
            checked={values.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
          />
          Aktiv
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm text-aw-muted">Reihenfolge</label>
        <input
          type="number"
          className={inputClassName}
          value={values.sortOrder}
          onChange={(e) =>
            updateField("sortOrder", Number.parseInt(e.target.value, 10) || 0)
          }
        />
        <p className="mt-1 text-xs text-aw-muted">
          Kleinere Zahlen erscheinen weiter oben.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryButtonClassName}
          onClick={onSubmit}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </div>
  );
}
