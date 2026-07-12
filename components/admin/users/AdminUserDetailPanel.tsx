"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import AdminUserRightsPanel from "@/components/admin/permissions/AdminUserRightsPanel";
import {
  assignAdminUserMembershipApi,
  endAdminUserMembershipApi,
  getAdminUserDetailApi,
  grantAdminUserCourseApi,
  listAdminUserCoursesApi,
  revokeAdminUserCourseApi,
  updateAdminUserApi,
} from "@/lib/admin/admin-platform-client";
import type { AdminUserDetail } from "@/lib/admin/admin-user-service";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import { USER_SYSTEM_ROLE_LABELS } from "@/lib/users/system-role";
import type { CourseSummary } from "@/lib/courses/course-types";
import type { MembershipRole, UserAccountStatus, UserSystemRole } from "@prisma/client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleString("de-DE");
}

const SYSTEM_ROLE_OPTIONS: UserSystemRole[] = [
  "USER",
  "SUPPORT",
  "INSTRUCTOR",
  "ADMIN",
  "SUPERADMIN",
];

const MEMBERSHIP_ASSIGN_OPTIONS: MembershipRole[] = [
  "registered",
  "wurstclub",
  "meisterclub",
];

type AdminUserDetailPanelProps = {
  userId: string;
};

export default function AdminUserDetailPanel({
  userId,
}: AdminUserDetailPanelProps) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [note, setNote] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserSystemRole>("USER");
  const [selectedMembershipRole, setSelectedMembershipRole] =
    useState<MembershipRole>("wurstclub");
  const [membershipEndsAt, setMembershipEndsAt] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseExpiresAt, setCourseExpiresAt] = useState("");
  const [courseNote, setCourseNote] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "rights">("profile");

  const loadUser = useCallback(async () => {
    const response = await getAdminUserDetailApi(userId);

    if (!response.success) {
      setError(response.error.message);
      setUser(null);
      return false;
    }

    setError(null);
    setUser(response.data);
    setSelectedRole(response.data.systemRole);
    return true;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const [userOk, coursesResponse] = await Promise.all([
        loadUser(),
        listAdminUserCoursesApi(userId),
      ]);

      if (cancelled) {
        return;
      }

      if (coursesResponse.success) {
        setCourses(coursesResponse.data);
      }

      if (!userOk) {
        setLoading(false);
        return;
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loadUser]);

  async function runAction(
    action: () => Promise<{ success: boolean; error?: { message: string } }>,
    successMessage: string,
  ) {
    setSaving(true);
    setSuccess(null);
    setError(null);

    const response = await action();

    setSaving(false);

    if (!response.success) {
      setError(response.error?.message ?? "Aktion fehlgeschlagen.");
      return;
    }

    setSuccess(successMessage);
    await loadUser();
  }

  async function handleAccountStatus(accountStatus: UserAccountStatus) {
    const labels: Record<UserAccountStatus, string> = {
      active: "aktivieren",
      suspended: "sperren",
      deactivated: "deaktivieren",
    };

    if (
      !window.confirm(
        `Konto wirklich ${labels[accountStatus]}?`,
      )
    ) {
      return;
    }

    await runAction(
      () =>
        updateAdminUserApi(userId, {
          accountStatus,
          note: note.trim() || null,
        }),
      `Konto wurde ${labels[accountStatus]}.`,
    );
  }

  async function handleRoleSave() {
    if (
      !user ||
      !window.confirm(
        `Systemrolle wirklich auf „${USER_SYSTEM_ROLE_LABELS[selectedRole]}“ setzen?`,
      )
    ) {
      return;
    }

    await runAction(
      () =>
        updateAdminUserApi(userId, {
          systemRole: selectedRole,
          note: note.trim() || null,
        }),
      "Systemrolle gespeichert.",
    );
  }

  async function handleGrantCourse() {
    if (!courseId) {
      return;
    }

    await runAction(
      () =>
        grantAdminUserCourseApi(userId, {
          courseId,
          expiresAt: courseExpiresAt || null,
          note: courseNote.trim() || null,
        }),
      "Kurs freigeschaltet.",
    );
  }

  async function handleRevokeCourse(id: string, title: string) {
    if (!window.confirm(`Kurszugang „${title}“ wirklich entziehen?`)) {
      return;
    }

    await runAction(
      () => revokeAdminUserCourseApi(userId, id, note.trim() || null),
      "Kurszugang entzogen.",
    );
  }

  async function handleAssignMembership() {
    await runAction(
      () =>
        assignAdminUserMembershipApi(userId, {
          role: selectedMembershipRole,
          extendedUntil: membershipEndsAt || null,
          note: note.trim() || null,
        }),
      "Mitgliedschaft vergeben.",
    );
  }

  async function handleEndMembership() {
    if (!user?.membershipId) {
      return;
    }

    if (!window.confirm("Mitgliedschaft wirklich beenden?")) {
      return;
    }

    await runAction(
      () =>
        endAdminUserMembershipApi(
          userId,
          user.membershipId!,
          note.trim() || null,
        ),
      "Mitgliedschaft beendet.",
    );
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Nutzer wird geladen …</p>;
  }

  if (error && !user) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        {error}
      </p>
    );
  }

  if (!user) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        Nutzer nicht gefunden.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/benutzer"
          className="text-sm text-aw-muted hover:text-aw-gold"
        >
          ← Zurück zur Liste
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-aw-cream">
          {user.displayName}
        </h1>
        <p className="mt-1 text-sm text-aw-muted">{user.email}</p>
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-aw-success" role="status">
          {success}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-aw-border pb-2">
        <button
          type="button"
          className={activeTab === "profile" ? primaryButtonClassName : secondaryButtonClassName}
          onClick={() => setActiveTab("profile")}
        >
          Profil & Verwaltung
        </button>
        <button
          type="button"
          className={activeTab === "rights" ? primaryButtonClassName : secondaryButtonClassName}
          onClick={() => setActiveTab("rights")}
        >
          Rechte & Gruppen
        </button>
      </div>

      {activeTab === "rights" ? (
        <AdminUserRightsPanel userId={userId} />
      ) : (
        <>
      <section className="grid gap-4 rounded-xl border border-aw-border bg-aw-surface/40 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-aw-muted">Kontostatus</p>
          <p className="mt-1 font-medium text-aw-cream">
            {user.accountStatusLabel}
          </p>
        </div>
        <div>
          <p className="text-xs text-aw-muted">Systemrolle</p>
          <p className="mt-1 text-aw-cream">{user.systemRoleLabel}</p>
        </div>
        <div>
          <p className="text-xs text-aw-muted">Anzeigename</p>
          <p className="mt-1 text-aw-cream">{user.publicName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-aw-muted">Mitgliedschaft</p>
          <p className="mt-1 text-aw-cream">
            {user.membershipRole ?? "—"}
            {user.membershipStatus ? ` (${user.membershipStatus})` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-aw-muted">Registriert</p>
          <p className="mt-1 text-aw-cream">{formatDate(user.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-aw-muted">Letzter Login</p>
          <p className="mt-1 text-aw-cream">{formatDate(user.lastLoginAt)}</p>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Konto verwalten
        </h2>
        <div className="mt-4">
          <label className={labelClassName} htmlFor="admin-note">
            Grund / Notiz (optional)
          </label>
          <input
            id="admin-note"
            className={`${inputClassName} mt-1`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Begründung für Audit-Log …"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.accountStatus !== "active" && (
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={saving}
              onClick={() => void handleAccountStatus("active")}
            >
              Konto aktivieren
            </button>
          )}
          {user.accountStatus === "active" && (
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={saving}
              onClick={() => void handleAccountStatus("suspended")}
            >
              Konto sperren
            </button>
          )}
          {user.accountStatus !== "deactivated" && (
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={saving}
              onClick={() => void handleAccountStatus("deactivated")}
            >
              Konto deaktivieren
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Systemrolle
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className={labelClassName} htmlFor="system-role">
              Rolle
            </label>
            <select
              id="system-role"
              className={`${selectClassName} mt-1 min-w-[12rem]`}
              value={selectedRole}
              onChange={(event) =>
                setSelectedRole(event.target.value as UserSystemRole)
              }
            >
              {SYSTEM_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {USER_SYSTEM_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving || selectedRole === user.systemRole}
            onClick={() => void handleRoleSave()}
          >
            Rolle speichern
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Kurse
        </h2>
        {user.courses.length > 0 ? (
          <ul className="mt-4 divide-y divide-aw-border rounded-xl border border-aw-border">
            {user.courses.map((course) => (
              <li
                key={course.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="text-aw-cream">
                  {course.title}{" "}
                  <span className="text-aw-muted">
                    · seit {formatDate(course.grantedAt)}
                  </span>
                </span>
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={saving}
                  onClick={() => void handleRevokeCourse(course.id, course.title)}
                >
                  Entziehen
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-aw-muted">Noch keine Kurszugriffe.</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="course-id">
              Kurs freischalten
            </label>
            <select
              id="course-id"
              className={`${selectClassName} mt-1 w-full`}
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Kurs wählen …</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="course-expires">
              Ablaufdatum (optional)
            </label>
            <input
              id="course-expires"
              type="date"
              className={`${inputClassName} mt-1 w-full`}
              value={courseExpiresAt}
              onChange={(event) => setCourseExpiresAt(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClassName} htmlFor="course-note">
            Notiz (optional)
          </label>
          <input
            id="course-note"
            className={`${inputClassName} mt-1 w-full`}
            value={courseNote}
            onChange={(event) => setCourseNote(event.target.value)}
          />
        </div>
        <button
          type="button"
          className={`${primaryButtonClassName} mt-4`}
          disabled={saving || !courseId}
          onClick={() => void handleGrantCourse()}
        >
          Kurs freischalten
        </button>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Mitgliedschaft
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="membership-role">
              Rolle vergeben
            </label>
            <select
              id="membership-role"
              className={`${selectClassName} mt-1 w-full`}
              value={selectedMembershipRole}
              onChange={(event) =>
                setSelectedMembershipRole(event.target.value as MembershipRole)
              }
            >
              {MEMBERSHIP_ASSIGN_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {MEMBERSHIP_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="membership-ends">
              Gültig bis (optional)
            </label>
            <input
              id="membership-ends"
              type="date"
              className={`${inputClassName} mt-1 w-full`}
              value={membershipEndsAt}
              onChange={(event) => setMembershipEndsAt(event.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving}
            onClick={() => void handleAssignMembership()}
          >
            Mitgliedschaft vergeben
          </button>
          {user.membershipId && user.membershipStatus === "active" && (
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={saving}
              onClick={() => void handleEndMembership()}
            >
              Mitgliedschaft beenden
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Audit-Log
        </h2>
        {user.auditLog.length === 0 ? (
          <p className="mt-4 text-sm text-aw-muted">
            Noch keine Einträge vorhanden.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-aw-border rounded-xl border border-aw-border">
            {user.auditLog.map((entry) => (
              <li key={entry.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-aw-cream">
                    {entry.actionLabel}
                  </span>
                  <span className="text-xs text-aw-muted">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-aw-muted">{entry.summary}</p>
                {entry.note && (
                  <p className="mt-1 text-aw-muted">Notiz: {entry.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Section
        title="Zertifikate"
        isEmpty={user.certificates.length === 0}
        empty="Noch keine Zertifikate."
      >
        <ul className="divide-y divide-aw-border rounded-xl border border-aw-border">
          {user.certificates.map((cert) => (
            <li key={cert.id} className="px-4 py-3 text-sm text-aw-cream">
              {cert.courseTitle} · {cert.certificateNumber} · {cert.status}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Bewertungen"
        isEmpty={user.reviews.length === 0}
        empty="Noch keine Bewertungen."
      >
        <ul className="divide-y divide-aw-border rounded-xl border border-aw-border">
          {user.reviews.map((review) => (
            <li key={review.id} className="px-4 py-3 text-sm text-aw-cream">
              {review.courseTitle} · {review.rating}★ · {review.status}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Bestellungen / Positionen"
        isEmpty={user.orders.length === 0}
        empty="Noch keine Bestellungen vorhanden."
      >
        <ul className="divide-y divide-aw-border rounded-xl border border-aw-border">
          {user.orders.map((order) => (
            <li key={order.id} className="px-4 py-3 text-sm text-aw-cream">
              {order.title} · {order.grossAmount} € · {order.paymentStatus}
            </li>
          ))}
        </ul>
      </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  empty,
  isEmpty,
  children,
}: {
  title: string;
  empty: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-aw-cream">{title}</h2>
      <div className="mt-3">
        {isEmpty ? (
          <p className="rounded-xl border border-aw-border bg-aw-surface/30 p-4 text-sm text-aw-muted">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
