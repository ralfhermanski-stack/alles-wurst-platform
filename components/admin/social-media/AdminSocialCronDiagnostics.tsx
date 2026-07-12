"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import PlatformTextFallback from "@/components/platform-text/PlatformTextFallback";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { adminFetch } from "@/lib/admin/admin-fetch";
import type {
  CronDiagnostics,
} from "@/lib/social-media/social-media-types";

export default function AdminSocialCronDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<CronDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [running, setRunning] = useState<"simulate" | "manual" | null>(null);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    const response = await adminFetch<CronDiagnostics>(
      "/api/admin/social-media/cron",
    );

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setDiagnostics(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  async function runAction(endpoint: string, mode: "simulate" | "manual") {
    setRunning(mode);
    setError(null);
    setSuccess(null);

    const response = await adminFetch<{ synced: number; message: string }>(
      endpoint,
      { method: "POST" },
    );

    setRunning(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess(response.data.message);
    await loadDiagnostics();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            <PlatformTextFallback
              textKey="admin.social.setup.cron"
              as="span"
              fallback="Cronjob-Diagnose"
            />
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Status, Endpunkt und manuelle Auslösung der Social-Media-Synchronisierung.
          </p>
        </div>
        <Link
          href="/admin/marketing/social-media/einrichtung"
          className={secondaryButtonClassName}
        >
          Zur Einrichtung
        </Link>
      </div>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      {diagnostics && (
        <>
          <section
            className={`rounded-xl border p-5 ${
              diagnostics.staleWarning
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-aw-border bg-aw-surface/40"
            }`}
          >
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Cron-Status
            </h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-aw-muted">Cron-Secret gesetzt</dt>
                <dd className="font-semibold text-aw-cream">
                  {diagnostics.secretConfigured ? "ja" : "nein"}
                </dd>
              </div>
              <div>
                <dt className="text-aw-muted">Endpunkt</dt>
                <dd className="font-mono text-aw-cream">{diagnostics.endpoint}</dd>
              </div>
              <div>
                <dt className="text-aw-muted">HTTP-Methode</dt>
                <dd className="font-mono text-aw-cream">{diagnostics.method}</dd>
              </div>
              <div>
                <dt className="text-aw-muted">Authentifizierung</dt>
                <dd className="font-mono text-xs text-aw-cream">
                  {diagnostics.authHeader}
                </dd>
              </div>
              <div>
                <dt className="text-aw-muted">Letzter Cron-Aufruf</dt>
                <dd className="text-aw-cream">
                  {diagnostics.lastCronAt
                    ? new Date(diagnostics.lastCronAt).toLocaleString("de-DE")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-aw-muted">Letzter erfolgreicher Lauf</dt>
                <dd className="text-aw-cream">
                  {diagnostics.lastCronSuccessAt
                    ? new Date(diagnostics.lastCronSuccessAt).toLocaleString("de-DE")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-aw-muted">Letzter fehlgeschlagener Lauf</dt>
                <dd className="text-aw-cream">
                  {diagnostics.lastCronFailureAt
                    ? new Date(diagnostics.lastCronFailureAt).toLocaleString("de-DE")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-aw-muted">Nächster erwarteter Lauf</dt>
                <dd className="text-aw-cream">
                  {diagnostics.nextExpectedRunAt
                    ? new Date(diagnostics.nextExpectedRunAt).toLocaleString("de-DE")
                    : "—"}
                </dd>
              </div>
            </dl>

            {diagnostics.staleWarning && (
              <p className="mt-4 text-sm text-amber-200">
                Warnung: Seit mehr als 6 Stunden kein Cron-Lauf protokolliert.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Einrichtungshinweise
            </h2>
            <p className="mt-3 text-sm text-aw-muted">
              Empfohlener Zeitplan: {diagnostics.recommendedSchedule}
            </p>
            <p className="mt-2 font-mono text-xs text-aw-muted">
              {diagnostics.exampleCall}
            </p>
            <p className="mt-4 text-xs text-aw-muted">
              Mögliche Antworten: 200 (Erfolg), 401/403 (nicht autorisiert), 429 (Rate-Limit), 500 (Fehler).
              Rückgabeformat: {"{ success: boolean, synced?: number, error?: string }"}
            </p>
          </section>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={running !== null}
              onClick={() =>
                void runAction("/api/admin/social-media/cron/simulate", "simulate")
              }
            >
              {running === "simulate" ? "Läuft …" : "Cronjob lokal simulieren"}
            </button>
            <button
              type="button"
              className={secondaryButtonClassName}
              disabled={running !== null}
              onClick={() =>
                void runAction("/api/admin/social-media/sync-all", "manual")
              }
            >
              {running === "manual" ? "Läuft …" : "Synchronisierung manuell auslösen"}
            </button>
            <Link
              href="/admin/marketing/social-media/protokoll"
              className={secondaryButtonClassName}
            >
              Protokoll öffnen
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
