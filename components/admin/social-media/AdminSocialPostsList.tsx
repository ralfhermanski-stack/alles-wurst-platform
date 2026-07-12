"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/social-media/social-media-types";
import type { SocialMediaChannelEntry } from "@/lib/social-media/social-media-types";
import type { SocialMediaPostEntry } from "@/lib/social-media/social-media-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

import type { SocialMediaPostType } from "@prisma/client";

const POST_TYPES: SocialMediaPostType[] = [
  "POST",
  "IMAGE",
  "VIDEO",
  "REEL",
  "SHORT",
  "LIVE",
  "CAROUSEL",
];

const EMPTY_FORM: {
  channelId: string;
  title: string;
  content: string;
  postType: SocialMediaPostType;
  permalink: string;
  tags: string;
  active: boolean;
  featured: boolean;
  showOnHomepage: boolean;
} = {
  channelId: "",
  title: "",
  content: "",
  postType: "POST",
  permalink: "",
  tags: "",
  active: true,
  featured: false,
  showOnHomepage: false,
};

export default function AdminSocialPostsList() {
  const [channels, setChannels] = useState<SocialMediaChannelEntry[]>([]);
  const [posts, setPosts] = useState<SocialMediaPostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (channelFilter !== "all") {
      params.set("channelId", channelFilter);
    }

    const [channelsResponse, postsResponse] = await Promise.all([
      adminFetch<SocialMediaChannelEntry[]>("/api/admin/social-media/channels"),
      adminFetch<SocialMediaPostEntry[]>(
        `/api/admin/social-media/posts?${params.toString()}`,
      ),
    ]);

    if (!channelsResponse.success) {
      setError(channelsResponse.error.message);
      setLoading(false);
      return;
    }

    if (!postsResponse.success) {
      setError(postsResponse.error.message);
      setLoading(false);
      return;
    }

    setChannels(channelsResponse.data);
    setPosts(postsResponse.data);

    if (!form.channelId && channelsResponse.data[0]) {
      setForm((current) => ({ ...current, channelId: channelsResponse.data[0]!.id }));
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, [channelFilter]);

  async function savePost() {
    const payload = {
      ...form,
      title: form.title.trim() || null,
      content: form.content.trim() || null,
      permalink: form.permalink.trim() || null,
      tags: form.tags
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    };

    const response = editingId
      ? await adminFetch(`/api/admin/social-media/posts/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/admin/social-media/posts", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setForm({ ...EMPTY_FORM, channelId: form.channelId });
    setEditingId(null);
    await loadData();
  }

  async function deletePost(id: string) {
    if (!window.confirm("Beitrag wirklich löschen?")) {
      return;
    }

    const response = await adminFetch(`/api/admin/social-media/posts/${id}`, {
      method: "DELETE",
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await loadData();
  }

  function channelName(channelId: string): string {
    return channels.find((entry) => entry.id === channelId)?.name ?? channelId;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">Beiträge</h1>
          <p className="mt-1 text-sm text-aw-muted">
            Manuelle Beiträge verwalten und Homepage-Inhalte kuratieren.
          </p>
        </div>
        <Link
          href="/admin/marketing/social-media"
          className={secondaryButtonClassName}
        >
          Zur Übersicht
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className={inputClassName}
          value={channelFilter}
          onChange={(event) => setChannelFilter(event.target.value)}
        >
          <option value="all">Alle Kanäle</option>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {SOCIAL_PLATFORM_LABELS[channel.platform]} – {channel.name}
            </option>
          ))}
        </select>
      </div>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          {editingId ? "Beitrag bearbeiten" : "Neuer Beitrag"}
        </h2>
        <div className="mt-4 grid gap-4">
          <select
            className={inputClassName}
            value={form.channelId}
            onChange={(event) => setForm({ ...form, channelId: event.target.value })}
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
          <select
            className={inputClassName}
            value={form.postType}
            onChange={(event) =>
              setForm({
                ...form,
                postType: event.target.value as typeof form.postType,
              })
            }
          >
            {POST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            className={inputClassName}
            placeholder="Titel"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <textarea
            className={`${inputClassName} min-h-[100px]`}
            placeholder="Inhalt"
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Permalink"
            value={form.permalink}
            onChange={(event) => setForm({ ...form, permalink: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Tags (kommagetrennt)"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
              />
              Aktiv
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm({ ...form, featured: event.target.checked })}
              />
              Hervorgehoben
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-muted">
              <input
                type="checkbox"
                checked={form.showOnHomepage}
                onChange={(event) =>
                  setForm({ ...form, showOnHomepage: event.target.checked })
                }
              />
              Auf Startseite
            </label>
          </div>
          <button type="button" className={primaryButtonClassName} onClick={() => void savePost()}>
            Speichern
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-aw-muted">
                  {channelName(post.channelId)} · {post.postType} ·{" "}
                  {post.sourceType}
                </p>
                <h3 className="mt-1 font-medium text-aw-cream">
                  {post.title ?? "Ohne Titel"}
                </h3>
                {post.publishedAt && (
                  <p className="mt-1 text-xs text-aw-muted">
                    {new Date(post.publishedAt).toLocaleString("de-DE")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingId(post.id);
                    setForm({
                      channelId: post.channelId,
                      title: post.title ?? "",
                      content: post.content ?? "",
                      postType: post.postType,
                      permalink: post.permalink ?? "",
                      tags: post.tags.join(", "),
                      active: post.active,
                      featured: post.featured,
                      showOnHomepage: post.showOnHomepage,
                    });
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
                  onClick={() => void deletePost(post.id)}
                >
                  Löschen
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
