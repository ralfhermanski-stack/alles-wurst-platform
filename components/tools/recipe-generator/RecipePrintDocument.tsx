import type { ReactNode } from "react";

import type { RecipePdfData } from "@/lib/tools/recipe-pdf-data";
import {
  DEFAULT_RECIPE_PDF_SETTINGS,
  type RecipePdfSettings,
} from "@/lib/tools/recipe-pdf-settings";
import {
  formatPdfDateTime,
  formatPdfGrams,
  formatPdfKg,
  formatPdfPercent,
} from "@/lib/tools/recipe-pdf-format";
import { REFERENCE_BASIS_LABELS } from "@/lib/tools/recipe-labels";
import type { PlausibilitySeverity } from "@/lib/tools/recipe-plausibility";
import type {
  RecipeProduction,
  RecipeSmokingPhase,
} from "@/lib/tools/recipe-types";

type RecipePrintDocumentProps = {
  data: RecipePdfData;
  pdfSettings?: RecipePdfSettings;
};

const SEVERITY_LABELS: Record<PlausibilitySeverity, string> = {
  info: "Hinweis",
  warning: "Prüfen",
  critical: "Wichtig",
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-lg font-bold text-aw-gold print:text-[#8b6914]">
      {children}
    </h2>
  );
}

function EmptyHint({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      className={`text-sm text-aw-muted print:text-gray-500 ${className}`.trim()}
    >
      {children}
    </p>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-sm">
      <dt className="text-aw-muted print:text-gray-600">{label}</dt>
      <dd className="font-medium text-aw-cream print:text-gray-900">{value}</dd>
    </div>
  );
}

function ProductionDetails({ production }: { production: RecipeProduction }) {
  const details: string[] = [];

  if (production.grinding?.passes !== undefined) {
    details.push(`Mahlgänge: ${production.grinding.passes}`);
  }
  if (production.grinding?.plateMm !== undefined) {
    details.push(`Lochscheibe: ${production.grinding.plateMm} mm`);
  }
  if (production.mixing?.durationMin !== undefined) {
    details.push(`Mischzeit: ${production.mixing.durationMin} min`);
  }
  if (production.mixing?.endTemperatureC !== undefined) {
    details.push(`Misch-Endtemperatur: ${production.mixing.endTemperatureC} °C`);
  }
  if (production.cooking?.coreTempC !== undefined) {
    details.push(`Kerntemperatur: ${production.cooking.coreTempC} °C`);
  }
  if (production.cooking?.durationMin !== undefined) {
    details.push(`Kochzeit: ${production.cooking.durationMin} min`);
  }
  if (production.cooking?.medium) {
    details.push(`Kochmedium: ${production.cooking.medium}`);
  }
  if (production.resting?.durationMin !== undefined) {
    details.push(`Ruhezeit: ${production.resting.durationMin} min`);
  }
  if (production.stuffing?.notes) {
    details.push(`Abfüllen: ${production.stuffing.notes}`);
  }
  if (production.resting?.notes) {
    details.push(`Ruhephase: ${production.resting.notes}`);
  }

  if (details.length === 0) {
    return null;
  }

  return (
    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-aw-cream print:text-gray-800">
      {details.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SmokingPhaseRow({ phase, index }: { phase: RecipeSmokingPhase; index: number }) {
  const parts: string[] = [];

  if (phase.temperatureC !== undefined) {
    parts.push(`${phase.temperatureC} °C`);
  }
  if (phase.durationMin !== undefined) {
    parts.push(`${phase.durationMin} min`);
  }
  if (phase.humidityPercent !== undefined) {
    parts.push(`${phase.humidityPercent} % LF`);
  }

  return (
    <li className="rounded-lg border border-aw-border bg-aw-surface/40 px-4 py-3 print:border-gray-300 print:bg-gray-50">
      <p className="font-semibold text-aw-cream print:text-gray-900">
        {phase.name.trim() || `Phase ${index + 1}`}
      </p>
      {parts.length > 0 && (
        <p className="mt-1 text-sm text-aw-muted print:text-gray-600">
          {parts.join(" · ")}
        </p>
      )}
    </li>
  );
}

/**
 * Vollständiges Rezeptdokument für Bildschirmvorschau und Druck/PDF.
 */
export default function RecipePrintDocument({
  data,
  pdfSettings = DEFAULT_RECIPE_PDF_SETTINGS,
}: RecipePrintDocumentProps) {
  const { recipe, calculation, plausibilityIssues, imageUrl, authorName } = data;
  const { payload } = recipe;
  const casing = payload.casing;
  const production = payload.production;
  const smoking = payload.smoking;
  const schuettung = payload.schuettung;

  return (
    <article className="recipe-print-document mx-auto max-w-[210mm] bg-aw-bg px-6 py-8 text-aw-cream print:bg-white print:px-0 print:py-0 print:text-gray-900">
      <header className="border-b border-aw-gold/30 pb-6 print:border-[#8b6914]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-5">
            <div
              className="flex h-28 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-aw-gold/40 bg-aw-surface-2 text-xs text-aw-muted print:border-[#8b6914] print:bg-gray-100 print:text-gray-500"
              aria-label={pdfSettings.pdfLogoUrl ? "PDF-Logo" : "Logo-Platzhalter"}
            >
              {pdfSettings.pdfLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pdfSettings.pdfLogoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                pdfSettings.pdfLogoPlaceholder
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aw-bronze print:text-[#8a5a30]">
                {pdfSettings.pdfHeaderText}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold text-aw-cream print:text-gray-900">
                {recipe.name}
              </h1>
              <p className="mt-2 text-sm text-aw-muted print:text-gray-600">
                Kategorie: {recipe.category?.trim() || "—"}
              </p>
              {authorName && (
                <p className="mt-2 text-sm text-aw-cream print:text-gray-800">
                  Erstellt von{" "}
                  <span className="font-semibold text-aw-gold print:text-[#8b6914]">
                    {authorName}
                  </span>
                </p>
              )}
            </div>
          </div>

          {imageUrl ? (
            <figure className="w-full max-w-[11rem] shrink-0 sm:w-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`Produktbild: ${recipe.name}`}
                className="h-36 w-full rounded-xl border border-aw-border object-cover print:border-gray-300"
              />
              <figcaption className="mt-1 text-[10px] text-aw-muted print:text-gray-500">
                Produktbild
              </figcaption>
            </figure>
          ) : null}

          <dl className="min-w-[12rem] space-y-2 rounded-xl border border-aw-border bg-aw-surface/60 p-4 text-sm print:border-gray-300 print:bg-gray-50">
            <MetaRow
              label="Gesamtgewicht"
              value={`${formatPdfKg(calculation.totalWeightKg)} kg`}
            />
            <MetaRow label="Version" value={`v${recipe.version}`} />
            <MetaRow
              label="Erstellt"
              value={formatPdfDateTime(recipe.createdAt)}
            />
            <MetaRow
              label="Geändert"
              value={formatPdfDateTime(recipe.updatedAt)}
            />
          </dl>
        </div>
      </header>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Fleischanteile</SectionTitle>
        {calculation.meatLines.length === 0 ? (
          <EmptyHint className="mt-3">Keine Fleischanteile erfasst.</EmptyHint>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-aw-border text-left text-xs uppercase tracking-wide text-aw-muted print:border-gray-300 print:text-gray-600">
                <th className="pb-2 pr-4 font-semibold">Fleisch</th>
                <th className="pb-2 pr-4 font-semibold">Anteil</th>
                <th className="pb-2 font-semibold">Gewicht</th>
              </tr>
            </thead>
            <tbody>
              {calculation.meatLines.map((line) => (
                <tr
                  key={`${line.meatType}-${line.sortOrder}`}
                  className="border-b border-aw-border/60 print:border-gray-200"
                >
                  <td className="py-2.5 pr-4">{line.meatType || "—"}</td>
                  <td className="py-2.5 pr-4">
                    {formatPdfPercent(line.percentage)} %
                  </td>
                  <td className="py-2.5">{formatPdfKg(line.weightKg)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Schüttung / Binder</SectionTitle>
        {calculation.binderLines.length === 0 &&
        !schuettung?.waterGPerKg &&
        !schuettung?.nitriteMgPerKg &&
        !schuettung?.ascorbicMgPerKg ? (
          <EmptyHint className="mt-3">Keine Schüttung erfasst.</EmptyHint>
        ) : (
          <div className="mt-4 space-y-4">
            {calculation.binderLines.length > 0 && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-aw-border text-left text-xs uppercase tracking-wide text-aw-muted print:border-gray-300 print:text-gray-600">
                    <th className="pb-2 pr-4 font-semibold">Komponente</th>
                    <th className="pb-2 pr-4 font-semibold">Anteil</th>
                    <th className="pb-2 font-semibold">Gewicht</th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.binderLines.map((line) => (
                    <tr
                      key={`${line.binderType}-${line.sortOrder}`}
                      className="border-b border-aw-border/60 print:border-gray-200"
                    >
                      <td className="py-2.5 pr-4">{line.binderType || "—"}</td>
                      <td className="py-2.5 pr-4">
                        {formatPdfPercent(line.percentage)} %
                      </td>
                      <td className="py-2.5">
                        {formatPdfKg(line.weightKg)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {(schuettung?.waterGPerKg !== undefined ||
              schuettung?.nitriteMgPerKg !== undefined ||
              schuettung?.ascorbicMgPerKg !== undefined) && (
              <dl className="grid gap-2 rounded-lg border border-aw-border bg-aw-surface/40 p-4 text-sm print:border-gray-300 print:bg-gray-50 sm:grid-cols-3">
                {schuettung.waterGPerKg !== undefined && (
                  <div>
                    <dt className="text-aw-muted print:text-gray-600">
                      Wasser/Eis
                    </dt>
                    <dd className="font-medium">
                      {formatPdfGrams(schuettung.waterGPerKg)} g/kg
                    </dd>
                  </div>
                )}
                {schuettung.nitriteMgPerKg !== undefined && (
                  <div>
                    <dt className="text-aw-muted print:text-gray-600">Nitrit</dt>
                    <dd className="font-medium">
                      {formatPdfGrams(schuettung.nitriteMgPerKg)} mg/kg
                    </dd>
                  </div>
                )}
                {schuettung.ascorbicMgPerKg !== undefined && (
                  <div>
                    <dt className="text-aw-muted print:text-gray-600">
                      Ascorbinsäure
                    </dt>
                    <dd className="font-medium">
                      {formatPdfGrams(schuettung.ascorbicMgPerKg)} mg/kg
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Gewürze &amp; Zutaten</SectionTitle>
        {calculation.ingredientLines.length === 0 ? (
          <EmptyHint className="mt-3">Keine Zutaten erfasst.</EmptyHint>
        ) : (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-aw-border text-left text-xs uppercase tracking-wide text-aw-muted print:border-gray-300 print:text-gray-600">
                <th className="pb-2 pr-4 font-semibold">Zutat</th>
                <th className="pb-2 pr-4 font-semibold">Menge</th>
                <th className="pb-2 pr-4 font-semibold">Bezugsbasis</th>
                <th className="pb-2 font-semibold">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {calculation.ingredientLines.map((line) => (
                <tr
                  key={`${line.name}-${line.sortOrder}`}
                  className="border-b border-aw-border/60 print:border-gray-200"
                >
                  <td className="py-2.5 pr-4">{line.name || "—"}</td>
                  <td className="py-2.5 pr-4">
                    {formatPdfGrams(line.amountPerKg)} g/kg
                  </td>
                  <td className="py-2.5 pr-4">
                    {REFERENCE_BASIS_LABELS[line.referenceBasis]}
                  </td>
                  <td className="py-2.5">
                    {formatPdfGrams(line.amountGrams)} g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Därme</SectionTitle>
        {!casing?.casingType?.trim() ? (
          <EmptyHint className="mt-3">Keine Darmangaben erfasst.</EmptyHint>
        ) : (
          <dl className="mt-4 grid gap-3 rounded-lg border border-aw-border bg-aw-surface/40 p-4 text-sm print:border-gray-300 print:bg-gray-50 sm:grid-cols-2">
            <div>
              <dt className="text-aw-muted print:text-gray-600">Darmtyp</dt>
              <dd className="font-medium">{casing.casingType}</dd>
            </div>
            {casing.caliberMm !== undefined && (
              <div>
                <dt className="text-aw-muted print:text-gray-600">Kaliber</dt>
                <dd className="font-medium">{casing.caliberMm} mm</dd>
              </div>
            )}
            {casing.lengthCm !== undefined && (
              <div>
                <dt className="text-aw-muted print:text-gray-600">Länge</dt>
                <dd className="font-medium">{casing.lengthCm} cm</dd>
              </div>
            )}
            {casing.notes && (
              <div className="sm:col-span-2">
                <dt className="text-aw-muted print:text-gray-600">Notizen</dt>
                <dd className="mt-1 font-medium">{casing.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Herstellung</SectionTitle>
        {!production?.steps?.length && !production?.notes?.trim() ? (
          <EmptyHint className="mt-3">
            Keine Herstellungsschritte erfasst.
          </EmptyHint>
        ) : (
          <div className="mt-4 space-y-4">
            {production?.steps && production.steps.length > 0 && (
              <ol className="space-y-3">
                {production.steps.map((step, index) => (
                  <li
                    key={`${step.title}-${index}`}
                    className="rounded-lg border border-aw-border bg-aw-surface/40 px-4 py-3 print:border-gray-300 print:bg-gray-50"
                  >
                    <p className="font-semibold">
                      {index + 1}. {step.title || "Schritt"}
                    </p>
                    {step.description && (
                      <p className="mt-1 text-sm text-aw-muted print:text-gray-600">
                        {step.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-aw-muted print:text-gray-500">
                      {[
                        step.durationMin !== undefined
                          ? `${step.durationMin} min`
                          : null,
                        step.temperatureC !== undefined
                          ? `${step.temperatureC} °C`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || null}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {production && <ProductionDetails production={production} />}
            {production?.notes?.trim() && (
              <p className="text-sm text-aw-cream print:text-gray-800">
                <span className="font-semibold">Notizen: </span>
                {production.notes}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Räucherprogramm</SectionTitle>
        {!smoking?.phases?.length && !smoking?.notes?.trim() ? (
          <EmptyHint className="mt-3">Kein Räucherprogramm erfasst.</EmptyHint>
        ) : (
          <div className="mt-4 space-y-4">
            {smoking?.phases && smoking.phases.length > 0 && (
              <ul className="space-y-3">
                {smoking.phases.map((phase, index) => (
                  <SmokingPhaseRow
                    key={`${phase.name}-${index}`}
                    phase={phase}
                    index={index}
                  />
                ))}
              </ul>
            )}
            {smoking?.notes?.trim() && (
              <p className="text-sm">
                <span className="font-semibold">Notizen: </span>
                {smoking.notes}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 break-inside-avoid">
        <SectionTitle>Plausibilitäts-Hinweise</SectionTitle>
        {plausibilityIssues.length === 0 ? (
          <p className="mt-3 text-sm text-aw-success print:text-green-800">
            Keine Hinweise — die Eingaben wirken plausibel.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {plausibilityIssues.map((issue) => (
              <li
                key={issue.code}
                className="rounded-lg border border-aw-border bg-aw-surface/40 px-4 py-3 print:border-gray-300 print:bg-gray-50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-aw-bronze print:text-[#8a5a30]">
                  {SEVERITY_LABELS[issue.severity]}
                  {issue.blocking ? " · Speichern blockiert" : ""}
                </p>
                <p className="mt-1 font-semibold">{issue.title}</p>
                <p className="mt-1 text-sm text-aw-muted print:text-gray-600">
                  {issue.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="recipe-print-footer mt-10 border-t border-aw-gold/20 pt-4 text-center text-xs text-aw-muted print:fixed print:bottom-0 print:left-0 print:right-0 print:border-[#8b6914]/30 print:bg-white print:py-3 print:text-gray-500">
        <p>{pdfSettings.pdfFooterText}</p>
        {pdfSettings.pdfLegalNotice.trim() && (
          <p className="mt-2 max-w-prose mx-auto text-[10px] leading-relaxed print:text-gray-400">
            {pdfSettings.pdfLegalNotice}
          </p>
        )}
      </footer>
    </article>
  );
}
