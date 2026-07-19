import Image from "next/image";
import Link from "next/link";

import WorkshopProductImageDisclaimer from "@/components/werkstatt/WorkshopProductImageDisclaimer";
import type { ProductRecommendationSummary } from "@/lib/product-recommendations/product-recommendation-types";

type WorkshopProductCardProps = {
  product: ProductRecommendationSummary;
  disclosure?: string;
};

export default function WorkshopProductCard({
  product,
}: WorkshopProductCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-colors hover:border-aw-gold/50">
      <figure>
        <div className="relative aspect-[4/3] overflow-hidden bg-aw-surface-2">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-aw-muted">
              Kein Bild
            </div>
          )}
          {product.isMasterRecommendation && (
            <span className="absolute left-3 top-3 rounded-full bg-aw-gold/90 px-2.5 py-1 text-xs font-semibold text-aw-surface">
              Meister-Empfehlung
            </span>
          )}
        </div>
        <WorkshopProductImageDisclaimer
          as="figcaption"
          className="border-t border-aw-border/40 bg-aw-surface-2/80 px-3 py-1.5 leading-4"
        />
      </figure>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-aw-gold">
          {product.categoryName}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-aw-cream">{product.title}</h3>
        {product.manufacturer && (
          <p className="mt-1 text-xs text-aw-muted">{product.manufacturer}</p>
        )}
        <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">
          {product.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/werkstatt/empfehlungen/${product.slug}`}
            className="inline-flex items-center rounded-lg border border-aw-border px-3 py-2 text-sm font-semibold text-aw-cream transition-colors hover:border-aw-gold/50 hover:text-aw-gold"
          >
            Details ansehen
          </Link>
        </div>
      </div>
    </article>
  );
}
