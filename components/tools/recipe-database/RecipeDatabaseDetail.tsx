"use client";

/**
 * @file RecipeDatabaseDetail.tsx
 * @purpose Öffentliche Detailansicht eines offiziellen Rezepts.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import Icon from "@/components/brand/Icon";
import RecipeDatabaseCopyButton from "@/components/tools/recipe-database/RecipeDatabaseCopyButton";
import { calculateRecipePayload } from "@/lib/tools/recipe-calculator";
import { formatCasingCaliber } from "@/lib/tools/recipe-casing";
import { RECIPE_TYPE_SUMMARY_LABELS } from "@/lib/tools/recipe-database-labels";
import { REFERENCE_BASIS_LABELS } from "@/lib/tools/recipe-labels";
import {
  fetchOfficialRecipe,
  type PublicRecipeDetail,
} from "@/lib/tools/recipe-client";
import type { RecipeLockCta } from "@/lib/tools/recipe-database-service";
import {
  SMOKING_DIMENSIONS,
  STRUCTURE_DIMENSIONS,
  type MeatClassification,
} from "@/lib/tools/recipe-types";

type RecipeDatabaseDetailProps = {
  recipeId: string;
};

function lockCtaHref(lockCta: RecipeLockCta | null): string {
  switch (lockCta) {
    case "login":
      return "/anmelden";
    case "course":
      return "/akademie/kurse";
    case "membership":
    default:
      return "/mitgliedschaft";
  }
}

function lockCtaLabel(lockCta: RecipeLockCta | null): string {
  switch (lockCta) {
    case "login":
      return "Jetzt anmelden";
    case "course":
      return "Kurse entdecken";
    case "membership":
    default:
      return "Mitgliedschaft wählen";
  }
}

function lockMessage(recipe: PublicRecipeDetail): string {
  switch (recipe.lockCta) {
    case "login":
      return "Dieses Rezept ist sichtbar, aber zum Öffnen brauchst du ein kostenloses Konto.";
    case "course":
      return "Dieses Kursrezept siehst du als Vorschau. Nach Buchung des zugehörigen Kurses kannst du es öffnen.";
    case "membership":
      return `Dieses Rezept gehört zur Stufe „${recipe.accessLabel}“. Mit der passenden Mitgliedschaft kannst du es vollständig öffnen.`;
    default:
      return "Du hast derzeit keinen Zugriff auf den vollständigen Inhalt.";
  }
}

function formatKg(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 3,
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGrams(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 1,
  }).format(value);
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="font-display text-lg font-bold text-aw-gold">{children}</h2>
  );
}

function formatMeatClassification(classification: MeatClassification): string {
  const parts: string[] = [];

  for (const dimension of [...STRUCTURE_DIMENSIONS, ...SMOKING_DIMENSIONS]) {
    const value = classification[dimension];

    if (typeof value === "number" && value !== 0) {
      parts.push(`${dimension}: ${formatPercent(value)}`);
    }
  }

  return parts.join(" · ");
}

export default function RecipeDatabaseDetail({
  recipeId,
}: RecipeDatabaseDetailProps) {
  const [recipe, setRecipe] = useState<PublicRecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const response = await fetchOfficialRecipe(recipeId);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setRecipe(null);
      } else {
        setRecipe(response.data);
      }

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  if (loading) {
    return <p className="text-sm text-aw-muted">Rezept wird geladen …</p>;
  }

  if (!recipe) {
    return (
      <div>
        <p className="text-sm text-aw-warning" role="alert">
          {error ?? "Rezept nicht gefunden."}
        </p>
        <Link
          href="/werkstatt/rezeptdatenbank"
          className="mt-4 inline-block text-sm text-aw-gold"
        >
          ← Zur Rezeptdatenbank
        </Link>
      </div>
    );
  }

  if (!recipe.canOpen || !recipe.payload) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/werkstatt/rezeptdatenbank"
            className="text-sm text-aw-muted hover:text-aw-gold"
          >
            ← Zur Rezeptdatenbank
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-aw-bronze">
            {recipe.accessLabel}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-aw-cream">
            {recipe.name}
          </h1>
          {recipe.description && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-aw-cream/90">
              {recipe.description}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-aw-gold/30 bg-gradient-to-b from-aw-gold/10 to-aw-surface p-8 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-aw-surface text-aw-gold ring-1 ring-aw-gold/40">
            <Icon name="lock" className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold text-aw-cream">
            Inhalt gesperrt
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-aw-muted">
            {lockMessage(recipe)}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={lockCtaHref(recipe.lockCta)}
              className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              {lockCtaLabel(recipe.lockCta)}
            </Link>
            <Link
              href="/werkstatt/rezeptdatenbank"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
            >
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const calculation = calculateRecipePayload(recipe.payload);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Link
            href="/werkstatt/rezeptdatenbank"
            className="text-sm text-aw-muted hover:text-aw-gold"
          >
            ← Zur Rezeptdatenbank
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-aw-bronze">
            Offizielles Club-Rezept
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-aw-cream">
            {recipe.name}
          </h1>
          <p className="mt-2 text-sm text-aw-muted">
            {recipe.category ?? "Keine Kategorie"} ·{" "}
            {RECIPE_TYPE_SUMMARY_LABELS[recipe.recipeType]} · v{recipe.version}
          </p>
        </div>
        <RecipeDatabaseCopyButton recipeId={recipe.id} />
      </div>

      {recipe.description && (
        <p className="max-w-3xl text-base leading-7 text-aw-cream/90">
          {recipe.description}
        </p>
      )}

      <div className="grid gap-4 rounded-xl border border-aw-border bg-aw-surface/60 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-aw-muted">Gesamtmasse</p>
          <p className="mt-1 text-lg font-semibold text-aw-cream">
            {formatKg(calculation.totalWeightKg)} kg
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-aw-muted">Fleischanteil</p>
          <p className="mt-1 text-lg font-semibold text-aw-cream">
            {formatPercent(calculation.meatSharePercent)} %
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-aw-muted">Schüttung</p>
          <p className="mt-1 text-lg font-semibold text-aw-cream">
            {formatPercent(calculation.binderSharePercent)} %
          </p>
        </div>
      </div>

      {calculation.meatLines.length > 0 && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <SectionTitle>Fleischanteile</SectionTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {calculation.meatLines.map((line) => {
              const classificationText = formatMeatClassification(
                line.classification,
              );

              return (
                <li
                  key={`${line.meatType}-${line.sortOrder}`}
                  className="border-b border-aw-border/50 py-2 last:border-0"
                >
                  <div className="flex justify-between gap-4">
                    <span>{line.meatType}</span>
                    <span className="text-aw-muted">
                      {formatPercent(line.percentage)} % ·{" "}
                      {formatKg(line.weightKg)} kg
                    </span>
                  </div>
                  {classificationText && (
                    <p className="mt-1 text-xs text-aw-muted">
                      Klassifizierung: {classificationText}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {calculation.binderLines.length > 0 && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <SectionTitle>Schüttung</SectionTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {calculation.binderLines.map((line) => (
              <li
                key={`${line.binderType}-${line.sortOrder}`}
                className="flex justify-between gap-4 border-b border-aw-border/50 py-2 last:border-0"
              >
                <span>{line.binderType}</span>
                <span className="text-aw-muted">
                  {formatPercent(line.percentage)} % · {formatKg(line.weightKg)} kg
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {calculation.ingredientLines.length > 0 && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <SectionTitle>Gewürze &amp; Zutaten</SectionTitle>
          <ul className="mt-4 space-y-2 text-sm">
            {calculation.ingredientLines.map((line) => (
              <li
                key={`${line.name}-${line.sortOrder}`}
                className="flex flex-wrap justify-between gap-4 border-b border-aw-border/50 py-2 last:border-0"
              >
                <span>{line.name}</span>
                <span className="text-aw-muted">
                  {formatGrams(line.amountPerKg)} g/kg (
                  {REFERENCE_BASIS_LABELS[line.referenceBasis]}) ·{" "}
                  {formatGrams(line.amountGrams)} g
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.payload.casing?.casingType && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <SectionTitle>Därme</SectionTitle>
          <p className="mt-3 text-sm text-aw-cream">
            {recipe.payload.casing.casingType}
            {formatCasingCaliber(recipe.payload.casing)
              ? ` · ${formatCasingCaliber(recipe.payload.casing)}`
              : ""}
          </p>
        </section>
      )}

      {recipe.payload.production?.steps &&
        recipe.payload.production.steps.length > 0 && (
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <SectionTitle>Herstellung</SectionTitle>
            <ol className="mt-4 space-y-3 text-sm">
              {recipe.payload.production.steps.map((step, index) => (
                <li
                  key={`${step.title}-${index}`}
                  className="rounded-lg border border-aw-border/60 px-4 py-3"
                >
                  <p className="font-semibold text-aw-cream">
                    {index + 1}. {step.title}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-aw-muted">{step.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

      {recipe.payload.smoking?.phases &&
        recipe.payload.smoking.phases.length > 0 && (
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <SectionTitle>Räucherprogramm</SectionTitle>
            <ul className="mt-4 space-y-2 text-sm">
              {recipe.payload.smoking.phases.map((phase, index) => (
                <li
                  key={`${phase.name}-${index}`}
                  className="rounded-lg border border-aw-border/60 px-4 py-3"
                >
                  <p className="font-semibold">{phase.name || `Phase ${index + 1}`}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

      <div className="rounded-xl border border-aw-gold/25 bg-aw-gold/5 p-5">
        <p className="text-sm text-aw-muted">
          Kopiere das Rezept in deinen Rezeptgenerator, passe es an und speichere
          es als eigenen Entwurf — privat und nur für dich sichtbar.
        </p>
        <div className="mt-4">
          <RecipeDatabaseCopyButton recipeId={recipe.id} />
        </div>
      </div>
    </div>
  );
}
