import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import Hero from "@/components/marketing/Hero";
import Icon from "@/components/brand/Icon";
import RecipeDatabaseCard from "@/components/tools/recipe-database/RecipeDatabaseCard";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import {
  createMembershipContext,
  type MembershipAccessContext,
} from "@/lib/membership/membership-rules";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";
import { listRecipeCategories } from "@/lib/admin/admin-category-service";
import {
  listOfficialRecipes,
  type PublicRecipeSummary,
} from "@/lib/tools/recipe-database-service";
import { resolveMembershipAccessFromDb } from "@/lib/users/membership-service";
import { recipeAccess } from "@/lib/placeholder-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/rezepte", {
    title: "Rezepte",
    description:
      "Die Alles-Wurst Rezeptdatenbank – echte Rezepte mit Vorschau für alle, voller Zugriff je nach Mitgliedschaft.",
  });
}

const tierStyle: Record<
  string,
  { ring: string; text: string; medal: string; featured?: boolean }
> = {
  gast: {
    ring: "border-aw-border",
    text: "text-aw-cream",
    medal: "from-aw-surface-2 to-aw-border",
  },
  bronze: {
    ring: "border-aw-bronze/40",
    text: "text-aw-bronze",
    medal: "from-aw-bronze to-aw-bronze-dark",
  },
  silver: {
    ring: "border-aw-silver/40",
    text: "text-aw-silver",
    medal: "from-aw-silver to-aw-silver-dark",
  },
  gold: {
    ring: "border-aw-gold",
    text: "text-aw-gold",
    medal: "from-aw-gold via-yellow-200 to-aw-gold-dark",
    featured: true,
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  brühwurst: "sausage",
  bruehwurst: "sausage",
  rohwurst: "meat",
  kochwurst: "recipe",
  bratwurst: "flame",
  schinken: "brine",
  pökelware: "brine",
  poekelware: "brine",
  räucherwaren: "smoke",
  raeucherwaren: "smoke",
  marinade: "marinade",
  rub: "marinade",
  grundrezept: "book",
};

function categoryIcon(name: string): string {
  const key = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/g, "");

  for (const [needle, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(needle.replace(/[^a-z]/g, ""))) {
      return icon;
    }
  }

  return "recipe";
}

async function resolvePageMembership(): Promise<MembershipAccessContext> {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    return createMembershipContext("guest", null);
  }

  const result = await resolveMembershipAccessFromDb(userId);
  if (result.success) {
    return result.data;
  }

  return createMembershipContext("guest", null);
}

export default async function RezeptePage() {
  const membership = await resolvePageMembership();
  const [listResult, categoriesResult] = await Promise.all([
    listOfficialRecipes({ membership }),
    listRecipeCategories({ activeOnly: true }),
  ]);

  const recipes: PublicRecipeSummary[] = listResult.success
    ? listResult.data
    : [];
  const recipeOfMonth =
    recipes.find((recipe) => recipe.isRecipeOfMonth) ?? recipes[0] ?? null;
  const lockedRecipes = recipes.filter((recipe) => !recipe.canOpen).slice(0, 6);
  const libraryRecipes = recipes.slice(0, 9);

  const categoryCounts = new Map<string, number>();
  for (const recipe of recipes) {
    if (!recipe.category) {
      continue;
    }
    categoryCounts.set(
      recipe.category,
      (categoryCounts.get(recipe.category) ?? 0) + 1,
    );
  }

  const categories =
    categoriesResult.success && categoriesResult.data.length > 0
      ? categoriesResult.data.map((cat) => ({
          name: cat.name,
          icon: categoryIcon(cat.name),
          count: categoryCounts.get(cat.name) ?? 0,
        }))
      : Array.from(categoryCounts.entries()).map(([name, count]) => ({
          name,
          icon: categoryIcon(name),
          count,
        }));

  return (
    <>
      <Hero
        eyebrow="Rezeptbibliothek"
        title="Die Alles-Wurst Rezeptdatenbank"
        subtitle="Echte Rezepte aus der Werkstatt – als Vorschau für alle sichtbar, vollständig öffenbar je nach Mitgliedschaft und Kurszugang."
        imageSrc="/rezepte-header.png"
        imageAlt="Rezeptdatenbank — Wurst, Gewürze und Werkzeuge"
        primaryCta={{ label: "Rezeptdatenbank", href: "/werkstatt/rezeptdatenbank" }}
        secondaryCta={{ label: "Rezept des Monats", href: "#rezept-des-monats" }}
        stats={[
          {
            key: "recipes",
            value: String(recipes.length || "–"),
            label: "Rezepte sichtbar",
          },
          {
            key: "categories",
            value: String(categories.length || "–"),
            label: "Kategorien",
          },
          {
            key: "monthly",
            value: "monatlich",
            label: "neues Gratis-Rezept",
          },
        ]}
      />

      <section id="rezept-des-monats" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            Rezept des Monats
          </p>
          <span className="rounded-full bg-aw-success/15 px-2.5 py-1 text-xs font-medium text-aw-success">
            Für registrierte Mitglieder
          </span>
        </div>

        {recipeOfMonth ? (
          <div className="mt-8 grid gap-8 overflow-hidden rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface lg:grid-cols-2">
            <div className="relative flex min-h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-aw-gold/25 to-aw-bg">
              {recipeOfMonth.hasImage ? (
                <Image
                  src={`/api/recipes/${recipeOfMonth.id}/image`}
                  alt={recipeOfMonth.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <Icon name="flame" className="h-40 w-40 text-aw-cream/10" />
              )}
              {recipeOfMonth.category && (
                <span className="absolute left-4 top-4 rounded-full bg-aw-bg/70 px-2.5 py-1 text-xs font-medium text-aw-cream/90 backdrop-blur-sm">
                  {recipeOfMonth.category}
                </span>
              )}
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold text-aw-cream sm:text-3xl">
                {recipeOfMonth.name}
              </h2>
              {recipeOfMonth.description && (
                <p className="mt-4 text-base leading-7 text-aw-muted">
                  {recipeOfMonth.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-aw-muted">
                <span className="inline-flex items-center gap-2">
                  <Icon name="recipe" className="h-4 w-4 text-aw-gold" />
                  {recipeOfMonth.accessLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name="book" className="h-4 w-4 text-aw-gold" />
                  {recipeOfMonth.ingredientCount} Zutaten
                </span>
              </div>
              {recipeOfMonth.canOpen ? (
                <Link
                  href={`/werkstatt/rezeptdatenbank/${recipeOfMonth.id}`}
                  className="mt-8 inline-flex w-fit items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
                >
                  Rezept ansehen
                </Link>
              ) : (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={
                      recipeOfMonth.lockCta === "login"
                        ? "/anmelden"
                        : recipeOfMonth.lockCta === "course"
                          ? "/akademie/kurse"
                          : "/mitgliedschaft"
                    }
                    className="inline-flex w-fit items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
                  >
                    {recipeOfMonth.lockCta === "login"
                      ? "Anmelden zum Öffnen"
                      : "Freischalten"}
                  </Link>
                  <Link
                    href="/werkstatt/rezeptdatenbank"
                    className="inline-flex w-fit items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
                  >
                    Zur Datenbank
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-aw-border px-6 py-16 text-center">
            <p className="text-aw-cream">Aktuell ist kein Rezept des Monats freigegeben.</p>
            <p className="mt-2 text-sm text-aw-muted">
              Sobald eines veröffentlicht ist, erscheint es an dieser Stelle.
            </p>
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="border-y border-aw-border bg-aw-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
                Bibliothek
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
                Rezepte nach Kategorie
              </h2>
              <p className="mt-4 text-base leading-7 text-aw-muted">
                Von Brühwurst bis Räucherware – die Datenbank wächst kontinuierlich.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href="/werkstatt/rezeptdatenbank"
                  className="group flex items-center gap-4 rounded-xl border border-aw-border bg-aw-surface p-5 transition-all hover:-translate-y-1 hover:border-aw-gold/50"
                >
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border transition-colors group-hover:bg-aw-gold/15">
                    <Icon name={cat.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-aw-cream">{cat.name}</h3>
                    <p className="text-xs text-aw-muted">
                      {cat.count} {cat.count === 1 ? "Rezept" : "Rezepte"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface p-8 text-center sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            Club · Werkstatt
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-aw-cream sm:text-3xl">
            Offizielle Rezeptdatenbank
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-aw-muted sm:text-base">
            Alle freigegebenen Rezepte durchsuchen — Name und Beschreibung sind sichtbar.
            Den vollständigen Inhalt öffnest du mit der passenden Mitgliedschaft.
          </p>
          <Link
            href="/werkstatt/rezeptdatenbank"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
          >
            Zur Rezeptdatenbank
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
              Aus der Bibliothek
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
              Aktuelle Rezepte
            </h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-aw-muted">
          Echte Rezepte aus der Datenbank. Gesperrte Karten zeigen Name und Beschreibung —
          zum Öffnen brauchst du die passende Stufe.
        </p>
        {libraryRecipes.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {libraryRecipes.map((recipe) => (
              <RecipeDatabaseCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-aw-border px-6 py-16 text-center">
            <p className="text-aw-cream">Noch keine Rezepte veröffentlicht.</p>
          </div>
        )}
      </section>

      {lockedRecipes.length > 0 && (
        <section className="border-y border-aw-border bg-aw-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/40">
                <Icon name="lock" className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold text-aw-cream">
                Noch gesperrte Inhalte
              </h2>
              <p className="mt-4 text-base leading-7 text-aw-muted">
                Diese Rezepte siehst du bereits — zum Öffnen fehlt dir noch die passende
                Freigabe.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lockedRecipes.map((recipe) => (
                <RecipeDatabaseCard key={`locked-${recipe.id}`} recipe={recipe} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            Zugriffskonzept
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
            Wer öffnet welche Rezepte?
          </h2>
          <p className="mt-4 text-base leading-7 text-aw-muted">
            Alle sehen die Vorschau. Der volle Inhalt öffnet sich Stufe für Stufe.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {recipeAccess.map((tier) => {
            const style = tierStyle[tier.tierKey];
            return (
              <div
                key={tier.tier}
                className={`flex flex-col rounded-2xl border bg-aw-surface p-6 ${style.ring} ${
                  style.featured
                    ? "bg-gradient-to-b from-aw-gold/10 to-aw-surface shadow-[0_0_0_1px_rgba(212,175,55,0.5),0_20px_50px_-20px_rgba(212,175,55,0.45)]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${style.medal} text-aw-bg`}
                    aria-hidden="true"
                  >
                    <Icon
                      name={
                        tier.tierKey === "gast"
                          ? "users"
                          : tier.tierKey === "gold"
                            ? "crown"
                            : "check"
                      }
                      className="h-5 w-5"
                    />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-aw-cream">
                      {tier.tier}
                    </h3>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}
                    >
                      {tier.note}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 flex-1 space-y-3">
                  {tier.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-aw-cream/90"
                    >
                      <Icon
                        name="check"
                        className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-aw-border bg-gradient-to-b from-aw-surface to-aw-bg">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-aw-cream sm:text-4xl">
            Voller Zugriff auf die Rezeptbibliothek
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-aw-muted">
            Schalte mit einer Mitgliedschaft Club-Rezepte und Meisterclub-Inhalte frei —
            oder starte kostenlos mit dem Rezept des Monats.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/mitgliedschaft"
              className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              Mitgliedschaft wählen
            </Link>
            <Link
              href="/anmelden"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
            >
              Anmelden / Registrieren
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
