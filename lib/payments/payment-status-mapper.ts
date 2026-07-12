/**
 * @file payment-status-mapper.ts
 * @purpose Abbildung zwischen Payment-Status und AccountingPosition.
 */

import type {
  AccountingPositionPaymentStatus,
  CheckoutIntentStatus,
  PaymentIntentStatus,
} from "@prisma/client";

/**
 * Leitet den Buchhaltungs-Zahlungsstatus aus einem Payment-Intent ab.
 */
export function paymentIntentStatusToAccountingStatus(
  status: PaymentIntentStatus,
): AccountingPositionPaymentStatus {
  switch (status) {
    case "succeeded":
      return "paid";
    case "failed":
    case "cancelled":
    case "expired":
      return "cancelled";
    case "awaiting_payment":
    case "created":
      return "pending";
    case "processing":
      return "pending";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

/**
 * Leitet den Buchhaltungs-Zahlungsstatus aus einem Checkout-Intent ab.
 */
export function checkoutIntentStatusToAccountingStatus(
  status: CheckoutIntentStatus,
): AccountingPositionPaymentStatus | null {
  switch (status) {
    case "succeeded":
      return "paid";
    case "failed":
    case "cancelled":
    case "expired":
      return "cancelled";
    case "awaiting_payment":
    case "created":
    case "processing":
      return "pending";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

/**
 * Prüft, ob ein Payment-Intent als erfolgreich gilt.
 */
export function isPaymentSucceeded(status: PaymentIntentStatus): boolean {
  return status === "succeeded";
}

/**
 * Prüft, ob ein Checkout-Intent abgeschlossen ist.
 */
export function isCheckoutComplete(status: CheckoutIntentStatus): boolean {
  return (
    status === "succeeded" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "expired"
  );
}
