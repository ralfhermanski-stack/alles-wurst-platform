"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CourseForumSection from "@/components/courses/CourseForumSection";
import CourseReviewForm from "@/components/courses/CourseReviewForm";
import {
  COURSE_LESSON_TYPE_LABELS,
  COURSE_TYPE_LABELS,
} from "@/lib/courses/course-labels";
import type { CourseDetail, CourseProgressSummary } from "@/lib/courses/course-types";
import type { CourseForumGroup } from "@/lib/forums/forum-types";
import type { UserCourseReviewEntry } from "@/lib/reviews/course-review-types";

type CourseLearningHubProps = {
  slug: string;
};

export default function CourseLearningHub({ slug }: CourseLearningHubProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgressSummary | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [forums, setForums] = useState<CourseForumGroup | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<UserCourseReviewEntry | null>(null);
  const [displayName, setDisplayName] = useState("Wurstfreund");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [courseResponse, sessionResponse] = await Promise.all([
          fetch(`/api/courses/${slug}`, { credentials: "include" }),
          fetch("/api/auth/session", { credentials: "include" }),
        ]);

        if (cancelled) {
          return;
        }

        const courseText = await courseResponse.text();

        if (!courseText.trim()) {
          setError("Kurs konnte nicht geladen werden.");
          return;
        }

        const data = JSON.parse(courseText) as {
          success: boolean;
          data?: {
            course: CourseDetail;
            hasAccess: boolean;
            progress: CourseProgressSummary | null;
            forums: CourseForumGroup | null;
            canReview: boolean;
            userReview: UserCourseReviewEntry | null;
          };
          error?: { message: string };
        };

        if (!data.success || !data.data?.course) {
          setError(data.error?.message ?? "Kurs nicht gefunden.");
          return;
        }

        setCourse(data.data.course);
        setHasAccess(data.data.hasAccess);
        setProgress(data.data.progress);
        setForums(data.data.forums);
        setCanReview(data.data.canReview);
        setUserReview(data.data.userReview);

        const sessionText = await sessionResponse.text();

        if (!sessionText.trim()) {
          return;
        }

        const sessionData = JSON.parse(sessionText) as {
          success: boolean;
          data?: {
            displayName: string;
            profile?: { avatarUrl: string | null } | null;
          } | null;
        };

        if (sessionData.success && sessionData.data?.displayName) {
          setDisplayName(sessionData.data.displayName);
          setAvatarUrl(sessionData.data.profile?.avatarUrl ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("Kurs konnte nicht geladen werden.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return <p className="p-8 text-sm text-aw-warning">{error}</p>;
  }

  if (!course) {
    return <p className="p-8 text-sm text-aw-muted">Kurs wird geladen …</p>;
  }

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-aw-muted">
          Kein Zugriff auf diesen Kurs.{" "}
          <Link href="/kaufen" className="text-aw-gold">
            Kurs kaufen
          </Link>
        </p>
      </div>
    );
  }

  const progressMap = new Map(
    progress?.lessonProgress.map((item) => [item.lessonId, item.completed]) ??
      [],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase text-aw-muted">
        {COURSE_TYPE_LABELS[course.courseType]}
      </p>
      <h1 className="font-display text-3xl font-bold text-aw-cream">
        {course.title}
      </h1>

      {progress && (
        <div className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-aw-muted">Kursfortschritt</span>
            <span className="font-semibold text-aw-gold">
              {progress.percentComplete} %
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-aw-surface-2">
            <div
              className="h-full rounded-full bg-aw-gold"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          {progress.courseCompleted && (
            <div className="mt-4 rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-4">
              <p className="font-semibold text-aw-gold">Herzlichen Glückwunsch!</p>
              <p className="mt-1 text-sm text-aw-muted">
                Du hast den Kurs abgeschlossen. Lade dein Zertifikat herunter oder teile deinen Erfolg.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/mein-bereich/zertifikate"
                  className="inline-flex rounded-lg border border-aw-gold/40 px-4 py-2 text-sm font-semibold text-aw-gold hover:bg-aw-gold/10"
                >
                  Zertifikat herunterladen
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {progress?.courseCompleted && canReview && (
        <CourseReviewForm
          slug={slug}
          displayName={displayName}
          avatarUrl={avatarUrl}
          initialReview={userReview}
          onSubmitted={setUserReview}
        />
      )}

      {forums && <CourseForumSection forums={forums} />}

      <div className="mt-8 space-y-6">
        {course.modules.map((module) => {
          const moduleProgress = progress?.moduleProgress.find(
            (item) => item.moduleId === module.id,
          );

          return (
            <section
              key={module.id}
              className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-aw-gold">
                  {module.title}
                </h2>
                {moduleProgress && (
                  <span className="text-xs text-aw-muted">
                    {moduleProgress.completedLessons}/{moduleProgress.totalLessons}{" "}
                    Lektionen
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {module.lessons.map((lesson) => {
                  const completed = progressMap.get(lesson.id) ?? false;
                  const locked =
                    lesson.lessonType === "certificate" &&
                    !progress?.courseCompleted;

                  return (
                    <li key={lesson.id}>
                      {locked ? (
                        <span className="block rounded-lg border border-dashed border-aw-border px-4 py-3 text-sm text-aw-muted">
                          {lesson.title} — nach Kursabschluss
                        </span>
                      ) : (
                        <Link
                          href={`/mein-bereich/kurse/${slug}/lektion/${lesson.slug}`}
                          className="flex items-center justify-between rounded-lg border border-aw-border px-4 py-3 text-sm text-aw-cream hover:border-aw-gold/50"
                        >
                          <span>
                            {lesson.title}{" "}
                            <span className="text-xs text-aw-muted">
                              ({COURSE_LESSON_TYPE_LABELS[lesson.lessonType]})
                            </span>
                          </span>
                          <span className="text-xs text-aw-gold">
                            {completed ? "Abgeschlossen" : "Öffnen"}
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
