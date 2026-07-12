"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  deleteBlogPostApi,
  listAdminBlogPostsApi,
  publishBlogPostApi,
} from "@/lib/blog/blog-client";
import { BLOG_STATUS_LABELS } from "@/lib/blog/blog-types";
import type { BlogPostSummary } from "@/lib/blog/blog-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminBlogList() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [staleOnly, setStaleOnly] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadPosts() {
    setLoading(true);
    setError(null);

    const response = await listAdminBlogPostsApi({
      status,
      query: query.trim() || undefined,
      staleOnly,
    });

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setPosts(response.data);
  }

  useEffect(() => {
    void loadPosts();
  }, [status, staleOnly]);

  async function handlePublish(postId: string) {
    setActionId(postId);
    const response = await publishBlogPostApi(postId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadPosts();
  }

  async function handleDelete(postId: string) {
    if (!window.confirm("Artikel wirklich löschen?")) {
      return;
    }

    setActionId(postId);
    const response = await deleteBlogPostApi(postId);
    setActionId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadPosts();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">Magazin</h1>
          <p className="mt-1 text-sm text-aw-muted">
            Blogartikel erstellen, optimieren und veröffentlichen.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/magazin/kategorien" className={secondaryButtonClassName}>
            Kategorien
          </Link>
          <Link href="/admin/magazin/schlagwoerter" className={secondaryButtonClassName}>
            Schlagwörter
          </Link>
          <Link href="/admin/magazin/neu" className={primaryButtonClassName}>
            Neuer Artikel
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className={inputClassName}
            placeholder="Suche Titel, Slug, Keyword …"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadPosts();
              }
            }}
          />
          <select
            className={inputClassName}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Alle Status</option>
            {Object.entries(BLOG_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-md border border-aw-border px-3 py-2 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={staleOnly}
              onChange={(event) => setStaleOnly(event.target.checked)}
            />
            Nur veraltete Artikel (&gt;12 Monate)
          </label>
        </div>
      </section>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-aw-muted">Wird geladen …</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Artikel</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Kategorie</th>
                <th className="px-4 py-3 font-semibold">Autor</th>
                <th className="px-4 py-3 font-semibold">Veröffentlicht</th>
                <th className="px-4 py-3 font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border bg-aw-surface/30">
              {posts.map((post) => (
                <tr key={post.id} className={post.isStale ? "bg-amber-500/5" : ""}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/magazin/${post.id}`}
                      className="font-medium text-aw-cream hover:text-aw-gold"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-xs text-aw-muted">/{post.slug}</p>
                    {post.isStale && (
                      <p className="mt-1 text-xs text-amber-400">
                        Fachlich prüfen — älter als 12 Monate
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {BLOG_STATUS_LABELS[post.status]}
                  </td>
                  <td className="px-4 py-3 text-aw-muted">{post.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-aw-muted">{post.authorDisplayName}</td>
                  <td className="px-4 py-3 text-aw-muted">
                    {post.publishedAt
                      ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
                          new Date(post.publishedAt),
                        )
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() => router.push(`/admin/magazin/${post.id}`)}
                      >
                        Bearbeiten
                      </button>
                      {post.status !== "published" && (
                        <button
                          type="button"
                          disabled={actionId === post.id}
                          className={primaryButtonClassName}
                          onClick={() => void handlePublish(post.id)}
                        >
                          Veröffentlichen
                        </button>
                      )}
                      <a
                        href={`/magazin/${post.slug}?preview=${post.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className={secondaryButtonClassName}
                      >
                        Vorschau
                      </a>
                      <button
                        type="button"
                        disabled={actionId === post.id}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10"
                        onClick={() => void handleDelete(post.id)}
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <p className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
          Keine Artikel gefunden.
        </p>
      )}
    </div>
  );
}
