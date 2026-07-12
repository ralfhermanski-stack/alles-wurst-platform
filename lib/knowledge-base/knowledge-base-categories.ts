/**
 * @file knowledge-base-categories.ts
 * @purpose Standard-Kategorien der Wissensdatenbank.
 */

export const DEFAULT_KNOWLEDGE_BASE_CATEGORIES = [
  { name: "Konto & Registrierung", slug: "konto-registrierung", sortOrder: 10 },
  { name: "Mitgliedschaften", slug: "mitgliedschaften", sortOrder: 20 },
  { name: "Zahlungen", slug: "zahlungen", sortOrder: 30 },
  { name: "Kurse", slug: "kurse", sortOrder: 40 },
  { name: "Zertifikate", slug: "zertifikate", sortOrder: 50 },
  { name: "Rezeptgenerator", slug: "rezeptgenerator", sortOrder: 60 },
  { name: "Marinaden-Generator", slug: "marinaden-generator", sortOrder: 70 },
  { name: "Salzrechner", slug: "salzrechner", sortOrder: 80 },
  { name: "Lakerechner", slug: "lakerechner", sortOrder: 90 },
  { name: "Forum & Community", slug: "forum-community", sortOrder: 100 },
  { name: "Technische Probleme", slug: "technische-probleme", sortOrder: 110 },
  { name: "Datenschutz", slug: "datenschutz", sortOrder: 120 },
  { name: "Sonstiges", slug: "sonstiges", sortOrder: 130 },
] as const;
