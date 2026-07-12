"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminCourseImportPanel from "@/components/admin/courses/AdminCourseImportPanel";
import {
  archiveCourseApi,
  duplicateCourseApi,
  listAdminCoursesApi,
  publishCourseApi,
} from "@/lib/courses/admin-course-client";
import {
  COURSE_STATUS_LABELS,
  COURSE_TYPE_LABELS,
} from "@/lib/courses/course-labels";
import type { CourseSummary } from "@/lib/courses/course-types";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminCourseList() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await listAdminCoursesApi();

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setCourses(response.data);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadCourses() {
    const response = await listAdminCoursesApi();

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCourses(response.data);
  }

  async function handleDuplicate(courseId: string) {
    setActionId(courseId);
    setError(null);

    const response = await duplicateCourseApi(courseId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    router.push(`/admin/kurse/${response.data.id}`);
  }

  async function handlePublish(courseId: string) {
    setActionId(courseId);
    setError(null);

    const response = await publishCourseApi(courseId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reloadCourses();
  }

  async function handleArchive(courseId: string) {
    setActionId(courseId);
    setError(null);

    const response = await archiveCourseApi(courseId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reloadCourses();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Kurse verwalten
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Minikurse und Zertifikatskurse — importieren, bearbeiten, veröffentlichen.
          </p>
        </div>
        <Link href="/admin/kurse/neu" className={primaryButtonClassName}>
          Neuer Kurs
        </Link>
      </div>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <AdminCourseImportPanel />

      {loading ? (
        <p className="mt-8 text-sm text-aw-muted">Kurse werden geladen …</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-aw-border">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-aw-surface text-xs uppercase text-aw-muted">
              <tr>
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Inhalt</th>
                <th className="px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {courses.map((course) => (
                <tr key={course.id} className="text-aw-cream">
                  <td className="px-4 py-3">
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-aw-muted">{course.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {COURSE_TYPE_LABELS[course.courseType]}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {COURSE_STATUS_LABELS[course.status]}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {course.moduleCount} Module · {course.lessonCount} Lektionen
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link
                        href={`/admin/kurse/${course.id}`}
                        className="text-aw-gold hover:text-aw-cream"
                      >
                        Bearbeiten
                      </Link>
                      <Link
                        href={`/admin/kurse/${course.id}/vorschau`}
                        className="text-aw-gold hover:text-aw-cream"
                      >
                        Vorschau
                      </Link>
                      <button
                        type="button"
                        className="text-aw-gold hover:text-aw-cream disabled:opacity-50"
                        disabled={actionId === course.id}
                        onClick={() => void handleDuplicate(course.id)}
                      >
                        Duplizieren
                      </button>
                      {course.status !== "published" && (
                        <button
                          type="button"
                          className="text-aw-gold hover:text-aw-cream disabled:opacity-50"
                          disabled={actionId === course.id}
                          onClick={() => void handlePublish(course.id)}
                        >
                          Veröffentlichen
                        </button>
                      )}
                      {course.status !== "archived" && (
                        <button
                          type="button"
                          className="text-aw-muted hover:text-aw-cream disabled:opacity-50"
                          disabled={actionId === course.id}
                          onClick={() => void handleArchive(course.id)}
                        >
                          Archivieren
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
