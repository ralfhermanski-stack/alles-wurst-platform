/**
 * @file recipe-calculator.ts
 * @purpose Reine Berechnungslogik für den Alles-Wurst Rezeptgenerator.
 * @responsibility Mengen, Anteile und Technologieprofil aus dem Recipe-Payload berechnen.
 * @usage Importiert von zukünftiger UI/API — keine UI-, DB- oder Netzwerk-Abhängigkeiten.
 * @see docs/REZEPTGENERATOR_DATENMODELL.md (Version 1.1)
 * @see lib/tools/recipe-types.ts
 */

import {
  type AggregatedTechnologyProfile,
  type IngredientReferenceBasis,
  type RecipeBinderLine,
  type RecipeBinderLineCalculated,
  type RecipeCalculationResult,
  type RecipeIngredientLine,
  type RecipeIngredientLineCalculated,
  type RecipeMeatLine,
  type RecipeMeatLineCalculated,
  type RecipePayload,
  type SmokingProfile,
  type StructureProfile,
  SMOKING_DIMENSIONS,
  STRUCTURE_DIMENSIONS,
} from "./recipe-types";

// =============================================================================
// Konstanten
// =============================================================================

/**
 * Toleranz für die 100-%-Prüfung (Fleisch + Schüttung).
 * 0,01 % erlaubt minimale Rundungsdifferenzen bei Dezimal-Eingaben.
 */
export const PERCENT_SUM_TOLERANCE = 0.01;

/** Ziel-Summe der Prozentanteile von Fleisch und Schüttung */
export const TARGET_PERCENT_SUM = 100;

// =============================================================================
// Einzelberechnungen — Gewichte
// =============================================================================

/**
 * Berechnet das Gewicht einer Zeile aus Gesamtmasse und Prozentanteil.
 *
 * Formel:
 *   Gewicht (kg) = Gesamtmasse (kg) × Anteil (%) / 100
 *
 * @param totalWeightKg - Ziel-Gesamtgewicht der Charge in kg
 * @param percentage    - Anteil am Gesamtrezept in % (0–100)
 * @returns Gewicht der Zeile in kg
 */
export function calculateLineWeightKg(
  totalWeightKg: number,
  percentage: number,
): number {
  if (totalWeightKg <= 0 || percentage <= 0) {
    return 0;
  }

  return (totalWeightKg * percentage) / 100;
}

/**
 * Berechnet das Fleischgewicht einer einzelnen Fleischzeile in kg.
 *
 * @param totalWeightKg - Ziel-Gesamtgewicht der Charge
 * @param meatLine      - Fleischzeile mit Prozentanteil
 */
export function calculateMeatLineWeightKg(
  totalWeightKg: number,
  meatLine: RecipeMeatLine,
): number {
  return calculateLineWeightKg(totalWeightKg, meatLine.percentage);
}

/**
 * Berechnet das Schüttungsgewicht einer einzelnen Schüttungszeile in kg.
 *
 * @param totalWeightKg - Ziel-Gesamtgewicht der Charge
 * @param binderLine    - Schüttungszeile mit Prozentanteil
 */
export function calculateBinderLineWeightKg(
  totalWeightKg: number,
  binderLine: RecipeBinderLine,
): number {
  return calculateLineWeightKg(totalWeightKg, binderLine.percentage);
}

/**
 * Liefert das Gesamtgewicht der Charge aus dem Payload.
 * Entspricht `payload.calculation.totalWeightKg`.
 *
 * @param payload - Rezept-Payload
 */
export function calculateTotalWeightKg(payload: RecipePayload): number {
  const value = payload.calculation.totalWeightKg;

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

// =============================================================================
// Prozent-Summen und Validierung
// =============================================================================

/**
 * Summiert die Prozentanteile aller Fleischzeilen.
 *
 * @param meats - Fleischzeilen aus dem Payload
 */
export function sumMeatPercent(meats: RecipeMeatLine[]): number {
  return meats.reduce((sum, line) => {
    const percent = line.percentage;

    if (!Number.isFinite(percent)) {
      return sum;
    }

    return sum + percent;
  }, 0);
}

/**
 * Summiert die Prozentanteile aller Schüttungszeilen.
 *
 * @param binders - Schüttungszeilen aus dem Payload
 */
export function sumBinderPercent(binders: RecipeBinderLine[]): number {
  return binders.reduce((sum, line) => {
    const percent = line.percentage;

    if (!Number.isFinite(percent)) {
      return sum;
    }

    return sum + percent;
  }, 0);
}

/**
 * Prüft, ob Fleisch-% + Schüttung-% (innerhalb der Toleranz) 100 % ergeben.
 *
 * @param meatSharePercent   - Summe Fleisch-%
 * @param binderSharePercent - Summe Schüttung-%
 */
export function areSharesValid(
  meatSharePercent: number,
  binderSharePercent: number,
): boolean {
  const total = meatSharePercent + binderSharePercent;

  return Math.abs(total - TARGET_PERCENT_SUM) <= PERCENT_SUM_TOLERANCE;
}

/**
 * Validiert die Prozent-Summe und liefert eine lesbare Meldung.
 *
 * @param meatSharePercent   - Summe Fleisch-%
 * @param binderSharePercent - Summe Schüttung-%
 */
export function validateSharePercents(
  meatSharePercent: number,
  binderSharePercent: number,
): { valid: boolean; message?: string } {
  const total = meatSharePercent + binderSharePercent;

  if (areSharesValid(meatSharePercent, binderSharePercent)) {
    return { valid: true };
  }

  const formattedTotal = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(total);

  return {
    valid: false,
    message: `Fleisch (${meatSharePercent.toFixed(2)} %) und Schüttung (${binderSharePercent.toFixed(2)} %) ergeben zusammen ${formattedTotal} % — es müssen 100 % sein.`,
  };
}

// =============================================================================
// Brät und Gesamtgewichte
// =============================================================================

/**
 * Berechnet die Summe aller Fleischgewichte in kg.
 *
 * @param totalWeightKg - Ziel-Gesamtgewicht
 * @param meats         - Fleischzeilen
 */
export function calculateMeatWeightKg(
  totalWeightKg: number,
  meats: RecipeMeatLine[],
): number {
  return meats.reduce(
    (sum, line) => sum + calculateMeatLineWeightKg(totalWeightKg, line),
    0,
  );
}

/**
 * Berechnet die Summe aller Schüttungsgewichte in kg.
 *
 * @param totalWeightKg - Ziel-Gesamtgewicht
 * @param binders       - Schüttungszeilen
 */
export function calculateBinderWeightKg(
  totalWeightKg: number,
  binders: RecipeBinderLine[],
): number {
  return binders.reduce(
    (sum, line) => sum + calculateBinderLineWeightKg(totalWeightKg, line),
    0,
  );
}

/**
 * Berechnet das Brätgewicht (Fleisch + Schüttung, ohne Hülle).
 *
 * Formel:
 *   Brät (kg) = Fleischgewicht (kg) + Schüttungsgewicht (kg)
 *
 * @param meatWeightKg   - Summe Fleisch in kg
 * @param binderWeightKg - Summe Schüttung in kg
 */
export function calculateBraetWeightKg(
  meatWeightKg: number,
  binderWeightKg: number,
): number {
  return meatWeightKg + binderWeightKg;
}

// =============================================================================
// Zutaten — Bezugsbasis und absolute Menge
// =============================================================================

/**
 * Ermittelt das Bezugs-Gewicht in kg für eine Zutatenzeile.
 *
 * | Basis   | Gewicht                          |
 * |---------|----------------------------------|
 * | meat    | Summe aller Fleischanteile (kg)   |
 * | braet   | Fleisch + Schüttung (kg)         |
 * | total   | Gesamtmasse der Charge (kg)      |
 *
 * @param basis          - Gewählte Bezugsbasis
 * @param totalWeightKg  - Gesamtmasse
 * @param meatWeightKg   - Fleischsumme
 * @param braetWeightKg  - Brät (Fleisch + Schüttung)
 */
export function getReferenceBasisWeightKg(
  basis: IngredientReferenceBasis,
  totalWeightKg: number,
  meatWeightKg: number,
  braetWeightKg: number,
): number {
  switch (basis) {
    case "meat":
      return meatWeightKg;
    case "braet":
      return braetWeightKg;
    case "total":
      return totalWeightKg;
  }
}

/**
 * Berechnet die absolute Zutatenmenge in Gramm.
 *
 * Formel:
 *   Menge (g) = g/kg × Bezugs-Gewicht (kg)
 *
 * Beispiel:
 *   22 g/kg × 10 kg Gesamtmasse = 220 g Salz
 *
 * @param amountPerKg    - Menge in g/kg bezogen auf die Basis
 * @param basisWeightKg  - Gewicht der Bezugsbasis in kg
 */
export function calculateIngredientAmountGrams(
  amountPerKg: number,
  basisWeightKg: number,
): number {
  if (amountPerKg <= 0 || basisWeightKg <= 0) {
    return 0;
  }

  return amountPerKg * basisWeightKg;
}

/**
 * Berechnet eine Zutatenzeile inkl. Bezugs-Gewicht und absoluter Menge.
 *
 * @param ingredient    - Zutatenzeile aus dem Payload
 * @param totalWeightKg - Gesamtmasse
 * @param meatWeightKg  - Fleischsumme
 * @param braetWeightKg - Brätgewicht
 */
export function calculateIngredientLine(
  ingredient: RecipeIngredientLine,
  totalWeightKg: number,
  meatWeightKg: number,
  braetWeightKg: number,
): RecipeIngredientLineCalculated {
  const basisWeightKg = getReferenceBasisWeightKg(
    ingredient.referenceBasis,
    totalWeightKg,
    meatWeightKg,
    braetWeightKg,
  );

  const amountGrams = calculateIngredientAmountGrams(
    ingredient.amountPerKg,
    basisWeightKg,
  );

  return {
    ...ingredient,
    basisWeightKg,
    amountGrams,
  };
}

// =============================================================================
// Technologieprofil — gewichtete Aggregation (keine Meisteranalyse)
// =============================================================================

/**
 * Erzeugt ein leeres Strukturprofil (alle S1–S10 = 0).
 */
function createEmptyStructureProfile(): StructureProfile {
  return {
    S1: 0,
    S2: 0,
    S3: 0,
    S4: 0,
    S5: 0,
    S6: 0,
    S7: 0,
    S8: 0,
    S9: 0,
    S10: 0,
  };
}

/**
 * Erzeugt ein leeres Räucherprofil (alle R1–R5 = 0).
 */
function createEmptySmokingProfile(): SmokingProfile {
  return {
    R1: 0,
    R2: 0,
    R3: 0,
    R4: 0,
    R5: 0,
  };
}

/**
 * Aggregiert das Technologieprofil aus allen Fleischzeilen.
 *
 * Jede Dimension wird gewichtet nach dem %-Anteil der Fleischzeile
 * am Gesamtrezept berechnet:
 *
 *   Profil[D] = Σ (Zeile.percentage / 100 × Zeile.classification[D])
 *
 * Beispiel S1 mit zwei Zeilen (70 % / 30 %):
 *   S1 = 0,70 × S1₁ + 0,30 × S1₂
 *
 * Hinweis:
 *   Dies ist die Live-Vorschau für den Rezeptgenerator.
 *   Meisteranalyse (Referenzprofil, Score) folgt in einem separaten Modul.
 *
 * @param meats - Fleischzeilen mit Klassifizierung
 */
export function aggregateTechnologyProfile(
  meats: RecipeMeatLine[],
): AggregatedTechnologyProfile {
  const structureProfile = createEmptyStructureProfile();
  const smokingProfile = createEmptySmokingProfile();

  for (const line of meats) {
    const weight = line.percentage / 100;

    if (!Number.isFinite(weight) || weight <= 0) {
      continue;
    }

    for (const dimension of STRUCTURE_DIMENSIONS) {
      const value = line.classification[dimension];

      if (Number.isFinite(value)) {
        structureProfile[dimension] += weight * value;
      }
    }

    for (const dimension of SMOKING_DIMENSIONS) {
      const value = line.classification[dimension];

      if (Number.isFinite(value)) {
        smokingProfile[dimension] += weight * value;
      }
    }
  }

  return {
    structureProfile,
    smokingProfile,
  };
}

// =============================================================================
// Gesamtberechnung
// =============================================================================

/**
 * Führt die vollständige Payload-Berechnung durch.
 *
 * Berechnet:
 *   - Gewichte je Fleisch- und Schüttungszeile
 *   - Prozent-Summen und 100-%-Prüfung
 *   - Brätgewicht
 *   - Zutatenmengen je Bezugsbasis
 *   - Aggregiertes Technologieprofil S1–S10 / R1–R5
 *
 * @param payload - Rezept-Payload aus dem JSON-Feld `recipes.payload`
 */
export function calculateRecipePayload(
  payload: RecipePayload,
): RecipeCalculationResult {
  const totalWeightKg = calculateTotalWeightKg(payload);

  const meatSharePercent = sumMeatPercent(payload.meats);
  const binderSharePercent = sumBinderPercent(payload.binders);

  const shareValidation = validateSharePercents(
    meatSharePercent,
    binderSharePercent,
  );

  const meatWeightKg = calculateMeatWeightKg(totalWeightKg, payload.meats);
  const binderWeightKg = calculateBinderWeightKg(
    totalWeightKg,
    payload.binders,
  );
  const braetWeightKg = calculateBraetWeightKg(meatWeightKg, binderWeightKg);

  const meatLines: RecipeMeatLineCalculated[] = payload.meats.map((line) => ({
    ...line,
    weightKg: calculateMeatLineWeightKg(totalWeightKg, line),
  }));

  const binderLines: RecipeBinderLineCalculated[] = payload.binders.map(
    (line) => ({
      ...line,
      weightKg: calculateBinderLineWeightKg(totalWeightKg, line),
    }),
  );

  const ingredientLines: RecipeIngredientLineCalculated[] =
    payload.ingredients.map((ingredient) =>
      calculateIngredientLine(
        ingredient,
        totalWeightKg,
        meatWeightKg,
        braetWeightKg,
      ),
    );

  const technologyProfile = aggregateTechnologyProfile(payload.meats);

  return {
    totalWeightKg,
    meatWeightKg,
    binderWeightKg,
    braetWeightKg,
    meatSharePercent,
    binderSharePercent,
    sharesValid: shareValidation.valid,
    sharesMessage: shareValidation.message,
    meatLines,
    binderLines,
    ingredientLines,
    technologyProfile,
  };
}

/**
 * Validiert den Payload und berechnet das Ergebnis.
 * Gibt bei ungültigem Gesamtgewicht eine Fehlermeldung zurück.
 *
 * @param payload - Rezept-Payload
 */
export function runRecipeCalculation(
  payload: RecipePayload,
): { result: RecipeCalculationResult } | { error: string } {
  const totalWeightKg = calculateTotalWeightKg(payload);

  if (totalWeightKg <= 0) {
    return {
      error: "Das Gesamtgewicht muss größer als 0 kg sein.",
    };
  }

  return {
    result: calculateRecipePayload(payload),
  };
}
