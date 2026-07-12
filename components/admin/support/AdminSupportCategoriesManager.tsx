"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { SupportCategoryEntry } from "@/lib/support/support-types";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminSupportCategoriesManager() {
  const [categories, setCategories] = useState<SupportCategoryEntry[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const response = await adminFetch<SupportCategoryEntry[]>("/api/admin/support/categories");
    if (response.success) setCategories(response.data);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createCategory() {
    const response = await adminFetch<unknown>("/api/admin/support/categories", {
      method: "POST",
      body: JSON.stringify({ name, slug, description }),
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setName("");
    setSlug("");
    setDescription("");
    await loadData();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Support-Kategorien</h1>
      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5 space-y-3">
        <input className={inputClassName} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClassName} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input className={inputClassName} placeholder="Beschreibung" value={description} onChange={(e) => setDescription(e.target.value)} />
        {error && <p className="text-sm text-aw-warning">{error}</p>}
        <button type="button" className={primaryButtonClassName} onClick={() => void createCategory()}>Kategorie anlegen</button>
      </section>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="rounded-xl border border-aw-border bg-aw-surface/30 p-4">
            <p className="font-medium text-aw-cream">{category.name}</p>
            <p className="text-xs text-aw-muted">/{category.slug}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
