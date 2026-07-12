"use client";

import { useState } from "react";

import { COURSE_LESSON_TYPE_LABELS } from "@/lib/courses/course-labels";
import type { CourseModuleEntry } from "@/lib/courses/course-types";

function ModuleItem({
  module,
  defaultOpen,
}: {
  module: CourseModuleEntry;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-aw-border bg-aw-surface/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>
          <span className="font-display text-lg font-bold text-aw-gold">
            {module.title}
          </span>
          <span className="ml-2 text-xs text-aw-muted">
            {module.lessons.length} Lektion
            {module.lessons.length === 1 ? "" : "en"}
          </span>
        </span>
        <span className="shrink-0 rounded-md border border-aw-border px-3 py-1 text-xs text-aw-cream">
          {open ? "Modul schließen" : "Modul öffnen"}
        </span>
      </button>

      {open && (
        <div className="border-t border-aw-border px-5 py-4">
          {module.description && (
            <p className="mb-3 text-sm text-aw-muted">{module.description}</p>
          )}
          <ul className="space-y-2">
            {module.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-aw-border bg-aw-bg/40 px-4 py-2 text-sm"
              >
                <span className="text-aw-cream">{lesson.title}</span>
                <span className="shrink-0 text-xs text-aw-muted">
                  {COURSE_LESSON_TYPE_LABELS[lesson.lessonType]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function PublicCourseModules({
  modules,
}: {
  modules: CourseModuleEntry[];
}) {
  if (modules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {modules.map((module, index) => (
        <ModuleItem key={module.id} module={module} defaultOpen={index === 0} />
      ))}
    </div>
  );
}
