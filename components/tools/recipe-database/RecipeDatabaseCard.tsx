import Link from "next/link";

import Icon from "@/components/brand/Icon";
import { RECIPE_TYPE_SUMMARY_LABELS } from "@/lib/tools/recipe-database-labels";
import type { PublicRecipeSummary } from "@/lib/tools/recipe-database-service";

type RecipeDatabaseCardProps = {
  recipe: PublicRecipeSummary;
};

function formatKg(value: number | null): string {
  if (value === null || value <= 0) {
    return "—";
  }

  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 }).format(value)} kg`;
}

/**
 * Karte für ein offizielles Rezept in der Datenbankliste.
 */
export default function RecipeDatabaseCard({ recipe }: RecipeDatabaseCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]">
      <div className="relative flex h-36 items-end overflow-hidden bg-gradient-to-br from-aw-bronze/30 to-aw-bg p-4">
        <Icon
          name="recipe"
          className="pointer-events-none absolute -right-4 top-1/2 h-36 w-36 -translate-y-1/2 text-aw-cream/[0.07]"
        />
        {recipe.category && (
          <span className="absolute left-3 top-3 rounded-full bg-aw-bg/70 px-2.5 py-1 text-xs font-medium text-aw-cream/90 backdrop-blur-sm">
            {recipe.category}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-aw-gold/15 px-2.5 py-1 text-xs font-medium text-aw-gold">
          Offiziell
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-aw-muted">
          {RECIPE_TYPE_SUMMARY_LABELS[recipe.recipeType]}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug text-aw-cream">
          {recipe.name}
        </h3>
        {recipe.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-aw-muted">
            {recipe.description}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-aw-muted">
          <div>
            <dt className="uppercase tracking-wide">Masse</dt>
            <dd className="mt-0.5 font-medium text-aw-cream">
              {formatKg(recipe.totalWeightKg)}
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Zutaten</dt>
            <dd className="mt-0.5 font-medium text-aw-cream">
              {recipe.ingredientCount}
            </dd>
          </div>
        </dl>

        <Link
          href={`/werkstatt/rezeptdatenbank/${recipe.id}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aw-gold transition-colors hover:text-aw-cream"
        >
          Rezept ansehen
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
