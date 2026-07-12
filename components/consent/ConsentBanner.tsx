"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { AnalyticsConsentState } from "@/lib/analytics/analytics-types";

type ConsentBannerProps = {
  initialConsent: AnalyticsConsentState | null;
  onConsentChange: (state: AnalyticsConsentState) => void;
};

async function saveConsent(
  statistics: boolean,
  marketing: boolean,
  action: "granted" | "denied" | "updated" | "revoked",
): Promise<AnalyticsConsentState | null> {
  try {
    const response = await fetch("/api/consent", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statistics, marketing, action }),
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: AnalyticsConsentState;
    };

    if (!response.ok || !json.success || !json.data) {
      return null;
    }

    return json.data;
  } catch {
    return null;
  }
}

export default function ConsentBanner({
  initialConsent,
  onConsentChange,
}: ConsentBannerProps) {
  const [visible, setVisible] = useState(!initialConsent);
  const [showDetails, setShowDetails] = useState(false);
  const [statistics, setStatistics] = useState(initialConsent?.statistics ?? false);
  const [marketing, setMarketing] = useState(initialConsent?.marketing ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const openSettings = () => {
      setVisible(true);
      setShowDetails(true);
    };

    window.addEventListener("aw:open-consent-settings", openSettings);

    return () => {
      window.removeEventListener("aw:open-consent-settings", openSettings);
    };
  }, []);

  if (!visible) {
    return null;
  }

  async function applyConsent(
    nextStatistics: boolean,
    nextMarketing: boolean,
    action: "granted" | "denied" | "updated" | "revoked",
  ) {
    setSaving(true);
    setError(null);

    const state = await saveConsent(nextStatistics, nextMarketing, action);

    setSaving(false);

    if (!state) {
      setError("Einstellungen konnten nicht gespeichert werden. Bitte erneut versuchen.");
      return;
    }

    onConsentChange(state);
    setVisible(false);
    setShowDetails(false);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-aw-border bg-aw-surface/95 p-4 shadow-2xl backdrop-blur"
      role="dialog"
      aria-label="Cookie-Einstellungen"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div>
          <p className="font-display text-lg font-bold text-aw-cream">
            Datenschutz & Cookies
          </p>
          <p className="mt-2 text-sm text-aw-muted">
            Wir verwenden eigene First-Party-Statistiken ohne Google oder Meta.
            Technisch notwendige Cookies sind immer aktiv. Statistik-Cookies setzen
            wir nur nach Ihrer Einwilligung. Details in der{" "}
            <Link href="/datenschutz" className="text-aw-gold underline">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>

        {showDetails && (
          <div className="space-y-3 rounded-lg border border-aw-border bg-aw-surface-2 p-4 text-sm">
            <label className="flex items-start gap-3">
              <input type="checkbox" checked disabled className="mt-1" />
              <span>
                <span className="font-semibold text-aw-cream">Notwendig</span>
                <span className="mt-1 block text-aw-muted">
                  Session, Sicherheit und Speicherung Ihrer Consent-Entscheidung.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={statistics}
                onChange={(event) => setStatistics(event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="font-semibold text-aw-cream">Statistik</span>
                <span className="mt-1 block text-aw-muted">
                  Anonymisierte Nutzungsstatistiken (Seitenaufrufe, Verweildauer,
                  Funnels) — nur First-Party, keine Weitergabe an Dritte.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 opacity-70">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-1"
                disabled
              />
              <span>
                <span className="font-semibold text-aw-cream">Marketing</span>
                <span className="mt-1 block text-aw-muted">
                  Derzeit nicht aktiv. Option für spätere Newsletter-/Kampagnen-Tracking.
                </span>
              </span>
            </label>
          </div>
        )}

        {error && (
          <p className="text-sm text-aw-warning" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void applyConsent(true, false, initialConsent ? "updated" : "granted")}
            className="rounded-lg bg-aw-gold px-4 py-2 text-sm font-semibold text-aw-bg hover:bg-aw-gold/90 disabled:opacity-60"
          >
            Statistik akzeptieren
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void applyConsent(false, false, initialConsent ? "revoked" : "denied")}
            className="rounded-lg border border-aw-border px-4 py-2 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            Nur notwendige Cookies
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (showDetails) {
                void applyConsent(statistics, marketing, "updated");
                return;
              }

              setShowDetails(true);
            }}
            className="rounded-lg border border-aw-border px-4 py-2 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            {showDetails ? "Auswahl speichern" : "Einstellungen"}
          </button>
        </div>
      </div>
    </div>
  );
}
