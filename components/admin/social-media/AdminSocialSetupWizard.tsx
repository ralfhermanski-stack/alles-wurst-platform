"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import PlatformTextFallback from "@/components/platform-text/PlatformTextFallback";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { adminFetch } from "@/lib/admin/admin-fetch";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/social-media/social-media-types";
import type {
  SetupSectionId,
  SetupSectionResult,
  SetupSectionStatus,
  SocialMediaSetupOverview,
} from "@/lib/social-media/social-media-types";

const SECTION_LABELS: Record<SetupSectionId, string> = {
  channels: "Social-Media-Kanäle",
  youtube: "YouTube-Schnittstelle",
  manual_posts: "Manuelle Beiträge",
  sync: "Synchronisierung",
  homepage: "Startseiten-Anzeige",
  cron: "Cronjob",
  function_test: "Funktionstest",
};

const STATUS_LABELS: Record<SetupSectionStatus, string> = {
  not_configured: "Nicht eingerichtet",
  partial: "Teilweise eingerichtet",
  ready: "Eingerichtet",
  error: "Fehler",
  test_passed: "Test bestanden",
};

const STATUS_CLASSES: Record<SetupSectionStatus, string> = {
  not_configured: "border-aw-border bg-aw-surface/30 text-aw-muted",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  ready: "border-green-500/40 bg-green-500/10 text-green-200",
  error: "border-red-500/40 bg-red-500/10 text-red-200",
  test_passed: "border-green-500/50 bg-green-500/15 text-green-100",
};

export default function AdminSocialSetupWizard() {
  const [overview, setOverview] = useState<SocialMediaSetupOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<SetupSectionId | null>(null);
  const [sectionResults, setSectionResults] = useState<
    Partial<Record<SetupSectionId, SetupSectionResult>>
  >({});

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await adminFetch<SocialMediaSetupOverview>(
      "/api/admin/social-media/setup",
    );

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setOverview(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function checkSection(sectionId: SetupSectionId) {
    setCheckingId(sectionId);

    const youtubeChannelId =
      overview?.sections.find((section) => section.id === "youtube")?.details
        ?.channelId;

    const response = await adminFetch<SetupSectionResult>(
      "/api/admin/social-media/setup",
      {
        method: "POST",
        body: JSON.stringify({
          sectionId,
          youtubeChannelId:
            sectionId === "youtube" && typeof youtubeChannelId === "string"
              ? youtubeChannelId
              : undefined,
        }),
      },
    );

    setCheckingId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSectionResults((current) => ({
      ...current,
      [sectionId]: response.data,
    }));

    await loadOverview();
  }

  const sections = overview?.sections ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            <PlatformTextFallback
              textKey="admin.social.setup.title"
              as="span"
              fallback="Social-Media-Einrichtung"
            />
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            <PlatformTextFallback
              textKey="admin.social.setup.description"
              as="span"
              fallback="Schritt für Schritt zur vollständigen Einrichtung von Social Media und Synchronisierung."
            />
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
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      {overview && (
        <>
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Plattform-Übersicht
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overview.platforms.map((platform) => (
                <div
                  key={platform.platform}
                  className="rounded-lg border border-aw-border bg-aw-bg/40 p-4"
                >
                  <p className="text-sm font-semibold text-aw-cream">
                    {SOCIAL_PLATFORM_LABELS[platform.platform]}
                  </p>
                  <p className="mt-1 text-xs text-aw-muted">
                    Eingerichtet: {platform.configured ? "ja" : "nein"}
                  </p>
                  {platform.channelName && (
                    <p className="mt-1 text-xs text-aw-muted">
                      Kanal: {platform.channelName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-4">
            {sections.map((section) => {
              const latest = sectionResults[section.id] ?? section;

              return (
                <article
                  key={section.id}
                  className={`rounded-xl border p-5 ${STATUS_CLASSES[latest.status]}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-lg font-bold">
                        {SECTION_LABELS[section.id]}
                      </h2>
                      <p className="mt-1 text-xs uppercase tracking-wide opacity-80">
                        {STATUS_LABELS[latest.status]}
                      </p>
                      <p className="mt-3 text-sm">{latest.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={section.adminHref}
                        className={secondaryButtonClassName}
                      >
                        Öffnen
                      </Link>
                      <button
                        type="button"
                        className={primaryButtonClassName}
                        disabled={checkingId === section.id}
                        onClick={() => void checkSection(section.id)}
                      >
                        {checkingId === section.id ? "Prüfe …" : "Jetzt prüfen"}
                      </button>
                    </div>
                  </div>

                  {latest.details && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs opacity-80">
                        Technische Details
                      </summary>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-aw-bg/60 p-3 text-xs">
                        {JSON.stringify(latest.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </article>
              );
            })}
          </div>

          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Umgebungsvariablen
            </h2>
            <ul className="mt-4 space-y-2">
              {overview.environment.map((entry) => (
                <li
                  key={entry.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-aw-border bg-aw-bg/30 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-aw-cream">{entry.name}</span>
                  <span className="text-aw-muted">{entry.message}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
