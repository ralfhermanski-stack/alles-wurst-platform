/**
 * @file recipe-labels.ts
 * @purpose Deutsche Beschriftungen für Status, Sichtbarkeit und Wizard-Schritte.
 * @usage Importiert von Rezeptgenerator-UI-Komponenten.
 */

import type { RecipeStatus, RecipeVisibility } from "@prisma/client";

/** Wizard-Schritte in Reihenfolge */
export const WIZARD_STEPS = [
  { id: "grunddaten", label: "Grunddaten" },
  { id: "fleisch", label: "Fleischanteile" },
  { id: "schuettung", label: "Schüttung" },
  { id: "gewuerze", label: "Gewürze" },
  { id: "daerme", label: "Därme" },
  { id: "herstellung", label: "Herstellung" },
  { id: "rauchern", label: "Räuchern" },
  { id: "zusammenfassung", label: "Zusammenfassung" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export const STATUS_LABELS: Record<RecipeStatus, string> = {
  draft: "Entwurf",
  saved: "Gespeichert",
  published: "Veröffentlicht",
};

export const VISIBILITY_LABELS: Record<RecipeVisibility, string> = {
  private: "Privat",
  public: "Öffentlich",
  database: "Rezeptdatenbank",
};

export const REFERENCE_BASIS_LABELS = {
  meat: "Fleisch",
  braet: "Brät",
  total: "Gesamtmasse",
} as const;
