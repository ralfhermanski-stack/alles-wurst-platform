/**
 * @file recipe-casing.ts
 * @purpose Kaliber-Eingaben für Därme (Einzelwert oder Range wie 28/32).
 */

/**
 * Normalisiert Kaliber-Eingaben:
 * - "28/32", "28 / 32", "28-32" → "28/32"
 * - "32", "32 mm", "32,5" → "32" bzw. "32.5"
 */
export function normalizeCasingCaliber(raw: string): string | undefined {
  const trimmed = raw.trim();

  if (!trimmed) {
    return undefined;
  }

  const rangeMatch = trimmed.match(
    /(\d+(?:[.,]\d+)?)\s*[\/\-–]\s*(\d+(?:[.,]\d+)?)/,
  );

  if (rangeMatch) {
    const from = rangeMatch[1].replace(",", ".");
    const to = rangeMatch[2].replace(",", ".");
    return `${from}/${to}`;
  }

  const singleMatch = trimmed.replace(",", ".").match(/-?\d+(?:\.\d+)?/);

  if (!singleMatch) {
    return undefined;
  }

  return singleMatch[0];
}

/**
 * Liest den ersten Zahlenwert aus einem Kaliber (für Legacy-Feld caliberMm).
 */
export function casingCaliberToMm(raw: string | undefined): number | undefined {
  if (!raw) {
    return undefined;
  }

  const normalized = normalizeCasingCaliber(raw);

  if (!normalized) {
    return undefined;
  }

  const first = normalized.split("/")[0];
  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Anzeige-Text für Kaliber im UI/PDF.
 */
export function formatCasingCaliber(input: {
  caliber?: string | null;
  caliberMm?: number | null;
}): string | null {
  const normalized = input.caliber
    ? normalizeCasingCaliber(input.caliber)
    : undefined;

  if (normalized) {
    return `${normalized} mm`;
  }

  if (input.caliberMm !== undefined && input.caliberMm !== null) {
    return `${input.caliberMm} mm`;
  }

  return null;
}
