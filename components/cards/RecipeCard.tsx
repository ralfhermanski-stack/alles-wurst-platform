import Link from "next/link";
import Icon from "@/components/brand/Icon";
import type { Recipe, RecipeAccess } from "@/lib/placeholder-data";

const accessTone: Record<RecipeAccess, string> = {
  Gast: "bg-aw-success/15 text-aw-success",
  "Wurst Club": "bg-aw-bronze/15 text-aw-bronze",
  "Wurst Club Pro": "bg-aw-silver/15 text-aw-silver",
  Meisterklasse: "bg-aw-gold/15 text-aw-gold",
};

/**
 * Rezeptkarte für die Rezeptbibliothek.
 * Optional als gesperrter Inhalt (locked) mit Schloss-Overlay und Stufen-Hinweis.
 */
export default function RecipeCard({
  recipe,
  locked = false,
}: {
  recipe: Recipe;
  locked?: boolean;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]">
      {/* Bildplatzhalter */}
      <div
        className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br ${recipe.accent} to-aw-bg p-4`}
      >
        <Icon
          name={recipe.icon}
          className="pointer-events-none absolute -right-5 top-1/2 h-40 w-40 -translate-y-1/2 text-aw-cream/[0.07] transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 rounded-full bg-aw-bg/70 px-2.5 py-1 text-xs font-medium text-aw-cream/90 backdrop-blur-sm">
          {recipe.category}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${accessTone[recipe.access]}`}
        >
          {recipe.access}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-aw-cream">
          {recipe.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{recipe.excerpt}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-aw-muted">
          <span>{recipe.difficulty}</span>
          <span>{recipe.time}</span>
        </div>

        <Link
          href="#"
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

      {/* Sperr-Overlay für gesperrte Inhalte */}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-aw-bg/55 p-4 text-center backdrop-blur-[3px]">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-aw-surface text-aw-gold ring-1 ring-aw-gold/40">
            <Icon name="lock" className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-aw-cream">Gesperrter Inhalt</p>
          <p className="text-xs text-aw-muted">
            Ab <span className="font-semibold text-aw-gold">{recipe.access}</span>{" "}
            freigeschaltet
          </p>
          <Link
            href="/mitgliedschaft"
            className="mt-1 inline-flex rounded-md bg-aw-gold px-4 py-2 text-xs font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
          >
            Freischalten
          </Link>
        </div>
      )}
    </article>
  );
}
