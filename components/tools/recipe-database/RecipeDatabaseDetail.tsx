"use client";

/**
 * @file RecipeDatabaseDetail.tsx
 * @purpose Öffentliche Detailansicht eines offiziellen Rezepts.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import RecipeDatabaseCopyButton from "@/components/tools/recipe-database/RecipeDatabaseCopyButton";
import { calculateRecipePayload } from "@/lib/tools/recipe-calculator";
import { RECIPE_TYPE_SUMMARY_LABELS } from "@/lib/tools/recipe-database-labels";
import { REFERENCE_BASIS_LABELS } from "@/lib/tools/recipe-labels";
import {
  fetchOfficialRecipe,
  type PublicRecipeDetail,
} from "@/lib/tools/recipe-client";

type RecipeDatabaseDetailProps = {
  recipeId: string;
};

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
            {calculation.meatLines.map((line) => (
              <li
                key={`${line.meatType}-${line.sortOrder}`}
                className="flex justify-between gap-4 border-b border-aw-border/50 py-2 last:border-0"
              >
                <span>{line.meatType}</span>
                <span className="text-aw-muted">
                  {formatPercent(line.percentage)} % · {formatKg(line.weightKg)} kg
                </span>
              </li>
            ))}
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
            {recipe.payload.casing.caliberMm !== undefined &&
              ` · ${recipe.payload.casing.caliberMm} mm`}
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
