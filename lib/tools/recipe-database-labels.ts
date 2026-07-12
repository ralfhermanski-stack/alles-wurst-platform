/**
 * @file recipe-database-labels.ts
 * @purpose Deutsche Beschriftungen für die öffentliche Rezeptdatenbank.
 */

import type { RecipeDatabaseTypeFilter } from "./recipe-database-service";

export const RECIPE_TYPE_FILTER_LABELS: Record<
  RecipeDatabaseTypeFilter,
  string
> = {
  all: "Alle Rezepttypen",
  smoked: "Räucherware",
  fresh: "Frischware (ohne Räuchern)",
};

export const RECIPE_TYPE_SUMMARY_LABELS = {
  smoked: "Räucherware",
  fresh: "Frischware",
} as const;
