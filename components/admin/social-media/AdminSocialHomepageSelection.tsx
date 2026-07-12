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

export default function AdminSocialHomepageSelection() {
  const [channels, setChannels] = useState<SocialMediaChannelEntry[]>([]);
  const [posts, setPosts] = useState<SocialMediaPostEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [channelsResponse, postsResponse] = await Promise.all([
      adminFetch<SocialMediaChannelEntry[]>("/api/admin/social-media/channels"),
      adminFetch<SocialMediaPostEntry[]>("/api/admin/social-media/posts?active=true"),
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
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function updateChannel(
    channelId: string,
    patch: Partial<{
      showOnHomepage: boolean;
      displayOrder: number;
      featuredPostId: string | null;
    }>,
  ) {
    setSavingId(channelId);
    const response = await adminFetch(`/api/admin/social-media/channels/${channelId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setSavingId(null);

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    setSuccess("Startseiten-Einstellungen gespeichert.");
    await loadData();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">Startseite</h1>
          <p className="mt-1 text-sm text-aw-muted">
            Kanäle und Highlight-Beiträge für die Startseite auswählen.
          </p>
        </div>
        <Link
          href="/admin/marketing/social-media"
          className={secondaryButtonClassName}
        >
          Zur Übersicht
        </Link>
      </div>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-4">
        {channels.map((channel) => {
          const channelPosts = posts.filter((post) => post.channelId === channel.id);

          return (
            <section
              key={channel.id}
              className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
            >
              <h2 className="font-display text-lg font-bold text-aw-cream">
                {SOCIAL_PLATFORM_LABELS[channel.platform]} – {channel.name}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-aw-muted">
                  <input
                    type="checkbox"
                    checked={channel.showOnHomepage}
                    onChange={(event) =>
                      void updateChannel(channel.id, {
                        showOnHomepage: event.target.checked,
                      })
                    }
                  />
                  Auf Startseite anzeigen
                </label>
                <div className="flex gap-2">
                  <input
                    className={inputClassName}
                    type="number"
                    defaultValue={channel.displayOrder}
                    onBlur={(event) => {
                      const value = Number(event.target.value) || 0;
                      if (value !== channel.displayOrder) {
                        void updateChannel(channel.id, { displayOrder: value });
                      }
                    }}
                  />
                  <span className="self-center text-xs text-aw-muted">Reihenfolge</span>
                </div>
                <select
                  className={`${inputClassName} sm:col-span-2`}
                  value={channel.featuredPostId ?? ""}
                  disabled={savingId === channel.id}
                  onChange={(event) =>
                    void updateChannel(channel.id, {
                      featuredPostId: event.target.value || null,
                    })
                  }
                >
                  <option value="">Kein Highlight-Beitrag</option>
                  {channelPosts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.title ?? post.permalink ?? post.id}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className={`${primaryButtonClassName} mt-4`}
                disabled={savingId === channel.id}
                onClick={() => void loadData()}
              >
                Aktualisieren
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
