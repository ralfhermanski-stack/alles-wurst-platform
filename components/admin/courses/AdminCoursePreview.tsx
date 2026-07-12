"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  COURSE_LESSON_TYPE_LABELS,
  COURSE_STATUS_LABELS,
  COURSE_TYPE_LABELS,
  formatCoursePrice,
} from "@/lib/courses/course-labels";
import { getAdminCourseApi } from "@/lib/courses/admin-course-client";
import type {
  AdminCourseRecord,
  AdminLessonEntry,
} from "@/lib/courses/course-types";
import { buildVimeoEmbedUrl } from "@/lib/courses/vimeo-embed";
import Markdown from "@/components/ui/Markdown";

type AdminCoursePreviewProps = {
  courseId: string;
};

function LessonCard({ lesson }: { lesson: AdminLessonEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="overflow-hidden rounded-lg border border-aw-border bg-aw-bg/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="font-medium text-aw-cream">
          {lesson.title}{" "}
          <span className="text-xs text-aw-muted">
            ({COURSE_LESSON_TYPE_LABELS[lesson.lessonType]})
          </span>
        </span>
        <span className="shrink-0 text-xs text-aw-gold">
          {open ? "Schließen" : "Lektion ansehen"}
        </span>
      </button>

      {open && (
        <div className="border-t border-aw-border px-4 py-4">
          {lesson.description && (
            <p className="mb-3 text-sm text-aw-muted">{lesson.description}</p>
          )}

          {lesson.lessonType === "video" &&
            (lesson.vimeoVideoId ? (
              <div className="aspect-video overflow-hidden rounded-lg">
                <iframe
                  src={buildVimeoEmbedUrl(lesson.vimeoVideoId)}
                  title={lesson.title}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-sm text-aw-warning">
                Noch keine Vimeo-ID hinterlegt.
              </p>
            ))}

          {lesson.lessonType === "text" &&
            (lesson.textContent ? (
              <Markdown content={lesson.textContent} />
            ) : (
              <p className="text-sm text-aw-muted">Noch kein Text hinterlegt.</p>
            ))}

          {lesson.lessonType === "download" && (
            <p className="text-sm text-aw-muted">
              {lesson.downloadFileName
                ? `Download: ${lesson.downloadFileName}`
                : "Download-Datei fehlt noch."}
            </p>
          )}

          {lesson.lessonType === "recipe" && (
            <p className="text-sm text-aw-muted">
              {lesson.recipeTitle ?? "Rezept ohne Titel"}
            </p>
          )}

          {lesson.lessonType === "certificate" && (
            <p className="text-sm text-aw-gold">
              Zertifikat-Lektion (nach Kursabschluss verfügbar).
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function ModuleSection({
  module,
  defaultOpen,
}: {
  module: AdminCourseRecord["modules"][number];
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
            <p className="mb-4 text-sm text-aw-muted">{module.description}</p>
          )}
          <ul className="space-y-3">
            {module.lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function AdminCoursePreview({ courseId }: AdminCoursePreviewProps) {
  const [course, setCourse] = useState<AdminCourseRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await getAdminCourseApi(courseId);

      if (!response.success || !response.data) {
        setError(
          response.success ? "Kurs nicht gefunden." : response.error.message,
        );
        return;
      }

      setCourse(response.data);
    })();
  }, [courseId]);

  const priceLabel = useMemo(
    () =>
      course
        ? formatCoursePrice(course.priceCents, course.priceCurrency)
        : null,
    [course],
  );

  if (error) {
    return <p className="p-8 text-sm text-aw-warning">{error}</p>;
  }

  if (!course) {
    return <p className="p-8 text-sm text-aw-muted">Vorschau wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/kurse/${courseId}`}
          className="text-sm text-aw-gold hover:text-aw-cream"
        >
          ← Zurück zum Editor
        </Link>
        <p className="rounded-full border border-aw-gold/40 px-3 py-1 text-xs text-aw-gold">
          Admin-Vorschau (wie Teilnehmeransicht)
        </p>
      </div>

      {course.hasCover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/courses/covers/${course.id}`}
          alt={course.title}
          className="mb-6 h-56 w-full rounded-xl border border-aw-border object-cover"
        />
      )}

      <p className="text-xs uppercase text-aw-muted">
        {COURSE_TYPE_LABELS[course.courseType]} ·{" "}
        {COURSE_STATUS_LABELS[course.status]}
        {priceLabel ? ` · ${priceLabel}` : ""}
      </p>
      <h1 className="font-display text-3xl font-bold text-aw-cream">
        {course.title}
      </h1>
      {course.subtitle && (
        <p className="mt-2 text-lg text-aw-muted">{course.subtitle}</p>
      )}
      {course.shortDescription && (
        <p className="mt-3 text-sm leading-7 text-aw-cream">
          {course.shortDescription}
        </p>
      )}

      {course.description && (
        <div className="mt-6">
          <Markdown content={course.description} />
        </div>
      )}

      {course.prerequisites && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Voraussetzungen
          </h2>
          <Markdown content={course.prerequisites} className="mt-2" />
        </div>
      )}

      {course.requiredEquipment && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Was du zuhause benötigst
          </h2>
          <Markdown content={course.requiredEquipment} className="mt-2" />
        </div>
      )}

      {course.estimatedMinutes ? (
        <p className="mt-6 text-sm text-aw-muted">
          Geschätzte Dauer: ca. {Math.round(course.estimatedMinutes / 60)} Std.
        </p>
      ) : null}

      <h2 className="mt-10 font-display text-2xl font-bold text-aw-cream">
        Kursaufbau
      </h2>
      <div className="mt-4 space-y-4">
        {course.modules.map((module, index) => (
          <ModuleSection
            key={module.id}
            module={module}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
