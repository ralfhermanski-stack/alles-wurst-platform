"use client";

/**
 * @file AdminRecipeDetail.tsx
 * @purpose Admin-Detailansicht mit Moderation und Kommentar.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchAdminRecipe,
  moderateAdminRecipeApi,
  updateAdminRecipeApi,
} from "@/lib/admin/admin-client";
import {
  MODERATION_ACTION_LABELS,
  MODERATION_STATUS_LABELS,
} from "@/lib/admin/admin-labels";
import type { AdminRecipeRecord } from "@/lib/admin/admin-recipe-service";
import {
  STATUS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/tools/recipe-labels";

const inputClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream";

type AdminRecipeDetailProps = {
  recipeId: string;
};

export default function AdminRecipeDetail({ recipeId }: AdminRecipeDetailProps) {
  const [recipe, setRecipe] = useState<AdminRecipeRecord | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEffect() {
      setLoading(true);
      setError(null);

      const response = await fetchAdminRecipe(recipeId);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setRecipe(null);
      } else {
        setRecipe(response.data);
        setAdminComment(response.data.adminComment ?? "");
      }

      setLoading(false);
    }

    void loadEffect();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  async function saveComment() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await updateAdminRecipeApi(recipeId, {
      adminComment: adminComment.trim() || null,
    });

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRecipe(response.data);
    setSuccess("Admin-Kommentar gespeichert.");
  }

  async function runModeration(
    action: keyof typeof MODERATION_ACTION_LABELS,
  ) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const response = await moderateAdminRecipeApi(
      recipeId,
      action,
      adminComment.trim() || null,
    );

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRecipe(response.data);
    setAdminComment(response.data.adminComment ?? "");
    setSuccess(`Aktion ausgeführt: ${MODERATION_ACTION_LABELS[action]}`);
  }

  if (loading) {
    return (
      <p className="p-8 text-sm text-aw-muted">Rezept wird geladen …</p>
    );
  }

  if (!recipe) {
    return (
      <div className="p-8">
        <p className="text-sm text-aw-warning" role="alert">
          {error ?? "Rezept nicht gefunden."}
        </p>
        <Link
          href="/admin/werkstatt/rezeptgenerator"
          className="mt-4 inline-block text-sm text-aw-gold"
        >
          ← Zurück zur Liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/werkstatt/rezeptgenerator"
            className="text-sm text-aw-muted hover:text-aw-gold"
          >
            ← Alle Rezepte
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-aw-cream">
            {recipe.name}
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            ID: <span className="font-mono">{recipe.id}</span>
          </p>
        </div>
        <Link
          href={`/admin/werkstatt/rezeptgenerator/${recipe.id}/bearbeiten`}
          className="rounded-lg bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg hover:bg-aw-cream"
        >
          Vollständig bearbeiten
        </Link>
      </div>

      {error && (
        <p
          className="mb-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg border border-aw-success/30 bg-aw-success/10 px-4 py-3 text-sm text-aw-success">
          {success}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-aw-border bg-aw-surface/60 p-5">
          <h2 className="font-display text-lg font-bold text-aw-gold">
            Stammdaten
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">User-ID</dt>
              <dd className="font-mono text-xs">{recipe.userId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Kategorie</dt>
              <dd>{recipe.category ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Status</dt>
              <dd>{STATUS_LABELS[recipe.status]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Sichtbarkeit</dt>
              <dd>{VISIBILITY_LABELS[recipe.visibility]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Moderation</dt>
              <dd>{MODERATION_STATUS_LABELS[recipe.moderationStatus]}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Offizielle DB</dt>
              <dd>{recipe.isOfficialDatabase ? "Ja" : "Nein"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Version</dt>
              <dd>v{recipe.version}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Gesamtgewicht</dt>
              <dd>
                {recipe.totalWeightKg !== null
                  ? `${recipe.totalWeightKg} kg`
                  : "—"}
              </dd>
            </div>
          </dl>
          {recipe.description && (
            <p className="mt-4 text-sm text-aw-cream">{recipe.description}</p>
          )}
        </section>

        <section className="rounded-xl border border-aw-border bg-aw-surface/60 p-5">
          <h2 className="font-display text-lg font-bold text-aw-gold">
            Moderation
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            Freigabe, Ablehnung, Sperre oder Übernahme in die offizielle
            Rezeptdatenbank.
          </p>

          <label className="mt-4 block text-sm font-semibold text-aw-cream">
            Admin-Kommentar
          </label>
          <textarea
            rows={4}
            className={`${inputClassName} mt-2 resize-y`}
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            placeholder="Interner Hinweis, z. B. Ablehnungsgrund …"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-aw-border px-4 py-2 text-sm font-semibold text-aw-cream hover:border-aw-gold/50"
              onClick={() => void saveComment()}
            >
              Kommentar speichern
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-aw-success/20 px-4 py-2 text-sm font-semibold text-aw-success hover:bg-aw-success/30"
              onClick={() => void runModeration("approve")}
            >
              {MODERATION_ACTION_LABELS.approve}
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-aw-gold/20 px-4 py-2 text-sm font-semibold text-aw-gold hover:bg-aw-gold/30"
              onClick={() => void runModeration("adopt")}
            >
              {MODERATION_ACTION_LABELS.adopt}
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-aw-warning/15 px-4 py-2 text-sm font-semibold text-aw-warning hover:bg-aw-warning/25"
              onClick={() => void runModeration("reject")}
            >
              {MODERATION_ACTION_LABELS.reject}
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-red-950/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/60"
              onClick={() => void runModeration("block")}
            >
              {MODERATION_ACTION_LABELS.block}
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg border border-aw-border px-4 py-2 text-sm text-aw-muted hover:text-aw-cream"
              onClick={() => void runModeration("reset")}
            >
              {MODERATION_ACTION_LABELS.reset}
            </button>
          </div>

          {recipe.moderationReviewedAt && (
            <p className="mt-4 text-xs text-aw-muted">
              Zuletzt geprüft:{" "}
              {new Intl.DateTimeFormat("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(recipe.moderationReviewedAt))}
            </p>
          )}
          {recipe.blockedAt && (
            <p className="mt-1 text-xs text-aw-warning">
              Gesperrt am:{" "}
              {new Intl.DateTimeFormat("de-DE", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(recipe.blockedAt))}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
