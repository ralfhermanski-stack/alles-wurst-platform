"use client";

import { useEffect, useState } from "react";

import type { PlatformReviewFocus } from "@prisma/client";
import type { UserPlatformReviewEntry } from "@/lib/reviews/platform-review-types";
import {
  inputClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

type PlatformReviewResponse = {
  review: UserPlatformReviewEntry | null;
  eligibility: { allowed: boolean; reason: string | null };
};

const FOCUS_OPTIONS: { value: PlatformReviewFocus; label: string }[] = [
  { value: "platform", label: "Plattform" },
  { value: "courses", label: "Kurse" },
  { value: "recipes", label: "Rezepte" },
  { value: "tools", label: "Werkzeuge" },
  { value: "community", label: "Community" },
  { value: "support", label: "Support" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Wird geprüft",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  archived: "Zurückgezogen",
};

function StarsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Gesamtbewertung">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            className={`text-2xl ${rating <= value ? "text-aw-gold" : "text-aw-border"}`}
            onClick={() => onChange(rating)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function PlatformReviewPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [review, setReview] = useState<UserPlatformReviewEntry | null>(null);
  const [eligibility, setEligibility] = useState<{
    allowed: boolean;
    reason: string | null;
  }>({ allowed: false, reason: null });

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [focus, setFocus] = useState<PlatformReviewFocus>("platform");
  const [publicConsent, setPublicConsent] = useState(false);
  const [showMembership, setShowMembership] = useState(false);

  async function loadReview() {
    setLoading(true);
    setError(null);

    const response = (await fetch("/api/users/me/platform-review", {
      credentials: "include",
    }).then((r) => r.json())) as ApiSuccess<PlatformReviewResponse> | ApiFailure;

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setReview(response.data.review);
    setEligibility(response.data.eligibility);

    if (response.data.review) {
      setRating(response.data.review.rating);
      setTitle(response.data.review.title ?? "");
      setContent(response.data.review.content);
      setFocus(response.data.review.focus);
      setPublicConsent(response.data.review.publicConsent);
      setShowMembership(response.data.review.showMembership);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadReview();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = (await fetch("/api/users/me/platform-review", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        title: title.trim() || null,
        content,
        focus,
        publicConsent,
        showMembership,
      }),
    }).then((r) => r.json())) as ApiSuccess<UserPlatformReviewEntry> | ApiFailure;

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setReview(response.data);
    setSuccess("Deine Bewertung wurde eingereicht und wird geprüft.");
    await loadReview();
  }

  async function handleWithdraw() {
    setSaving(true);
    setError(null);

    const response = (await fetch("/api/users/me/platform-review", {
      method: "DELETE",
      credentials: "include",
    }).then((r) => r.json())) as ApiSuccess<true> | ApiFailure;

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setReview(null);
    setContent("");
    setTitle("");
    setSuccess("Deine Bewertung wurde zurückgezogen.");
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Bewertung wird geladen …</p>;
  }

  return (
    <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <h2 className="font-display text-xl font-bold text-aw-cream">
        {review ? "Meine Bewertung" : "Alles Wurst bewerten"}
      </h2>

      {review && (
        <p className="mt-2 text-sm text-aw-muted">
          Status: {STATUS_LABELS[review.moderationStatus] ?? review.moderationStatus}
        </p>
      )}

      {!eligibility.allowed && !review && eligibility.reason && (
        <p className="mt-4 text-sm text-aw-warning">{eligibility.reason}</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 text-sm text-aw-gold" role="status">
          {success}
        </p>
      )}

      {(eligibility.allowed || review) && (
        <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <p className="text-sm font-medium text-aw-cream">Gesamtbewertung</p>
            <StarsInput value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-sm font-medium text-aw-cream" htmlFor="platform-review-title">
              Überschrift (optional)
            </label>
            <input
              id="platform-review-title"
              className="mt-1 w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
              maxLength={100}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-aw-cream" htmlFor="platform-review-content">
              Bewertungstext
            </label>
            <textarea
              id="platform-review-content"
              className={`${inputClassName} min-h-[120px]`}
              rows={5}
              minLength={30}
              maxLength={1500}
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <p className="mt-1 text-xs text-aw-muted">
              Mindestens 30, maximal 1.500 Zeichen.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-aw-cream" htmlFor="platform-review-focus">
              Schwerpunkt
            </label>
            <select
              id="platform-review-focus"
              className={selectClassName}
              value={focus}
              onChange={(event) => setFocus(event.target.value as PlatformReviewFocus)}
            >
              {FOCUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={publicConsent}
              onChange={(event) => setPublicConsent(event.target.checked)}
            />
            <span>
              Öffentlich anzeigen — Deine Bewertung wird vor der Veröffentlichung
              geprüft. Öffentlich erscheinen nur dein Anzeigename und dein Avatar.
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={showMembership}
              onChange={(event) => setShowMembership(event.target.checked)}
            />
            <span>Meine Mitgliedschaftsstufe anzeigen</span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || !publicConsent}
              className={secondaryButtonClassName}
            >
              {saving ? "Wird gespeichert …" : review ? "Bewertung aktualisieren" : "Bewertung absenden"}
            </button>

            {review && (
              <button
                type="button"
                disabled={saving}
                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300"
                onClick={() => void handleWithdraw()}
              >
                Bewertung zurückziehen
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
