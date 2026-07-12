"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type {
  KnowledgeBaseAnalyticsSummary,
  KnowledgeBaseArticleSummary,
  KnowledgeBaseCategoryEntry,
} from "@/lib/knowledge-base/knowledge-base-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminKnowledgeBaseList() {
  const [articles, setArticles] = useState<KnowledgeBaseArticleSummary[]>([]);
  const [categories, setCategories] = useState<KnowledgeBaseCategoryEntry[]>([]);
  const [analytics, setAnalytics] = useState<KnowledgeBaseAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    categoryId: "",
    keywords: "",
    status: "draft",
    sortOrder: 0,
  });

  async function loadArticles() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("status", status);

    if (query.trim()) {
      params.set("q", query.trim());
    }

    const [articlesResponse, categoriesResponse, analyticsResponse] = await Promise.all([
      adminFetch<KnowledgeBaseArticleSummary[]>(
        `/api/admin/knowledge-base/articles?${params.toString()}`,
      ),
      fetch("/api/knowledge-base/categories").then((r) => r.json()) as Promise<{
        success: boolean;
        data?: KnowledgeBaseCategoryEntry[];
      }>,
      adminFetch<KnowledgeBaseAnalyticsSummary>("/api/admin/knowledge-base/analytics"),
    ]);

    if (!articlesResponse.success) {
      setError(articlesResponse.error.message);
      setLoading(false);
      return;
    }

    setArticles(articlesResponse.data);

    if (categoriesResponse.success && categoriesResponse.data) {
      setCategories(categoriesResponse.data);
      if (!form.categoryId && categoriesResponse.data[0]) {
        setForm((current) => ({
          ...current,
          categoryId: categoriesResponse.data![0]!.id,
        }));
      }
    }

    if (analyticsResponse.success) {
      setAnalytics(analyticsResponse.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadArticles();
  }, [status]);

  function resetForm() {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      summary: "",
      content: "",
      categoryId: categories[0]?.id ?? "",
      keywords: "",
      status: "draft",
      sortOrder: 0,
    });
  }

  async function saveArticle() {
    const payload = {
      ...form,
      keywords: form.keywords
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    };

    const response = editingId
      ? await adminFetch(`/api/admin/knowledge-base/articles/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/admin/knowledge-base/articles", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    resetForm();
    await loadArticles();
  }

  async function archiveArticle(id: string) {
    const response = await adminFetch(`/api/admin/knowledge-base/articles/${id}`, {
      method: "DELETE",
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadArticles();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Wissensdatenbank
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            FAQ-Einträge erstellen, bearbeiten und veröffentlichen.
          </p>
        </div>
        <Link href="/admin/support" className={secondaryButtonClassName}>
          Zur Support-Übersicht
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className={inputClassName}
          placeholder="Suche …"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className={inputClassName}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Alle</option>
          <option value="draft">Entwürfe</option>
          <option value="published">Veröffentlicht</option>
          <option value="archived">Archiviert</option>
        </select>
        <button type="button" className={secondaryButtonClassName} onClick={() => void loadArticles()}>
          Suchen
        </button>
      </div>

      {analytics && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Welche Fragen werden am häufigsten gestellt?
          </h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-aw-cream">Meistgesuchte Begriffe</h3>
              <ul className="mt-2 space-y-1 text-sm text-aw-muted">
                {analytics.topSearches.length === 0 && <li>Noch keine Daten</li>}
                {analytics.topSearches.map((entry) => (
                  <li key={entry.query}>
                    {entry.query} ({entry.count})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-aw-cream">Häufigste FAQ-Aufrufe</h3>
              <ul className="mt-2 space-y-1 text-sm text-aw-muted">
                {analytics.topArticles.length === 0 && <li>Noch keine Daten</li>}
                {analytics.topArticles.map((entry) => (
                  <li key={entry.slug}>
                    {entry.title} ({entry.viewCount})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-aw-cream">Ungelöste Suchanfragen</h3>
              <ul className="mt-2 space-y-1 text-sm text-aw-muted">
                {analytics.unresolvedSearches.length === 0 && <li>Keine</li>}
                {analytics.unresolvedSearches.map((entry) => (
                  <li key={entry.query}>
                    {entry.query} ({entry.count})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-aw-cream">Tickets nach FAQ-Besuch</h3>
              <p className="mt-2 text-3xl font-bold text-aw-cream">
                {analytics.ticketCreationsAfterFaq}
              </p>
            </div>
          </div>
        </section>
      )}

      <section id="kategorien" className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">FAQ-Kategorien</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="rounded-full border border-aw-border px-3 py-1 text-xs text-aw-muted"
            >
              {category.name} ({category.articleCount})
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          {editingId ? "FAQ bearbeiten" : "Neuer FAQ-Eintrag"}
        </h2>
        <div className="mt-4 grid gap-4">
          <input
            className={inputClassName}
            placeholder="Titel"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Slug (optional)"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
          />
          <textarea
            className={`${inputClassName} min-h-[80px] w-full`}
            placeholder="Kurzbeschreibung"
            rows={2}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
          />
          <textarea
            className={`${inputClassName} min-h-[200px] w-full`}
            placeholder="Inhalt"
            rows={8}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              className={inputClassName}
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className={inputClassName}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
              <option value="archived">Archiviert</option>
            </select>
          </div>
          <input
            className={inputClassName}
            placeholder="Schlagwörter (kommagetrennt)"
            value={form.keywords}
            onChange={(event) => setForm({ ...form, keywords: event.target.value })}
          />
          <div className="flex gap-3">
            <button type="button" className={primaryButtonClassName} onClick={() => void saveArticle()}>
              Speichern
            </button>
            {editingId && (
              <button type="button" className={secondaryButtonClassName} onClick={resetForm}>
                Abbrechen
              </button>
            )}
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-3">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-aw-muted">
                  {article.categoryName} · {article.status}
                </p>
                <h3 className="mt-1 font-medium text-aw-cream">{article.title}</h3>
                {article.summary && (
                  <p className="mt-2 text-sm text-aw-muted">{article.summary}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingId(article.id);
                    setForm({
                      title: article.title,
                      slug: article.slug,
                      summary: article.summary ?? "",
                      content: "",
                      categoryId: article.categoryId,
                      keywords: article.keywords.join(", "),
                      status: article.status,
                      sortOrder: article.sortOrder,
                    });
                    void adminFetch<KnowledgeBaseArticleSummary & { content: string }>(
                      `/api/admin/knowledge-base/articles/${article.id}`,
                    ).then((response) => {
                      if (response.success) {
                        setForm((current) => ({
                          ...current,
                          content: response.data.content,
                        }));
                      }
                    });
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
                  onClick={() => void archiveArticle(article.id)}
                >
                  Archivieren
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
