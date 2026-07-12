"use client";

import { useEffect, useState } from "react";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { adminFetch } from "@/lib/admin/admin-fetch";
import type { SocialMediaChannelEntry } from "@/lib/social-media/social-media-types";
import type { YouTubeConnectionTestResult } from "@/lib/social-media/social-media-youtube-test";

type YouTubeStatus = {
  apiKeyPresent: boolean;
  channelIdPresent: boolean;
  connectionStatus: string;
  channelName: string;
  lastSyncedAt: string | null;
  importedVideos: number;
  lastErrorMessage: string | null;
};

export default function AdminYouTubeConnectionPanel({
  channel,
}: {
  channel: SocialMediaChannelEntry;
}) {
  const [status, setStatus] = useState<YouTubeStatus | null>(null);
  const [testResult, setTestResult] = useState<YouTubeConnectionTestResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    const postsResponse = await adminFetch<unknown[]>(
      `/api/admin/social-media/posts?channelId=${channel.id}`,
    );

    setStatus({
      apiKeyPresent: channel.connectionStatus !== "NOT_CONFIGURED",
      channelIdPresent: Boolean(channel.externalChannelId),
      connectionStatus: channel.connectionStatus,
      channelName: channel.publicName ?? channel.name,
      lastSyncedAt: channel.lastSyncedAt,
      importedVideos: postsResponse.success ? postsResponse.data.length : 0,
      lastErrorMessage: channel.lastErrorMessage,
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadStatus();
  }, [channel]);

  async function runTest() {
    setRunning("test");
    setError(null);
    setSuccess(null);

    const response = await adminFetch<YouTubeConnectionTestResult>(
      `/api/admin/social-media/youtube/${channel.id}/test`,
      { method: "POST" },
    );

    setRunning(null);

    if (!response.success) {
      setError(response.error.message);
      setTestResult(null);
      return;
    }

    setTestResult(response.data);
    setSuccess(response.data.message);
  }

  async function syncNow() {
    setRunning("sync");
    setError(null);

    const response = await adminFetch(`/api/admin/social-media/channels/${channel.id}/sync`, {
      method: "POST",
    });

    setRunning(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Die Synchronisierung wurde erfolgreich abgeschlossen.");
  }

  async function resetConnection() {
    setRunning("reset");
    setError(null);

    const response = await adminFetch(
      `/api/admin/social-media/youtube/${channel.id}/reset`,
      { method: "POST" },
    );

    setRunning(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Die YouTube-Verbindung wurde zurückgesetzt.");
    setTestResult(null);
  }

  if (loading || !status) {
    return <p className="text-sm text-aw-muted">YouTube-Status wird geladen …</p>;
  }

  return (
    <section className="mt-4 rounded-lg border border-aw-border bg-aw-bg/30 p-4">
      <h3 className="text-sm font-semibold text-aw-cream">YouTube-Verbindungsstatus</h3>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-aw-muted">API-Key vorhanden</dt>
          <dd>{status.apiKeyPresent ? "ja (in DB oder ENV)" : "nein"}</dd>
        </div>
        <div>
          <dt className="text-aw-muted">Kanal-ID vorhanden</dt>
          <dd>{status.channelIdPresent ? "ja" : "nein"}</dd>
        </div>
        <div>
          <dt className="text-aw-muted">Verbindung erfolgreich</dt>
          <dd>{status.connectionStatus === "CONNECTED" ? "ja" : "nein"}</dd>
        </div>
        <div>
          <dt className="text-aw-muted">Kanalname</dt>
          <dd>{testResult?.channelName ?? status.channelName}</dd>
        </div>
        <div>
          <dt className="text-aw-muted">Letzter erfolgreicher Abruf</dt>
          <dd>
            {status.lastSyncedAt
              ? new Date(status.lastSyncedAt).toLocaleString("de-DE")
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-aw-muted">Importierte Videos</dt>
          <dd>{status.importedVideos}</dd>
        </div>
      </dl>

      {status.lastErrorMessage && (
        <p className="mt-3 text-xs text-aw-warning">{status.lastErrorMessage}</p>
      )}
      {error && <p className="mt-3 text-xs text-aw-warning">{error}</p>}
      {success && <p className="mt-3 text-xs text-green-400">{success}</p>}

      {testResult && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-aw-muted">
            Testergebnis vom {new Date(testResult.testedAt).toLocaleString("de-DE")}
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-aw-bg/50 p-2 text-xs">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </details>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={running !== null}
          onClick={() => void runTest()}
        >
          {running === "test" ? "Teste …" : "Verbindung testen"}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={running !== null}
          onClick={() => void syncNow()}
        >
          {running === "sync" ? "Synchronisiere …" : "Jetzt synchronisieren"}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={running !== null}
          onClick={() => void resetConnection()}
        >
          {running === "reset" ? "Setze zurück …" : "Verbindung zurücksetzen"}
        </button>
      </div>
    </section>
  );
}
