"use client";

/**
 * @file CheckoutPanel.tsx
 * @purpose Preis- und Zahlungsart-Auswahl, Checkout-Intent erstellen.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import CheckoutLegalSection, {
  type CheckoutLegalConsentState,
} from "@/components/legal/CheckoutLegalSection";
import { createCheckoutApi } from "@/lib/payments/checkout-client";
import { formatMoney } from "@/lib/payments/format-money";
import {
  BILLING_PERIOD_LABELS,
  PAYMENT_PROVIDER_LABELS,
} from "@/lib/payments/payment-labels";
import type { ProductWithPrices } from "@/lib/payments/payment-types";
import type { BillingPeriod, PaymentProvider } from "@prisma/client";
import {
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type CheckoutPanelProps = {
  product: ProductWithPrices;
  isLoggedIn: boolean;
  availableProviders: PaymentProvider[];
  initialBillingPeriod?: BillingPeriod;
};

export default function CheckoutPanel({
  product,
  isLoggedIn,
  availableProviders,
  initialBillingPeriod,
}: CheckoutPanelProps) {
  const router = useRouter();
  const defaultPrice =
    product.prices.find((price) => price.billingPeriod === initialBillingPeriod) ??
    product.prices[0];
  const [priceId, setPriceId] = useState(defaultPrice?.id ?? "");
  const defaultProvider = availableProviders.includes("stripe")
    ? "stripe"
    : (availableProviders[0] ?? "bank_transfer");
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>(defaultProvider);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalConsents, setLegalConsents] = useState<CheckoutLegalConsentState>({
    termsAccepted: false,
    privacyAcknowledged: false,
    immediateAccessConsent: null,
    withdrawalLossAcknowledged: null,
  });

  const selectedPrice = product.prices.find((price) => price.id === priceId);
  const hasStripe = availableProviders.includes("stripe");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!priceId) {
      setError("Bitte wähle eine Preisoption.");
      return;
    }

    setLoading(true);

    const response = await createCheckoutApi({
      productPriceId: priceId,
      paymentProvider,
      ...legalConsents,
    });

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    if (response.data.redirectUrl) {
      window.location.href = response.data.redirectUrl;
      return;
    }

    router.push(`/kaufen/status/${response.data.checkoutId}`);
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-aw-gold/25 bg-aw-surface p-6">
        <h2 className="font-display text-xl font-bold text-aw-cream">Checkout</h2>
        <p className="mt-3 text-sm text-aw-muted">
          Bitte melde dich an, um eine Zahlung vorzubereiten. Dein Kauf wird in
          der Buchhaltung erfasst und nach Freigabe freigeschaltet.
        </p>
        <Link
          href={`/anmelden?next=/kaufen/${product.slug}`}
          className={`${primaryButtonClassName} mt-6 inline-flex w-full justify-center`}
        >
          Anmelden
        </Link>
      </div>
    );
  }

  if (product.prices.length === 0) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        Für dieses Produkt ist aktuell kein Preis hinterlegt.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-aw-gold/25 bg-aw-surface p-6"
    >
      <h2 className="font-display text-xl font-bold text-aw-cream">Checkout</h2>
      <p className="mt-2 text-sm text-aw-muted">
        {hasStripe
          ? "Wähle Preis und Zahlungsart. Bei Stripe wirst du zur sicheren Zahlungsseite weitergeleitet. Die Freischaltung erfolgt erst nach bestätigtem Webhook — nicht über die Erfolgsseite."
          : "Wähle Preis und Zahlungsart. Es erfolgt noch keine Online-Zahlung — die Buchhaltung prüft den Eingang und schaltet deinen Zugang frei."}
      </p>

      {error && (
        <p
          className="mt-4 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}

      <fieldset className="mt-6 space-y-3">
        <legend className={labelClassName}>Preisoption</legend>
        {product.prices.map((price) => (
          <label
            key={price.id}
            className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 ${
              priceId === price.id
                ? "border-aw-gold bg-aw-gold/10"
                : "border-aw-border bg-aw-bg"
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="price"
                value={price.id}
                checked={priceId === price.id}
                onChange={() => setPriceId(price.id)}
                className="accent-aw-gold"
              />
              <span className="text-sm text-aw-cream">
                {BILLING_PERIOD_LABELS[price.billingPeriod]}
              </span>
            </span>
            <span className="font-semibold text-aw-gold">
              {formatMoney(price.grossAmount, price.currency)}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-6 space-y-3">
        <legend className={labelClassName}>Zahlungsart</legend>
        {availableProviders.map((provider) => (
          <label
            key={provider}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
              paymentProvider === provider
                ? "border-aw-gold bg-aw-gold/10"
                : "border-aw-border bg-aw-bg"
            }`}
          >
            <input
              type="radio"
              name="provider"
              value={provider}
              checked={paymentProvider === provider}
              onChange={() => setPaymentProvider(provider)}
              className="accent-aw-gold"
            />
            <span className="text-sm text-aw-cream">
              {PAYMENT_PROVIDER_LABELS[provider]}
            </span>
          </label>
        ))}
      </fieldset>

      {selectedPrice && (
        <div className="mt-6 rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-muted">
          <p>
            <span className="text-aw-cream">Gesamt (brutto):</span>{" "}
            <strong className="text-aw-gold">
              {formatMoney(selectedPrice.grossAmount, selectedPrice.currency)}
            </strong>
          </p>
          <p className="mt-1">
            inkl. {formatMoney(selectedPrice.taxAmount, selectedPrice.currency)}{" "}
            MwSt. ({selectedPrice.taxRate.toFixed(0)} %)
          </p>
        </div>
      )}

      <CheckoutLegalSection
        productKind={product.kind}
        legalConfig={product.legalConfig}
        value={legalConsents}
        onChange={setLegalConsents}
      />

      <button
        type="submit"
        className={`${primaryButtonClassName} mt-6 w-full`}
        disabled={loading}
      >
        {loading
          ? "Wird vorbereitet …"
          : paymentProvider === "stripe"
            ? "Weiter zu Stripe"
            : "Zahlung vorbereiten"}
      </button>
    </form>
  );
}
