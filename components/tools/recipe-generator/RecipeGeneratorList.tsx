"use client";

/**
 * @file RecipeGeneratorList.tsx
 * @purpose Übersicht eigener Rezepte mit Aktionen.
 * @usage Eingebunden auf `/werkstatt/rezeptgenerator`.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/brand/Icon";
import MembershipBlockedNotice from "@/components/membership/MembershipBlockedNotice";
import RecipeJsonExportButton from "@/components/tools/recipe-generator/RecipeJsonExportButton";
import RecipeJsonImportButton from "@/components/tools/recipe-generator/RecipeJsonImportButton";
import RecipePdfExportButton from "@/components/tools/recipe-generator/RecipePdfExportButton";
import {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  deleteRecipeApi,
  duplicateRecipeApi,
  fetchRecipeList,
  type ApiRecipe,
} from "@/lib/tools/recipe-client";
import {
  STATUS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/tools/recipe-labels";
import { getRecipeUserId } from "@/lib/tools/recipe-session";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";

function formatKg(value: number | null): string {
  if (value === null || value <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 }).format(value)} kg`;
}

/**
 * Rezeptübersicht — Liste, Neu-Button, Duplizieren, Löschen.
 */
export default function RecipeGeneratorList() {
  const router = useRouter();
  const membership = useMembershipAccess();
  const listCheck = membership.check("recipe.own.list");
  const [recipes, setRecipes] = useState<ApiRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!listCheck.allowed) {
      return;
    }

    let cancelled = false;

    async function load() {
      const userId = getRecipeUserId();
      const response = await fetchRecipeList(userId);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setRecipes([]);
      } else {
        setError(null);
        setRecipes(response.data);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [listCheck.allowed]);

  async function reloadRecipes() {
    setLoading(true);
    setError(null);

    const userId = getRecipeUserId();
    const response = await fetchRecipeList(userId);

    if (!response.success) {
      setError(response.error.message);
      setRecipes([]);
    } else {
      setRecipes(response.data);
    }

    setLoading(false);
  }

  async function handleDuplicate(id: string) {
    setActionId(id);
    const userId = getRecipeUserId();
    const response = await duplicateRecipeApi(id, userId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    void reloadRecipes();
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(
      `Rezept „${name}" wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    setActionId(id);
    const userId = getRecipeUserId();
    const response = await deleteRecipeApi(id, userId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    void reloadRecipes();
  }

  const createCheck = membership.canCreateRecipe(recipes.length);
  const limitHint = membership.limitHint(recipes.length);
  const showLoading = listCheck.allowed && loading;
  const visibleRecipes = listCheck.allowed ? recipes : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col gap-4 border-b border-aw-border bg-aw-surface/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-aw-gold/10 text-aw-gold ring-1 ring-aw-gold/30">
            <Icon name="recipe" className="h-6 w-6" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-aw-cream sm:text-xl">
              Meine Rezepte
            </h2>
            <p className="text-sm text-aw-muted">
              Erstellen, bearbeiten und verwalten.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {createCheck.allowed && (
            <RecipeJsonImportButton
              onImported={(recipe) => {
                void reloadRecipes();
                router.push(`/werkstatt/rezeptgenerator/${recipe.id}`);
              }}
            />
          )}
          {createCheck.allowed ? (
            <Link href="/werkstatt/rezeptgenerator/neu" className={primaryButtonClassName}>
              Neues Rezept
            </Link>
          ) : (
            <span
              className={`${primaryButtonClassName} cursor-not-allowed opacity-50`}
              title={createCheck.message}
            >
              Neues Rezept
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8">
        {!listCheck.allowed && (
          <MembershipBlockedNotice message={listCheck.message} />
        )}

        {listCheck.allowed && limitHint && (
          <p className="mb-4 text-sm text-aw-muted">{limitHint}</p>
        )}

        {listCheck.allowed && !createCheck.allowed && recipes.length > 0 && (
          <div className="mb-4">
            <MembershipBlockedNotice
              title="Rezept-Limit erreicht"
              message={createCheck.message}
            />
          </div>
        )}

        {error && (
          <p
            className="mb-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
            role="alert"
          >
            {error}
          </p>
        )}

        {showLoading ? (
          <p className="text-sm text-aw-muted">Rezepte werden geladen …</p>
        ) : !listCheck.allowed ? null : visibleRecipes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-aw-border px-6 py-12 text-center">
            <p className="text-aw-cream">Noch keine Rezepte gespeichert.</p>
            <p className="mt-2 text-sm text-aw-muted">
              Starte mit &bdquo;Neues Rezept&ldquo; — der Assistent führt dich Schritt für
              Schritt.
            </p>
            <Link
              href="/werkstatt/rezeptgenerator/neu"
              className={`${primaryButtonClassName} mt-6 ${createCheck.allowed ? "" : "pointer-events-none opacity-50"}`}
              aria-disabled={!createCheck.allowed}
            >
              Erstes Rezept anlegen
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-aw-border text-xs uppercase tracking-wide text-aw-muted">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Kategorie</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Sichtbarkeit</th>
                  <th className="pb-3 pr-4 font-medium">Masse</th>
                  <th className="pb-3 pr-4 font-medium">Version</th>
                  <th className="pb-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aw-border">
                {visibleRecipes.map((recipe) => (
                  <tr key={recipe.id} className="text-aw-cream">
                    <td className="py-4 pr-4 font-medium">{recipe.name}</td>
                    <td className="py-4 pr-4 text-aw-muted">
                      {recipe.category ?? "—"}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="rounded-full bg-aw-surface-2 px-2.5 py-1 text-xs">
                        {STATUS_LABELS[recipe.status]}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-aw-muted">
                      {VISIBILITY_LABELS[recipe.visibility]}
                    </td>
                    <td className="py-4 pr-4">
                      {formatKg(recipe.totalWeightKg)}
                    </td>
                    <td className="py-4 pr-4">v{recipe.version}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          onClick={() =>
                            router.push(
                              `/werkstatt/rezeptgenerator/${recipe.id}`,
                            )
                          }
                        >
                          Öffnen
                        </button>
                        <RecipePdfExportButton recipeId={recipe.id} />
                        <RecipeJsonExportButton
                          recipeId={recipe.id}
                          recipe={recipe}
                        />
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={actionId === recipe.id}
                          onClick={() => void handleDuplicate(recipe.id)}
                        >
                          Duplizieren
                        </button>
                        <button
                          type="button"
                          className={dangerButtonClassName}
                          disabled={actionId === recipe.id}
                          onClick={() =>
                            void handleDelete(recipe.id, recipe.name)
                          }
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
