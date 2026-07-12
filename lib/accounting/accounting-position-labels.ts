/**
 * @file accounting-position-labels.ts
 * @purpose Deutsche Bezeichnungen für Buchhaltungspositionen.
 */

import type {
  AccountingPositionPaymentStatus,
  AccountingProductType,
} from "@prisma/client";

export const ACCOUNTING_PRODUCT_TYPE_LABELS: Record<
  AccountingProductType,
  string
> = {
  membership: "Mitgliedschaft",
  course: "Kurs",
  workshop: "Workshop",
  manual: "Manuelle Position",
};

export const ACCOUNTING_POSITION_STATUS_LABELS: Record<
  AccountingPositionPaymentStatus,
  string
> = {
  pending: "Offen",
  paid: "Bezahlt",
  overdue: "Überfällig",
  cancelled: "Storniert",
  refunded: "Erstattet",
};
