/**
 * @file invoice-labels.ts
 * @purpose Deutsche Labels für Rechnungsstatus.
 */

import type { InvoiceStatus } from "@prisma/client";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Entwurf",
  issued: "Ausgestellt",
  paid: "Bezahlt",
  cancelled: "Storniert",
  refunded: "Erstattet",
};
