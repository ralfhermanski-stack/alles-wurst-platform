"use client";

/**
 * @file BrineCalculator.tsx
 * @purpose Interaktives UI-Werkzeug für den Alles-Wurst Lakerechner.
 * @responsibility Formular, optionale Zutaten, Ergebnisanzeige – Logik in lib/tools/brine-calculator.ts.
 * @usage Eingebunden auf `/werkstatt/lakerechner` via `app/(marketing)/werkstatt/lakerechner/page.tsx`.
 *
 * Fachliches Prinzip: Lake ist Lake – produktneutral, ohne Beratung oder Empfehlungen.
 * Ergebnis wird als übersichtliches Lake-Rezept dargestellt.
 */

import { useState } from "react";
import Icon from "@/components/brand/Icon";
import {
  BRINE_CONCENTRATION_OPTIONS,
  BRINE_SPICE_OPTIONS,
  BRINE_TOOL_HINT,
  BRINE_TYPE_LABELS,
  SALT_LABEL_BY_BRINE_TYPE,
  runBrineCalculation,
  type BrineCalculatorResult,
  type BrineConcentration,
  type BrineSpice,
  type BrineType,
} from "@/lib/tools/brine-calculator";

/** Lakearten für die Radio-Auswahl. */
const BRINE_TYPE_OPTIONS: { value: BrineType; label: string; hint: string }[] = [
  {
    value: "salzlake",
    label: BRINE_TYPE_LABELS.salzlake,
    hint: SALT_LABEL_BY_BRINE_TYPE.salzlake,
  },
  {
    value: "poekellake",
    label: BRINE_TYPE_LABELS.poekellake,
    hint: SALT_LABEL_BY_BRINE_TYPE.poekellake,
  },
  {
    value: "gewuerzlake",
    label: BRINE_TYPE_LABELS.gewuerzlake,
    hint: SALT_LABEL_BY_BRINE_TYPE.gewuerzlake,
  },
];

/** Schnellauswahl für Zucker in g/L (Beispiele aus der Spezifikation). */
const SUGAR_PRESETS_GRAMS_PER_LITER = [5, 10, 20] as const;

/**
 * Lakerechner – berechnet Lake-Rezepte nach Volumen und Konzentration.
 * Optional Zucker und Gewürze – der Einsatz bleibt beim Nutzer.
 */
export default function BrineCalculator() {
  // ── Pflichtfelder ──────────────────────────────────────────────────────────
  const [brineType, setBrineType] = useState<BrineType>("poekellake");
  const [liters, setLiters] = useState("");
  const [concentration, setConcentration] = useState<BrineConcentration>(10);

  // ── Optionale Zutaten ──────────────────────────────────────────────────────
  const [useSugar, setUseSugar] = useState(false);
  const [sugarPerLiter, setSugarPerLiter] = useState("5");
  const [useSpices, setUseSpices] = useState(false);
  const [selectedSpices, setSelectedSpices] = useState<BrineSpice[]>([]);
  const [customSpices, setCustomSpices] = useState("");

  // ── Ergebnis ───────────────────────────────────────────────────────────────
  const [result, setResult] = useState<BrineCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Schaltet ein Standardgewürz in der Mehrfachauswahl um.
   *
   * @param spice - Name des Gewürzes
   */
  function toggleSpice(spice: BrineSpice) {
    setSelectedSpices((current) =>
      current.includes(spice) ? current.filter((s) => s !== spice) : [...current, spice],
    );
  }

  /**
   * Startet die Lake-Berechnung über die zentrale Logik in lib/.
   */
  function handleCalculate() {
    setError(null);
    setResult(null);

    const outcome = runBrineCalculation({
      brineType,
      litersRaw: liters,
      concentration,
      useSugar,
      sugarPerLiterRaw: sugarPerLiter,
      useSpices,
      selectedSpices,
      customSpicesRaw: customSpices,
    });

    if ("error" in outcome) {
      setError(outcome.error);
      return;
    }

    setResult(outcome.result);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)]">
      {/* Werkzeug-Kopf */}
      <div className="flex items-center gap-4 border-b border-aw-border bg-aw-surface/80 px-6 py-5 sm:px-8">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-aw-gold/10 text-aw-gold ring-1 ring-aw-gold/30">
          <Icon name="brine" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-aw-cream sm:text-xl">
            Lakerechner
          </h2>
          <p className="text-sm text-aw-muted">
            Lake berechnen – neutral nach Liter, Konzentration und Zutaten.
          </p>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-8">
        {/* ── Lakeart ──────────────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-sm font-semibold text-aw-cream">Lakeart</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {BRINE_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer flex-col rounded-lg border px-4 py-3 transition-colors ${
                  brineType === option.value
                    ? "border-aw-gold/50 bg-aw-gold/10"
                    : "border-aw-border bg-aw-bg hover:border-aw-gold/30"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="brine-type"
                    value={option.value}
                    checked={brineType === option.value}
                    onChange={() => setBrineType(option.value)}
                    className="h-4 w-4 accent-aw-gold"
                  />
                  <span className="text-sm font-medium text-aw-cream">{option.label}</span>
                </span>
                <span className="mt-1 pl-6 text-xs text-aw-muted">{option.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ── Liter Lake ───────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="brine-liters" className="text-sm font-semibold text-aw-cream">
            Liter Lake
          </label>
          <input
            id="brine-liters"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="z. B. 5"
            value={liters}
            onChange={(event) => setLiters(event.target.value)}
            className="mt-3 w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream placeholder:text-aw-muted/60 focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40"
          />
          <p className="mt-2 text-xs text-aw-muted">
            Freie Eingabe – z. B. 1, 2, 5, 10 oder 25 Liter.
          </p>
        </div>

        {/* ── Konzentration ────────────────────────────────────────────────── */}
        <div>
          <label htmlFor="brine-concentration" className="text-sm font-semibold text-aw-cream">
            Konzentration
          </label>
          <select
            id="brine-concentration"
            value={concentration}
            onChange={(event) =>
              setConcentration(Number(event.target.value) as BrineConcentration)
            }
            className="mt-3 w-full appearance-none rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40"
          >
            {BRINE_CONCENTRATION_OPTIONS.map((percent) => (
              <option key={percent} value={percent}>
                {percent} %
              </option>
            ))}
          </select>
        </div>

        {/* ── Zucker (optional) ────────────────────────────────────────────── */}
        <fieldset className="rounded-xl border border-aw-border bg-aw-bg/40 p-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={useSugar}
              onChange={(event) => setUseSugar(event.target.checked)}
              className="h-4 w-4 rounded accent-aw-gold"
            />
            <span className="text-sm font-semibold text-aw-cream">Zucker verwenden</span>
          </label>

          {useSugar && (
            <div className="mt-4">
              <label htmlFor="sugar-per-liter" className="text-sm text-aw-muted">
                g pro Liter
              </label>
              <input
                id="sugar-per-liter"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={sugarPerLiter}
                onChange={(event) => setSugarPerLiter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGAR_PRESETS_GRAMS_PER_LITER.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSugarPerLiter(String(preset))}
                    className="rounded-md border border-aw-border bg-aw-surface px-3 py-1.5 text-xs font-medium text-aw-cream transition-colors hover:border-aw-gold/40 hover:text-aw-gold"
                  >
                    {preset} g/L
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* ── Gewürze (optional) ───────────────────────────────────────────── */}
        <fieldset className="rounded-xl border border-aw-border bg-aw-bg/40 p-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={useSpices}
              onChange={(event) => setUseSpices(event.target.checked)}
              className="h-4 w-4 rounded accent-aw-gold"
            />
            <span className="text-sm font-semibold text-aw-cream">Gewürze hinzufügen</span>
          </label>

          {useSpices && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BRINE_SPICE_OPTIONS.map((spice) => (
                  <label
                    key={spice}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      selectedSpices.includes(spice)
                        ? "border-aw-gold/50 bg-aw-gold/10 text-aw-cream"
                        : "border-aw-border bg-aw-bg text-aw-muted hover:border-aw-gold/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpices.includes(spice)}
                      onChange={() => toggleSpice(spice)}
                      className="h-3.5 w-3.5 accent-aw-gold"
                    />
                    {spice}
                  </label>
                ))}
              </div>

              <div>
                <label htmlFor="custom-spices" className="text-sm text-aw-muted">
                  Eigene Gewürze
                </label>
                <input
                  id="custom-spices"
                  type="text"
                  placeholder="z. B. Chili, Zitrone, Nelken"
                  value={customSpices}
                  onChange={(event) => setCustomSpices(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-cream placeholder:text-aw-muted/60 focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40"
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* ── Berechnen ──────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleCalculate}
          className="w-full rounded-lg bg-aw-gold px-6 py-3.5 text-sm font-bold tracking-wide text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream sm:text-base"
        >
          Berechnen
        </button>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-aw-error/40 bg-aw-error/10 px-4 py-3 text-sm text-aw-cream"
          >
            {error}
          </p>
        )}

        {/* ── Lake-Rezept (Ergebnis) ───────────────────────────────────────── */}
        {result && (
          <div
            aria-live="polite"
            className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-6"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-aw-gold">
              Lake-Rezept
            </p>
            <p className="mt-1 text-xs text-aw-muted">
              Übersichtliche Zusammenstellung deiner berechneten Lake.
            </p>

            <dl className="mt-5 space-y-3">
              <ResultRow label="Lakeart" value={result.brineTypeLabel} />
              <ResultRow label="Liter" value={result.litersLabel} />
              <ResultRow label="Konzentration" value={result.concentrationLabel} />
              <ResultRow
                label={result.saltLabel}
                value={result.saltAmountLabel}
                highlight
              />

              {result.sugarLabel && result.sugarAmountLabel && (
                <ResultRow label={result.sugarLabel} value={result.sugarAmountLabel} />
              )}

              {result.spicesLabel && (
                <div className="border-t border-aw-border/60 pt-3">
                  <dt className="text-sm text-aw-muted">{result.spicesLabel}</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {result.spiceList.length > 0 ? (
                      result.spiceList.map((spice) => (
                        <span
                          key={spice}
                          className="rounded-full border border-aw-gold/30 bg-aw-bg/60 px-3 py-1 text-sm text-aw-cream"
                        >
                          {spice}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-aw-muted">
                        Keine Gewürze ausgewählt
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* ── Fachlicher Hinweis (produktneutral) ──────────────────────────── */}
        <aside className="rounded-lg border border-aw-border bg-aw-bg/60 px-4 py-4 text-sm leading-7 text-aw-muted">
          <p className="font-semibold text-aw-cream/90">Hinweis</p>
          <p className="mt-2">{BRINE_TOOL_HINT}</p>
        </aside>
      </div>
    </div>
  );
}

/**
 * Einzelne Zeile im Lake-Rezept – wiederverwendbar innerhalb des Lakerechners.
 *
 * @param label     - Beschriftung links
 * @param value     - Wert rechts
 * @param highlight - Gold-Hervorhebung für die Hauptmenge (Salz)
 */
function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-aw-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-aw-muted">{label}</dt>
      <dd
        className={`font-display font-bold ${
          highlight ? "text-xl text-aw-gold" : "text-lg text-aw-cream"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
