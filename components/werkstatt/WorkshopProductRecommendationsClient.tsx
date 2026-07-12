"use client";

import { useMemo, useState } from "react";

import WorkshopProductCard from "@/components/werkstatt/WorkshopProductCard";
import type {
  ProductRecommendationCategoryEntry,
  ProductRecommendationSummary,
} from "@/lib/product-recommendations/product-recommendation-types";
import {
  inputClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type WorkshopProductRecommendationsClientProps = {
  products: ProductRecommendationSummary[];
  categories: ProductRecommendationCategoryEntry[];
  disclosure: string;
};

export default function WorkshopProductRecommendationsClient({
  products,
  categories,
  disclosure,
}: WorkshopProductRecommendationsClientProps) {
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (categorySlug && product.categorySlug !== categorySlug) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.title.toLowerCase().includes(query) ||
        product.shortDescription.toLowerCase().includes(query) ||
        (product.manufacturer?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [products, search, categorySlug]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          className={inputClassName}
          placeholder="Produkte durchsuchen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={inputClassName}
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
        >
          <option value="">Alle Kategorien</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name} ({category.productCount})
            </option>
          ))}
        </select>
        {(search || categorySlug) && (
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => {
              setSearch("");
              setCategorySlug("");
            }}
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-aw-border bg-aw-surface p-6 text-sm text-aw-muted">
          Keine Produkte gefunden. Bitte Filter anpassen oder später erneut versuchen.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <WorkshopProductCard key={product.id} product={product} disclosure={disclosure} />
          ))}
        </div>
      )}

      <p className="rounded-lg border border-aw-border/60 bg-aw-surface-2 p-4 text-xs leading-5 text-aw-muted">
        {disclosure}
      </p>
    </div>
  );
}
