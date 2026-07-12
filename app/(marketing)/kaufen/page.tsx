import type { Metadata } from "next";
import Link from "next/link";

import ProductCard from "@/components/checkout/ProductCard";
import PageHeader from "@/components/marketing/PageHeader";
import { PRODUCT_KIND_LABELS } from "@/lib/payments/payment-labels";
import { listActiveProducts } from "@/lib/payments/product-catalog-service";
import type { ProductKind } from "@prisma/client";
import type { ProductWithPrices } from "@/lib/payments/payment-types";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/kaufen", {
    title: "Kaufen",
    description:
      "Wurstclub, Meisterclub, Kurse und Workshops — Zahlung per Überweisung oder manuelle Freigabe vorbereiten.",
  });
}

const SECTION_ORDER: ProductKind[] = [
  "membership_wurstclub",
  "membership_meisterclub",
  "course",
  "workshop",
];

function groupProducts(products: ProductWithPrices[]): ProductWithPrices[][] {
  return SECTION_ORDER.map((kind) =>
    products.filter((product) => product.kind === kind),
  ).filter((section) => section.length > 0);
}

export default async function KaufenPage() {
  const result = await listActiveProducts();
  const products = result.success ? result.data : [];
  const sections = groupProducts(products);

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Mitgliedschaften & Kurse"
        description="Wähle dein Angebot und bereite die Zahlung vor. Nach Buchhaltungsfreigabe wird dein Zugang automatisch aktiviert."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {!result.success && (
          <p className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning">
            Der Produktkatalog konnte nicht geladen werden.
          </p>
        )}

        {products.length === 0 && result.success && (
          <p className="text-sm text-aw-muted">
            Aktuell sind keine Produkte im Katalog hinterlegt.
          </p>
        )}

        <div className="space-y-14">
          {sections.map((section) => (
            <div key={section[0]?.kind}>
              <h2 className="font-display text-2xl font-bold text-aw-cream">
                {PRODUCT_KIND_LABELS[section[0].kind]}
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-aw-muted">
          Bereits registriert?{" "}
          <Link href="/anmelden" className="font-semibold text-aw-gold hover:text-aw-cream">
            Anmelden
          </Link>{" "}
          — für den Checkout ist ein Konto erforderlich.
        </p>
      </section>
    </>
  );
}
