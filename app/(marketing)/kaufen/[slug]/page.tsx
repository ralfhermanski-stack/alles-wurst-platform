import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CheckoutPanel from "@/components/checkout/CheckoutPanel";
import PageHeader from "@/components/marketing/PageHeader";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { formatMoney } from "@/lib/payments/format-money";
import { getCheckoutUiProviders } from "@/lib/payments/checkout-query-service";
import {
  BILLING_PERIOD_LABELS,
  PRODUCT_KIND_LABELS,
} from "@/lib/payments/payment-labels";
import { getProductBySlug } from "@/lib/payments/product-catalog-service";
import { buildRouteKey } from "@/lib/page-seo/page-seo-site";
import { resolvePageMetadata } from "@/lib/page-seo/page-seo-metadata";
import PageSeoJsonLd from "@/components/seo/PageSeoJsonLd";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.data) {
    return { title: "Produkt nicht gefunden" };
  }

  return resolvePageMetadata(buildRouteKey("product", slug), {
    title: `${result.data.name} — Checkout`,
    description: result.data.description ?? undefined,
  });
}

export default async function KaufenProduktPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { period } = await searchParams;
  const result = await getProductBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;
  const userId = await getSessionUserIdFromCookies();
  const availableProviders = await getCheckoutUiProviders();
  const hasStripe = availableProviders.includes("stripe");
  const initialBillingPeriod =
    period === "monthly" || period === "yearly" || period === "one_time"
      ? period
      : undefined;

  return (
    <>
      <PageSeoJsonLd routeKey={buildRouteKey("product", slug)} />
      <PageHeader
        eyebrow={PRODUCT_KIND_LABELS[product.kind]}
        title={product.name}
        description={product.description ?? "Checkout vorbereiten"}
      />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2 sm:px-6">
        <div className="rounded-2xl border border-aw-border bg-aw-surface p-6">
          <h2 className="font-display text-xl font-bold text-aw-cream">
            Preisübersicht
          </h2>
          <ul className="mt-6 space-y-4">
            {product.prices.map((price) => (
              <li
                key={price.id}
                className="flex items-center justify-between rounded-lg border border-aw-border bg-aw-bg px-4 py-3"
              >
                <span className="text-sm text-aw-cream">
                  {BILLING_PERIOD_LABELS[price.billingPeriod]}
                </span>
                <span className="font-semibold text-aw-gold">
                  {formatMoney(price.grossAmount, price.currency)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-aw-muted">
            Alle Preise inkl. MwSt.
            {hasStripe
              ? " Online-Zahlung per Stripe verfügbar."
              : " Überweisung und manuelle Freigabe verfügbar."}
          </p>
          <Link
            href="/kaufen"
            className="mt-6 inline-block text-sm font-medium text-aw-gold hover:text-aw-cream"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>

        <CheckoutPanel
          product={product}
          isLoggedIn={Boolean(userId)}
          availableProviders={availableProviders}
          initialBillingPeriod={initialBillingPeriod}
        />
      </section>
    </>
  );
}
