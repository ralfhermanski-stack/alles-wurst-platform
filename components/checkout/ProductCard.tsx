import Link from "next/link";

import type { ProductWithPrices } from "@/lib/payments/payment-types";
import { formatMoney } from "@/lib/payments/format-money";
import {
  PRODUCT_KIND_LABELS,
} from "@/lib/payments/payment-labels";

type ProductCardProps = {
  product: ProductWithPrices;
};

function lowestPrice(product: ProductWithPrices): string | null {
  const price = product.prices[0];

  if (!price) {
    return null;
  }

  const suffix =
    price.billingPeriod === "monthly"
      ? " / Monat"
      : price.billingPeriod === "yearly"
        ? " / Jahr"
        : "";

  return `ab ${formatMoney(price.grossAmount, price.currency)}${suffix}`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const fromPrice = lowestPrice(product);

  return (
    <article className="flex flex-col rounded-2xl border border-aw-border bg-aw-surface p-6 transition-colors hover:border-aw-gold/40">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-aw-gold">
        {PRODUCT_KIND_LABELS[product.kind]}
      </p>
      <h2 className="mt-3 font-display text-xl font-bold text-aw-cream">
        {product.name}
      </h2>
      {product.description && (
        <p className="mt-3 flex-1 text-sm leading-6 text-aw-muted">
          {product.description}
        </p>
      )}
      {fromPrice && (
        <p className="mt-4 font-display text-2xl font-bold text-aw-gold">
          {fromPrice}
        </p>
      )}
      <p className="mt-2 text-xs text-aw-muted">
        {product.prices.length}{" "}
        {product.prices.length === 1 ? "Preisoption" : "Preisoptionen"}
      </p>
      <Link
        href={`/kaufen/${product.slug}`}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark"
      >
        Details &amp; Checkout
      </Link>
    </article>
  );
}
