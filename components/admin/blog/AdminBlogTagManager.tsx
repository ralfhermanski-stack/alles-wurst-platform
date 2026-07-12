"use client";

import { useEffect, useState } from "react";

import { listBlogTagsApi, upsertBlogTagApi } from "@/lib/blog/blog-client";
import type { BlogTagEntry } from "@/lib/blog/blog-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminBlogTagManager() {
  const [tags, setTags] = useState<BlogTagEntry[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadTags() {
    const response = await listBlogTagsApi();

    if (response.success) {
      setTags(response.data);
    }
  }

  useEffect(() => {
    void loadTags();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await upsertBlogTagApi(name);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setName("");
    await loadTags();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Schlagwörter</h1>

      <form onSubmit={(event) => void handleCreate(event)} className="mt-6 flex gap-2">
        <input className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} placeholder="Neues Schlagwort" required />
        <button type="submit" className={primaryButtonClassName}>Anlegen</button>
      </form>

      {error && <p className="mt-3 text-sm text-aw-warning">{error}</p>}

      <ul className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.id} className="rounded-full border border-aw-border px-3 py-1 text-sm text-aw-cream">
            {tag.name}
            {tag.postCount !== undefined && (
              <span className="ml-2 text-aw-muted">({tag.postCount})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
