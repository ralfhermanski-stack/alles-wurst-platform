"use client";

/**
 * @file CheckoutStatusPanel.tsx
 * @purpose Checkout-Status mit Überweisungsdaten und Aktualisierung.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import BankTransferInstructions from "@/components/checkout/BankTransferInstructions";
import { fetchCheckoutDetailsApi } from "@/lib/payments/checkout-client";
import type { CheckoutDetails } from "@/lib/payments/checkout-query-service";
import {
  BILLING_PERIOD_LABELS,
  CHECKOUT_INTENT_STATUS_LABELS,
  PAYMENT_PROVIDER_LABELS,
} from "@/lib/payments/payment-labels";
import { formatMoney } from "@/lib/payments/format-money";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type CheckoutStatusPanelProps = {
  initialDetails: CheckoutDetails;
  checkoutId: string;
};

function statusTone(status: CheckoutDetails["checkout"]["status"]): string {
  switch (status) {
    case "succeeded":
      return "border-aw-success/40 bg-aw-success/10 text-aw-success";
    case "failed":
    case "cancelled":
    case "expired":
      return "border-aw-warning/40 bg-aw-warning/10 text-aw-warning";
    default:
      return "border-aw-gold/40 bg-aw-gold/10 text-aw-gold";
  }
}

export default function CheckoutStatusPanel({
  initialDetails,
  checkoutId,
}: CheckoutStatusPanelProps) {
  const router = useRouter();
  const [details, setDetails] = useState(initialDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setError(null);

    const response = await fetchCheckoutDetailsApi(checkoutId);

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    if (response.data) {
      setDetails(response.data);
    }

    router.refresh();
  }

  const { checkout } = details;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${statusTone(checkout.status)}`}
        role="status"
      >
        Status: {CHECKOUT_INTENT_STATUS_LABELS[checkout.status]}
      </div>

      {error && (
        <p
          className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          {details.productName}
        </h1>
        <p className="mt-2 text-sm text-aw-muted">{details.productKindLabel}</p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-aw-muted">Abrechnung</dt>
            <dd className="mt-1 font-medium text-aw-cream">
              {BILLING_PERIOD_LABELS[details.billingPeriod]}
            </dd>
          </div>
          <div>
            <dt className="text-aw-muted">Zahlungsart</dt>
            <dd className="mt-1 font-medium text-aw-cream">
              {PAYMENT_PROVIDER_LABELS[checkout.paymentProvider]}
            </dd>
          </div>
          <div>
            <dt className="text-aw-muted">Betrag</dt>
            <dd className="mt-1 font-display text-xl font-bold text-aw-gold">
              {formatMoney(checkout.grossAmount, checkout.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-aw-muted">Checkout-Nr.</dt>
            <dd className="mt-1 font-mono text-xs text-aw-muted">{checkout.id}</dd>
          </div>
        </dl>
      </div>

      {details.stripeReturnHint && (
        <div
          className="rounded-2xl border border-aw-gold/40 bg-aw-gold/10 px-5 py-4 text-sm leading-6 text-aw-cream"
          role="status"
        >
          {details.stripeReturnHint}
        </div>
      )}

      {details.stripeRedirectUrl &&
        checkout.status === "awaiting_payment" &&
        checkout.paymentProvider === "stripe" && (
          <a
            href={details.stripeRedirectUrl}
            className={`${primaryButtonClassName} inline-flex`}
          >
            Zahlung bei Stripe fortsetzen
          </a>
        )}

      {details.bankTransfer && (
        <BankTransferInstructions details={details.bankTransfer} />
      )}

      {details.manualHint && (
        <div className="rounded-2xl border border-aw-border bg-aw-surface p-6 text-sm leading-6 text-aw-muted">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Manuelle Prüfung
          </h2>
          <p className="mt-3">{details.manualHint}</p>
        </div>
      )}

      {checkout.status === "succeeded" && (
        <div className="rounded-2xl border border-aw-success/30 bg-aw-success/5 p-6 text-sm text-aw-muted">
          <p>
            Deine Zahlung wurde freigegeben. Du kannst deine Mitgliedschaft bzw.
            deinen Kurszugang im Mein-Bereich nutzen.
          </p>
          <Link
            href="/mein-bereich"
            className={`${primaryButtonClassName} mt-4 inline-flex`}
          >
            Zum Mein-Bereich
          </Link>
        </div>
      )}

      {checkout.status === "awaiting_payment" && (
        <p className="text-sm text-aw-muted">
          {checkout.paymentProvider === "stripe"
            ? "Sobald Stripe die Zahlung bestätigt hat, wird der Status hier auf „Abgeschlossen“ wechseln und dein Zugang aktiviert. Die Freischaltung erfolgt ausschließlich über unser Zahlungssystem — nicht über die Stripe-Erfolgsseite."
            : "Sobald die Buchhaltung deine Zahlung bestätigt hat, wird der Status hier auf „Abgeschlossen“ wechseln und dein Zugang aktiviert."}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleRefresh()}
        className={`${primaryButtonClassName}`}
        disabled={loading}
      >
        {loading ? "Aktualisiere …" : "Status aktualisieren"}
      </button>
    </div>
  );
}
