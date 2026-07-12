"use client";

/**
 * @file RecipeDatabaseList.tsx
 * @purpose Öffentliche Rezeptdatenbank mit Filtern.
 */

import { useEffect, useState, type FormEvent } from "react";

import RecipeDatabaseCard from "@/components/tools/recipe-database/RecipeDatabaseCard";
import MembershipBlockedNotice from "@/components/membership/MembershipBlockedNotice";
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

export default function RecipeDatabaseList() {
  const membership = useMembershipAccess();
  const readCheck = membership.check("recipe.database.read");
  const [recipes, setRecipes] = useState<PublicRecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [recipeType, setRecipeType] = useState<RecipeDatabaseTypeFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<RecipeDatabaseListFilters>({});

  useEffect(() => {
    if (!readCheck.allowed) {
      return;
    }

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
  }, [filters, readCheck.allowed]);

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();

    setFilters({
      category: category || undefined,
      search: searchInput.trim() || undefined,
      recipeType,
    });
  }

  const showLoading = readCheck.allowed && loading;
  const visibleRecipes = readCheck.allowed ? recipes : [];

  return (
    <div>
      {!readCheck.allowed && (
        <MembershipBlockedNotice message={readCheck.message} />
      )}

      {readCheck.allowed && (
      <form
        className="mb-8 grid gap-4 rounded-xl border border-aw-gold/25 bg-aw-surface/60 p-5 lg:grid-cols-4"
        onSubmit={applyFilters}
      >
        <div>
          <label htmlFor="db-category" className="text-xs font-semibold uppercase text-aw-muted">
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
          <label htmlFor="db-type" className="text-xs font-semibold uppercase text-aw-muted">
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
          <label htmlFor="db-search" className="text-xs font-semibold uppercase text-aw-muted">
            Textsuche
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
      )}

      {readCheck.allowed && error && (
        <p
          className="mb-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}

      {showLoading ? (
        <p className="text-sm text-aw-muted">Rezepte werden geladen …</p>
      ) : readCheck.allowed && visibleRecipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-aw-border px-6 py-16 text-center">
          <p className="text-aw-cream">Noch keine offiziellen Rezepte verfügbar.</p>
          <p className="mt-2 text-sm text-aw-muted">
            Freigegebene Rezepte erscheinen hier nach der Admin-Übernahme in die
            Datenbank.
          </p>
        </div>
      ) : readCheck.allowed ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((recipe) => (
            <RecipeDatabaseCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
