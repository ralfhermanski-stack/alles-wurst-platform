/**
 * @file brine-calculator.ts
 * @purpose Reine Berechnungslogik für den Alles-Wurst Lakerechner.
 * @responsibility Lake-Berechnung, Validierung, Formatierung – ohne UI-Abhängigkeiten.
 * @usage Importiert von `components/tools/BrineCalculator.tsx`.
 *
 * Fachliches Prinzip: Lake ist Lake – produktneutral.
 * Es gibt keine Produktauswahl, keine Einlegezeit und keine automatischen Empfehlungen.
 * Der Nutzer entscheidet selbst über Einsatz, Intensität und Anwendung.
 */

/** Fachlicher Hinweistext – zentral gepflegt, in der UI wiederverwendet. */
export const BRINE_TOOL_HINT =
  "Lake ist ein Werkzeug. Die Wirkung hängt von Konzentration, Zeit, Produktgröße, Temperatur und gewünschtem Ergebnis ab. Beim Einlegen findet ein Austausch statt: Salz wandert in das Produkt, Wasser und gelöste Stoffe gleichen sich an. Deshalb kann auch eine kräftige Lake je nach Anwendung sinnvoll sein.";

/** Auswählbare Lakearten – unabhängig vom späteren Verwendungszweck. */
export type BrineType = "salzlake" | "poekellake" | "gewuerzlake";

/** Erlaubte Konzentrationsstufen in Prozent (10–100 in 10er-Schritten). */
export const BRINE_CONCENTRATION_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

export type BrineConcentration = (typeof BRINE_CONCENTRATION_OPTIONS)[number];

/**
 * Referenztabelle: Gramm Salz pro Liter Lake je Konzentrationsstufe.
 *
 * Ankerwerte aus der Spezifikation:
 * - 10 % → 28,5 g Salz pro Liter  (4 L = 114 g)
 * - 100 % → 367 g Salz pro Liter  (4 L = 1.468 g)
 *
 * Zwischenwerte (20–90 %) sind linear zwischen diesen Ankerpunkten interpoliert
 * und einmalig gerundet hinterlegt – keine Laufzeit-Interpolation nötig.
 */
export const SALT_GRAMS_PER_LITER_BY_CONCENTRATION: Record<BrineConcentration, number> = {
  10: 28.5,
  20: 66.1,
  30: 103.7,
  40: 141.3,
  50: 178.9,
  60: 216.6,
  70: 254.2,
  80: 291.8,
  90: 329.4,
  100: 367.0,
};

/** Vordefinierte Gewürze zur Mehrfachauswahl. */
export const BRINE_SPICE_OPTIONS = [
  "Pfeffer",
  "Knoblauch",
  "Wacholder",
  "Lorbeer",
  "Koriander",
  "Senfkörner",
  "Piment",
  "Rosmarin",
  "Thymian",
] as const;

export type BrineSpice = (typeof BRINE_SPICE_OPTIONS)[number];

/** Lesbare Bezeichnungen der Lakearten. */
export const BRINE_TYPE_LABELS: Record<BrineType, string> = {
  salzlake: "Salzlake",
  poekellake: "Pökellake",
  gewuerzlake: "Gewürzlake",
};

/**
 * Salzart je Lakeart – rein typbezogen, ohne Produktlogik:
 * Salzlake → Kochsalz, Pökellake → Nitritpökelsalz, Gewürzlake → Kochsalz als Basis.
 */
export const SALT_LABEL_BY_BRINE_TYPE: Record<BrineType, string> = {
  salzlake: "Kochsalz",
  poekellake: "Nitritpökelsalz",
  gewuerzlake: "Kochsalz",
};

/** Rohdaten aus dem Formular vor Validierung und Berechnung. */
export type BrineCalculatorInput = {
  /** Lakeart (Salz-, Pökelsalz- oder Gewürzlake). */
  brineType: BrineType;
  /** Eingegebene Litermenge als String aus dem Input-Feld. */
  litersRaw: string;
  /** Konzentration in Prozent (10–100). */
  concentration: BrineConcentration;
  /** Ob optional Zucker verwendet wird. */
  useSugar: boolean;
  /** Zucker in g/L – nur relevant wenn useSugar true. */
  sugarPerLiterRaw: string;
  /** Ob Gewürze hinzugefügt werden. */
  useSpices: boolean;
  /** Ausgewählte Standardgewürze. */
  selectedSpices: BrineSpice[];
  /** Freitext für eigene Gewürze (kommagetrennt). */
  customSpicesRaw: string;
};

/** Ergebnis einer erfolgreichen Lake-Berechnung – Darstellung als neutrales Lake-Rezept. */
export type BrineCalculatorResult = {
  brineTypeLabel: string;
  litersLabel: string;
  concentrationLabel: string;
  saltLabel: string;
  saltAmountLabel: string;
  saltAmountGrams: number;
  sugarLabel: string | null;
  sugarAmountLabel: string | null;
  sugarAmountGrams: number | null;
  spicesLabel: string | null;
  spiceList: string[];
};

/**
 * Liest den Tabellenwert für Gramm Salz pro Liter bei gegebener Konzentration.
 *
 * @param concentration - Konzentration in Prozent (muss in der Tabelle existieren)
 */
export function getSaltGramsPerLiter(concentration: BrineConcentration): number {
  return SALT_GRAMS_PER_LITER_BY_CONCENTRATION[concentration];
}

/**
 * Kernberechnung Salz: Salzmenge = Liter × Referenzwert (g/L)
 *
 * @param liters        - Lakevolumen in Litern
 * @param concentration - Konzentration in Prozent
 */
export function calculateSaltGrams(liters: number, concentration: BrineConcentration): number {
  const gramsPerLiter = getSaltGramsPerLiter(concentration);
  return liters * gramsPerLiter;
}

/**
 * Berechnet die Gesamtmenge Zucker: Liter × g Zucker pro Liter.
 *
 * @param liters       - Lakevolumen in Litern
 * @param sugarPerLiter - Zucker in g/L
 */
export function calculateSugarGrams(liters: number, sugarPerLiter: number): number {
  return liters * sugarPerLiter;
}

/**
 * Formatiert Litermenge für die Anzeige.
 *
 * @param liters - Volumen in Litern
 */
export function formatLiters(liters: number): string {
  const formatted = new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
  }).format(liters);
  return `${formatted} L`;
}

/**
 * Formatiert Gramm-Mengen für die Anzeige (Salz, Zucker).
 *
 * @param grams - Menge in Gramm
 */
export function formatGrams(grams: number): string {
  const isWholeNumber = Math.abs(grams - Math.round(grams)) < 0.0001;

  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: isWholeNumber ? 0 : 1,
    maximumFractionDigits: isWholeNumber ? 0 : 1,
  }).format(grams);

  return `${formatted} g`;
}

/**
 * Formatiert die Konzentration für die Anzeige.
 *
 * @param concentration - Wert in Prozent
 */
export function formatConcentration(concentration: BrineConcentration): string {
  return `${concentration} %`;
}

/**
 * Parst Freitext-Gewürze in eine Liste (Komma oder Zeilenumbruch als Trenner).
 *
 * @param raw - Freitext aus dem Eingabefeld
 */
export function parseCustomSpices(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Kombiniert Standardgewürze und eigene Einträge zu einer eindeutigen Liste.
 *
 * @param selectedSpices  - Checkbox-Auswahl
 * @param customSpicesRaw - Freitext
 */
export function buildSpiceList(
  selectedSpices: BrineSpice[],
  customSpicesRaw: string,
): string[] {
  const custom = parseCustomSpices(customSpicesRaw);
  const combined = [...selectedSpices, ...custom];

  // Doppelte Einträge vermeiden (Groß-/Kleinschreibung ignorieren)
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const spice of combined) {
    const key = spice.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(spice);
    }
  }

  return unique;
}

/**
 * Validiert Eingaben und führt die Lake-Berechnung durch.
 *
 * @param input - Formulardaten
 * @returns Ergebnis oder Fehlermeldung
 */
export function runBrineCalculation(
  input: BrineCalculatorInput,
): { result: BrineCalculatorResult } | { error: string } {
  const litersTrimmed = input.litersRaw.trim().replace(",", ".");

  if (litersTrimmed === "") {
    return { error: "Bitte gib die gewünschte Litermenge ein." };
  }

  const liters = Number(litersTrimmed);

  if (Number.isNaN(liters)) {
    return { error: "Die Litermenge muss eine gültige Zahl sein." };
  }

  if (liters <= 0) {
    return { error: "Die Litermenge muss größer als 0 sein." };
  }

  let sugarPerLiter: number | null = null;

  if (input.useSugar) {
    const sugarTrimmed = input.sugarPerLiterRaw.trim().replace(",", ".");

    if (sugarTrimmed === "") {
      return { error: "Bitte gib die Zucker-Menge in g/L ein oder deaktiviere Zucker." };
    }

    sugarPerLiter = Number(sugarTrimmed);

    if (Number.isNaN(sugarPerLiter)) {
      return { error: "Die Zucker-Angabe muss eine gültige Zahl sein." };
    }

    if (sugarPerLiter < 0) {
      return { error: "Die Zucker-Angabe darf nicht negativ sein." };
    }
  }

  const saltAmountGrams = calculateSaltGrams(liters, input.concentration);
  const saltBaseLabel = SALT_LABEL_BY_BRINE_TYPE[input.brineType];

  let sugarAmountGrams: number | null = null;
  if (input.useSugar && sugarPerLiter !== null) {
    sugarAmountGrams = calculateSugarGrams(liters, sugarPerLiter);
  }

  let spiceList: string[] = [];
  if (input.useSpices) {
    spiceList = buildSpiceList(input.selectedSpices, input.customSpicesRaw);
  }

  return {
    result: {
      brineTypeLabel: BRINE_TYPE_LABELS[input.brineType],
      litersLabel: formatLiters(liters),
      concentrationLabel: formatConcentration(input.concentration),
      saltLabel: `Benötigtes ${saltBaseLabel}`,
      saltAmountLabel: formatGrams(saltAmountGrams),
      saltAmountGrams,
      sugarLabel: input.useSugar ? "Zucker" : null,
      sugarAmountLabel:
        sugarAmountGrams !== null ? formatGrams(sugarAmountGrams) : null,
      sugarAmountGrams,
      spicesLabel: input.useSpices ? "Gewürze" : null,
      spiceList,
    },
  };
}
