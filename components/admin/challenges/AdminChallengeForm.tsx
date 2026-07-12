"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_SUBMISSION_STATUS_LABELS,
  CHALLENGE_VOTING_MODE_LABELS,
  type AdminChallengeSubmission,
  type ChallengeEntry,
} from "@/lib/challenges/challenge-types";
import type { ChallengeVotingMode, CommunityChallengeStatus } from "@prisma/client";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminChallengeFormProps = {
  challengeId?: string;
};

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

const EMPTY_FORM: {
  title: string;
  slug: string;
  excerpt: string;
  description: string;
  task: string;
  coverImageUrl: string;
  startAt: string;
  endAt: string;
  submissionDeadline: string;
  votingStartAt: string;
  votingEndAt: string;
  status: CommunityChallengeStatus;
  votingMode: ChallengeVotingMode;
  winnerCount: number;
  prizeDescription: string;
  showOnHomepage: boolean;
  showInMemberDashboard: boolean;
  popupEnabled: boolean;
  notificationsEnabled: boolean;
  participationRules: string;
} = {
  title: "",
  slug: "",
  excerpt: "",
  description: "",
  task: "",
  coverImageUrl: "",
  startAt: "",
  endAt: "",
  submissionDeadline: "",
  votingStartAt: "",
  votingEndAt: "",
  status: "DRAFT" as const,
  votingMode: "ADMIN_ONLY" as const,
  winnerCount: 1,
  prizeDescription: "",
  showOnHomepage: true,
  showInMemberDashboard: true,
  popupEnabled: false,
  notificationsEnabled: true,
  participationRules: "",
};

export default function AdminChallengeForm({ challengeId }: AdminChallengeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(challengeId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<AdminChallengeSubmission[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState("all");

  async function loadChallenge() {
    if (!challengeId) {
      return;
    }

    setLoading(true);
    const response = await adminFetch<ChallengeEntry>(
      `/api/admin/challenges/${challengeId}`,
    );

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    const data = response.data;
    setForm({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? "",
      description: data.description,
      task: data.task,
      coverImageUrl: data.coverImageUrl ?? "",
      startAt: toDatetimeLocal(data.startAt),
      endAt: toDatetimeLocal(data.endAt),
      submissionDeadline: toDatetimeLocal(data.submissionDeadline),
      votingStartAt: toDatetimeLocal(data.votingStartAt),
      votingEndAt: toDatetimeLocal(data.votingEndAt),
      status: data.status,
      votingMode: data.votingMode,
      winnerCount: data.winnerCount,
      prizeDescription: data.prizeDescription ?? "",
      showOnHomepage: data.showOnHomepage,
      showInMemberDashboard: data.showInMemberDashboard,
      popupEnabled: data.popupEnabled,
      notificationsEnabled: data.notificationsEnabled,
      participationRules: data.participationRules ?? "",
    });
    setLoading(false);
  }

  async function loadSubmissions() {
    if (!challengeId) {
      return;
    }

    const params = new URLSearchParams();
    params.set("status", submissionStatus);

    const response = await adminFetch<AdminChallengeSubmission[]>(
      `/api/admin/challenges/${challengeId}/submissions?${params.toString()}`,
    );

    if (response.success) {
      setSubmissions(response.data);
    }
  }

  useEffect(() => {
    void loadChallenge();
  }, [challengeId]);

  useEffect(() => {
    void loadSubmissions();
  }, [challengeId, submissionStatus]);

  async function saveChallenge() {
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      excerpt: form.excerpt.trim() || null,
      coverImageUrl: form.coverImageUrl.trim() || null,
      prizeDescription: form.prizeDescription.trim() || null,
      participationRules: form.participationRules.trim() || null,
      slug: form.slug.trim() || undefined,
      startAt: form.startAt ? fromDatetimeLocal(form.startAt) : "",
      endAt: form.endAt ? fromDatetimeLocal(form.endAt) : "",
      submissionDeadline: form.submissionDeadline
        ? fromDatetimeLocal(form.submissionDeadline)
        : "",
      votingStartAt: form.votingStartAt
        ? fromDatetimeLocal(form.votingStartAt)
        : null,
      votingEndAt: form.votingEndAt ? fromDatetimeLocal(form.votingEndAt) : null,
    };

    const response = isEdit
      ? await adminFetch<ChallengeEntry>(
          `/api/admin/challenges/${challengeId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        )
      : await adminFetch<ChallengeEntry>("/api/admin/challenges", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    if (!isEdit) {
      router.push(`/admin/community/challenges/${response.data.id}`);
      return;
    }

    await loadChallenge();
  }

  async function moderateSubmission(
    submissionId: string,
    status: AdminChallengeSubmission["status"],
    rejectionReason?: string,
  ) {
    const response = await adminFetch(
      `/api/admin/challenges/submissions/${submissionId}/moderate`,
      {
        method: "POST",
        body: JSON.stringify({
          status,
          rejectionReason: rejectionReason ?? null,
          isWinner: status === "WINNER",
        }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadSubmissions();
  }

  if (loading) {
    return <p className="px-4 py-8 text-sm text-aw-muted">Wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            {isEdit ? "Challenge bearbeiten" : "Neue Challenge"}
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Challenge-Details, Zeitraum und Teilnahmebedingungen festlegen.
          </p>
        </div>
        <Link
          href="/admin/community/challenges"
          className={secondaryButtonClassName}
        >
          Zur Übersicht
        </Link>
      </div>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <div className="grid gap-4">
          <input
            className={inputClassName}
            placeholder="Titel"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Slug (optional)"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
          />
          <textarea
            className={`${inputClassName} min-h-[60px]`}
            placeholder="Kurzbeschreibung"
            value={form.excerpt}
            onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
          />
          <textarea
            className={`${inputClassName} min-h-[120px]`}
            placeholder="Beschreibung"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <textarea
            className={`${inputClassName} min-h-[80px]`}
            placeholder="Aufgabe / Challenge-Text"
            value={form.task}
            onChange={(event) => setForm({ ...form, task: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Cover-Bild-URL"
            value={form.coverImageUrl}
            onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-aw-muted">
              Start
              <input
                className={`${inputClassName} mt-1`}
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => setForm({ ...form, startAt: event.target.value })}
              />
            </label>
            <label className="text-sm text-aw-muted">
              Ende
              <input
                className={`${inputClassName} mt-1`}
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm({ ...form, endAt: event.target.value })}
              />
            </label>
            <label className="text-sm text-aw-muted">
              Einreichungsfrist
              <input
                className={`${inputClassName} mt-1`}
                type="datetime-local"
                value={form.submissionDeadline}
                onChange={(event) =>
                  setForm({ ...form, submissionDeadline: event.target.value })
                }
              />
            </label>
            <label className="text-sm text-aw-muted">
              Gewinner-Anzahl
              <input
                className={`${inputClassName} mt-1`}
                type="number"
                min={1}
                value={form.winnerCount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    winnerCount: Number(event.target.value) || 1,
                  })
                }
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              className={inputClassName}
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as typeof form.status,
                })
              }
            >
              {Object.entries(CHALLENGE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className={inputClassName}
              value={form.votingMode}
              onChange={(event) =>
                setForm({
                  ...form,
                  votingMode: event.target.value as typeof form.votingMode,
                })
              }
            >
              {Object.entries(CHALLENGE_VOTING_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <input
            className={inputClassName}
            placeholder="Preisbeschreibung"
            value={form.prizeDescription}
            onChange={(event) =>
              setForm({ ...form, prizeDescription: event.target.value })
            }
          />
          <textarea
            className={`${inputClassName} min-h-[80px]`}
            placeholder="Teilnahmebedingungen"
            value={form.participationRules}
            onChange={(event) =>
              setForm({ ...form, participationRules: event.target.value })
            }
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.showOnHomepage}
                onChange={(event) =>
                  setForm({ ...form, showOnHomepage: event.target.checked })
                }
              />
              Auf Startseite
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.showInMemberDashboard}
                onChange={(event) =>
                  setForm({ ...form, showInMemberDashboard: event.target.checked })
                }
              />
              Im Mitgliederbereich
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.popupEnabled}
                onChange={(event) =>
                  setForm({ ...form, popupEnabled: event.target.checked })
                }
              />
              Popup aktiv
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.notificationsEnabled}
                onChange={(event) =>
                  setForm({ ...form, notificationsEnabled: event.target.checked })
                }
              />
              Benachrichtigungen
            </label>
          </div>
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={saving}
            onClick={() => void saveChallenge()}
          >
            {saving ? "Speichern …" : "Speichern"}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-aw-warning">{error}</p>}

      {isEdit && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Einreichungen
            </h2>
            <select
              className={inputClassName}
              value={submissionStatus}
              onChange={(event) => setSubmissionStatus(event.target.value)}
            >
              <option value="all">Alle</option>
              {Object.entries(CHALLENGE_SUBMISSION_STATUS_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="mt-4 space-y-3">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-lg border border-aw-border/60 p-4"
              >
                <p className="text-xs text-aw-muted">
                  {submission.userDisplayName} ·{" "}
                  {CHALLENGE_SUBMISSION_STATUS_LABELS[submission.status]}
                </p>
                <h3 className="mt-1 font-medium text-aw-cream">{submission.title}</h3>
                <p className="mt-2 text-sm text-aw-muted">{submission.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => void moderateSubmission(submission.id, "APPROVED")}
                  >
                    Freigeben
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() =>
                      void moderateSubmission(
                        submission.id,
                        "REJECTED",
                        "Nicht den Richtlinien entsprechend.",
                      )
                    }
                  >
                    Ablehnen
                  </button>
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    onClick={() => void moderateSubmission(submission.id, "WINNER")}
                  >
                    Als Gewinner
                  </button>
                </div>
              </article>
            ))}
            {submissions.length === 0 && (
              <p className="text-sm text-aw-muted">Keine Einreichungen.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
