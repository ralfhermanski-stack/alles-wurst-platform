"use client";

import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { SupportTemplateEntry } from "@/lib/support/support-types";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminSupportTemplatesManager() {
  const [templates, setTemplates] = useState<SupportTemplateEntry[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const response = await adminFetch<SupportTemplateEntry[]>("/api/admin/support/templates");
    if (response.success) setTemplates(response.data);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createTemplate() {
    const response = await adminFetch<unknown>("/api/admin/support/templates", {
      method: "POST",
      body: JSON.stringify({ title, body }),
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setTitle("");
    setBody("");
    await loadData();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Antwortvorlagen</h1>
      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5 space-y-3">
        <input className={inputClassName} placeholder="Titel" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${inputClassName} min-h-32 w-full`} placeholder="Vorlagentext" value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="text-sm text-aw-warning">{error}</p>}
        <button type="button" className={primaryButtonClassName} onClick={() => void createTemplate()}>Vorlage anlegen</button>
      </section>
      <ul className="space-y-2">
        {templates.map((template) => (
          <li key={template.id} className="rounded-xl border border-aw-border bg-aw-surface/30 p-4">
            <p className="font-medium text-aw-cream">{template.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-aw-muted">{template.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
