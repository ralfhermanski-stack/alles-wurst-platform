import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/marketing/Hero";
import Icon from "@/components/brand/Icon";
import RecipeCard from "@/components/cards/RecipeCard";
import {
  recipeOfMonth,
  recipeCategories,
  sampleRecipes,
  lockedRecipes,
  recipeAccess,
} from "@/lib/placeholder-data";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/rezepte", {
    title: "Rezepte",
    description:
      "Die Alles-Wurst Rezeptdatenbank – eine wachsende Wissensbibliothek mit hunderten Rezepten.",
  });
}

// Akzent je Zugriffsstufe für die Premium-Hinweise
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

export default function RezeptePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Hero
        eyebrow="Rezeptbibliothek"
        title="Die Alles-Wurst Rezeptdatenbank"
        subtitle="Eine wachsende Wissensbibliothek für dein Handwerk – vom kostenlosen Rezept des Monats bis zu exklusiven Meisterrezepten. Perspektivisch mehrere hundert erprobte Rezepturen."
        imageSrc="/rezepte-header.png"
        imageAlt="Rezeptdatenbank — Wurst, Gewürze und Werkzeuge"
        primaryCta={{ label: "Rezeptdatenbank", href: "/werkstatt/rezeptdatenbank" }}
        secondaryCta={{ label: "Rezept des Monats", href: "#rezept-des-monats" }}
        stats={[
          { key: "recipes", value: "500+", label: "Rezepte geplant" },
          { key: "categories", value: "8", label: "Kategorien" },
          { key: "monthly", value: "monatlich", label: "neues Gratis-Rezept" },
        ]}
      />

      {/* ── Rezept des Monats ────────────────────────────────────────────── */}
      <section id="rezept-des-monats" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            Rezept des Monats
          </p>
          <span className="rounded-full bg-aw-success/15 px-2.5 py-1 text-xs font-medium text-aw-success">
            Kostenlos für alle
          </span>
        </div>

        <div className="mt-8 grid gap-8 overflow-hidden rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface lg:grid-cols-2">
          {/* Bildplatzhalter */}
          <div
            className={`relative flex min-h-56 items-center justify-center overflow-hidden bg-gradient-to-br ${recipeOfMonth.accent} to-aw-bg`}
          >
            <Icon name={recipeOfMonth.icon} className="h-40 w-40 text-aw-cream/10" />
            <span className="absolute left-4 top-4 rounded-full bg-aw-bg/70 px-2.5 py-1 text-xs font-medium text-aw-cream/90 backdrop-blur-sm">
              {recipeOfMonth.category}
            </span>
          </div>
          {/* Details */}
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-aw-cream sm:text-3xl">
              {recipeOfMonth.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-aw-muted">{recipeOfMonth.excerpt}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-aw-muted">
              <span className="inline-flex items-center gap-2">
                <Icon name="cap" className="h-4 w-4 text-aw-gold" />
                {recipeOfMonth.difficulty}
              </span>
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 text-aw-gold" />
                {recipeOfMonth.time}
              </span>
            </div>
            <Link
              href="#"
              className="mt-8 inline-flex w-fit items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              Rezept ansehen
            </Link>
          </div>
        </div>
      </section>

      {/* ── Kategorien ───────────────────────────────────────────────────── */}
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
            {recipeCategories.map((cat) => (
              <Link
                key={cat.name}
                href="#"
                className="group flex items-center gap-4 rounded-xl border border-aw-border bg-aw-surface p-5 transition-all hover:-translate-y-1 hover:border-aw-gold/50"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border transition-colors group-hover:bg-aw-gold/15">
                  <Icon name={cat.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-semibold text-aw-cream">{cat.name}</h3>
                  <p className="text-xs text-aw-muted">{cat.count} Rezepte</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offizielle Datenbank (live) ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface p-8 text-center sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            Club · Werkstatt
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-aw-cream sm:text-3xl">
            Offizielle Rezeptdatenbank
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-aw-muted sm:text-base">
            Freigegebene Meisterrezepte durchsuchen, nach Kategorie und Rezepttyp
            filtern und mit einem Klick in deinen Rezeptgenerator kopieren.
          </p>
          <Link
            href="/werkstatt/rezeptdatenbank"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
          >
            Zur Rezeptdatenbank
          </Link>
        </div>
      </section>

      {/* ── Beispiel-Rezeptkarten ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
              Aus der Bibliothek
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
              Beispiel-Rezepte
            </h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-aw-muted">
          Ein kleiner Auszug aus der Datenbank. Die Stufen-Kennzeichnung zeigt, ab
          welcher Mitgliedschaft ein Rezept verfügbar ist.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleRecipes.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      </section>

      {/* ── Gesperrte Inhalte ────────────────────────────────────────────── */}
      <section className="border-y border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/40">
              <Icon name="lock" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-aw-cream">
              Exklusive & gesperrte Inhalte
            </h2>
            <p className="mt-4 text-base leading-7 text-aw-muted">
              Meisterrezepte, eigene Rezepturen und die vollständige Datenbank sind den
              höheren Mitgliedschaften vorbehalten. Ein Vorgeschmack:
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lockedRecipes.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} locked />
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium-Hinweise / Zugriffskonzept ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
            Zugriffskonzept
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
            Wer sieht welche Rezepte?
          </h2>
          <p className="mt-4 text-base leading-7 text-aw-muted">
            Je nach Mitgliedschaft öffnet sich die Bibliothek Stufe für Stufe.
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
                      name={tier.tierKey === "gast" ? "users" : tier.tierKey === "gold" ? "crown" : "check"}
                      className="h-5 w-5"
                    />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-aw-cream">
                      {tier.tier}
                    </h3>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
                      {tier.note}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 flex-1 space-y-3">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-aw-cream/90">
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

      {/* ── Mitgliedschafts-CTA ──────────────────────────────────────────── */}
      <section className="border-t border-aw-border bg-gradient-to-b from-aw-surface to-aw-bg">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-aw-cream sm:text-4xl">
            Voller Zugriff auf die Rezeptbibliothek
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-aw-muted">
            Schalte mit einer Mitgliedschaft das Archiv, die erweiterte Bibliothek und
            die exklusiven Meisterrezepte frei.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/mitgliedschaft"
              className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              Mitgliedschaft wählen
            </Link>
            <Link
              href="/akademie/kurse"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
            >
              Kurse entdecken
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
