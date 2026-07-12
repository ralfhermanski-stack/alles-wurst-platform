"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminFetch } from "@/lib/admin/admin-fetch";
import type { CombinedSystemStatus, SystemHealthTone } from "@/lib/social-media/social-media-types";

const TONE_CLASSES: Record<SystemHealthTone, string> = {
  green: "border-green-500/40 bg-green-500/10",
  yellow: "border-amber-500/40 bg-amber-500/10",
  red: "border-red-500/40 bg-red-500/10",
  gray: "border-aw-border bg-aw-surface/30",
};

export default function AdminSystemStatusCard() {
  const [status, setStatus] = useState<CombinedSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const response = await adminFetch<CombinedSystemStatus>(
        "/api/admin/social-media/system-status",
      );

      if (response.success) {
        setStatus(response.data);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <p className="text-sm text-aw-muted">Systemstatus wird geladen …</p>
      </section>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Systemstatus
        </h2>
        <Link
          href="/admin/marketing/social-media/einrichtung"
          className="text-sm text-aw-gold hover:text-aw-cream"
        >
          Einrichtung öffnen →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article
          className={`rounded-xl border p-5 ${TONE_CLASSES[status.socialMedia.tone]}`}
        >
          <h3 className="font-display text-base font-bold text-aw-cream">
            Social Media
          </h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Aktive Kanäle</dt>
              <dd>{status.socialMedia.activeChannels}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Sichtbare Kanäle</dt>
              <dd>{status.socialMedia.visibleChannels}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Manuelle Beiträge</dt>
              <dd>{status.socialMedia.manualPosts}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Importierte Beiträge</dt>
              <dd>{status.socialMedia.importedPosts}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">YouTube-Verbindung</dt>
              <dd>{status.socialMedia.youtubeConnected ? "ja" : "nein"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Letzter Sync</dt>
              <dd>
                {status.socialMedia.lastSyncAt
                  ? new Date(status.socialMedia.lastSyncAt).toLocaleString("de-DE")
                  : "—"}
              </dd>
            </div>
          </dl>
        </article>

        <article
          className={`rounded-xl border p-5 ${TONE_CLASSES[status.challenges.tone]}`}
        >
          <h3 className="font-display text-base font-bold text-aw-cream">
            Challenges
          </h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Aktive Challenge</dt>
              <dd>{status.challenges.activeChallengeTitle ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Geplante Challenges</dt>
              <dd>{status.challenges.plannedChallengeCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Offene Einreichungen</dt>
              <dd>{status.challenges.openSubmissions}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Freigegebene Einreichungen</dt>
              <dd>{status.challenges.approvedSubmissions}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Popup aktiv</dt>
              <dd>{status.challenges.popupActive ? "ja" : "nein"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-aw-muted">Benachrichtigungen aktiv</dt>
              <dd>{status.challenges.notificationsActive ? "ja" : "nein"}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
