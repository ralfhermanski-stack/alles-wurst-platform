"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchMyCoursesApi,
  fetchPublishedCoursesApi,
} from "@/lib/courses/course-client";
import {
  COURSE_TYPE_LABELS,
  USER_CERTIFICATE_STATUS_LABELS,
} from "@/lib/courses/course-labels";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import type { CourseSummary, UserCourseEntry } from "@/lib/courses/course-types";

export default function MyCoursesContent() {
  const [courses, setCourses] = useState<UserCourseEntry[]>([]);
  const [recommended, setRecommended] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const response = await fetchMyCoursesApi();
      setLoading(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setCourses(response.data);

      if (response.data.length === 0) {
        const catalog = await fetchPublishedCoursesApi();

        if (catalog.success) {
          // Kurzliste für echte Neukunden (keine Dummy-Fortschrittsdaten).
          const featuredFirst = [...catalog.data].sort((a, b) => {
            return Number(Boolean(b.featuredOnHomepage)) -
              Number(Boolean(a.featuredOnHomepage));
          });

          setRecommended(featuredFirst.slice(0, 3));
        }
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-aw-cream">
        Meine Kurse
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Deine freigeschalteten Kurse mit Fortschritt und Zertifikatshinweis.
      </p>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-aw-muted">Kurse werden geladen …</p>
      ) : courses.length === 0 ? (
        <div className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-6">
          <p className="text-sm text-aw-muted">
            Noch keine Kurse freigeschaltet.{" "}
            <Link href="/akademie/kurse" className="text-aw-gold hover:text-aw-cream">
              Zum Kurskatalog
            </Link>
          </p>

          {recommended.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {recommended.map((course) => (
                <CourseCatalogCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {courses.map((entry) => (
            <article
              key={entry.course.id}
              className="rounded-xl border border-aw-border bg-aw-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-aw-muted">
                    {COURSE_TYPE_LABELS[entry.course.courseType]}
                  </p>
                  <h2 className="font-display text-xl font-bold text-aw-cream">
                    {entry.course.title}
                  </h2>
                  {entry.course.subtitle && (
                    <p className="mt-1 text-sm text-aw-muted">
                      {entry.course.subtitle}
                    </p>
                  )}
                </div>
                <p className="text-2xl font-bold text-aw-gold">
                  {entry.progress.percentComplete} %
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-aw-surface-2">
                <div
                  className="h-full rounded-full bg-aw-gold"
                  style={{ width: `${entry.progress.percentComplete}%` }}
                />
              </div>

              {entry.certificateStatus && (
                <p className="mt-3 text-xs text-aw-muted">
                  Zertifikat:{" "}
                  {USER_CERTIFICATE_STATUS_LABELS[entry.certificateStatus]}
                </p>
              )}

              <div className="mt-4">
                <Link
                  href={`/mein-bereich/kurse/${entry.course.slug}`}
                  className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
                >
                  Kurs öffnen →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
