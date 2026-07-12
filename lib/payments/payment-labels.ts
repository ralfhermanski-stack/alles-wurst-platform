/**
 * @file payment-labels.ts
 * @purpose Deutsche Labels für Zahlungsstatus und Provider.
 */

import type {
  BillingPeriod,
  CheckoutIntentStatus,
  PaymentIntentStatus,
  PaymentProvider,
  ProductKind,
} from "@prisma/client";

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  membership_wurstclub: "Wurstclub-Mitgliedschaft",
  membership_meisterclub: "Meisterclub-Mitgliedschaft",
  course: "Kurs",
  workshop: "Workshop",
};

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  stripe: "Stripe",
  paypal: "PayPal",
  bank_transfer: "Überweisung",
  manual: "Manuell (Buchhaltung)",
};

export const CHECKOUT_INTENT_STATUS_LABELS: Record<CheckoutIntentStatus, string> =
  {
    created: "Erstellt",
    awaiting_payment: "Zahlung ausstehend",
    processing: "In Bearbeitung",
    succeeded: "Abgeschlossen",
    failed: "Fehlgeschlagen",
    cancelled: "Storniert",
    expired: "Abgelaufen",
  };

export const PAYMENT_INTENT_STATUS_LABELS: Record<PaymentIntentStatus, string> =
  {
    created: "Erstellt",
    awaiting_payment: "Zahlung ausstehend",
    processing: "In Bearbeitung",
    succeeded: "Bezahlt",
    failed: "Fehlgeschlagen",
    cancelled: "Storniert",
    expired: "Abgelaufen",
  };

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  one_time: "Einmalig",
  monthly: "Monatlich",
  yearly: "Jährlich",
};
