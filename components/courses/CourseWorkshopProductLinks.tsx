import Image from "next/image";
import Link from "next/link";

import type { ProductRecommendationSummary } from "@/lib/product-recommendations/product-recommendation-types";

type CourseWorkshopProductLinksProps = {
  products: ProductRecommendationSummary[];
};

export default function CourseWorkshopProductLinks({
  products,
}: CourseWorkshopProductLinksProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-aw-gold">
        Empfohlene Werkstatt-Artikel
      </h3>
      <ul className="mt-4 space-y-3">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/werkstatt/empfehlungen/${product.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-aw-border bg-aw-surface/60 p-4 transition-colors hover:border-aw-gold/50"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-aw-surface-2">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-aw-muted">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-aw-gold">
                  {product.categoryName}
                </p>
                <p className="mt-0.5 font-medium text-aw-cream transition-colors group-hover:text-aw-gold">
                  {product.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-aw-muted">
                  {product.shortDescription}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-aw-gold">
                Zur Werkstatt →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
