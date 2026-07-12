"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import type {
  KnowledgeBaseArticleSummary,
  KnowledgeBaseCategoryEntry,
} from "@/lib/knowledge-base/knowledge-base-types";

type KnowledgeBaseBrowserProps = {
  initialArticles: KnowledgeBaseArticleSummary[];
  categories: KnowledgeBaseCategoryEntry[];
  searchPlaceholder: string;
  noResultsTitle: string;
  noResultsDescription: string;
  createTicketLabel: string;
};

export default function KnowledgeBaseBrowser({
  initialArticles,
  categories,
  searchPlaceholder,
  noResultsTitle,
  noResultsDescription,
  createTicketLabel,
}: KnowledgeBaseBrowserProps) {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [articles, setArticles] = useState(initialArticles);
  const [loading, setLoading] = useState(false);

  const ticketHref = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("subject", `Hilfe: ${query.trim().slice(0, 80)}`);
    }

    params.set("fromFaq", "1");

    const suffix = params.toString();

    return `/account/tickets/new?${suffix}`;
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);

        const params = new URLSearchParams();

        if (query.trim()) {
          params.set("q", query.trim());
        }

        if (categorySlug) {
          params.set("category", categorySlug);
        }

        const response = await fetch(`/api/knowledge-base/articles?${params.toString()}`);
        const json = (await response.json()) as {
          success: boolean;
          data?: { articles: KnowledgeBaseArticleSummary[] };
        };

        if (json.success && json.data) {
          setArticles(json.data.articles);
        }

        setLoading(false);
      })();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, categorySlug]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <label htmlFor="kb-search" className="sr-only">
          Suche
        </label>
        <input
          id="kb-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className={`${inputClassName} text-base`}
          autoComplete="off"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-xs ${categorySlug === "" ? "bg-aw-gold text-aw-bg" : "border border-aw-border text-aw-muted"}`}
            onClick={() => setCategorySlug("")}
          >
            Alle
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${categorySlug === category.slug ? "bg-aw-gold text-aw-bg" : "border border-aw-border text-aw-muted"}`}
              onClick={() => setCategorySlug(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-aw-muted">Suche läuft …</p>}

      <div className="grid gap-4">
        {articles.map((article) => (
          <article
            key={article.id}
            className="rounded-2xl border border-aw-border bg-aw-surface/60 p-6"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-aw-gold">
              {article.categoryName}
            </p>
            <h2 className="mt-2 font-display text-xl font-bold text-aw-cream">
              <Link href={`/hilfe/wissen/${article.slug}`} className="hover:text-aw-gold">
                {article.title}
              </Link>
            </h2>
            {article.summary && (
              <p className="mt-2 text-sm leading-6 text-aw-muted">{article.summary}</p>
            )}
          </article>
        ))}
      </div>

      {!loading && articles.length === 0 && (
        <div className="rounded-2xl border border-aw-border bg-aw-surface/40 p-8 text-center">
          <h3 className="font-display text-xl font-bold text-aw-cream">{noResultsTitle}</h3>
          <p className="mt-3 text-sm leading-6 text-aw-muted">{noResultsDescription}</p>
          <Link href={ticketHref} className={`${primaryButtonClassName} mt-6 inline-flex`}>
            {createTicketLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
