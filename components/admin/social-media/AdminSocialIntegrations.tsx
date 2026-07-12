"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  SOCIAL_INTEGRATION_MODE_LABELS,
  SOCIAL_PLATFORM_LABELS,
} from "@/lib/social-media/social-media-types";
import type { SocialMediaChannelEntry } from "@/lib/social-media/social-media-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import AdminYouTubeConnectionPanel from "@/components/admin/social-media/AdminYouTubeConnectionPanel";

const CREDENTIAL_FIELDS: Record<string, { type: string; label: string }[]> = {
  YOUTUBE: [
    { type: "api_key", label: "YouTube API-Key" },
    { type: "playlist_id", label: "Upload-Playlist-ID (optional)" },
  ],
  INSTAGRAM: [
    { type: "access_token", label: "Access Token" },
    { type: "account_id", label: "Account-ID" },
  ],
  FACEBOOK: [
    { type: "page_access_token", label: "Page Access Token" },
    { type: "page_id", label: "Page-ID" },
  ],
  TIKTOK: [
    { type: "access_token", label: "Access Token" },
    { type: "open_id", label: "Open ID" },
  ],
};

export default function AdminSocialIntegrations() {
  const [channels, setChannels] = useState<SocialMediaChannelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function loadChannels() {
    setLoading(true);
    const response = await adminFetch<SocialMediaChannelEntry[]>(
      "/api/admin/social-media/channels",
    );

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setChannels(response.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadChannels();
  }, []);

  async function saveCredential(channelId: string, credentialType: string) {
    const key = `${channelId}:${credentialType}`;
    const value = values[key]?.trim();

    if (!value) {
      setError("Bitte einen Wert eingeben.");
      return;
    }

    setSavingKey(key);
    const response = await adminFetch(
      `/api/admin/social-media/channels/${channelId}/credentials`,
      {
        method: "POST",
        body: JSON.stringify({ credentialType, value }),
      },
    );
    setSavingKey(null);

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    setValues((current) => ({ ...current, [key]: "" }));
    setSuccess("Zugangsdaten gespeichert (verschlüsselt).");
    setError(null);
  }

  const apiChannels = channels.filter(
    (channel) => channel.integrationMode === "API" && channel.active,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Schnittstellen
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            API-Zugangsdaten pro Kanal hinterlegen (werden verschlüsselt gespeichert).
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

      {apiChannels.length === 0 && !loading && (
        <p className="text-sm text-aw-muted">
          Keine aktiven Kanäle im API-Modus. Bitte unter „Kanäle“ einen Kanal mit
          Integration „API-Sync“ anlegen.
        </p>
      )}

      <div className="space-y-4">
        {apiChannels.map((channel) => {
          const fields = CREDENTIAL_FIELDS[channel.platform] ?? [
            { type: "access_token", label: "Access Token" },
          ];

          return (
            <section
              key={channel.id}
              className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
            >
              <h2 className="font-display text-lg font-bold text-aw-cream">
                {SOCIAL_PLATFORM_LABELS[channel.platform]} – {channel.name}
              </h2>
              <p className="mt-1 text-xs text-aw-muted">
                {SOCIAL_INTEGRATION_MODE_LABELS[channel.integrationMode]}
              </p>
              <div className="mt-4 space-y-3">
                {fields.map((field) => {
                  const key = `${channel.id}:${field.type}`;
                  return (
                    <div key={field.type} className="flex flex-wrap gap-2">
                      <input
                        className={`${inputClassName} min-w-[200px] flex-1`}
                        type="password"
                        placeholder={field.label}
                        value={values[key] ?? ""}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className={primaryButtonClassName}
                        disabled={savingKey === key}
                        onClick={() =>
                          void saveCredential(channel.id, field.type)
                        }
                      >
                        {savingKey === key ? "Speichern …" : "Speichern"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {channel.platform === "YOUTUBE" && (
                <AdminYouTubeConnectionPanel channel={channel} />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
