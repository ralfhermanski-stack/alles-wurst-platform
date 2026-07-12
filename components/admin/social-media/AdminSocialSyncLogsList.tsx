"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_SYNC_STATUS_LABELS,
} from "@/lib/social-media/social-media-types";
import type { SocialMediaChannelEntry } from "@/lib/social-media/social-media-types";
import type { SocialMediaSyncLogEntry } from "@/lib/social-media/social-media-types";
import {
  inputClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminSocialSyncLogsList() {
  const [channels, setChannels] = useState<SocialMediaChannelEntry[]>([]);
  const [logs, setLogs] = useState<SocialMediaSyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (channelFilter !== "all") {
      params.set("channelId", channelFilter);
    }
    params.set("limit", "100");

    const [channelsResponse, logsResponse] = await Promise.all([
      adminFetch<SocialMediaChannelEntry[]>("/api/admin/social-media/channels"),
      adminFetch<SocialMediaSyncLogEntry[]>(
        `/api/admin/social-media/sync-logs?${params.toString()}`,
      ),
    ]);

    if (!channelsResponse.success) {
      setError(channelsResponse.error.message);
      setLoading(false);
      return;
    }

    if (!logsResponse.success) {
      setError(logsResponse.error.message);
      setLoading(false);
      return;
    }

    setChannels(channelsResponse.data);
    setLogs(logsResponse.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, [channelFilter]);

  function channelName(channelId: string | null): string {
    if (!channelId) {
      return "—";
    }

    return channels.find((entry) => entry.id === channelId)?.name ?? channelId;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Sync-Protokoll
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Verlauf der Social-Media-Synchronisierungen.
          </p>
        </div>
        <Link
          href="/admin/marketing/social-media"
          className={secondaryButtonClassName}
        >
          Zur Übersicht
        </Link>
      </div>

      <select
        className={inputClassName}
        value={channelFilter}
        onChange={(event) => setChannelFilter(event.target.value)}
      >
        <option value="all">Alle Kanäle</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.name}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-3">
        {logs.map((log) => (
          <article
            key={log.id}
            className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-aw-muted">
                  {log.platform ? SOCIAL_PLATFORM_LABELS[log.platform] : "—"} ·{" "}
                  {SOCIAL_SYNC_STATUS_LABELS[log.status]} · {log.triggeredBy}
                </p>
                <h3 className="mt-1 font-medium text-aw-cream">
                  {channelName(log.channelId)}
                </h3>
                <p className="mt-1 text-sm text-aw-muted">
                  {new Date(log.startedAt).toLocaleString("de-DE")}
                  {log.finishedAt &&
                    ` – ${new Date(log.finishedAt).toLocaleString("de-DE")}`}
                </p>
                <p className="mt-2 text-xs text-aw-muted">
                  Gefunden: {log.foundCount} · Neu: {log.createdCount} · Aktualisiert:{" "}
                  {log.updatedCount} · Übersprungen: {log.skippedCount}
                </p>
                {log.errorMessage && (
                  <p className="mt-2 text-sm text-aw-warning">{log.errorMessage}</p>
                )}
              </div>
            </div>
          </article>
        ))}
        {logs.length === 0 && !loading && (
          <p className="text-sm text-aw-muted">Noch keine Sync-Einträge.</p>
        )}
      </div>
    </div>
  );
}
