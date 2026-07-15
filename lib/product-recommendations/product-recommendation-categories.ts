/**
 * @file product-recommendation-categories.ts
 * @purpose Standard-Kategorien für Produktempfehlungen.
 */

export type DefaultCategoryDef = {
  name: string;
  slug: string;
  sortOrder: number;
};

export const DEFAULT_PRODUCT_RECOMMENDATION_CATEGORIES: DefaultCategoryDef[] = [
  { name: "Wurstfüller", slug: "wurstfueller", sortOrder: 10 },
  { name: "Fleischwölfe", slug: "fleischwoelfe", sortOrder: 20 },
  { name: "Kutter", slug: "kutter", sortOrder: 30 },
  { name: "Räucherschränke", slug: "raeucherschraenke", sortOrder: 40 },
  { name: "Thermometer", slug: "thermometer", sortOrder: 50 },
  { name: "Vakuumierer", slug: "vakuumierer", sortOrder: 60 },
  { name: "Messer", slug: "messer", sortOrder: 70 },
  { name: "Schneidbretter", slug: "schneidbretter", sortOrder: 80 },
  { name: "Därme", slug: "daerme", sortOrder: 90 },
  { name: "Gewürze", slug: "gewuerze", sortOrder: 100 },
  { name: "Pökelhilfsmittel", slug: "poekelhilfsmittel", sortOrder: 110 },
  { name: "Verpackung", slug: "verpackung", sortOrder: 120 },
  { name: "Bücher", slug: "buecher", sortOrder: 130 },
  { name: "Grillzubehör", slug: "grillzubehoer", sortOrder: 140 },
  { name: "Sonstiges", slug: "sonstiges", sortOrder: 999 },
];

export const CATEGORY_PLACEHOLDER_IMAGES: Record<string, string> = {
  wurstfueller: "/images/placeholders/product-default.svg",
  fleischwoelfe: "/images/placeholders/product-default.svg",
  kutter: "/images/placeholders/product-default.svg",
  raeucherschraenke: "/images/placeholders/product-default.svg",
  thermometer: "/images/placeholders/product-default.svg",
  vakuumierer: "/images/placeholders/product-default.svg",
  messer: "/images/placeholders/product-default.svg",
  schneidbretter: "/images/placeholders/product-default.svg",
  daerme: "/images/placeholders/product-default.svg",
  gewuerze: "/images/placeholders/product-default.svg",
  poekelhilfsmittel: "/images/placeholders/product-default.svg",
  verpackung: "/images/placeholders/product-default.svg",
  buecher: "/images/placeholders/product-default.svg",
  grillzubehoer: "/images/placeholders/product-default.svg",
  sonstiges: "/images/placeholders/product-default.svg",
};

export function isDefaultProductRecommendationCategorySlug(slug: string): boolean {
  return DEFAULT_PRODUCT_RECOMMENDATION_CATEGORIES.some((category) => category.slug === slug);
}
