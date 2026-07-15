"use client";

import { useEffect, useId, useRef, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { ProductRecommendationCategoryEntry } from "@/lib/product-recommendations/product-recommendation-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  dangerButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

const textareaClassName = `${inputClassName} min-h-[72px] resize-y`;

type CategoryDraft = {
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

type AdminProductRecommendationCategoriesPanelProps = {
  onCategoriesChange?: () => void;
};

function emptyDraft(): CategoryDraft {
  return {
    name: "",
    description: "",
    sortOrder: 100,
    isActive: true,
  };
}

export default function AdminProductRecommendationCategoriesPanel({
  onCategoriesChange,
}: AdminProductRecommendationCategoriesPanelProps) {
  const [categories, setCategories] = useState<ProductRecommendationCategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null);
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [imageVersions, setImageVersions] = useState<Record<string, number>>({});
  const [pendingPreviews, setPendingPreviews] = useState<Record<string, string>>({});
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newCategory, setNewCategory] = useState<CategoryDraft>(emptyDraft);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingPreviewUrlsRef = useRef<Set<string>>(new Set());
  const newCategoryInputId = useId();

  async function reload() {
    const response = await adminFetch<ProductRecommendationCategoryEntry[]>(
      "/api/admin/werkstatt/produktempfehlungen/categories",
    );

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setCategories(response.data);
    setDrafts(
      Object.fromEntries(
        response.data.map((category) => [
          category.id,
          {
            name: category.name,
            description: category.description ?? "",
            sortOrder: category.sortOrder,
            isActive: category.isActive,
          },
        ]),
      ),
    );
    onCategoriesChange?.();
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    return () => {
      for (const previewUrl of pendingPreviewUrlsRef.current) {
        URL.revokeObjectURL(previewUrl);
      }

      pendingPreviewUrlsRef.current.clear();
    };
  }, []);

  function clearPendingPreview(categoryId: string) {
    setPendingPreviews((current) => {
      const previewUrl = current[categoryId];

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        pendingPreviewUrlsRef.current.delete(previewUrl);
      }

      const next = { ...current };
      delete next[categoryId];
      return next;
    });
  }

  function updateDraft(categoryId: string, patch: Partial<CategoryDraft>) {
    setDrafts((current) => ({
      ...current,
      [categoryId]: { ...current[categoryId], ...patch },
    }));
  }

  async function handleSaveCategory(categoryId: string) {
    const draft = drafts[categoryId];

    if (!draft?.name.trim()) {
      setError("Kategoriename ist erforderlich.");
      return;
    }

    setSavingCategoryId(categoryId);
    setError(null);

    const response = await adminFetch<ProductRecommendationCategoryEntry>(
      "/api/admin/werkstatt/produktempfehlungen/categories",
      {
        method: "POST",
        body: JSON.stringify({
          id: categoryId,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          sortOrder: draft.sortOrder,
          isActive: draft.isActive,
        }),
      },
    );

    setSavingCategoryId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setEditingCategoryId(null);
    await reload();
  }

  async function handleCreateCategory() {
    if (!newCategory.name.trim()) {
      setError("Name für die neue Kategorie ist erforderlich.");
      return;
    }

    setCreatingCategory(true);
    setError(null);

    const response = await adminFetch<ProductRecommendationCategoryEntry>(
      "/api/admin/werkstatt/produktempfehlungen/categories",
      {
        method: "POST",
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null,
          sortOrder: newCategory.sortOrder,
          isActive: newCategory.isActive,
        }),
      },
    );

    setCreatingCategory(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setNewCategory(emptyDraft());
    await reload();
  }

  async function handleUploadPlaceholder(categoryId: string, file: File) {
    setUploadingCategoryId(categoryId);
    setError(null);
    setImageLoadErrors((current) => ({ ...current, [categoryId]: false }));

    clearPendingPreview(categoryId);
    const localPreviewUrl = URL.createObjectURL(file);
    pendingPreviewUrlsRef.current.add(localPreviewUrl);
    setPendingPreviews((current) => ({
      ...current,
      [categoryId]: localPreviewUrl,
    }));

    const formData = new FormData();
    formData.set("categoryId", categoryId);
    formData.set("file", file);

    const response = await adminFetch<{ storageKey: string }>(
      "/api/admin/werkstatt/produktempfehlungen/categories/placeholder",
      { method: "POST", body: formData },
    );

    setUploadingCategoryId(null);

    if (!response.success) {
      clearPendingPreview(categoryId);
      setError(response.error.message);
      return;
    }

    if (!response.data.storageKey) {
      clearPendingPreview(categoryId);
      setError("Bild-Upload fehlgeschlagen — keine Speicherreferenz vom Server.");
      return;
    }

    const serverPreviewUrl = `/api/werkstatt/empfehlungen/images/category/${categoryId}`;

    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              hasCustomPlaceholderImage: true,
              placeholderImageUrl: serverPreviewUrl,
            }
          : category,
      ),
    );

    setImageVersions((current) => ({
      ...current,
      [categoryId]: (current[categoryId] ?? 0) + 1,
    }));

    await reload();
  }

  function handlePreviewLoad(categoryId: string, src: string) {
    if (!src.startsWith("blob:")) {
      clearPendingPreview(categoryId);
      setImageLoadErrors((current) => ({ ...current, [categoryId]: false }));
    }
  }

  function handlePreviewError(categoryId: string, src: string, categoryName: string) {
    if (src.startsWith("blob:")) {
      return;
    }

    setImageLoadErrors((current) => ({
      ...current,
      [categoryId]: true,
    }));
    setError(`Vorschaubild für „${categoryName}“ konnte nicht geladen werden.`);
  }

  async function handleDeleteCategory(category: ProductRecommendationCategoryEntry) {
    if (category.isSystemCategory) {
      setError("System-Kategorien können nicht gelöscht werden.");
      return;
    }

    if (category.productCount > 0) {
      setError(
        `„${category.name}“ hat noch ${category.productCount} Produkt(e) — zuerst verschieben oder löschen.`,
      );
      return;
    }

    if (
      !window.confirm(
        `Kategorie „${category.name}“ endgültig löschen? Dies kann nicht rückgängig gemacht werden.`,
      )
    ) {
      return;
    }

    setDeletingCategoryId(category.id);
    setError(null);

    const response = await adminFetch<{ deleted: boolean }>(
      `/api/admin/werkstatt/produktempfehlungen/categories?categoryId=${category.id}&action=category`,
      { method: "DELETE" },
    );

    setDeletingCategoryId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    if (editingCategoryId === category.id) {
      setEditingCategoryId(null);
    }

    clearPendingPreview(category.id);
    await reload();
  }

  async function handleResetPlaceholder(categoryId: string) {
    if (
      !window.confirm(
        "Eigenes Kategorie-Bild entfernen und wieder den System-Standard verwenden?",
      )
    ) {
      return;
    }

    setUploadingCategoryId(categoryId);
    setError(null);

    const response = await adminFetch<ProductRecommendationCategoryEntry>(
      `/api/admin/werkstatt/produktempfehlungen/categories?categoryId=${categoryId}&action=placeholder`,
      { method: "DELETE" },
    );

    setUploadingCategoryId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setImageVersions((current) => ({
      ...current,
      [categoryId]: (current[categoryId] ?? 0) + 1,
    }));
    await reload();
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Kategorien werden geladen …</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-aw-border bg-aw-surface-2/40 p-4">
        <h2 className="font-semibold text-aw-cream">Kategorie-Standardbilder</h2>
        <p className="mt-1 text-sm text-aw-muted">
          Produkte ohne eigenes Bild zeigen das Standardbild ihrer Kategorie. Ohne
          Upload wird das generische System-Platzhalterbild verwendet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const draft = drafts[category.id];
          const isEditing = editingCategoryId === category.id;
          const isBusy =
            uploadingCategoryId === category.id ||
            savingCategoryId === category.id ||
            deletingCategoryId === category.id;
          const canDeleteCategory =
            !category.isSystemCategory && category.productCount === 0;
          const previewUrl = pendingPreviews[category.id]
            ?? (category.placeholderImageUrl
              ? `${category.placeholderImageUrl}?v=${imageVersions[category.id] ?? 0}`
              : null);
          const previewFailed = imageLoadErrors[category.id];

          return (
            <article
              key={category.id}
              className="flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface"
            >
              <div className="relative aspect-[4/3] bg-aw-surface-2">
                {previewUrl && !previewFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${category.id}-${imageVersions[category.id] ?? 0}-${pendingPreviews[category.id] ? "local" : "remote"}`}
                    src={previewUrl}
                    alt={`Standardbild ${category.name}`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onLoad={(event) =>
                      handlePreviewLoad(category.id, event.currentTarget.src)
                    }
                    onError={(event) =>
                      handlePreviewError(
                        category.id,
                        event.currentTarget.src,
                        category.name,
                      )
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-aw-muted">
                    {previewFailed ? "Vorschaubild konnte nicht geladen werden" : "Kein Vorschaubild"}
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    category.hasCustomPlaceholderImage
                      ? "bg-aw-gold/90 text-aw-surface"
                      : "bg-aw-surface/90 text-aw-muted"
                  }`}
                >
                  {category.hasCustomPlaceholderImage ? "Eigenes Bild" : "System-Standard"}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                {isEditing && draft ? (
                  <div className="space-y-3">
                    <div>
                      <label className={labelClassName}>Name</label>
                      <input
                        className={`${inputClassName} mt-1`}
                        value={draft.name}
                        onChange={(e) =>
                          updateDraft(category.id, { name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClassName}>Beschreibung</label>
                      <textarea
                        className={`${textareaClassName} mt-1`}
                        rows={2}
                        value={draft.description}
                        onChange={(e) =>
                          updateDraft(category.id, { description: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClassName}>Sortierung</label>
                        <input
                          type="number"
                          className={`${inputClassName} mt-1`}
                          value={draft.sortOrder}
                          onChange={(e) =>
                            updateDraft(category.id, {
                              sortOrder: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-aw-cream">
                          <input
                            type="checkbox"
                            checked={draft.isActive}
                            onChange={(e) =>
                              updateDraft(category.id, { isActive: e.target.checked })
                            }
                          />
                          Aktiv
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-aw-cream">{category.name}</h3>
                    <p className="mt-1 text-xs text-aw-muted">
                      {category.productCount} Produkt
                      {category.productCount === 1 ? "" : "e"}
                      {!category.isActive ? " · inaktiv" : ""}
                      {category.isSystemCategory ? " · System-Kategorie" : ""}
                    </p>
                    {category.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-aw-muted">
                        {category.description}
                      </p>
                    )}
                  </>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    ref={(element) => {
                      fileInputRefs.current[category.id] = element;
                    }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    disabled={isBusy}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void handleUploadPlaceholder(category.id, file);
                      }

                      event.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    className={primaryButtonClassName}
                    disabled={isBusy}
                    onClick={() => fileInputRefs.current[category.id]?.click()}
                  >
                    {uploadingCategoryId === category.id
                      ? "Wird hochgeladen …"
                      : category.hasCustomPlaceholderImage
                        ? "Bild ersetzen"
                        : "Bild hochladen"}
                  </button>

                  {category.hasCustomPlaceholderImage && (
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={isBusy}
                      onClick={() => void handleResetPlaceholder(category.id)}
                    >
                      Standard
                    </button>
                  )}

                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={isBusy}
                        onClick={() => void handleSaveCategory(category.id)}
                      >
                        {savingCategoryId === category.id ? "Speichert …" : "Speichern"}
                      </button>
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={isBusy}
                        onClick={() => setEditingCategoryId(null)}
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={isBusy}
                      onClick={() => setEditingCategoryId(category.id)}
                    >
                      Bearbeiten
                    </button>
                  )}

                  {canDeleteCategory && (
                    <button
                      type="button"
                      className={dangerButtonClassName}
                      disabled={isBusy}
                      onClick={() => void handleDeleteCategory(category)}
                    >
                      {deletingCategoryId === category.id ? "Wird gelöscht …" : "Löschen"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-xl border border-aw-border p-4">
        <h2 className="font-semibold text-aw-cream">Neue Kategorie</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor={newCategoryInputId}>
              Name
            </label>
            <input
              id={newCategoryInputId}
              className={`${inputClassName} mt-1`}
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory((current) => ({ ...current, name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelClassName}>Sortierung</label>
            <input
              type="number"
              className={`${inputClassName} mt-1`}
              value={newCategory.sortOrder}
              onChange={(e) =>
                setNewCategory((current) => ({
                  ...current,
                  sortOrder: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClassName}>Beschreibung</label>
            <textarea
              className={`${textareaClassName} mt-1`}
              rows={2}
              value={newCategory.description}
              onChange={(e) =>
                setNewCategory((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <button
          type="button"
          className={`${primaryButtonClassName} mt-4`}
          disabled={creatingCategory}
          onClick={() => void handleCreateCategory()}
        >
          {creatingCategory ? "Wird angelegt …" : "Kategorie anlegen"}
        </button>
      </section>
    </div>
  );
}
