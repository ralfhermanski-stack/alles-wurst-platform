"use client";

import Image from "next/image";
import Link from "next/link";

import type { ProductRecommendationDetail } from "@/lib/product-recommendations/product-recommendation-types";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type WorkshopProductDetailClientProps = {
  product: ProductRecommendationDetail;
  disclosure: string;
};

async function trackClick(productId: string, eventType: "amazon" | "shop" | "affiliate") {
  try {
    await fetch(`/api/werkstatt/empfehlungen/${productId}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType }),
    });
  } catch {
    // Tracking ist optional
  }
}

export default function WorkshopProductDetailClient({
  product,
  disclosure,
}: WorkshopProductDetailClientProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/werkstatt/empfehlungen"
        className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
      >
        ← Zurück zur Übersicht
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-aw-border bg-aw-surface-2">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />
          )}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-aw-gold">
            {product.categoryName}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-aw-cream">{product.title}</h1>
          {product.manufacturer && (
            <p className="mt-2 text-sm text-aw-muted">Hersteller: {product.manufacturer}</p>
          )}
          <p className="mt-4 text-base leading-7 text-aw-muted">{product.shortDescription}</p>

          {product.isMasterRecommendation && product.masterRecommendationText && (
            <div className="mt-6 rounded-xl border border-aw-gold/40 bg-aw-gold/10 p-4">
              <p className="text-sm font-semibold text-aw-gold">
                Empfehlung von Fleischermeister Ralf Hermanski
              </p>
              <p className="mt-2 text-sm leading-6 text-aw-cream">
                {product.masterRecommendationText}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {product.amazonUrl && (
              <a
                href={product.amazonUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={primaryButtonClassName}
                data-analytics-event="affiliate_click"
                data-analytics-label={product.slug}
                onClick={() => void trackClick(product.id, "amazon")}
              >
                Bei Amazon ansehen
              </a>
            )}
            {product.shopUrl && (
              <a
                href={product.shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryButtonClassName}
                onClick={() => void trackClick(product.id, "shop")}
              >
                Zum Shop
              </a>
            )}
            {product.affiliateUrl && !product.amazonUrl && (
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className={secondaryButtonClassName}
                data-analytics-event="affiliate_click"
                data-analytics-label={product.slug}
                onClick={() => void trackClick(product.id, "affiliate")}
              >
                Partnerlink öffnen
              </a>
            )}
          </div>
        </div>
      </div>

      {product.longDescription && (
        <section className="mt-10 rounded-xl border border-aw-border bg-aw-surface p-6">
          <h2 className="font-display text-xl font-bold text-aw-cream">Beschreibung</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-aw-muted">
            {product.longDescription}
          </p>
        </section>
      )}

      {product.galleryImageUrls.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-xl font-bold text-aw-cream">Galerie</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {product.galleryImageUrls.map((url) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-lg border border-aw-border"
              >
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 rounded-lg border border-aw-border/60 bg-aw-surface-2 p-4 text-xs leading-5 text-aw-muted">
        {disclosure}
      </p>
    </div>
  );
}
