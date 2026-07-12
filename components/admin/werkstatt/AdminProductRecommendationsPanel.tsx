"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type {
  AdminProductRecommendationDetail,
  ProductRecommendationAnalytics,
  ProductRecommendationCategoryEntry,
  ProductRecommendationSummary,
  UpsertProductRecommendationInput,
} from "@/lib/product-recommendations/product-recommendation-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

const textareaClassName = `${inputClassName} min-h-[88px] resize-y`;

type AdminProduct = ProductRecommendationSummary & {
  amazonClickCount: number;
  shopClickCount: number;
  affiliateClickCount: number;
};

export default function AdminProductRecommendationsPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<ProductRecommendationCategoryEntry[]>([]);
  const [analytics, setAnalytics] = useState<ProductRecommendationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<UpsertProductRecommendationInput>({
    title: "",
    shortDescription: "",
    categoryId: "",
    status: "draft",
  });

  async function reload() {
    const [productsRes, categoriesRes, analyticsRes] = await Promise.all([
      adminFetch<AdminProduct[]>("/api/admin/werkstatt/produktempfehlungen"),
      adminFetch<ProductRecommendationCategoryEntry[]>(
        "/api/admin/werkstatt/produktempfehlungen/categories",
      ),
      adminFetch<ProductRecommendationAnalytics>(
        "/api/admin/werkstatt/produktempfehlungen?analytics=1",
      ),
    ]);

    setLoading(false);

    if (!productsRes.success) {
      setError(productsRes.error.message);
      return;
    }

    setProducts(productsRes.data);
    if (categoriesRes.success) {
      setCategories(categoriesRes.data);
      if (!form.categoryId && categoriesRes.data[0]) {
        setForm((prev) => ({ ...prev, categoryId: categoriesRes.data[0].id }));
      }
    }
    if (analyticsRes.success) {
      setAnalytics(analyticsRes.data);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleSave() {
    setError(null);

    const payload = { ...form };
    const response = editingId
      ? await adminFetch<AdminProductRecommendationDetail>(
          `/api/admin/werkstatt/produktempfehlungen/${editingId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        )
      : await adminFetch<AdminProductRecommendationDetail>(
          "/api/admin/werkstatt/produktempfehlungen",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    const savedId = editingId ?? response.data.id;

    if (savedId) {
      setEditingId(savedId);
      setImageUrl(response.data.imageUrl);
      setGalleryImageUrls(response.data.galleryImageUrls ?? []);
    } else {
      setEditingId(null);
      setImageUrl(null);
      setGalleryImageUrls([]);
      setForm({
        title: "",
        shortDescription: "",
        categoryId: categories[0]?.id ?? "",
        status: "draft",
      });
    }

    await reload();
  }

  async function uploadProductImage(file: File, kind: "main" | "gallery") {
    if (!editingId) {
      setError("Bitte speichere das Produkt zuerst, bevor du ein Bild hochlädst.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);

    const response = await adminFetch<{ storageKey: string; imageId?: string }>(
      `/api/admin/werkstatt/produktempfehlungen/${editingId}/image`,
      { method: "POST", body: formData },
    );

    setUploading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await handleEdit(editingId);
    await reload();
  }

  async function handleMainImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadProductImage(file, "main");
    event.target.value = "";
  }

  async function handleGalleryImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadProductImage(file, "gallery");
    event.target.value = "";
  }

  async function handleEdit(id: string) {
    const response = await adminFetch<AdminProductRecommendationDetail>(
      `/api/admin/werkstatt/produktempfehlungen/${id}`,
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    const data = response.data;
    setEditingId(id);
    setImageUrl(data.imageUrl);
    setGalleryImageUrls(data.galleryImageUrls ?? []);
    setForm({
      title: data.title,
      shortDescription: data.shortDescription,
      longDescription: data.longDescription ?? "",
      manufacturer: data.manufacturer ?? "",
      subcategory: data.subcategory ?? "",
      categoryId: data.categoryId,
      sortOrder: data.sortOrder,
      priority: data.priority,
      status: data.status,
      amazonLink: data.amazonLink ?? "",
      shopLink: data.shopLink ?? "",
      affiliateLink: data.affiliateLink ?? "",
      isMasterRecommendation: data.isMasterRecommendation,
      masterRecommendationText: data.masterRecommendationText ?? "",
      seoTitle: data.seoTitle ?? "",
      seoDescription: data.seoDescription ?? "",
      linkedCourseIds: data.linkedCourseIds,
      linkedRecipeIds: data.linkedRecipeIds,
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Produkt wirklich löschen?")) return;

    const response = await adminFetch(`/api/admin/werkstatt/produktempfehlungen/${id}`, {
      method: "DELETE",
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await reload();
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Produkte werden geladen …</p>;
  }

  return (
    <div className="space-y-8">
      {analytics && (
        <section className="rounded-xl border border-aw-border p-4">
          <h2 className="font-semibold text-aw-cream">Statistik (Top 10)</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-aw-surface-2 p-3 text-sm">
              <p className="text-aw-muted">Aufrufe</p>
              <p className="text-xl font-bold text-aw-cream">{analytics.totals.views}</p>
            </div>
            <div className="rounded-lg bg-aw-surface-2 p-3 text-sm">
              <p className="text-aw-muted">Amazon-Klicks</p>
              <p className="text-xl font-bold text-aw-cream">{analytics.totals.amazonClicks}</p>
            </div>
            <div className="rounded-lg bg-aw-surface-2 p-3 text-sm">
              <p className="text-aw-muted">Shop-Klicks</p>
              <p className="text-xl font-bold text-aw-cream">{analytics.totals.shopClicks}</p>
            </div>
            <div className="rounded-lg bg-aw-surface-2 p-3 text-sm">
              <p className="text-aw-muted">Affiliate-Klicks</p>
              <p className="text-xl font-bold text-aw-cream">{analytics.totals.affiliateClicks}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-aw-muted">
            {analytics.topProducts.map((product) => (
              <li key={product.id}>
                {product.title} — {product.viewCount} Aufrufe, {product.totalClicks} Klicks
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-aw-border p-4">
        <h2 className="mb-4 font-semibold text-aw-cream">
          {editingId ? "Produkt bearbeiten" : "Neues Produkt"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName}>Titel</label>
            <input
              className={inputClassName}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Kategorie</label>
            <select
              className={inputClassName}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Kurzbeschreibung (max. 250 Zeichen)</label>
            <textarea
              className={textareaClassName}
              rows={2}
              maxLength={250}
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Langbeschreibung</label>
            <textarea
              className={textareaClassName}
              rows={4}
              value={form.longDescription ?? ""}
              onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Hersteller</label>
            <input
              className={inputClassName}
              value={form.manufacturer ?? ""}
              onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Status</label>
            <select
              className={inputClassName}
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as UpsertProductRecommendationInput["status"],
                })
              }
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
          <div>
            <label className={labelClassName}>Amazon-Link / ASIN</label>
            <input
              className={inputClassName}
              value={form.amazonLink ?? ""}
              onChange={(e) => setForm({ ...form, amazonLink: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Shop-Link</label>
            <input
              className={inputClassName}
              value={form.shopLink ?? ""}
              onChange={(e) => setForm({ ...form, shopLink: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Affiliate-Link</label>
            <input
              className={inputClassName}
              value={form.affiliateLink ?? ""}
              onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="checkbox"
                checked={form.isMasterRecommendation ?? false}
                onChange={(e) =>
                  setForm({ ...form, isMasterRecommendation: e.target.checked })
                }
              />
              Empfehlung von Fleischermeister Ralf Hermanski
            </label>
            {form.isMasterRecommendation && (
              <textarea
                className={`${textareaClassName} mt-2`}
                rows={3}
                placeholder="Persönliche Einschätzung …"
                value={form.masterRecommendationText ?? ""}
                onChange={(e) =>
                  setForm({ ...form, masterRecommendationText: e.target.value })
                }
              />
            )}
          </div>

          {editingId ? (
            <div className="md:col-span-2 rounded-xl border border-aw-border/60 bg-aw-surface-2 p-4">
              <h3 className="font-semibold text-aw-cream">Produktbilder</h3>
              <p className="mt-1 text-xs text-aw-muted">
                JPEG, PNG oder WebP — maximal 5 MB pro Bild.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>Hauptbild</label>
                  {imageUrl ? (
                    <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-lg border border-aw-border">
                      <Image
                        src={imageUrl}
                        alt="Produktbild"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-aw-muted">
                      Noch kein Bild — es wird das Kategorie-Standardbild verwendet.
                    </p>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-3 block w-full text-sm text-aw-muted"
                    disabled={uploading}
                    onChange={(event) => void handleMainImageUpload(event)}
                  />
                </div>

                <div>
                  <label className={labelClassName}>Galeriebilder</label>
                  {galleryImageUrls.length > 0 ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {galleryImageUrls.map((url) => (
                        <div
                          key={url}
                          className="relative aspect-square overflow-hidden rounded-lg border border-aw-border"
                        >
                          <Image src={url} alt="" fill className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-aw-muted">Noch keine Galeriebilder.</p>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-3 block w-full text-sm text-aw-muted"
                    disabled={uploading}
                    onChange={(event) => void handleGalleryImageUpload(event)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="md:col-span-2 text-sm text-aw-muted">
              Bilder können hochgeladen werden, sobald das Produkt gespeichert wurde.
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" className={primaryButtonClassName} onClick={() => void handleSave()}>
            {editingId ? "Speichern" : "Anlegen"}
          </button>
          {editingId && (
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => {
                setEditingId(null);
                setImageUrl(null);
                setGalleryImageUrls([]);
                setForm({
                  title: "",
                  shortDescription: "",
                  categoryId: categories[0]?.id ?? "",
                  status: "draft",
                });
              }}
            >
              Abbrechen
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-aw-border p-4">
        <h2 className="mb-4 font-semibold text-aw-cream">Produktliste</h2>
        <ul className="space-y-2">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-aw-border/60 bg-aw-surface-2 p-3 text-sm"
            >
              <div>
                <p className="font-semibold text-aw-cream">{product.title}</p>
                <p className="text-aw-muted">
                  {product.categoryName} · {product.status} · {product.viewCount} Aufrufe
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => void handleEdit(product.id)}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => void handleDelete(product.id)}
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
