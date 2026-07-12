"use client";

import { useEffect, useState } from "react";

import { createBlogCategoryApi, listBlogCategoriesApi } from "@/lib/blog/blog-client";
import type { BlogCategoryEntry } from "@/lib/blog/blog-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminBlogCategoryManager() {
  const [categories, setCategories] = useState<BlogCategoryEntry[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    const response = await listBlogCategoriesApi();

    if (response.success) {
      setCategories(response.data);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await createBlogCategoryApi({
      name,
      description: description || null,
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setName("");
    setDescription("");
    await loadCategories();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Blog-Kategorien</h1>

      <form onSubmit={(event) => void handleCreate(event)} className="mt-6 space-y-4 rounded-xl border border-aw-border p-5">
        <div>
          <label className={labelClassName}>Name</label>
          <input className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className={labelClassName}>Beschreibung</label>
          <textarea className={inputClassName} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="text-sm text-aw-warning">{error}</p>}
        <button type="submit" className={primaryButtonClassName}>Kategorie anlegen</button>
      </form>

      <ul className="mt-8 space-y-2">
        {categories.map((category) => (
          <li key={category.id} className="rounded-lg border border-aw-border px-4 py-3 text-sm text-aw-cream">
            {category.name} <span className="text-aw-muted">/{category.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
