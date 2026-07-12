"use client";

/**
 * @file SaltCalculator.tsx
 * @purpose Interaktives UI-Werkzeug für den Alles-Wurst Salzrechner.
 * @responsibility Formular, Eingabevalidierung (über lib), Ergebnisanzeige inkl. Salzgabe-Bewertung.
 * @usage Eingebunden auf `/werkstatt/salzrechner` via `app/(marketing)/werkstatt/salzrechner/page.tsx`.
 *
 * Props: keine – die Komponente ist eigenständig und verwaltet ihren Zustand intern.
 */

import { useState } from "react";
import Icon from "@/components/brand/Icon";
import {
  SALT_INTENSITY_INFO,
  SALT_PER_KG_OPTIONS,
  runSaltCalculation,
  type MeatUnit,
  type SaltCalculatorResult,
  type SaltIntensity,
  type SaltType,
} from "@/lib/tools/salt-calculator";

/** Optionen für die Salzart-Auswahl (Radio-Buttons). */
const SALT_TYPE_OPTIONS: { value: SaltType; label: string }[] = [
  { value: "kochsalz", label: "Kochsalz" },
  { value: "nitritpoekelsalz", label: "Nitritpökelsalz" },
];

/** Farbliche Hervorhebung der Salzgabe-Bewertung im Ergebnis. */
const INTENSITY_BADGE_STYLES: Record<SaltIntensity, string> = {
  mild: "border-aw-success/40 bg-aw-success/10 text-aw-success",
  normal: "border-aw-gold/40 bg-aw-gold/10 text-aw-gold",
  stark: "border-aw-warning/40 bg-aw-warning/10 text-aw-warning",
  ausserhalb: "border-aw-border bg-aw-surface-2 text-aw-muted",
};

/**
 * Salzrechner – erste produktive Funktion der Alles-Wurst Plattform.
 * Berechnet die benötigte Salzmenge aus Fleischmenge und Salzgabe (g/kg).
 */
export default function SaltCalculator() {
  // ── Formularzustand ────────────────────────────────────────────────────────
  const [meatAmount, setMeatAmount] = useState("");
  const [meatUnit, setMeatUnit] = useState<MeatUnit>("kg");
  const [saltType, setSaltType] = useState<SaltType>("kochsalz");
  // Standard: 18 g/kg – mittlerer Normal-Bereich
  const [saltPerKg, setSaltPerKg] = useState(18);

  // ── Ergebnis- und Fehlerzustand (werden erst nach Klick gesetzt) ───────────
  const [result, setResult] = useState<SaltCalculatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Löst die Berechnung aus, wenn der Nutzer auf „Berechnen" klickt.
   * Vorherige Fehler und Ergebnisse werden zurückgesetzt.
   */
  function handleCalculate() {
    setError(null);
    setResult(null);

    const outcome = runSaltCalculation({
      meatAmountRaw: meatAmount,
      meatUnit,
      saltType,
      saltPerKg,
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
          <Icon name="salt" className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-aw-cream sm:text-xl">
            Salzrechner
          </h2>
          <p className="text-sm text-aw-muted">
            Salzmenge für Fleisch und Wurst – in g/kg, mit fachlicher Bewertung.
          </p>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-8">
        {/* ── Fleischmenge ─────────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-sm font-semibold text-aw-cream">Menge Fleisch</legend>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              id="meat-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step={meatUnit === "kg" ? "0.001" : "1"}
              placeholder={meatUnit === "kg" ? "z. B. 5" : "z. B. 5000"}
              value={meatAmount}
              onChange={(event) => setMeatAmount(event.target.value)}
              className="w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream placeholder:text-aw-muted/60 focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40 sm:flex-1"
              aria-describedby="meat-unit-hint"
            />

            {/* Einheiten-Umschalter: Kilogramm / Gramm */}
            <div
              className="inline-flex shrink-0 rounded-lg border border-aw-border bg-aw-bg p-1"
              role="group"
              aria-label="Einheit wählen"
            >
              {(["kg", "g"] as MeatUnit[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setMeatUnit(unit)}
                  className={`rounded-md px-5 py-2.5 text-sm font-semibold transition-colors ${
                    meatUnit === unit
                      ? "bg-aw-gold text-aw-bg"
                      : "text-aw-muted hover:text-aw-cream"
                  }`}
                  aria-pressed={meatUnit === unit}
                >
                  {unit === "kg" ? "Kilogramm" : "Gramm"}
                </button>
              ))}
            </div>
          </div>
          <p id="meat-unit-hint" className="mt-2 text-xs text-aw-muted">
            Wähle Kilogramm oder Gramm – die Berechnung passt sich automatisch an.
          </p>
        </fieldset>

        {/* ── Salzart ──────────────────────────────────────────────────────── */}
        <fieldset>
          <legend className="text-sm font-semibold text-aw-cream">Salzart</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SALT_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  saltType === option.value
                    ? "border-aw-gold/50 bg-aw-gold/10"
                    : "border-aw-border bg-aw-bg hover:border-aw-gold/30"
                }`}
              >
                <input
                  type="radio"
                  name="salt-type"
                  value={option.value}
                  checked={saltType === option.value}
                  onChange={() => setSaltType(option.value)}
                  className="h-4 w-4 accent-aw-gold"
                />
                <span className="text-sm font-medium text-aw-cream">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ── Salzgabe (g/kg) ──────────────────────────────────────────────── */}
        <div>
          <label htmlFor="salt-per-kg" className="text-sm font-semibold text-aw-cream">
            Salzgabe
          </label>
          <select
            id="salt-per-kg"
            value={saltPerKg}
            onChange={(event) => setSaltPerKg(Number(event.target.value))}
            className="mt-3 w-full appearance-none rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-base text-aw-cream focus:border-aw-gold focus:outline-none focus:ring-1 focus:ring-aw-gold/40"
          >
            <optgroup label={`Mild (${SALT_INTENSITY_INFO.mild.range})`}>
              {SALT_PER_KG_OPTIONS.filter((o) => o.intensity === "mild").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            <optgroup label={`Normal (${SALT_INTENSITY_INFO.normal.range})`}>
              {SALT_PER_KG_OPTIONS.filter((o) => o.intensity === "normal").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
            <optgroup label={`Stark (${SALT_INTENSITY_INFO.stark.range})`}>
              {SALT_PER_KG_OPTIONS.filter((o) => o.intensity === "stark").map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Orientierungstabelle der Bewertungsstufen */}
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(["mild", "normal", "stark"] as const).map((key) => (
              <div
                key={key}
                className="rounded-lg border border-aw-border bg-aw-bg/60 px-3 py-2 text-xs"
              >
                <p className="font-semibold text-aw-cream">{SALT_INTENSITY_INFO[key].label}</p>
                <p className="text-aw-gold">{SALT_INTENSITY_INFO[key].range}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Berechnen-Button ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleCalculate}
          className="w-full rounded-lg bg-aw-gold px-6 py-3.5 text-sm font-bold tracking-wide text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream sm:text-base"
        >
          Berechnen
        </button>

        {/* ── Fehlermeldung ────────────────────────────────────────────────── */}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-aw-error/40 bg-aw-error/10 px-4 py-3 text-sm text-aw-cream"
          >
            {error}
          </p>
        )}

        {/* ── Ergebnis ─────────────────────────────────────────────────────── */}
        {result && (
          <div
            aria-live="polite"
            className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-6"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-aw-gold">
              Ergebnis
            </p>

            {/* Bewertungs-Badge der Salzgabe */}
            <div
              className={`mt-4 inline-flex flex-col rounded-lg border px-4 py-3 ${INTENSITY_BADGE_STYLES[result.intensity]}`}
            >
              <span className="text-xs font-medium uppercase tracking-wider">Bewertung</span>
              <span className="mt-0.5 font-display text-lg font-bold">{result.intensityLabel}</span>
              <span className="mt-1 text-xs leading-5 opacity-90">{result.intensityDescription}</span>
            </div>

            <dl className="mt-5 space-y-3">
              <div className="flex items-baseline justify-between gap-4 border-b border-aw-border/60 pb-3">
                <dt className="text-sm text-aw-muted">Fleischmenge</dt>
                <dd className="font-display text-lg font-bold text-aw-cream">
                  {result.meatAmountLabel}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-aw-border/60 pb-3">
                <dt className="text-sm text-aw-muted">Salzgabe</dt>
                <dd className="font-display text-lg font-bold text-aw-cream">
                  {result.saltPerKgLabel}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-aw-muted">Benötigte Salzmenge</dt>
                <dd className="font-display text-xl font-bold text-aw-gold">
                  {result.saltAmountLabel} {result.saltTypeLabel}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* ── Hinweis (immer sichtbar) ─────────────────────────────────────── */}
        <aside className="rounded-lg border border-aw-border bg-aw-bg/60 px-4 py-4 text-sm leading-6 text-aw-muted">
          <p className="font-semibold text-aw-cream/90">Hinweis</p>
          <p className="mt-1">
            Die optimale Salzmenge hängt vom Produkt, Geschmack und Herstellungsverfahren ab.
            Die Bewertung (mild / normal / stark) dient als Orientierungshilfe für die gewählte
            Salzgabe in g/kg.
          </p>
        </aside>
      </div>
    </div>
  );
}
