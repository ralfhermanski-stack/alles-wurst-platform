/**
 * @file marinade-labels.ts
 * @purpose Deutsche Beschriftungen für den Marinaden-Generator.
 */

import type {
  MarinadeIntensity,
  MarinadePreparation,
  MarinadeProductType,
  MarinadeStyle,
} from "./marinade-types";

export const MARINADE_WIZARD_STEPS = [
  { id: "product", label: "Produkt" },
  { id: "style", label: "Marinadenart" },
  { id: "weight", label: "Gewicht" },
  { id: "ingredients", label: "Zutaten" },
  { id: "instructions", label: "Anleitung" },
  { id: "save", label: "Speichern & PDF" },
] as const;

export type MarinadeWizardStepId = (typeof MARINADE_WIZARD_STEPS)[number]["id"];

export const PRODUCT_TYPE_LABELS: Record<MarinadeProductType, string> = {
  pork: "Schwein",
  beef: "Rind",
  poultry: "Geflügel",
  game: "Wild",
  fish: "Fisch",
  vegetable: "Gemüse / Grillgemüse",
};

export const MARINADE_STYLE_LABELS: Record<MarinadeStyle, string> = {
  oil: "Ölmarinade",
  spice: "Gewürzmarinade",
  herb: "Kräutermarinade",
  bbq: "BBQ-Marinade",
  yogurt: "Joghurtmarinade",
  mustard: "Senfmarinade",
  beer: "Biermarinade",
  honey: "Honigmarinade",
  garlic: "Knoblauchmarinade",
  asian: "Asiatische Marinade",
  spicy: "Scharfe Marinade",
  dry_rub: "Trockenmarinade / Rub",
};

export const INTENSITY_LABELS: Record<MarinadeIntensity, string> = {
  mild: "Mild",
  medium: "Mittel",
  strong: "Kräftig",
};

export const PREPARATION_LABELS: Record<MarinadePreparation, string> = {
  grill: "Grillen",
  roast: "Braten",
  pan: "Pfanne",
  oven: "Ofen",
  smoker: "Räuchern",
  sous_vide: "Sous-vide",
};

export const INGREDIENT_GROUP_LABELS = {
  oil: "Öl / Fett",
  salt: "Salz",
  sugar: "Zucker / Süße",
  acid: "Säure",
  spice: "Gewürze",
  herb: "Kräuter",
  liquid: "Flüssigkeit",
  other: "Sonstiges",
} as const;
