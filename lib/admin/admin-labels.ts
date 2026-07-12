/**
 * @file admin-labels.ts
 * @purpose Deutsche Beschriftungen für den Admin-Rezeptgenerator.
 */

import type { RecipeModerationStatus } from "@prisma/client";

export const MODERATION_STATUS_LABELS: Record<RecipeModerationStatus, string> =
  {
    none: "Keine Prüfung",
    pending: "Ausstehend",
    approved: "Freigegeben",
    rejected: "Abgelehnt",
    blocked: "Gesperrt",
  };

export const MODERATION_ACTION_LABELS = {
  approve: "Freigeben",
  reject: "Ablehnen",
  block: "Sperren",
  adopt: "In Datenbank übernehmen",
  reset: "Zur Prüfung vormerken",
} as const;

export type ModerationAction = keyof typeof MODERATION_ACTION_LABELS;
