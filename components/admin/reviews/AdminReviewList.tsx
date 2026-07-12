"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { UnifiedAdminReviewEntry } from "@/lib/reviews/unified-review-admin-service";
import type { HomepageCommunityReviewsSettings } from "@/lib/reviews/homepage-reviews-settings-service";
import {
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
  archived: "Archiviert",
};

export default function AdminReviewList() {
  const [reviews, setReviews] = useState<UnifiedAdminReviewEntry[]>([]);
  const [settings, setSettings] = useState<HomepageCommunityReviewsSettings | null>(null);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReviews() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();

    if (source) {
      params.set("source", source);
    }

    if (status) {
      params.set("status", status);
    }

    if (featured) {
      params.set("featured", featured);
    }

    if (rating) {
      params.set("rating", rating);
    }

    const [reviewsResponse, settingsResponse] = await Promise.all([
      adminFetch<UnifiedAdminReviewEntry[]>(
        `/api/admin/reviews?${params.toString()}`,
      ),
      adminFetch<HomepageCommunityReviewsSettings>("/api/admin/reviews/settings"),
    ]);

    if (!reviewsResponse.success) {
      setError(reviewsResponse.error.message);
      setLoading(false);
      return;
    }

    setReviews(reviewsResponse.data);

    if (settingsResponse.success) {
      setSettings(settingsResponse.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadReviews();
  }, [source, status, featured, rating]);

  async function moderateReview(
    review: UnifiedAdminReviewEntry,
    nextStatus: "approved" | "rejected" | "archived",
  ) {
    const response = await adminFetch<unknown>(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        source: review.source,
        status: nextStatus,
      }),
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadReviews();
  }

  async function toggleFeatured(review: UnifiedAdminReviewEntry) {
    const response = await adminFetch<unknown>(
      `/api/admin/reviews/${review.id}/feature`,
      {
        method: "PATCH",
        body: JSON.stringify({
          source: review.source,
          featured: !review.featuredOnHomepage,
        }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadReviews();
  }

  async function saveSettings() {
    if (!settings) {
      return;
    }

    const response = await adminFetch<HomepageCommunityReviewsSettings>(
      "/api/admin/reviews/settings",
      {
        method: "PATCH",
        body: JSON.stringify(settings),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Bewertungen
        </h1>
        <p className="mt-1 text-sm text-aw-muted">
          Kurs- und Plattformbewertungen prüfen, freigeben oder hervorheben.
        </p>
      </div>

      {settings && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Startseiten-Einstellungen
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-aw-cream">
              Mitgliederzahl
              <select
                className={`${selectClassName} mt-1`}
                value={settings.memberCountDisplay}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    memberCountDisplay: event.target.value as HomepageCommunityReviewsSettings["memberCountDisplay"],
                  })
                }
              >
                <option value="exact">Exakte Zahl</option>
                <option value="rounded">Gerundete Zahl</option>
                <option value="hidden">Ausblenden</option>
              </select>
            </label>

            <label className="text-sm text-aw-cream">
              Leerer Zustand
              <select
                className={`${selectClassName} mt-1`}
                value={settings.emptyStateMode}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    emptyStateMode: event.target.value as HomepageCommunityReviewsSettings["emptyStateMode"],
                  })
                }
              >
                <option value="message">Hinweistext anzeigen</option>
                <option value="hidden">Bereich ausblenden</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="checkbox"
                checked={settings.showAverageRating}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    showAverageRating: event.target.checked,
                  })
                }
              />
              Durchschnittsbewertung anzeigen
            </label>

            <label className="text-sm text-aw-cream">
              Mindestanzahl für Durchschnitt
              <input
                type="number"
                min={1}
                max={100}
                className="mt-1 w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm"
                value={settings.minReviewsForAverage}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    minReviewsForAverage: Number(event.target.value),
                  })
                }
              />
            </label>

            <label className="text-sm text-aw-cream">
              Berechtigungsregel
              <select
                className={`${selectClassName} mt-1`}
                value={settings.eligibilityRule}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    eligibilityRule: event.target.value as HomepageCommunityReviewsSettings["eligibilityRule"],
                  })
                }
              >
                <option value="days_registered">Registrierungsdauer</option>
                <option value="course_started">Kurs begonnen</option>
                <option value="recipe_saved">Rezept gespeichert</option>
                <option value="tool_used">Werkzeug genutzt</option>
              </select>
            </label>

            <label className="text-sm text-aw-cream">
              Mindest-Registrierungstage
              <input
                type="number"
                min={1}
                max={365}
                className="mt-1 w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm"
                value={settings.minRegistrationDays}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    minRegistrationDays: Number(event.target.value),
                  })
                }
              />
            </label>
          </div>

          <button
            type="button"
            className={`${secondaryButtonClassName} mt-4`}
            onClick={() => void saveSettings()}
          >
            Einstellungen speichern
          </button>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <select className={selectClassName} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Alle Quellen</option>
          <option value="course">Kursbewertungen</option>
          <option value="platform">Plattformbewertungen</option>
        </select>

        <select className={selectClassName} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Alle Status</option>
          <option value="pending">Ausstehend</option>
          <option value="approved">Freigegeben</option>
          <option value="rejected">Abgelehnt</option>
          <option value="archived">Archiviert</option>
        </select>

        <select className={selectClassName} value={featured} onChange={(e) => setFeatured(e.target.value)}>
          <option value="">Hervorhebung</option>
          <option value="true">Hervorgehoben</option>
          <option value="false">Nicht hervorgehoben</option>
        </select>

        <select className={selectClassName} value={rating} onChange={(e) => setRating(e.target.value)}>
          <option value="">Alle Sterne</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={String(value)}>
              {value} Sterne
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-4">
        {reviews.map((review) => (
          <article
            key={`${review.source}-${review.id}`}
            className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-aw-cream">
                  {review.displayName ?? "Mitglied"} — {review.rating} ★
                </p>
                <p className="text-xs text-aw-muted">
                  {review.source === "course" ? "Kurs" : "Plattform"} ·{" "}
                  {review.contextLabel} · {STATUS_LABELS[review.status] ?? review.status}
                  {review.featuredOnHomepage ? " · Hervorgehoben" : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {review.status !== "approved" && (
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => void moderateReview(review, "approved")}
                  >
                    Freigeben
                  </button>
                )}
                {review.status !== "rejected" && review.status !== "archived" && (
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => void moderateReview(review, "rejected")}
                  >
                    Ablehnen
                  </button>
                )}
                {review.status === "approved" && (
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => void moderateReview(review, "archived")}
                  >
                    Archivieren
                  </button>
                )}
                {review.status === "approved" && (
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => void toggleFeatured(review)}
                  >
                    {review.featuredOnHomepage
                      ? "Hervorhebung entfernen"
                      : "Auf Startseite hervorheben"}
                  </button>
                )}
              </div>
            </div>

            {review.title && (
              <p className="mt-3 text-sm font-semibold text-aw-cream">{review.title}</p>
            )}

            {review.content && (
              <p className="mt-3 text-sm text-aw-cream/85">{review.content}</p>
            )}

            <p className="mt-2 text-xs text-aw-muted">Nutzer: {review.userEmail}</p>
          </article>
        ))}

        {!loading && reviews.length === 0 && (
          <p className="text-sm text-aw-muted">Keine Bewertungen gefunden.</p>
        )}
      </div>
    </div>
  );
}
