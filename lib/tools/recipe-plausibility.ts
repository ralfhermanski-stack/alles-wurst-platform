/**
 * @file recipe-plausibility.ts
 * @purpose Plausibilitätsprüfungen für den Rezeptgenerator (Anfängerführung).
 * @responsibility Fachliche Hinweise und blockierende Fehler — keine Speicherlogik.
 * @usage Importiert von UI-Komponenten; nutzt recipe-calculator-Ergebnisse.
 * @see lib/tools/salt-calculator.ts (Salz-Richtwerte 14–22 g/kg)
 */

import type { RecipeCalculationResult } from "./recipe-types";
import type { RecipePayload } from "./recipe-types";
import type { WizardStepId } from "./recipe-labels";

// =============================================================================
// Typen
// =============================================================================

/** Schweregrad einer Plausibilitätsmeldung */
export type PlausibilitySeverity = "info" | "warning" | "critical";

/** Wizard-Schritt oder allgemein */
export type PlausibilityAffectedStep = WizardStepId | "general";

/** Einzelne Prüfmeldung */
export type PlausibilityIssue = {
  severity: PlausibilitySeverity;
  code: string;
  title: string;
  message: string;
  affectedStep: PlausibilityAffectedStep;
  /** true = „Rezept speichern“ (status saved) wird in der UI blockiert */
  blocking: boolean;
};

/** Gesamtergebnis aller Prüfungen */
export type PlausibilityResult = {
  issues: PlausibilityIssue[];
  hasBlocking: boolean;
};

/**
 * Zusätzlicher Kontext aus dem Wizard (nicht alles steckt im Payload).
 */
export type RecipePlausibilityContext = {
  payload: RecipePayload;
  /** Wurstkategorie aus Stammdaten */
  category: string;
  /** Darmtyp (Formularfeld) */
  casingType: string;
  /** Anzahl Herstellungsschritte */
  productionStepCount: number;
  /**
   * Räuchern gilt als aktiviert, wenn mindestens eine Phase oder Notizen
   * im Räuchern-Schritt erfasst wurden.
   */
  smokingActive: boolean;
  /** Mindestens eine Phase ohne Name, Temperatur oder Dauer */
  smokingIncomplete: boolean;
};

// =============================================================================
// Schwellenwerte (Orientierung, keine Rechtsberatung)
// =============================================================================

/** Salzgabe mild bis stark in g/kg (bezogen auf Fleisch) — vgl. Salzrechner */
const SALT_G_PER_KG_LOW = 14;
const SALT_G_PER_KG_HIGH = 22;
const SALT_G_PER_KG_CRITICAL = 28;

/** Nitritpökelsalz als Zutat in g/kg (bezogen auf gewählte Basis) */
const NITRITE_SALT_G_PER_KG_WARNING = 8;
const NITRITE_SALT_G_PER_KG_CRITICAL = 12;

/** Nitrit direkt in mg/kg Gesamtmischung (Schüttung-Feld) */
const NITRITE_MG_PER_KG_WARNING = 100;

/** Schüttungsanteil bei Brühwurst in % */
const BRUHWURST_BINDER_WARNING = 25;
const BRUHWURST_BINDER_CRITICAL = 35;

// =============================================================================
// Hilfsfunktionen
// =============================================================================

/**
 * Erzeugt eine Prüfmeldung.
 */
function issue(
  partial: PlausibilityIssue,
): PlausibilityIssue {
  return partial;
}

/**
 * Prüft, ob die Kategorie eine Brühwurst bezeichnet.
 */
function isBruhwurstCategory(category: string): boolean {
  const normalized = category.toLowerCase();

  return (
    normalized.includes("brühwurst") || normalized.includes("bruehwurst")
  );
}

/**
 * Prüft, ob der Name auf Kochsalz hindeutet (nicht Nitritpökelsalz).
 */
function isPlainSaltName(name: string): boolean {
  const n = name.toLowerCase();

  if (n.includes("nitrit") || n.includes("pökel") || n.includes("poekel")) {
    return false;
  }

  return n.includes("salz");
}

/**
 * Prüft, ob der Name auf Nitritpökelsalz hindeutet.
 */
function isNitriteSaltName(name: string): boolean {
  const n = name.toLowerCase();

  return n.includes("nitrit") || n.includes("pökel") || n.includes("poekel");
}

/**
 * Rechnet g/kg einer Zutat auf Fleischbasis um (für Salzvergleich).
 *
 * @param amountPerKg   - Angabe in g/kg
 * @param referenceBasis - Bezugsbasis der Zeile
 * @param meatWeightKg  - Fleischgewicht
 * @param braetWeightKg - Brätgewicht
 * @param totalWeightKg - Gesamtmasse
 */
function toSaltGramsPerKgMeat(
  amountPerKg: number,
  referenceBasis: "meat" | "braet" | "total",
  meatWeightKg: number,
  braetWeightKg: number,
  totalWeightKg: number,
): number | null {
  if (meatWeightKg <= 0 || amountPerKg <= 0) {
    return null;
  }

  let basisKg = meatWeightKg;

  if (referenceBasis === "braet") {
    basisKg = braetWeightKg;
  } else if (referenceBasis === "total") {
    basisKg = totalWeightKg;
  }

  if (basisKg <= 0) {
    return null;
  }

  // g Salz pro kg Fleisch = g/kg(Basis) × (Basis kg / Fleisch kg)
  return (amountPerKg * basisKg) / meatWeightKg;
}

/**
 * Liegt genug Rezeptinhalt vor, dass Speichern als „Rezept“ Sinn ergibt?
 */
function hasSubstantiveContent(
  payload: RecipePayload,
  calculation: RecipeCalculationResult,
): boolean {
  return (
    payload.meats.length > 0 ||
    payload.binders.length > 0 ||
    payload.ingredients.length > 0 ||
    calculation.totalWeightKg > 0
  );
}

// =============================================================================
// Hauptprüfung
// =============================================================================

/**
 * Führt alle Plausibilitätsprüfungen durch.
 *
 * @param context     - Payload + Wizard-Kontext
 * @param calculation - Ergebnis von calculateRecipePayload()
 */
export function checkRecipePlausibility(
  context: RecipePlausibilityContext,
  calculation: RecipeCalculationResult,
): PlausibilityResult {
  const issues: PlausibilityIssue[] = [];
  const { payload } = context;

  const hasMeatOrBinder =
    payload.meats.length > 0 || payload.binders.length > 0;
  const substantive = hasSubstantiveContent(payload, calculation);

  // ── Gesamtgewicht ──────────────────────────────────────────────────────
  if (calculation.totalWeightKg <= 0 && substantive) {
    issues.push(
      issue({
        severity: "critical",
        code: "total_weight_missing",
        title: "Gesamtgewicht fehlt",
        message:
          "Trage im Schritt Grunddaten ein Gesamtgewicht in kg ein — sonst können Gewürze und Anteile nicht berechnet werden.",
        affectedStep: "grunddaten",
        blocking: true,
      }),
    );
  } else if (calculation.totalWeightKg <= 0) {
    issues.push(
      issue({
        severity: "info",
        code: "total_weight_empty",
        title: "Noch kein Gesamtgewicht",
        message:
          "Für einen Entwurf reicht das zunächst. Vor dem Speichern als Rezept solltest du die Chargenmasse in kg angeben.",
        affectedStep: "grunddaten",
        blocking: true,
      }),
    );
  }

  // ── Fleisch + Schüttung = 100 % ─────────────────────────────────────────
  if (hasMeatOrBinder && !calculation.sharesValid) {
    issues.push(
      issue({
        severity: "critical",
        code: "shares_not_100",
        title: "Anteile ergeben nicht 100 %",
        message:
          calculation.sharesMessage ??
          "Passe Fleisch- und Schüttungsanteile so an, dass sie zusammen genau 100 % ergeben.",
        affectedStep: "fleisch",
        blocking: true,
      }),
    );
  }

  // ── Keine Fleischzeilen ─────────────────────────────────────────────────
  if (payload.meats.length === 0 && substantive) {
    issues.push(
      issue({
        severity: "warning",
        code: "no_meat_lines",
        title: "Keine Fleischanteile",
        message:
          "Füge im Schritt Fleisch mindestens eine Fleischsorte mit Anteil und Klassifizierung hinzu.",
        affectedStep: "fleisch",
        blocking: false,
      }),
    );
  }

  // ── Salz ────────────────────────────────────────────────────────────────
  for (const line of payload.ingredients) {
    if (!isPlainSaltName(line.name)) {
      continue;
    }

    const saltOnMeat = toSaltGramsPerKgMeat(
      line.amountPerKg,
      line.referenceBasis,
      calculation.meatWeightKg,
      calculation.braetWeightKg,
      calculation.totalWeightKg,
    );

    if (saltOnMeat === null) {
      issues.push(
        issue({
          severity: "info",
          code: "salt_basis_missing",
          title: "Salz nicht bewertbar",
          message:
            "Für eine Salzempfehlung brauchst du Fleischanteile und ein Gesamtgewicht — dann können wir die Salzgabe einschätzen.",
          affectedStep: "gewuerze",
          blocking: false,
        }),
      );
      break;
    }

    if (saltOnMeat < SALT_G_PER_KG_LOW) {
      issues.push(
        issue({
          severity: "warning",
          code: "salt_too_low",
          title: "Salzgabe eher niedrig",
          message: `Die Salzmenge entspricht etwa ${saltOnMeat.toFixed(1)} g/kg Fleisch — üblich sind oft 14–22 g/kg. Prüfe, ob die Würzung für dein Produkt reicht.`,
          affectedStep: "gewuerze",
          blocking: false,
        }),
      );
    } else if (saltOnMeat > SALT_G_PER_KG_CRITICAL) {
      issues.push(
        issue({
          severity: "critical",
          code: "salt_too_high",
          title: "Salzgabe sehr hoch",
          message: `Etwa ${saltOnMeat.toFixed(1)} g/kg bezogen auf Fleisch liegt deutlich über den üblichen Richtwerten (14–22 g/kg). Bitte bewusst prüfen, bevor du das Rezept final speicherst.`,
          affectedStep: "gewuerze",
          blocking: true,
        }),
      );
    } else if (saltOnMeat > SALT_G_PER_KG_HIGH) {
      issues.push(
        issue({
          severity: "warning",
          code: "salt_high",
          title: "Salzgabe eher hoch",
          message: `Etwa ${saltOnMeat.toFixed(1)} g/kg Fleisch — kräftige Würzung. Typisch sind 14–22 g/kg; für dein Produkt kann das passen.`,
          affectedStep: "gewuerze",
          blocking: false,
        }),
      );
    }
  }

  // ── Nitritpökelsalz ─────────────────────────────────────────────────────
  for (const line of payload.ingredients) {
    if (!isNitriteSaltName(line.name)) {
      continue;
    }

    if (line.amountPerKg >= NITRITE_SALT_G_PER_KG_CRITICAL) {
      issues.push(
        issue({
          severity: "critical",
          code: "nitrite_salt_critical",
          title: "Nitritpökelsalz sehr hoch",
          message: `${line.amountPerKg} g/kg ${line.name} ist auffällig hoch. Nitrit streng nach Vorschrift dosieren — im Zweifel Fachliteratur oder Beratung nutzen.`,
          affectedStep: "gewuerze",
          blocking: true,
        }),
      );
    } else if (line.amountPerKg >= NITRITE_SALT_G_PER_KG_WARNING) {
      issues.push(
        issue({
          severity: "warning",
          code: "nitrite_salt_high",
          title: "Nitritpökelsalz prüfen",
          message: `${line.amountPerKg} g/kg wirkt eher hoch. Kontrolliere die Nitrit-Gesamtdosis und die Bezugsbasis (${line.referenceBasis}).`,
          affectedStep: "gewuerze",
          blocking: false,
        }),
      );
    }
  }

  if (
    payload.schuettung?.nitriteMgPerKg !== undefined &&
    payload.schuettung.nitriteMgPerKg >= NITRITE_MG_PER_KG_WARNING
  ) {
    issues.push(
      issue({
        severity: "warning",
        code: "nitrite_mg_high",
        title: "Nitrit (mg/kg) erhöht",
        message: `${payload.schuettung.nitriteMgPerKg} mg/kg in der Schüttung — bitte mit zulässigen Grenzwerten abgleichen.`,
        affectedStep: "schuettung",
        blocking: false,
      }),
    );
  }

  // ── Schüttung bei Brühwurst ─────────────────────────────────────────────
  if (
    isBruhwurstCategory(context.category) &&
    calculation.binderSharePercent > BRUHWURST_BINDER_WARNING
  ) {
    issues.push(
      issue({
        severity:
          calculation.binderSharePercent > BRUHWURST_BINDER_CRITICAL
            ? "critical"
            : "warning",
        code: "binder_high_bruhwurst",
        title: "Schüttung bei Brühwurst hoch",
        message: `Schüttungsanteil ${calculation.binderSharePercent.toFixed(1)} % — bei Brühwurst oft eher moderat. Zu viel Schüttung kann Bindung und Konsistenz beeinflussen.`,
        affectedStep: "schuettung",
        blocking:
          calculation.binderSharePercent > BRUHWURST_BINDER_CRITICAL,
      }),
    );
  }

  // ── Darm ────────────────────────────────────────────────────────────────
  if (
    payload.meats.length > 0 &&
    !context.casingType.trim() &&
    !context.category.toLowerCase().includes("pastete")
  ) {
    issues.push(
      issue({
        severity: "warning",
        code: "casing_missing",
        title: "Kein Darm angegeben",
        message:
          "Für die meisten Würste wird ein Darmtyp mit Kaliber benötigt. Trage ihn im Schritt Därme ein — oder notiere „ohne Hülle“, wenn bewusst gewünscht.",
        affectedStep: "daerme",
        blocking: false,
      }),
    );
  }

  // ── Herstellung ─────────────────────────────────────────────────────────
  if (payload.meats.length > 0 && context.productionStepCount === 0) {
    issues.push(
      issue({
        severity: "info",
        code: "production_missing",
        title: "Keine Herstellungsschritte",
        message:
          "Notiere im Schritt Herstellung kurz die wichtigsten Schritte (mahlen, mischen, füllen …) — das hilft dir später beim Nachmachen.",
        affectedStep: "herstellung",
        blocking: false,
      }),
    );
  }

  // ── Räuchern ───────────────────────────────────────────────────────────
  if (context.smokingActive && context.smokingIncomplete) {
    issues.push(
      issue({
        severity: "warning",
        code: "smoking_incomplete",
        title: "Räucherangaben unvollständig",
        message:
          "Du hast Räuchern begonnen — ergänze für jede Phase mindestens Name, Temperatur (°C) und Dauer (Minuten).",
        affectedStep: "rauchern",
        blocking: false,
      }),
    );
  }

  if (
    context.smokingActive &&
    (payload.smoking?.phases?.length ?? 0) === 0 &&
    !payload.smoking?.notes?.trim()
  ) {
    issues.push(
      issue({
        severity: "warning",
        code: "smoking_empty",
        title: "Räuchern ohne Programm",
        message:
          "Räuchern ist aktiv, aber es fehlen Phasen. Lege mindestens eine Räucherphase an oder entferne leere Einträge.",
        affectedStep: "rauchern",
        blocking: false,
      }),
    );
  }

  const hasBlocking = issues.some((item) => item.blocking);

  return { issues, hasBlocking };
}

/**
 * Deutsche Bezeichnung des betroffenen Wizard-Schritts.
 */
export const PLAUSIBILITY_STEP_LABELS: Record<PlausibilityAffectedStep, string> =
  {
    general: "Allgemein",
    grunddaten: "Grunddaten",
    fleisch: "Fleischanteile",
    schuettung: "Schüttung",
    gewuerze: "Gewürze",
    daerme: "Därme",
    herstellung: "Herstellung",
    rauchern: "Räuchern",
    zusammenfassung: "Zusammenfassung",
  };
