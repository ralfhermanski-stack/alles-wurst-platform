/**
 * @file marinade-presets.ts
 * @purpose Standard-Zutaten je Marinadenart und Produkttyp.
 */

import type {
  MarinadeIngredientLine,
  MarinadeIntensity,
  MarinadeProductType,
  MarinadeStyle,
} from "./marinade-types";

function createIngredientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `ing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function intensityFactor(intensity: MarinadeIntensity): number {
  switch (intensity) {
    case "mild":
      return 0.85;
    case "strong":
      return 1.2;
    default:
      return 1;
  }
}

function saltRangeForProduct(product: MarinadeProductType): { min: number; max: number } {
  switch (product) {
    case "fish":
      return { min: 8, max: 12 };
    case "poultry":
      return { min: 10, max: 14 };
    case "vegetable":
      return { min: 6, max: 10 };
    default:
      return { min: 10, max: 16 };
  }
}

function line(
  name: string,
  amountPerKg: number,
  group: MarinadeIngredientLine["group"],
  unit: MarinadeIngredientLine["unit"] = "g",
  allergen?: string,
): MarinadeIngredientLine {
  return {
    id: createIngredientId(),
    name,
    amountPerKg,
    unit,
    group,
    allergen: allergen ?? null,
    sortOrder: 0,
  };
}

export function buildDefaultIngredients(input: {
  style: MarinadeStyle;
  productType: MarinadeProductType;
  intensity: MarinadeIntensity;
}): MarinadeIngredientLine[] {
  const factor = intensityFactor(input.intensity);
  const salt = saltRangeForProduct(input.productType);
  const saltAmount = ((salt.min + salt.max) / 2) * factor;

  const base: MarinadeIngredientLine[] = [
    { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 1 },
  ];

  const oilAmount = Math.round(80 * factor);
  const acidAmount = Math.round(25 * factor);
  const sugarAmount = Math.round(15 * factor);

  switch (input.style) {
    case "oil":
      return [
        { ...line("Olivenöl", oilAmount, "oil"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Zitronensaft", acidAmount, "acid"), sortOrder: 3 },
        { ...line("Pfeffer", 3 * factor, "spice"), sortOrder: 4 },
      ];
    case "spice":
      return [
        { ...line("Rapsöl", oilAmount, "oil"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Paprika edelsüß", 8 * factor, "spice"), sortOrder: 3 },
        { ...line("Knoblauchpulver", 4 * factor, "spice"), sortOrder: 4 },
        { ...line("Zucker", sugarAmount, "sugar"), sortOrder: 5 },
      ];
    case "herb":
      return [
        { ...line("Olivenöl", oilAmount, "oil"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Rosmarin", 6 * factor, "herb"), sortOrder: 3 },
        { ...line("Thymian", 4 * factor, "herb"), sortOrder: 4 },
        { ...line("Zitronensaft", acidAmount, "acid"), sortOrder: 5 },
      ];
    case "bbq":
      return [
        { ...line("Rapsöl", oilAmount, "oil"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Ketchup", 40 * factor, "other"), sortOrder: 3 },
        { ...line("Brauner Zucker", 25 * factor, "sugar"), sortOrder: 4 },
        { ...line("Rauchpaprika", 6 * factor, "spice"), sortOrder: 5 },
        { ...line("Apfelessig", acidAmount, "acid"), sortOrder: 6 },
      ];
    case "yogurt":
      return [
        { ...line("Naturjoghurt", 120 * factor, "other", "g", "Milch"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Zitronensaft", acidAmount, "acid"), sortOrder: 3 },
        { ...line("Knoblauch", 8 * factor, "spice"), sortOrder: 4 },
      ];
    case "mustard":
      return [
        { ...line("Senf", 35 * factor, "other", "g", "Senf"), sortOrder: 1 },
        { ...line("Rapsöl", 50 * factor, "oil"), sortOrder: 2 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 3 },
        { ...line("Honig", 12 * factor, "sugar"), sortOrder: 4 },
      ];
    case "beer":
      return [
        { ...line("Bier", 100 * factor, "liquid", "ml"), sortOrder: 1 },
        { ...line("Rapsöl", 40 * factor, "oil"), sortOrder: 2 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 3 },
        { ...line("Zwiebelpulver", 5 * factor, "spice"), sortOrder: 4 },
      ];
    case "honey":
      return [
        { ...line("Honig", 30 * factor, "sugar"), sortOrder: 1 },
        { ...line("Olivenöl", 60 * factor, "oil"), sortOrder: 2 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 3 },
        { ...line("Sojasauce", 20 * factor, "other", "ml", "Soja, Gluten"), sortOrder: 4 },
      ];
    case "garlic":
      return [
        { ...line("Olivenöl", oilAmount, "oil"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Knoblauch (frisch)", 25 * factor, "spice"), sortOrder: 3 },
        { ...line("Pfeffer", 4 * factor, "spice"), sortOrder: 4 },
      ];
    case "asian":
      return [
        { ...line("Sojasauce", 35 * factor, "liquid", "ml", "Soja, Gluten"), sortOrder: 1 },
        { ...line("Sesamöl", 15 * factor, "oil", "ml", "Sesam"), sortOrder: 2 },
        { ...line("Salz", Math.round(saltAmount * 0.6 * 10) / 10, "salt"), sortOrder: 3 },
        { ...line("Ingwer (frisch)", 12 * factor, "spice"), sortOrder: 4 },
        { ...line("Knoblauch", 10 * factor, "spice"), sortOrder: 5 },
      ];
    case "spicy":
      return [
        { ...line("Rapsöl", oilAmount, "oil"), sortOrder: 1 },
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 2 },
        { ...line("Chiliflocken", 6 * factor, "spice"), sortOrder: 3 },
        { ...line("Paprika", 8 * factor, "spice"), sortOrder: 4 },
        { ...line("Zitronensaft", acidAmount, "acid"), sortOrder: 5 },
      ];
    case "dry_rub":
      return [
        { ...line("Salz", Math.round(saltAmount * 10) / 10, "salt"), sortOrder: 1 },
        { ...line("Brauner Zucker", 30 * factor, "sugar"), sortOrder: 2 },
        { ...line("Paprika", 12 * factor, "spice"), sortOrder: 3 },
        { ...line("Knoblauchpulver", 6 * factor, "spice"), sortOrder: 4 },
        { ...line("Pfeffer", 5 * factor, "spice"), sortOrder: 5 },
      ];
    default:
      return base;
  }
}

export function buildDefaultSteps(style: MarinadeStyle): { title: string; description: string; sortOrder: number }[] {
  const common = [
    {
      title: "Zutaten mischen",
      description: "Alle Zutaten in einer Schüssel gründlich verrühren, bis Salz und Gewürze gelöst sind.",
      sortOrder: 1,
    },
    {
      title: "Produkt marinieren",
      description: "Das Produkt vollständig mit der Marinade bedecken und kühl ziehen lassen.",
      sortOrder: 2,
    },
    {
      title: "Vor der Zubereitung abtropfen",
      description: "Überschüssige Marinade abtropfen lassen. Bei Trockenmarinaden/Rub gleichmäßig einreiben.",
      sortOrder: 3,
    },
  ];

  if (style === "dry_rub") {
    return [
      {
        title: "Rub anmischen",
        description: "Alle trockenen Zutaten vermischen und Klumpen auflösen.",
        sortOrder: 1,
      },
      {
        title: "Gleichmäßig einreiben",
        description: "Den Rub von allen Seiten auf das Produkt reiben und kurz antrocknen lassen.",
        sortOrder: 2,
      },
    ];
  }

  return common;
}

export function defaultHints(
  productType: MarinadeProductType,
  style: MarinadeStyle,
): { processing: string; storage: string; hygiene: string } {
  const hygieneParts: string[] = [];

  if (productType === "poultry") {
    hygieneParts.push(
      "Geflügel immer getrennt von anderen Lebensmitteln behandeln und gründlich durchgaren.",
    );
  }

  if (productType === "fish") {
    hygieneParts.push(
      "Fisch kühl mariniert halten und zeitnah verarbeiten. Marinade nach Kontakt mit rohem Fisch nicht wiederverwenden.",
    );
  }

  if (style === "beer") {
    hygieneParts.push("Enthält Alkohol — bei Kindern, Schwangeren und Autofahrern beachten.");
  }

  return {
    processing:
      "Marinade nicht auf offener Flamme verbrennen lassen. Bei Zucker-/Honiganteilen auf die Kerntemperatur achten.",
    storage:
      "Mariniertes Produkt im Kühlschrank lagern (max. 2–3 Tage). Marinade getrennt max. 24 h kühl haltbar.",
    hygiene:
      hygieneParts.join(" ") ||
      "Arbeitsflächen und Utensilien nach Kontakt mit rohem Fleisch reinigen.",
  };
}
