/**
 * @file salt-calculator.ts
 * @purpose Reine Berechnungslogik für den Alles-Wurst Salzrechner.
 * @responsibility Eingaben validieren, Fleischgewicht normalisieren, Salzmenge berechnen, Salzgabe bewerten.
 * @usage Importiert von `components/tools/SaltCalculator.tsx` – keine UI-Abhängigkeiten.
 */

/** Mögliche Eingabeeinheiten für die Fleischmenge. */
export type MeatUnit = "kg" | "g";

/** Auswählbare Salzarten – beeinflusst nur die Beschriftung, nicht die Formel. */
export type SaltType = "kochsalz" | "nitritpoekelsalz";

/**
 * Bewertungsstufen der Salzgabe in Gramm pro Kilogramm Fleisch.
 * - mild:   14–16 g/kg
 * - normal: 17–19 g/kg
 * - stark:  20–22 g/kg
 */
export type SaltIntensity = "mild" | "normal" | "stark" | "ausserhalb";

/** Ein Auswahlwert für die Salzgabe (Gramm Salz je Kilogramm Fleisch). */
export type SaltPerKgOption = {
  /** Salzmenge in g/kg, z. B. 18 */
  value: number;
  /** Kurzbeschreibung für Dropdown, z. B. „18 g/kg“ */
  label: string;
  /** Zugehörige Bewertungsstufe */
  intensity: SaltIntensity;
};

/**
 * Vordefinierte Salzgaben von 14–22 g/kg – deckt alle drei Bewertungsstufen ab.
 * Sortiert aufsteigend für die Dropdown-Auswahl.
 */
export const SALT_PER_KG_OPTIONS: SaltPerKgOption[] = [
  { value: 14, label: "14 g/kg", intensity: "mild" },
  { value: 15, label: "15 g/kg", intensity: "mild" },
  { value: 16, label: "16 g/kg", intensity: "mild" },
  { value: 17, label: "17 g/kg", intensity: "normal" },
  { value: 18, label: "18 g/kg", intensity: "normal" },
  { value: 19, label: "19 g/kg", intensity: "normal" },
  { value: 20, label: "20 g/kg", intensity: "stark" },
  { value: 21, label: "21 g/kg", intensity: "stark" },
  { value: 22, label: "22 g/kg", intensity: "stark" },
];

/** Lesbare Bezeichnungen und Erläuterungen für die Salzgabe-Bewertung. */
export const SALT_INTENSITY_INFO: Record<
  SaltIntensity,
  { label: string; range: string; description: string }
> = {
  mild: {
    label: "Mild",
    range: "14–16 g/kg",
    description: "Dezente Würzung – gut für mild gewürzte Produkte.",
  },
  normal: {
    label: "Normal",
    range: "17–19 g/kg",
    description: "Ausgewogene Salzgabe – der häufigste Bereich im Handwerk.",
  },
  stark: {
    label: "Stark",
    range: "20–22 g/kg",
    description: "Kräftige Würzung – für würzige Bratwurst und Salami.",
  },
  ausserhalb: {
    label: "Außerhalb der Richtwerte",
    range: "unter 14 oder über 22 g/kg",
    description: "Liegt außerhalb der üblichen Orientierungswerte – bewusst prüfen.",
  },
};

/** Rohdaten aus dem Formular, bevor sie validiert werden. */
export type SaltCalculatorInput = {
  /** Eingegebene Fleischmenge als String (kommt direkt aus dem Input-Feld). */
  meatAmountRaw: string;
  /** Gewählte Einheit der Fleischmenge. */
  meatUnit: MeatUnit;
  /** Gewählte Salzart (Kochsalz oder Nitritpökelsalz). */
  saltType: SaltType;
  /** Salzgabe in Gramm pro Kilogramm Fleisch, z. B. 18 */
  saltPerKg: number;
};

/** Ergebnis einer erfolgreichen Berechnung – bereit für die Anzeige. */
export type SaltCalculatorResult = {
  /** Fleischmenge formatiert mit Einheit, z. B. „5 kg“. */
  meatAmountLabel: string;
  /** Salzgabe formatiert, z. B. „18 g/kg“. */
  saltPerKgLabel: string;
  /** Benötigte Salzmenge in Gramm, formatiert, z. B. „90 g“. */
  saltAmountLabel: string;
  /** Lesbare Bezeichnung der Salzart für die Ergebniszeile. */
  saltTypeLabel: string;
  /** Roher Wert in Gramm (für spätere Erweiterungen wie PDF-Export). */
  saltAmountGrams: number;
  /** Bewertung der gewählten Salzgabe */
  intensity: SaltIntensity;
  /** Lesbare Bewertung, z. B. „Normal“ */
  intensityLabel: string;
  /** Kurzer Hinweis zur Bewertung */
  intensityDescription: string;
};

/** Lesbare Labels für die Salzarten in der Ergebnisanzeige. */
const SALT_TYPE_LABELS: Record<SaltType, string> = {
  kochsalz: "Kochsalz",
  nitritpoekelsalz: "Nitritpökelsalz",
};

/**
 * Wandelt die eingegebene Fleischmenge in Gramm um.
 * Alle weiteren Berechnungen arbeiten intern einheitlich in Gramm.
 *
 * @param amount - Numerischer Wert der Fleischmenge
 * @param unit   - „kg“ oder „g“
 * @returns Fleischgewicht in Gramm
 */
export function convertMeatToGrams(amount: number, unit: MeatUnit): number {
  if (unit === "kg") {
    // 1 kg = 1 000 g
    return amount * 1000;
  }
  return amount;
}

/**
 * Wandelt Gramm in Kilogramm um – wird für die g/kg-Formel benötigt.
 *
 * @param meatGrams - Fleischgewicht in Gramm
 * @returns Fleischgewicht in Kilogramm
 */
export function convertGramsToKg(meatGrams: number): number {
  return meatGrams / 1000;
}

/**
 * Formatiert eine Fleischmenge für die Ergebnisanzeige.
 * Behält die vom Nutzer gewählte Einheit bei (kg oder g).
 *
 * @param amount - Numerischer Wert der Fleischmenge
 * @param unit   - Gewählte Einheit
 */
export function formatMeatAmount(amount: number, unit: MeatUnit): string {
  if (unit === "kg") {
    const formatted = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 3,
    }).format(amount);
    return `${formatted} kg`;
  }

  const formatted = new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} g`;
}

/**
 * Formatiert die berechnete Salzmenge in Gramm.
 * Ganze Zahlen ohne Nachkommastelle, sonst maximal eine Dezimalstelle.
 *
 * @param grams - Salzmenge in Gramm
 */
export function formatSaltGrams(grams: number): string {
  const isWholeNumber = Math.abs(grams - Math.round(grams)) < 0.0001;

  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: isWholeNumber ? 0 : 1,
    maximumFractionDigits: isWholeNumber ? 0 : 1,
  }).format(grams);

  return `${formatted} g`;
}

/**
 * Formatiert die Salzgabe in g/kg für die Anzeige.
 *
 * @param saltPerKg - Gramm Salz je Kilogramm Fleisch
 */
export function formatSaltPerKg(saltPerKg: number): string {
  const formatted = new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 0,
  }).format(saltPerKg);

  return `${formatted} g/kg`;
}

/**
 * Bewertet die Salzgabe anhand der Gramm-pro-Kilogramm-Angabe.
 *
 * Richtwerte laut Fleischerpraxis:
 * - 14–16 g/kg → mild
 * - 17–19 g/kg → normal
 * - 20–22 g/kg → stark
 *
 * @param saltPerKg - Salzgabe in g/kg
 */
export function evaluateSaltDosage(saltPerKg: number): {
  intensity: SaltIntensity;
  label: string;
  description: string;
} {
  if (saltPerKg >= 14 && saltPerKg <= 16) {
    return {
      intensity: "mild",
      label: SALT_INTENSITY_INFO.mild.label,
      description: SALT_INTENSITY_INFO.mild.description,
    };
  }

  if (saltPerKg >= 17 && saltPerKg <= 19) {
    return {
      intensity: "normal",
      label: SALT_INTENSITY_INFO.normal.label,
      description: SALT_INTENSITY_INFO.normal.description,
    };
  }

  if (saltPerKg >= 20 && saltPerKg <= 22) {
    return {
      intensity: "stark",
      label: SALT_INTENSITY_INFO.stark.label,
      description: SALT_INTENSITY_INFO.stark.description,
    };
  }

  return {
    intensity: "ausserhalb",
    label: SALT_INTENSITY_INFO.ausserhalb.label,
    description: SALT_INTENSITY_INFO.ausserhalb.description,
  };
}

/**
 * Kernberechnung: Salzmenge = Fleischgewicht (kg) × Salzgabe (g/kg)
 *
 * Beispiel:
 *   5 kg × 20 g/kg = 100 g Salz
 *
 * @param meatGrams - Fleischgewicht in Gramm
 * @param saltPerKg - Salzgabe in Gramm je Kilogramm Fleisch
 * @returns Benötigte Salzmenge in Gramm
 */
export function calculateSaltGrams(meatGrams: number, saltPerKg: number): number {
  const meatKg = convertGramsToKg(meatGrams);

  // Salz in Gramm = Kilogramm Fleisch × Gramm Salz pro Kilogramm
  return meatKg * saltPerKg;
}

/**
 * Validiert und berechnet die Salzmenge.
 * Gibt bei ungültiger Eingabe eine Fehlermeldung zurück, sonst das Ergebnis.
 *
 * @param input - Rohdaten aus dem Formular
 * @returns `{ result }` bei Erfolg oder `{ error }` bei Validierungsfehler
 */
export function runSaltCalculation(
  input: SaltCalculatorInput,
): { result: SaltCalculatorResult } | { error: string } {
  const trimmed = input.meatAmountRaw.trim().replace(",", ".");

  if (trimmed === "") {
    return { error: "Bitte gib eine Fleischmenge ein." };
  }

  const meatAmount = Number(trimmed);

  if (Number.isNaN(meatAmount)) {
    return { error: "Die Fleischmenge muss eine gültige Zahl sein." };
  }

  if (meatAmount <= 0) {
    return { error: "Die Fleischmenge muss größer als 0 sein." };
  }

  if (input.saltPerKg <= 0) {
    return { error: "Die Salzgabe muss größer als 0 g/kg sein." };
  }

  // Fleischgewicht in Gramm normalisieren
  const meatGrams = convertMeatToGrams(meatAmount, input.meatUnit);

  // Salzmenge nach g/kg-Formel berechnen
  const saltAmountGrams = calculateSaltGrams(meatGrams, input.saltPerKg);

  // Salzgabe fachlich bewerten (mild / normal / stark)
  const evaluation = evaluateSaltDosage(input.saltPerKg);

  const saltTypeLabel = SALT_TYPE_LABELS[input.saltType];

  return {
    result: {
      meatAmountLabel: formatMeatAmount(meatAmount, input.meatUnit),
      saltPerKgLabel: formatSaltPerKg(input.saltPerKg),
      saltAmountLabel: formatSaltGrams(saltAmountGrams),
      saltTypeLabel,
      saltAmountGrams,
      intensity: evaluation.intensity,
      intensityLabel: evaluation.label,
      intensityDescription: evaluation.description,
    },
  };
}
