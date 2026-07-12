"use client";

import { useEffect, useState } from "react";

import type { CourseSummary } from "@/lib/courses/course-types";
import type { UserCourseAccessEntry } from "@/lib/courses/course-access-service";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type CourseAccessPanelProps = {
  userId: string;
};

type CourseAccessResponse = {
  entries: UserCourseAccessEntry[];
  courses: CourseSummary[];
};

export default function CourseAccessPanel({ userId }: CourseAccessPanelProps) {
  const [entries, setEntries] = useState<UserCourseAccessEntry[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseId, setCourseId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/accounting/users/${userId}/course-access`, {
        credentials: "include",
      });
      const data = (await response.json()) as {
        success: boolean;
        data?: CourseAccessResponse;
        error?: { message: string };
      };

      if (cancelled) {
        return;
      }

      if (!data.success || !data.data) {
        setError(data.error?.message ?? "Kurszugriff konnte nicht geladen werden.");
        return;
      }

      setEntries(data.data.entries);
      setCourses(data.data.courses);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function postAction(body: Record<string, string>) {
    const response = await fetch(`/api/accounting/users/${userId}/course-access`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!data.success) {
      setError(data.error?.message ?? "Aktion fehlgeschlagen.");
      return false;
    }

    return true;
  }

  async function reload() {
    const response = await fetch(`/api/accounting/users/${userId}/course-access`, {
      credentials: "include",
    });
    const data = (await response.json()) as {
      success: boolean;
      data?: CourseAccessResponse;
      error?: { message: string };
    };

    if (!data.success || !data.data) {
      setError(data.error?.message ?? "Kurszugriff konnte nicht geladen werden.");
      return;
    }

    setEntries(data.data.entries);
    setCourses(data.data.courses);
  }

  async function handleGrant() {
    if (!courseId) {
      return;
    }

    setError(null);
    const ok = await postAction({
      courseId,
      action: "grant",
      expiresAt,
      note,
    });

    if (ok) {
      await reload();
    }
  }

  async function handleRevoke(targetCourseId: string) {
    setError(null);
    const ok = await postAction({ courseId: targetCourseId, action: "revoke" });

    if (ok) {
      await reload();
    }
  }

  return (
    <section className="rounded-xl border border-aw-gold/25 bg-aw-surface/40 p-5">
      <h2 className="font-display text-lg font-bold text-aw-gold">
        Kurszugriff
      </h2>
      <p className="mt-1 text-xs text-aw-muted">
        Manuell gewähren, sperren oder verlängern.
      </p>

      {error && (
        <p className="mt-3 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName} htmlFor="course-access-select">
            Kurs
          </label>
          <select
            id="course-access-select"
            className={`${selectClassName} mt-2`}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">Kurs wählen</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClassName} htmlFor="course-access-expires">
            Gültig bis
          </label>
          <input
            id="course-access-expires"
            type="date"
            className={`${inputClassName} mt-2`}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClassName} htmlFor="course-access-note">
            Notiz
          </label>
          <input
            id="course-access-note"
            className={`${inputClassName} mt-2`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className={`${primaryButtonClassName} mt-4`}
        onClick={() => void handleGrant()}
      >
        Zugriff gewähren
      </button>

      {entries.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-aw-border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-aw-surface text-xs uppercase text-aw-muted">
              <tr>
                <th className="px-3 py-2">Kurs</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Quelle</th>
                <th className="px-3 py-2">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="text-aw-cream">
                  <td className="px-3 py-3">{entry.courseTitle}</td>
                  <td className="px-3 py-3 text-aw-muted">{entry.status}</td>
                  <td className="px-3 py-3 text-aw-muted">{entry.source}</td>
                  <td className="px-3 py-3">
                    {entry.status === "active" && (
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() => void handleRevoke(entry.courseId)}
                      >
                        Sperren
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
