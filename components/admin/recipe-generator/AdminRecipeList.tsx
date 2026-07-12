"use client";

/**
 * @file AdminRecipeList.tsx
 * @purpose Admin-Übersicht aller Rezepte mit Filtern.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  fetchAdminRecipeList,
  type AdminRecipeListFilters,
} from "@/lib/admin/admin-client";
import type { AdminRecipeRecord } from "@/lib/admin/admin-recipe-service";
import { MODERATION_STATUS_LABELS } from "@/lib/admin/admin-labels";
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

export default function AdminRecipeList() {
  const [recipes, setRecipes] = useState<AdminRecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminRecipeListFilters>({});
  const [searchInput, setSearchInput] = useState("");

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

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Rezeptgenerator — Admin
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Alle Rezepte prüfen, filtern und moderieren.
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
          <label className="text-xs font-semibold uppercase text-aw-muted">
            Kategorie
          </label>
          <input
            className={`${inputClassName} mt-1`}
            placeholder="z. B. Brühwurst"
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                category: e.target.value.trim() || undefined,
              }))
            }
          />
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

      {loading ? (
        <p className="text-sm text-aw-muted">Rezepte werden geladen …</p>
      ) : recipes.length === 0 ? (
        <p className="text-sm text-aw-muted">Keine Rezepte für diese Filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="w-full min-w-[960px] text-left text-sm">
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
                <th className="px-4 py-3 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="text-aw-cream">
                  <td className="px-4 py-3 font-medium">{recipe.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-aw-muted">
                    {recipe.userId.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {recipe.category ?? "—"}
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
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/werkstatt/rezeptgenerator/${recipe.id}`}
                      className="font-semibold text-aw-gold hover:text-aw-cream"
                    >
                      Öffnen
                    </Link>
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
