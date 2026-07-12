"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import VimeoPlayer from "@/components/courses/VimeoPlayer";
import {
  fetchLessonApi,
  updateLessonProgressApi,
} from "@/lib/courses/course-client";
import { COURSE_LESSON_TYPE_LABELS } from "@/lib/courses/course-labels";
import type { LessonDetail } from "@/lib/courses/course-types";
import { ShareButton } from "@/components/sharing/ShareModal";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type LessonViewProps = {
  courseSlug: string;
  lessonSlug: string;
};

export default function LessonView({ courseSlug, lessonSlug }: LessonViewProps) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetchLessonApi(courseSlug, lessonSlug);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      if (!response.data) {
        setError("Lektion nicht gefunden.");
        return;
      }

      setLesson(response.data);
      void updateLessonProgressApi(courseSlug, lessonSlug, response.data.completed);
    })();
  }, [courseSlug, lessonSlug]);

  async function handleComplete() {
    setSaving(true);
    const response = await updateLessonProgressApi(courseSlug, lessonSlug, true);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setLesson((current) =>
      current ? { ...current, completed: true } : current,
    );
  }

  if (error) {
    return <p className="p-8 text-sm text-aw-warning">{error}</p>;
  }

  if (!lesson) {
    return <p className="p-8 text-sm text-aw-muted">Lektion wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href={`/mein-bereich/kurse/${courseSlug}`}
        className="text-sm text-aw-gold hover:text-aw-cream"
      >
        ← Zurück zum Kurs
      </Link>

      <p className="mt-4 text-xs uppercase text-aw-muted">
        {lesson.moduleTitle} · {COURSE_LESSON_TYPE_LABELS[lesson.lessonType]}
      </p>
      <h1 className="font-display text-3xl font-bold text-aw-cream">
        {lesson.title}
      </h1>

      <div className="mt-8 space-y-6">
        {lesson.lessonType === "video" && lesson.vimeoEmbedUrl && (
          <VimeoPlayer embedUrl={lesson.vimeoEmbedUrl} title={lesson.title} />
        )}

        {lesson.lessonType === "text" && lesson.textContent && (
          <div className="prose prose-invert max-w-none rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm leading-7 text-aw-cream">
            {lesson.textContent.split("\n").map((paragraph) => (
              <p key={paragraph} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {lesson.lessonType === "download" && lesson.hasDownload && (
          <a
            href={`/api/courses/downloads/${lesson.id}`}
            className="inline-flex rounded-lg border border-aw-gold/40 px-4 py-2 text-sm text-aw-gold hover:bg-aw-gold/10"
          >
            Download: {lesson.downloadFileName ?? "Datei"}
          </a>
        )}

        {lesson.lessonType === "recipe" && (
          <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-6">
            <h2 className="font-semibold text-aw-cream">
              {lesson.recipeTitle ?? "Rezept"}
            </h2>
            {lesson.recipeContent && (
              <pre className="mt-4 overflow-x-auto text-xs text-aw-muted">
                {JSON.stringify(lesson.recipeContent, null, 2)}
              </pre>
            )}
          </div>
        )}

        {lesson.lessonType === "certificate" && (
          <div className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-6">
            <h2 className="font-semibold text-aw-gold">Zertifikat</h2>
            <p className="mt-2 text-sm text-aw-muted">
              {lesson.certificateStatus === "issued"
                ? "Dein Zertifikat wurde ausgestellt."
                : lesson.certificateStatus === "available"
                  ? "Dein Kurs ist abgeschlossen. Du kannst jetzt dein Zertifikat abrufen."
                  : "Das Zertifikat wird nach Kursabschluss freigeschaltet."}
            </p>
            {lesson.certificateId &&
              (lesson.certificateStatus === "available" ||
                lesson.certificateStatus === "issued") && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={`/mein-bereich/zertifikate/${lesson.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`${primaryButtonClassName} inline-flex`}
                  >
                    {lesson.certificateStatus === "issued"
                      ? "Zertifikat anzeigen"
                      : "Zertifikat abrufen"}
                  </a>
                  {lesson.certificateStatus === "issued" ? (
                    <ShareButton
                      label="Zertifikat teilen"
                      mode="certificate"
                      certificateId={lesson.certificateId}
                      title={lesson.title}
                    />
                  ) : null}
                </div>
              )}
          </div>
        )}

        {lesson.lessonType === "certificate" && !lesson.completed && (
          <p className="text-sm text-aw-muted">
            Markiere die Lektion als abgeschlossen, um den Zertifikatsabruf zu
            bestätigen.
          </p>
        )}

        {lesson.lessonType !== "certificate" && !lesson.completed && (
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving}
            onClick={() => void handleComplete()}
          >
            Lektion abschließen
          </button>
        )}

        {lesson.lessonType === "certificate" && !lesson.completed && (
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving}
            onClick={() => void handleComplete()}
          >
            Lektion abschließen
          </button>
        )}

        {lesson.completed && (
          <p className="text-sm text-aw-gold">Diese Lektion ist abgeschlossen.</p>
        )}
      </div>
    </div>
  );
}
