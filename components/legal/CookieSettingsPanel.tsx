"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AnalyticsConsentState } from "@/lib/analytics/analytics-types";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

async function fetchConsent(): Promise<AnalyticsConsentState | null> {
  const response = await fetch("/api/consent", { credentials: "include" });
  const json = (await response.json()) as {
    success: boolean;
    data?: AnalyticsConsentState;
  };
  return json.success && json.data ? json.data : null;
}

async function saveConsent(
  statistics: boolean,
  marketing: boolean,
  action: "granted" | "denied" | "updated" | "revoked",
): Promise<AnalyticsConsentState | null> {
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

  return json.success && json.data ? json.data : null;
}

export default function CookieSettingsPanel() {
  const [consent, setConsent] = useState<AnalyticsConsentState | null>(null);
  const [statistics, setStatistics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetchConsent().then((state) => {
      if (!state) {
        return;
      }

      setConsent(state);
      setStatistics(state.statistics);
      setMarketing(state.marketing);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const state = await saveConsent(statistics, marketing, "updated");

    setSaving(false);

    if (state) {
      setConsent(state);
      setSaved(true);
    }
  }

  async function handleRevokeAll() {
    setSaving(true);
    setSaved(false);

    const state = await saveConsent(false, false, "revoked");

    setSaving(false);

    if (state) {
      setConsent(state);
      setStatistics(false);
      setMarketing(false);
      setSaved(true);
    }
  }

  return (
    <div className="space-y-6">
      {consent?.updatedAt && (
        <p className="text-sm text-aw-muted">
          Letzte Entscheidung:{" "}
          {new Date(consent.updatedAt).toLocaleString("de-DE")}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="sr-only">Cookie-Kategorien</legend>

        <div className="rounded-lg border border-aw-border bg-aw-bg px-4 py-4">
          <p className="font-semibold text-aw-cream">Notwendige Cookies</p>
          <p className="mt-2 text-sm text-aw-muted">
            Diese Cookies sind für den Betrieb der Plattform erforderlich (z. B.
            Anmeldung, Sitzung, Sicherheit). Sie können nicht deaktiviert werden.
          </p>
          <p className="mt-2 text-xs text-aw-gold">Immer aktiv</p>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-aw-border bg-aw-bg px-4 py-4">
          <input
            type="checkbox"
            checked={statistics}
            onChange={(event) => setStatistics(event.target.checked)}
            className="mt-1 accent-aw-gold"
          />
          <span>
            <span className="block font-semibold text-aw-cream">
              Statistik-Cookies
            </span>
            <span className="mt-1 block text-sm text-aw-muted">
              Helfen uns zu verstehen, wie die Plattform genutzt wird.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-aw-border bg-aw-bg px-4 py-4">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(event) => setMarketing(event.target.checked)}
            className="mt-1 accent-aw-gold"
          />
          <span>
            <span className="block font-semibold text-aw-cream">
              Marketing-Cookies
            </span>
            <span className="mt-1 block text-sm text-aw-muted">
              Für personalisierte Inhalte und externe Medien, sofern eingesetzt.
            </span>
          </span>
        </label>
      </fieldset>

      {saved && (
        <p className="text-sm text-green-400" role="status">
          Deine Einstellungen wurden gespeichert.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className={primaryButtonClassName}
        >
          {saving ? "Speichern …" : "Einstellungen speichern"}
        </button>
        <button
          type="button"
          onClick={() => void handleRevokeAll()}
          disabled={saving}
          className={secondaryButtonClassName}
        >
          Alle optionalen Einwilligungen widerrufen
        </button>
      </div>

      <p className="text-xs text-aw-muted">
        Weitere Informationen findest du in der{" "}
        <Link href="/datenschutz" className="text-aw-gold underline">
          Datenschutzerklärung
        </Link>
        .
      </p>
    </div>
  );
}
