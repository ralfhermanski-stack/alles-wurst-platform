/**
 * @file membership-renewal-labels.ts
 */

import type {
  BillingPeriod,
  MembershipCancelReason,
  MembershipRenewalReminderStatus,
} from "@prisma/client";

export const MEMBERSHIP_CANCEL_REASON_LABELS: Record<
  MembershipCancelReason,
  string
> = {
  user_request: "Nutzerwunsch",
  account_deletion: "Kontolöschung",
  admin: "Admin/Buchhaltung",
  stripe_sync: "Stripe (Synchronisation)",
  payment_failed: "Zahlung fehlgeschlagen",
};

export const RENEWAL_REMINDER_STATUS_LABELS: Record<
  MembershipRenewalReminderStatus,
  string
> = {
  sent: "Gesendet",
  skipped: "Übersprungen",
  failed: "Fehlgeschlagen",
  suppressed: "Unterdrückt",
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  one_time: "Einmalig",
  monthly: "Monatlich",
  yearly: "Jährlich",
};
