"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { CertificateSummary } from "@/lib/certificates/certificate-types";
import { USER_CERTIFICATE_STATUS_LABELS } from "@/lib/courses/course-labels";
import { COURSE_TYPE_LABELS } from "@/lib/courses/course-labels";
import { fetchMyCoursesApi } from "@/lib/courses/course-client";
import type { UserCourseEntry } from "@/lib/courses/course-types";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import { useAuth } from "@/lib/auth/use-auth";

import type { MyProfileResponse } from "@/lib/users/user-profile-client";
import { isProfileBioFilled } from "@/lib/users/profile-bio-utils";
import { fetchMyProfileApi } from "@/lib/users/user-profile-client";

import ProfileEditor from "@/components/member/ProfileEditor";
import PlatformReviewPanel from "@/components/member/PlatformReviewPanel";
import MemberQuickLinks from "@/components/member/MemberQuickLinks";
import MembershipManagePanel from "@/components/member/MembershipManagePanel";
import { useMemberNotificationCounts } from "@/lib/member/use-member-notification-counts";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

function isApiSuccess<T>(
  value: ApiSuccess<T> | ApiFailure,
): value is ApiSuccess<T> {
  return value.success === true;
}

function computeProfileCompletion(profile: MyProfileResponse | null): {
  percent: number;
  missingOptional: string[];
} {
  if (!profile) {
    return { percent: 0, missingOptional: ["Profil laden"] };
  }

  const required = [
    Boolean(profile.publicName?.trim()),
    Boolean(profile.firstName?.trim()),
    Boolean(profile.lastName?.trim()),
    Boolean(profile.avatarUrl?.trim()),
    isProfileBioFilled(profile.bio),
  ];

  const total = required.length;
  const present = required.filter(Boolean).length;
  const percent = Math.max(0, Math.round((present / total) * 100));

  const missingLabels: string[] = [];
  if (!required[0]) missingLabels.push("Anzeigename");
  if (!required[1]) missingLabels.push("Vorname");
  if (!required[2]) missingLabels.push("Nachname");
  if (!required[3]) missingLabels.push("Avatar");
  if (!required[4]) missingLabels.push("Profilbeschreibung");

  return { percent, missingOptional: missingLabels };
}

export default function MeinBereichContent() {
  const { user, loading, refresh } = useAuth();
  const { supportUnreadCount } = useMemberNotificationCounts();

  const [courses, setCourses] = useState<UserCourseEntry[]>([]);
  const [certificates, setCertificates] = useState<CertificateSummary[]>([]);
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setError(null);

      const [coursesRes, certificatesRes, profileRes] = await Promise.all([
        fetchMyCoursesApi(),
        fetch("/api/certificates/my", { credentials: "include" }).then(
          (r) => r.json(),
        ) as Promise<ApiSuccess<CertificateSummary[]> | ApiFailure>,
        fetchMyProfileApi(),
      ]);

      if (cancelled) {
        return;
      }

      if (!isApiSuccess(coursesRes)) {
        setError(coursesRes.error.message);
        return;
      }

      if (!isApiSuccess(profileRes)) {
        setError(profileRes.error.message);
        return;
      }

      setCourses(coursesRes.data ?? []);
      setProfile(profileRes.data ?? null);

      if (isApiSuccess(certificatesRes)) {
        setCertificates(certificatesRes.data ?? []);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  const displayName = user?.displayName ?? "Wurstfreund";

  const membershipLabel = user?.membership
    ? MEMBERSHIP_ROLE_LABELS[user.membership.role]
    : "Basis (kostenlos)";

  const profileCompletion = useMemo(
    () => computeProfileCompletion(profile),
    [profile],
  );

  const activeCourses = courses.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-aw-cream">
          {loading ? "Willkommen …" : `Hallo, ${displayName}`}
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          {loading
            ? "Dein Bereich wird geladen …"
            : `${membershipLabel} · ${user?.email ?? ""}`}
        </p>
      </header>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {supportUnreadCount > 0 && (
        <div
          className="mt-6 rounded-xl border border-aw-gold/40 bg-aw-gold/10 px-4 py-4 sm:px-5"
          role="status"
        >
          <p className="font-semibold text-aw-cream">
            {supportUnreadCount === 1
              ? "Du hast eine neue Support-Antwort"
              : `Du hast ${supportUnreadCount} neue Support-Antworten`}
          </p>
          <p className="mt-1 text-sm text-aw-muted">
            Wir haben auf dein Ticket geantwortet — schau in deinen Support-Posteingang.
          </p>
          <Link
            href="/mein-bereich/support"
            className="mt-3 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
          >
            Zu meinen Tickets →
          </Link>
        </div>
      )}

      <section className="mt-8">
        <MemberQuickLinks />
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-aw-cream">
                Meine Kurse
              </h2>
              {courses.length > 0 && (
                <Link
                  href="/mein-bereich/kurse"
                  className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
                >
                  Alle anzeigen →
                </Link>
              )}
            </div>

            {activeCourses.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-aw-border px-4 py-6 text-center">
                <p className="text-sm text-aw-muted">
                  Noch keine Kurse gebucht.
                </p>
                <Link
                  href="/akademie/kurse"
                  className="mt-3 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
                >
                  Kurskatalog →
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {activeCourses.map((entry) => (
                  <li
                    key={entry.course.id}
                    className="rounded-lg border border-aw-border bg-aw-surface/50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-aw-muted">
                          {COURSE_TYPE_LABELS[entry.course.courseType]}
                        </p>
                        <p className="font-semibold text-aw-cream">
                          {entry.course.title}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-aw-gold">
                        {entry.progress.percentComplete} %
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-aw-surface-2">
                      <div
                        className="h-full rounded-full bg-aw-gold"
                        style={{ width: `${entry.progress.percentComplete}%` }}
                      />
                    </div>
                    <Link
                      href={`/mein-bereich/kurse/${entry.course.slug}`}
                      className="mt-3 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
                    >
                      Weiterlernen →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <h2 className="font-display text-xl font-bold text-aw-cream">
              Profil
            </h2>
            <p className="mt-2 text-sm text-aw-muted">
              Vollständigkeit:{" "}
              <span className="font-semibold text-aw-gold">
                {profileCompletion.percent} %
              </span>
              {profileCompletion.missingOptional.length > 0 && (
                <>
                  {" "}
                  — fehlt: {profileCompletion.missingOptional.join(", ")}
                </>
              )}
            </p>
            <div className="mt-5">
              <ProfileEditor email={user?.email ?? ""} onProfileUpdated={refresh} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-aw-gold/25 bg-aw-surface/40 p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Mitgliedschaft
            </h2>
            <div className="mt-4">
              <MembershipManagePanel compact />
            </div>
          </section>

          {certificates.length > 0 && (
            <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-aw-cream">
                  Zertifikate
                </h2>
                <Link
                  href="/mein-bereich/zertifikate"
                  className="text-xs font-semibold text-aw-gold hover:text-aw-cream"
                >
                  Alle →
                </Link>
              </div>
              <ul className="mt-3 space-y-2">
                {certificates.slice(0, 3).map((certificate) => (
                  <li
                    key={certificate.id}
                    className="rounded-lg border border-aw-border/60 px-3 py-2 text-sm"
                  >
                    <p className="font-medium text-aw-cream">
                      {certificate.courseTitle}
                    </p>
                    <p className="text-xs text-aw-muted">
                      {USER_CERTIFICATE_STATUS_LABELS[certificate.status]}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <PlatformReviewPanel />
        </aside>
      </div>
    </div>
  );
}
