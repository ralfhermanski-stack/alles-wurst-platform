"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  SOCIAL_CONNECTION_STATUS_LABELS,
  SOCIAL_INTEGRATION_MODE_LABELS,
  SOCIAL_PLATFORM_LABELS,
} from "@/lib/social-media/social-media-types";
import type { SocialMediaChannelEntry } from "@/lib/social-media/social-media-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

import type {
  SocialMediaIntegrationMode,
  SocialMediaPlatform,
} from "@prisma/client";
const PLATFORMS: SocialMediaPlatform[] = ["YOUTUBE", "INSTAGRAM", "FACEBOOK", "TIKTOK"];
const INTEGRATION_MODES: SocialMediaIntegrationMode[] = [
  "MANUAL",
  "API",
  "EMBED",
  "DISABLED",
];

const EMPTY_FORM: {
  platform: SocialMediaPlatform;
  name: string;
  publicName: string;
  handle: string;
  profileUrl: string;
  externalChannelId: string;
  description: string;
  integrationMode: SocialMediaIntegrationMode;
  active: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
} = {
  platform: "YOUTUBE",
  name: "",
  publicName: "",
  handle: "",
  profileUrl: "",
  externalChannelId: "",
  description: "",
  integrationMode: "MANUAL",
  active: true,
  showOnHomepage: true,
  displayOrder: 0,
};

export default function AdminSocialChannelsList() {
  const [channels, setChannels] = useState<SocialMediaChannelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  async function loadChannels() {
    setLoading(true);
    setError(null);

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

  async function saveChannel() {
    const payload = {
      ...form,
      publicName: form.publicName.trim() || null,
      handle: form.handle.trim() || null,
      profileUrl: form.profileUrl.trim() || null,
      externalChannelId: form.externalChannelId.trim() || null,
      description: form.description.trim() || null,
    };

    const response = editingId
      ? await adminFetch(`/api/admin/social-media/channels/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await adminFetch("/api/admin/social-media/channels", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    if (!response.success) {
      setError(response.error.message);
      setSuccess(null);
      return;
    }

    setForm(EMPTY_FORM);
    setEditingId(null);
    setSuccess(editingId ? "Kanal gespeichert." : "Kanal erstellt.");
    await loadChannels();
  }

  async function deleteChannel(id: string) {
    if (!window.confirm("Kanal wirklich löschen?")) {
      return;
    }

    const response = await adminFetch(`/api/admin/social-media/channels/${id}`, {
      method: "DELETE",
    });

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Kanal gelöscht.");
    await loadChannels();
  }

  async function syncChannel(id: string) {
    setSyncingId(id);
    const response = await adminFetch<{ success: boolean }>(
      `/api/admin/social-media/channels/${id}/sync`,
      { method: "POST" },
    );
    setSyncingId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Synchronisierung gestartet.");
    await loadChannels();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">Kanäle</h1>
          <p className="mt-1 text-sm text-aw-muted">
            Social-Media-Kanäle verwalten und synchronisieren.
          </p>
        </div>
        <Link
          href="/admin/marketing/social-media"
          className={secondaryButtonClassName}
        >
          Zur Übersicht
        </Link>
      </div>

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          {editingId ? "Kanal bearbeiten" : "Neuer Kanal"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <select
            className={inputClassName}
            value={form.platform}
            onChange={(event) =>
              setForm({
                ...form,
                platform: event.target.value as typeof form.platform,
              })
            }
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {SOCIAL_PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
          <select
            className={inputClassName}
            value={form.integrationMode}
            onChange={(event) =>
              setForm({
                ...form,
                integrationMode: event.target.value as typeof form.integrationMode,
              })
            }
          >
            {INTEGRATION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {SOCIAL_INTEGRATION_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
          <input
            className={inputClassName}
            placeholder="Interner Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Öffentlicher Name"
            value={form.publicName}
            onChange={(event) => setForm({ ...form, publicName: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Handle"
            value={form.handle}
            onChange={(event) => setForm({ ...form, handle: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder="Profil-URL"
            value={form.profileUrl}
            onChange={(event) => setForm({ ...form, profileUrl: event.target.value })}
          />
          <input
            className={inputClassName}
            placeholder={
              form.platform === "INSTAGRAM"
                ? "Instagram Business Account-ID"
                : "Externe Kanal-ID"
            }
            value={form.externalChannelId}
            onChange={(event) =>
              setForm({ ...form, externalChannelId: event.target.value })
            }
          />
          {form.platform === "INSTAGRAM" && form.integrationMode === "API" && (
            <p className="sm:col-span-2 text-xs text-aw-muted">
              Für API-Sync: Modus „API-Sync“, Business Account-ID hier oder unter
              Schnittstellen als Account-ID. Access Token unter Schnittstellen
              hinterlegen, dann synchronisieren.
            </p>
          )}
          <input
            className={inputClassName}
            type="number"
            placeholder="Reihenfolge"
            value={form.displayOrder}
            onChange={(event) =>
              setForm({ ...form, displayOrder: Number(event.target.value) || 0 })
            }
          />
          <textarea
            className={`${inputClassName} min-h-[80px] sm:col-span-2`}
            placeholder="Beschreibung"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
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
              checked={form.showOnHomepage}
              onChange={(event) =>
                setForm({ ...form, showOnHomepage: event.target.checked })
              }
            />
            Auf Startseite anzeigen
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" className={primaryButtonClassName} onClick={() => void saveChannel()}>
            Speichern
          </button>
          {editingId && (
            <button
              type="button"
              className={secondaryButtonClassName}
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
            >
              Abbrechen
            </button>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="space-y-3">
        {channels.map((channel) => (
          <article
            key={channel.id}
            className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-aw-muted">
                  {SOCIAL_PLATFORM_LABELS[channel.platform]} ·{" "}
                  {SOCIAL_INTEGRATION_MODE_LABELS[channel.integrationMode]} ·{" "}
                  {SOCIAL_CONNECTION_STATUS_LABELS[channel.connectionStatus]}
                </p>
                <h3 className="mt-1 font-medium text-aw-cream">{channel.name}</h3>
                {channel.handle && (
                  <p className="mt-1 text-sm text-aw-muted">@{channel.handle}</p>
                )}
                {channel.lastSyncedAt && (
                  <p className="mt-1 text-xs text-aw-muted">
                    Zuletzt synchronisiert:{" "}
                    {new Date(channel.lastSyncedAt).toLocaleString("de-DE")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  disabled={syncingId === channel.id}
                  onClick={() => void syncChannel(channel.id)}
                >
                  {syncingId === channel.id ? "Sync …" : "Synchronisieren"}
                </button>
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingId(channel.id);
                    setForm({
                      platform: channel.platform,
                      name: channel.name,
                      publicName: channel.publicName ?? "",
                      handle: channel.handle ?? "",
                      profileUrl: channel.profileUrl ?? "",
                      externalChannelId: channel.externalChannelId ?? "",
                      description: channel.description ?? "",
                      integrationMode: channel.integrationMode,
                      active: channel.active,
                      showOnHomepage: channel.showOnHomepage,
                      displayOrder: channel.displayOrder,
                    });
                  }}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
                  onClick={() => void deleteChannel(channel.id)}
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
