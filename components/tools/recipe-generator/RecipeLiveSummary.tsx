"use client";

/**
 * @file RecipeLiveSummary.tsx
 * @purpose Live-Berechnungsübersicht und Plausibilitätshinweise im Rezept-Wizard.
 * @responsibility Zeigt Summen aus recipe-calculator.ts und kompakte Warnungen.
 * @usage Eingebunden in RecipeGeneratorWizard.
 */

import { useMemo } from "react";

import RecipePlausibilityList from "@/components/tools/recipe-generator/RecipePlausibilityList";
import { calculateRecipePayload } from "@/lib/tools/recipe-calculator";
import {
  checkRecipePlausibility,
  type RecipePlausibilityContext,
} from "@/lib/tools/recipe-plausibility";

type RecipeLiveSummaryProps = RecipePlausibilityContext;

function formatKg(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGrams(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Live-Zusammenfassung: Prozent-Summen, Gewichte, Zutaten und Hinweise.
 */
export default function RecipeLiveSummary(context: RecipeLiveSummaryProps) {
  const { payload } = context;

  const result = useMemo(
    () => calculateRecipePayload(payload),
    [payload],
  );

  const plausibility = useMemo(
    () => checkRecipePlausibility(context, result),
    [context, result],
  );

  const totalPercent =
    result.meatSharePercent + result.binderSharePercent;

  return (
    <aside
      className="rounded-xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-5"
      aria-label="Live-Berechnung"
    >
      <h3 className="font-display text-base font-bold text-aw-gold">
        Live-Berechnung
      </h3>
      <p className="mt-1 text-xs text-aw-muted">
        Aktualisiert sich bei jeder Eingabe.
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Fleisch</dt>
          <dd className="font-semibold text-aw-cream">
            {formatPercent(result.meatSharePercent)} %
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Schüttung</dt>
          <dd className="font-semibold text-aw-cream">
            {formatPercent(result.binderSharePercent)} %
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-aw-border pt-3">
          <dt className="text-aw-muted">Gesamt</dt>
          <dd
            className={`font-semibold ${result.sharesValid ? "text-aw-success" : "text-aw-warning"}`}
          >
            {formatPercent(totalPercent)} %
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Fleischgewicht</dt>
          <dd className="font-semibold text-aw-cream">
            {formatKg(result.meatWeightKg)} kg
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Brätgewicht</dt>
          <dd className="font-semibold text-aw-cream">
            {formatKg(result.braetWeightKg)} kg
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Gesamtmasse</dt>
          <dd className="font-semibold text-aw-cream">
            {formatKg(result.totalWeightKg)} kg
          </dd>
        </div>
      </dl>

      <RecipePlausibilityList issues={plausibility.issues} compact />

      {result.ingredientLines.length > 0 && (
        <div className="mt-5 border-t border-aw-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-aw-muted">
            Zutaten (absolut)
          </h4>
          <ul className="mt-2 space-y-1.5">
            {result.ingredientLines.map((line, index) => (
              <li
                key={`${line.name}-${index}`}
                className="flex justify-between gap-2 text-xs"
              >
                <span className="truncate text-aw-cream">{line.name}</span>
                <span className="shrink-0 font-medium text-aw-gold">
                  {formatGrams(line.amountGrams)} g
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
