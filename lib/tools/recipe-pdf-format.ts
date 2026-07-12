/**
 * @file recipe-pdf-format.ts
 * @purpose Deutsche Zahlen- und Datumsformatierung für den Rezept-PDF-Export.
 */

/** Kilogramm mit deutschem Locale */
export function formatPdfKg(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

/** Prozent mit deutschem Locale */
export function formatPdfPercent(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Gramm mit deutschem Locale */
export function formatPdfGrams(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}

/** Datum und Uhrzeit für Metadaten im PDF */
export function formatPdfDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
