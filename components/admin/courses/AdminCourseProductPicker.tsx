"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { ProductRecommendationSummary } from "@/lib/product-recommendations/product-recommendation-types";
import { labelClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminCourseProductPickerProps = {
  selectedProductIds: string[];
  onChange: (productIds: string[]) => void;
};

export default function AdminCourseProductPicker({
  selectedProductIds,
  onChange,
}: AdminCourseProductPickerProps) {
  const [products, setProducts] = useState<ProductRecommendationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await adminFetch<
        Array<
          ProductRecommendationSummary & {
            amazonClickCount: number;
            shopClickCount: number;
            affiliateClickCount: number;
          }
        >
      >("/api/admin/werkstatt/produktempfehlungen");

      setLoading(false);

      if (!response.success) {
        setError("Werkstatt-Empfehlungen konnten nicht geladen werden.");
        return;
      }

      setProducts(
        response.data
          .filter((product) => product.status !== "archived")
          .sort((a, b) => a.title.localeCompare(b.title, "de")),
      );
    })();
  }, []);

  function toggleProduct(productId: string) {
    if (selectedProductIds.includes(productId)) {
      onChange(selectedProductIds.filter((id) => id !== productId));
      return;
    }

    onChange([...selectedProductIds, productId]);
  }

  const grouped = products.reduce<Record<string, ProductRecommendationSummary[]>>(
    (groups, product) => {
      const key = product.categoryName;
      groups[key] = groups[key] ?? [];
      groups[key].push(product);
      return groups;
    },
    {},
  );

  return (
    <div>
      <label className={labelClassName}>Werkstatt-Empfehlungen verlinken</label>
      <p className="mt-1 text-xs text-aw-muted">
        Optional: Verlinke passende Werkzeuge und Zutaten aus der Werkstatt. Sie
        erscheinen im Abschnitt „Was du zuhause benötigst“ auf der Kursseite.
      </p>

      {loading && (
        <p className="mt-3 text-sm text-aw-muted">Empfehlungen werden geladen …</p>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="mt-3 text-sm text-aw-muted">
          Noch keine Werkstatt-Empfehlungen vorhanden.{" "}
          <Link
            href="/admin/werkstatt/produktempfehlungen"
            className="text-aw-gold hover:underline"
          >
            Jetzt anlegen
          </Link>
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="mt-3 max-h-72 space-y-4 overflow-y-auto rounded-xl border border-aw-border bg-aw-surface-2/40 p-4">
          {Object.entries(grouped).map(([categoryName, categoryProducts]) => (
            <div key={categoryName}>
              <p className="text-xs font-semibold uppercase tracking-wide text-aw-gold">
                {categoryName}
              </p>
              <ul className="mt-2 space-y-2">
                {categoryProducts.map((product) => (
                  <li key={product.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-aw-surface">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-aw-cream">
                          {product.title}
                          {product.status !== "published" ? " (Entwurf)" : ""}
                        </span>
                        <span className="block text-xs text-aw-muted">
                          {product.shortDescription}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {selectedProductIds.length > 0 && (
        <p className="mt-2 text-xs text-aw-muted">
          {selectedProductIds.length} Empfehlung
          {selectedProductIds.length === 1 ? "" : "en"} ausgewählt
        </p>
      )}
    </div>
  );
}
