"use client";

import { useState } from "react";

import StarRating, { ReviewAvatar } from "@/components/courses/StarRating";
import type { UserCourseReviewEntry } from "@/lib/reviews/course-review-types";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type CourseReviewFormProps = {
  slug: string;
  displayName: string;
  avatarUrl?: string | null;
  initialReview: UserCourseReviewEntry | null;
  onSubmitted: (review: UserCourseReviewEntry) => void;
};

export default function CourseReviewForm({
  slug,
  displayName,
  avatarUrl = null,
  initialReview,
  onSubmitted,
}: CourseReviewFormProps) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [reviewText, setReviewText] = useState(initialReview?.reviewText ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) {
      setError("Bitte wähle mindestens einen Stern.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/courses/${slug}/reviews`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, reviewText }),
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: UserCourseReviewEntry;
      error?: { message: string };
    };

    setLoading(false);

    if (!data.success || !data.data) {
      setError(data.error?.message ?? "Bewertung konnte nicht gespeichert werden.");
      return;
    }

    setSuccess(
      data.data.status === "approved"
        ? "Vielen Dank für deine Bewertung!"
        : "Danke! Deine Bewertung wird nach Prüfung veröffentlicht.",
    );
    onSubmitted(data.data);
  }

  return (
    <section className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <h2 className="font-display text-xl font-bold text-aw-cream">
        Wie hat dir der Kurs gefallen?
      </h2>
      <p className="mt-2 text-sm text-aw-muted">
        Deine Bewertung hilft anderen Teilnehmern und verbessert den Kurs.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <ReviewAvatar displayName={displayName} avatarUrl={avatarUrl} />
        <div>
          <p className="text-sm font-medium text-aw-cream">{displayName}</p>
          <StarRating value={rating} onChange={setRating} />
        </div>
      </div>

      <textarea
        className={`${inputClassName} mt-4 min-h-28`}
        placeholder="Was hat dir besonders gefallen? Was können wir verbessern?"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
      />

      {error && <p className="mt-3 text-sm text-aw-warning">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-300">{success}</p>}

      {initialReview && (
        <p className="mt-2 text-xs text-aw-muted">
          Status:{" "}
          {initialReview.status === "approved"
            ? "Veröffentlicht"
            : initialReview.status === "rejected"
              ? "Abgelehnt"
              : "Wird geprüft"}
        </p>
      )}

      <button
        type="button"
        className={`${primaryButtonClassName} mt-4`}
        disabled={loading}
        onClick={() => void handleSubmit()}
      >
        {loading ? "Wird gesendet …" : "Bewertung absenden"}
      </button>
    </section>
  );
}
