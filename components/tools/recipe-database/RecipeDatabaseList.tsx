"use client";

/**
 * @file RecipeDatabaseList.tsx
 * @purpose Öffentliche Rezeptdatenbank mit Filtern — Teaser für alle, Detail nach Rechten.
 */

import { useEffect, useState, type FormEvent } from "react";

import RecipeDatabaseCard from "@/components/tools/recipe-database/RecipeDatabaseCard";
import RecipeCategorySelect from "@/components/tools/recipe-generator/RecipeCategorySelect";
import {
  inputClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { RECIPE_TYPE_FILTER_LABELS } from "@/lib/tools/recipe-database-labels";
import type { RecipeDatabaseTypeFilter } from "@/lib/tools/recipe-database-service";
import {
  fetchOfficialRecipeList,
  type PublicRecipeSummary,
  type RecipeDatabaseListFilters,
} from "@/lib/tools/recipe-client";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";
import type { MembershipRole } from "@/lib/membership/membership-rules";

function emptyStateCopy(role: MembershipRole): { title: string; hint: string } {
  switch (role) {
    case "registered":
      return {
        title: "Aktuell keine freigegebenen Rezepte",
        hint: "Als registriertes Mitglied kannst du das Rezept des Monats und gebuchte Kursrezepte öffnen — sobald sie veröffentlicht sind, erscheinen sie hier.",
      };
    case "wurstclub":
      return {
        title: "Aktuell keine Club-Rezepte verfügbar",
        hint: "Als Wurstclub-Mitglied siehst du hier das Rezept des Monats, Club-Inhalte und gebuchte Kursrezepte.",
      };
    case "meisterclub":
    case "admin":
      return {
        title: "Noch keine freigegebenen Rezepte verfügbar",
        hint: "Offizielle und freigegebene Community-Rezepte erscheinen hier, sobald sie veröffentlicht sind.",
      };
    default:
      return {
        title: "Noch keine Rezepte veröffentlicht",
        hint: "Sobald Rezepte freigegeben sind, siehst du sie hier als Vorschau. Zum Öffnen reicht die passende Mitgliedschaft.",
      };
  }
}

export default function RecipeDatabaseList() {
  const membership = useMembershipAccess();
  const [recipes, setRecipes] = useState<PublicRecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [recipeType, setRecipeType] = useState<RecipeDatabaseTypeFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<RecipeDatabaseListFilters>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const response = await fetchOfficialRecipeList(filters);

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

    void load();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();

    setFilters({
      category: category || undefined,
      search: searchInput.trim() || undefined,
      recipeType,
    });
  }

  const emptyCopy = emptyStateCopy(membership.role);
  const hasActiveFilters = Boolean(
    filters.category ||
      filters.search ||
      (filters.recipeType && filters.recipeType !== "all"),
  );

  return (
    <div>
      <form
        className="mb-8 grid gap-4 rounded-xl border border-aw-gold/25 bg-aw-surface/60 p-5 lg:grid-cols-4"
        onSubmit={applyFilters}
      >
        <div>
          <label
            htmlFor="db-category"
            className="text-xs font-semibold uppercase text-aw-muted"
          >
            Kategorie
          </label>
          <RecipeCategorySelect
            id="db-category"
            className={`${selectClassName} mt-2`}
            value={category}
            onChange={setCategory}
            emptyLabel="Alle Kategorien"
          />
        </div>

        <div>
          <label
            htmlFor="db-type"
            className="text-xs font-semibold uppercase text-aw-muted"
          >
            Rezepttyp
          </label>
          <select
            id="db-type"
            className={`${selectClassName} mt-2`}
            value={recipeType}
            onChange={(e) =>
              setRecipeType(e.target.value as RecipeDatabaseTypeFilter)
            }
          >
            {Object.entries(RECIPE_TYPE_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label
            htmlFor="db-search"
            className="text-xs font-semibold uppercase text-aw-muted"
          >
            Suche
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="db-search"
              className={inputClassName}
              placeholder="Name oder Beschreibung …"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg hover:bg-aw-cream"
            >
              Filtern
            </button>
          </div>
        </div>
      </form>

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
        <div className="rounded-xl border border-dashed border-aw-border px-6 py-16 text-center">
          <p className="text-aw-cream">
            {hasActiveFilters
              ? "Keine Rezepte passen zu deinen Filtern."
              : emptyCopy.title}
          </p>
          <p className="mt-2 text-sm text-aw-muted">
            {hasActiveFilters
              ? "Passe Kategorie, Rezepttyp oder Suche an und versuche es erneut."
              : emptyCopy.hint}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeDatabaseCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
