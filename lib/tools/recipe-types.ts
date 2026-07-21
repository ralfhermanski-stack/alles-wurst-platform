/**
 * @file recipe-types.ts
 * @purpose TypeScript-Typen für den Rezept-Payload des Alles-Wurst Rezeptgenerators.
 * @responsibility Struktur des JSON-Feldes `payload` in der Tabelle `recipes` definieren.
 * @usage Importiert von `recipe-calculator.ts` und später von UI/API — keine Laufzeitlogik.
 * @see docs/REZEPTGENERATOR_DATENMODELL.md (Version 1.1, §2.4)
 */

// =============================================================================
// Bezugsbasen und Klassifizierung
// =============================================================================

/**
 * Bezugsbasis für Gewürz-/Zutatenmengen in g/kg.
 * - meat:  bezogen auf die Summe aller Fleischanteile
 * - braet: bezogen auf Fleisch + Schüttung (Brät)
 * - total: bezogen auf die Gesamtmasse der Charge
 */
export type IngredientReferenceBasis = "meat" | "braet" | "total";

/** Struktur-Dimensionen S1–S10 (Fleischtechnologie, z. B. Bindung, Fettanteil). */
export type StructureDimension =
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8"
  | "S9"
  | "S10";

/** Räucher-Dimensionen R1–R5 (z. B. Rauchintensität, Trocknung, Farbe). */
export type SmokingDimension = "R1" | "R2" | "R3" | "R4" | "R5";

/**
 * Technologie-Klassifizierung einer einzelnen Fleischkomponente.
 * Jede Fleischzeile im Rezept trägt vollständige S1–S10- und R1–R5-Werte.
 */
export type MeatClassification = {
  S1: number;
  S2: number;
  S3: number;
  S4: number;
  S5: number;
  S6: number;
  S7: number;
  S8: number;
  S9: number;
  S10: number;
  R1: number;
  R2: number;
  R3: number;
  R4: number;
  R5: number;
};

/** Aggregierte Strukturwerte S1–S10 auf Rezeptebene (berechnet, nicht gespeichert). */
export type StructureProfile = Pick<
  MeatClassification,
  StructureDimension
>;

/** Aggregierte Räucherwerte R1–R5 auf Rezeptebene (berechnet, nicht gespeichert). */
export type SmokingProfile = Pick<MeatClassification, SmokingDimension>;

/** Aggregiertes Technologieprofil — Grundlage für spätere Meisteranalyse. */
export type AggregatedTechnologyProfile = {
  structureProfile: StructureProfile;
  smokingProfile: SmokingProfile;
};

// =============================================================================
// Payload-Bestandteile
// =============================================================================

/**
 * Berechnungsgrundlage im Payload.
 * `totalWeightKg` ist die Ziel-Chargenmasse; Prozent-Summen werden validiert.
 */
export type RecipeCalculation = {
  /** Ziel-Gesamtgewicht der Charge in Kilogramm */
  totalWeightKg: number;
  /** Summe aller Fleisch-%-Anteile (wird berechnet oder aus Zeilen abgeleitet) */
  meatSharePercent?: number;
  /** Summe aller Schüttungs-%-Anteile (wird berechnet oder aus Zeilen abgeleitet) */
  binderSharePercent?: number;
};

/** Eine Fleischzeile mit Anteil in % und Technologie-Klassifizierung. */
export type RecipeMeatLine = {
  /** Bezeichnung, z. B. „Schweinebauch“ */
  meatType: string;
  /** Anteil am Gesamtrezept in % (0–100) */
  percentage: number;
  /** S1–S10 und R1–R5 für diese Fleischkomponente */
  classification: MeatClassification;
  /** Reihenfolge in der UI */
  sortOrder: number;
};

/** Eine Schüttungszeile (Bindemittel / Füllstoff) in %. */
export type RecipeBinderLine = {
  /** Bezeichnung, z. B. „Eis“, „Wasser“ */
  binderType: string;
  /** Anteil am Gesamtrezept in % (0–100) */
  percentage: number;
  /** Reihenfolge in der UI */
  sortOrder: number;
};

/**
 * Technische Schüttungswerte in g/kg oder mg/kg.
 * Ergänzt die prozentuale Schüttung (`binders[]`).
 */
export type RecipeSchuettung = {
  /** Wasser/Eis in g/kg Gesamtmischung */
  waterGPerKg?: number;
  /** Nitrit in mg/kg Gesamtmischung */
  nitriteMgPerKg?: number;
  /** Ascorbinsäure in mg/kg (optional, für spätere Erweiterungen) */
  ascorbicMgPerKg?: number;
};

/** Optionale Gruppierung von Zutaten in der UI. */
export type IngredientGroup = "salz" | "gewuerze" | "hilfsstoff" | "sonstiges";

/** Eine Gewürz- oder Zutatenzeile mit g/kg-Angabe und Bezugsbasis. */
export type RecipeIngredientLine = {
  /** Optional: Referenz auf Zutatenkatalog (UUID) — in V1 oft leer */
  ingredientId?: string;
  /** Anzeigename */
  name: string;
  /** Menge in g/kg bezogen auf `referenceBasis` */
  amountPerKg: number;
  /** Bezugsbasis für die g/kg-Angabe */
  referenceBasis: IngredientReferenceBasis;
  /** Mengeneinheit — Standard g/kg */
  unit: "g/kg";
  /** Reihenfolge in der UI */
  sortOrder: number;
  /** Optionale Gruppe */
  group?: IngredientGroup;
};

/** Hülle / Darm */
export type RecipeCasing = {
  casingType: string;
  /**
   * Kaliber als Einzelwert oder Range, z. B. `"32"` oder `"28/32"`.
   */
  caliber?: string;
  /** Legacy-Einzelwert in mm (weiterhin gelesen/geschrieben). */
  caliberMm?: number;
  lengthCm?: number;
  notes?: string;
};

/** Einzelner Produktionsschritt */
export type RecipeProductionStep = {
  title: string;
  description?: string;
  durationMin?: number;
  temperatureC?: number;
};

/** Mahlen — optionale Parameter */
export type RecipeGrinding = {
  passes?: number;
  plateMm?: number;
};

/** Mischen — optionale Parameter */
export type RecipeMixing = {
  durationMin?: number;
  endTemperatureC?: number;
};

/** Kochen — optionale Parameter */
export type RecipeCooking = {
  coreTempC?: number;
  durationMin?: number;
  medium?: string;
};

/** Herstellung / Produktion (ohne Räuchern) */
export type RecipeProduction = {
  steps?: RecipeProductionStep[];
  grinding?: RecipeGrinding;
  mixing?: RecipeMixing;
  stuffing?: { notes?: string };
  resting?: { durationMin?: number; notes?: string };
  cooking?: RecipeCooking;
  notes?: string;
};

/** Eine Phase im Räucherprogramm */
export type RecipeSmokingPhase = {
  name: string;
  temperatureC?: number;
  durationMin?: number;
  humidityPercent?: number;
};

/** Räucherprogramm (optional) */
export type RecipeSmoking = {
  phases?: RecipeSmokingPhase[];
  notes?: string;
};

/**
 * Vollständiger Rezept-Payload — entspricht dem JSON-Feld `recipes.payload`.
 * Detaildaten liegen hier; Stammdaten (name, status) sind Tabellenspalten.
 */
export type RecipePayload = {
  calculation: RecipeCalculation;
  meats: RecipeMeatLine[];
  binders: RecipeBinderLine[];
  /** Technische g/kg-Werte der Schüttung */
  schuettung?: RecipeSchuettung;
  ingredients: RecipeIngredientLine[];
  casing?: RecipeCasing;
  production?: RecipeProduction;
  smoking?: RecipeSmoking;
};

// =============================================================================
// Berechnungsergebnisse (abgeleitete Werte, nicht im Payload gespeichert)
// =============================================================================

/** Fleischzeile mit berechnetem Gewicht in kg */
export type RecipeMeatLineCalculated = RecipeMeatLine & {
  weightKg: number;
};

/** Schüttungszeile mit berechnetem Gewicht in kg */
export type RecipeBinderLineCalculated = RecipeBinderLine & {
  weightKg: number;
};

/** Zutatenzeile mit berechneter absoluter Menge */
export type RecipeIngredientLineCalculated = RecipeIngredientLine & {
  /** Gewicht der Bezugsbasis in kg */
  basisWeightKg: number;
  /** Absolute Menge in Gramm */
  amountGrams: number;
};

/** Vollständiges Ergebnis der Payload-Berechnung */
export type RecipeCalculationResult = {
  /** Ziel-Gesamtgewicht der Charge in kg */
  totalWeightKg: number;
  /** Summe aller Fleischgewichte in kg */
  meatWeightKg: number;
  /** Summe aller Schüttungsgewichte in kg */
  binderWeightKg: number;
  /** Brätgewicht = Fleisch + Schüttung in kg */
  braetWeightKg: number;
  /** Summe der Fleisch-%-Anteile */
  meatSharePercent: number;
  /** Summe der Schüttungs-%-Anteile */
  binderSharePercent: number;
  /** true, wenn Fleisch-% + Schüttung-% = 100 % (mit Toleranz) */
  sharesValid: boolean;
  /** Fehlermeldung, wenn Anteile ungültig */
  sharesMessage?: string;
  /** Fleischzeilen inkl. Gewicht */
  meatLines: RecipeMeatLineCalculated[];
  /** Schüttungszeilen inkl. Gewicht */
  binderLines: RecipeBinderLineCalculated[];
  /** Zutatenzeilen inkl. absoluter Menge */
  ingredientLines: RecipeIngredientLineCalculated[];
  /** Gewichtetes Technologieprofil aus allen Fleischzeilen */
  technologyProfile: AggregatedTechnologyProfile;
};

/** Leerer Payload als Ausgangspunkt für neue Rezepte */
export const EMPTY_RECIPE_PAYLOAD: RecipePayload = {
  calculation: {
    totalWeightKg: 0,
  },
  meats: [],
  binders: [],
  ingredients: [],
};

/** Alle Struktur-Dimensionen S1–S10 in fester Reihenfolge */
export const STRUCTURE_DIMENSIONS: readonly StructureDimension[] = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
  "S10",
] as const;

/** Alle Räucher-Dimensionen R1–R5 in fester Reihenfolge */
export const SMOKING_DIMENSIONS: readonly SmokingDimension[] = [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
] as const;

/**
 * Erzeugt eine leere Klassifizierung mit Nullen.
 * Nützlich als Default beim Anlegen einer neuen Fleischzeile in der UI.
 */
export function createEmptyMeatClassification(): MeatClassification {
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
    R1: 0,
    R2: 0,
    R3: 0,
    R4: 0,
    R5: 0,
  };
}
