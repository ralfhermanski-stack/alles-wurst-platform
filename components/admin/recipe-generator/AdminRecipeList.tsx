"use client";

/**
 * @file AdminRecipeList.tsx
 * @purpose Admin-Übersicht aller Rezepte mit Filtern und Aktionen.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  deleteAdminRecipeApi,
  fetchAdminCategories,
  fetchAdminRecipeList,
  moderateAdminRecipeApi,
  updateAdminRecipeApi,
  type AdminRecipeListFilters,
} from "@/lib/admin/admin-client";
import type { RecipeCategoryRecord } from "@/lib/admin/admin-category-service";
import {
  MODERATION_ACTION_LABELS,
  MODERATION_STATUS_LABELS,
  type ModerationAction,
} from "@/lib/admin/admin-labels";
import type { AdminRecipeRecord } from "@/lib/admin/admin-recipe-service";
import {
  STATUS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/tools/recipe-labels";
import {
  RecipeModerationStatus,
  RecipeStatus,
  RecipeVisibility,
} from "@prisma/client";

const inputClassName =
  "w-full rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream";

const actionBtnClassName =
  "rounded border border-aw-border px-2 py-1 text-xs font-semibold text-aw-cream hover:border-aw-gold/50 disabled:opacity-50";

export default function AdminRecipeList() {
  const [recipes, setRecipes] = useState<AdminRecipeRecord[]>([]);
  const [categories, setCategories] = useState<RecipeCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminRecipeListFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reloadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchAdminRecipeList(filters);

    if (!response.success) {
      setError(response.error.message);
      setRecipes([]);
    } else {
      setRecipes(response.data);
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      const response = await fetchAdminCategories();

      if (cancelled || !response.success) {
        return;
      }

      setCategories(response.data.filter((item) => item.active));
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipesEffect() {
      setLoading(true);
      setError(null);

      const response = await fetchAdminRecipeList(filters);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setRecipes([]);
      } else {
        setRecipes(response.data);
      }

      setLoading(false);
    }

    void loadRecipesEffect();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  function applySearch() {
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
    }));
  }

  function patchRecipe(updated: AdminRecipeRecord) {
    setRecipes((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }

  async function assignCategory(recipe: AdminRecipeRecord, category: string) {
    const next = category.trim() || null;

    if ((recipe.category ?? null) === next) {
      return;
    }

    setBusyId(recipe.id);
    setError(null);
    setSuccess(null);

    const response = await updateAdminRecipeApi(recipe.id, {
      category: next,
    });

    setBusyId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    patchRecipe(response.data);
    setSuccess(
      next
        ? `Kategorie „${next}“ für „${recipe.name}“ gespeichert.`
        : `Kategorie bei „${recipe.name}“ entfernt.`,
    );
  }

  async function runModeration(recipe: AdminRecipeRecord, action: ModerationAction) {
    setBusyId(recipe.id);
    setError(null);
    setSuccess(null);

    const response = await moderateAdminRecipeApi(recipe.id, action);

    setBusyId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    patchRecipe(response.data);
    setSuccess(
      `„${recipe.name}“: ${MODERATION_ACTION_LABELS[action]}`,
    );
  }

  async function handleDelete(recipe: AdminRecipeRecord) {
    if (
      !window.confirm(
        `Rezept „${recipe.name}“ wirklich löschen? Es wird soft-gelöscht und erscheint nicht mehr in der Liste.`,
      )
    ) {
      return;
    }

    setBusyId(recipe.id);
    setError(null);
    setSuccess(null);

    const response = await deleteAdminRecipeApi(recipe.id);

    setBusyId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
    setSuccess(`„${recipe.name}“ wurde gelöscht.`);
  }

  const categoryOptions = categories.map((category) => category.name);

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Rezeptgenerator — Admin
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Alle Rezepte prüfen, kategorisieren, freigeben und löschen.
        </p>
      </div>

      <div className="mb-6 grid gap-4 rounded-xl border border-aw-border bg-aw-surface/60 p-4 lg:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase text-aw-muted">
            Status
          </label>
          <select
            className={`${inputClassName} mt-1`}
            value={filters.status ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: (e.target.value as RecipeStatus) || undefined,
              }))
            }
          >
            <option value="">Alle</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-aw-muted">
            Sichtbarkeit
          </label>
          <select
            className={`${inputClassName} mt-1`}
            value={filters.visibility ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                visibility: (e.target.value as RecipeVisibility) || undefined,
              }))
            }
          >
            <option value="">Alle</option>
            {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-aw-muted">
            Moderation
          </label>
          <select
            className={`${inputClassName} mt-1`}
            value={filters.moderationStatus ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                moderationStatus:
                  (e.target.value as RecipeModerationStatus) || undefined,
              }))
            }
          >
            <option value="">Alle</option>
            {Object.entries(MODERATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-aw-muted">
            Rezeptart
          </label>
          <select
            className={`${inputClassName} mt-1`}
            value={filters.recipeKind ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                recipeKind:
                  (e.target.value as "wurst" | "marinade" | "") || undefined,
              }))
            }
          >
            <option value="">Alle</option>
            <option value="wurst">Wurst</option>
            <option value="marinade">Marinade</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-aw-muted">
            User-ID
          </label>
          <input
            className={`${inputClassName} mt-1`}
            placeholder="UUID"
            value={filters.userId ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                userId: e.target.value.trim() || undefined,
              }))
            }
          />
        </div>

        <div>
          <label
            htmlFor="admin-recipe-filter-category"
            className="text-xs font-semibold uppercase text-aw-muted"
          >
            Kategorie
          </label>
          <select
            id="admin-recipe-filter-category"
            className={`${inputClassName} mt-1`}
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                category: e.target.value.trim() || undefined,
              }))
            }
          >
            <option value="">Alle</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-aw-muted">
            Suche
          </label>
          <div className="mt-1 flex gap-2">
            <input
              className={inputClassName}
              placeholder="Name oder Beschreibung"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applySearch();
                }
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-aw-border px-3 text-sm text-aw-cream hover:border-aw-gold/50"
              onClick={applySearch}
            >
              OK
            </button>
          </div>
        </div>
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

      {loading ? (
        <p className="text-sm text-aw-muted">Rezepte werden geladen …</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-aw-muted">Keine Rezepte für diese Filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-aw-border bg-aw-surface/80 text-xs uppercase tracking-wide text-aw-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Kategorie</th>
                <th className="px-4 py-3">Art</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sichtbarkeit</th>
                <th className="px-4 py-3">Moderation</th>
                <th className="px-4 py-3">PDF</th>
                <th className="px-4 py-3">Offiziell</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {recipes.map((recipe) => {
                const busy = busyId === recipe.id;
                const categoryValue = recipe.category ?? "";
                const hasOrphanCategory =
                  Boolean(categoryValue) &&
                  !categoryOptions.includes(categoryValue);

                return (
                  <tr key={recipe.id} className="text-aw-cream align-top">
                    <td className="px-4 py-3 font-medium">{recipe.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-aw-muted">
                      {recipe.userId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Kategorie für ${recipe.name}`}
                        className="min-w-[9rem] rounded border border-aw-border bg-aw-bg px-2 py-1.5 text-xs text-aw-cream disabled:opacity-50"
                        value={categoryValue}
                        disabled={busy}
                        onChange={(e) =>
                          void assignCategory(recipe, e.target.value)
                        }
                      >
                        <option value="">— keine —</option>
                        {hasOrphanCategory && (
                          <option value={categoryValue}>
                            {categoryValue} (nicht im Katalog)
                          </option>
                        )}
                        {categoryOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 capitalize">{recipe.recipeKind}</td>
                    <td className="px-4 py-3">{STATUS_LABELS[recipe.status]}</td>
                    <td className="px-4 py-3">
                      {VISIBILITY_LABELS[recipe.visibility]}
                    </td>
                    <td className="px-4 py-3">
                      {MODERATION_STATUS_LABELS[recipe.moderationStatus]}
                    </td>
                    <td className="px-4 py-3 text-aw-muted">{recipe.pdfStatus}</td>
                    <td className="px-4 py-3">
                      {recipe.isOfficialDatabase ? "Ja" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link
                          href={`/admin/werkstatt/rezeptgenerator/${recipe.id}`}
                          className="rounded border border-aw-gold/40 px-2 py-1 text-xs font-semibold text-aw-gold hover:bg-aw-gold/10"
                        >
                          Öffnen
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          className={`${actionBtnClassName} border-aw-success/40 text-aw-success`}
                          onClick={() => void runModeration(recipe, "approve")}
                        >
                          Freigeben
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={`${actionBtnClassName} border-aw-gold/40 text-aw-gold`}
                          onClick={() => void runModeration(recipe, "adopt")}
                        >
                          Übernehmen
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={`${actionBtnClassName} border-aw-warning/40 text-aw-warning`}
                          onClick={() => void runModeration(recipe, "reject")}
                        >
                          Ablehnen
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className={`${actionBtnClassName} border-red-500/40 text-red-300`}
                          onClick={() => void handleDelete(recipe)}
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && recipes.length > 0 && (
        <p className="mt-3 text-xs text-aw-muted">
          Kategorie wird beim Wechsel im Dropdown sofort gespeichert. Weitere
          Moderationsaktionen (Sperren, Zurücksetzen) in der Detailansicht.
          <button
            type="button"
            className="ml-2 text-aw-gold hover:underline"
            onClick={() => void reloadRecipes()}
          >
            Liste neu laden
          </button>
        </p>
      )}
    </div>
  );
}
