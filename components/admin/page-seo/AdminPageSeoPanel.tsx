"use client";

import { useEffect, useState } from "react";

import {
  generateMissingPageSeoApi,
  getPageSeoAdminApi,
  processPageSeoQueueApi,
  regenerateAutoPageSeoApi,
  reviewPageSeoDraftApi,
  scanPageSeoApi,
  updatePageSeoSettingsApi,
} from "@/lib/page-seo/page-seo-client";
import type {
  PageSeoAdminListItem,
  PageSeoSettingsData,
} from "@/lib/page-seo/page-seo-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("de-DE");
}

export default function AdminPageSeoPanel() {
  const [settings, setSettings] = useState<PageSeoSettingsData | null>(null);
  const [pages, setPages] = useState<PageSeoAdminListItem[]>([]);
  const [queuePending, setQueuePending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const response = await getPageSeoAdminApi();
    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data.settings);
    setPages(response.data.pages);
    setQueuePending(response.data.queuePending);
  }

  async function saveSettings(patch: Partial<PageSeoSettingsData>) {
    if (!settings) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await updatePageSeoSettingsApi(patch);
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSettings(response.data);
    setMessage("Einstellungen gespeichert.");
  }

  async function runScan() {
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await scanPageSeoApi();
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(
      `Scan: ${response.data.scan.discovered} Seiten, ${response.data.scan.created} neu, ${response.data.scan.queued} in Queue.`,
    );
    await load();
  }

  async function runGenerateMissing() {
    setBusy(true);
    const response = await generateMissingPageSeoApi();
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(`${response.data.queued} Jobs eingeplant.`);
    await load();
  }

  async function runRegenerateAuto() {
    setBusy(true);
    const response = await regenerateAutoPageSeoApi();
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(`${response.data.queued} Auto-Seiten zur Neugenerierung eingeplant.`);
    await load();
  }

  async function runProcessQueue() {
    setBusy(true);
    const response = await processPageSeoQueueApi();
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(
      `Queue: ${response.data.processed} verarbeitet, ${response.data.succeeded} erfolgreich.`,
    );
    await load();
  }

  async function reviewDraft(routeKey: string, action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await reviewPageSeoDraftApi(routeKey, action);
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(response.data.message ?? (action === "approve" ? "Freigegeben." : "Verworfen."));
    await load();
  }

  const pendingCount = pages.filter((page) => page.hasPendingDraft).length;

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  if (!settings) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        {error ?? "SEO-Daten konnten nicht geladen werden."}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-aw-border bg-aw-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-aw-cream">Einstellungen</h2>

        <p className="text-sm text-aw-muted">
          KI erzeugt nur Vorschläge. Nichts wird ohne deine Freigabe live geschaltet.
        </p>

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={settings.autoGenerateEnabled}
            onChange={(e) =>
              void saveSettings({ autoGenerateEnabled: e.target.checked })
            }
            disabled={busy}
          />
          Vorschläge automatisch erzeugen (ohne Live-Schaltung)
        </label>

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={settings.autoUpdateOnChange}
            onChange={(e) =>
              void saveSettings({ autoUpdateOnChange: e.target.checked })
            }
            disabled={busy}
          />
          Automatische Aktualisierung bei Seitenänderung
        </label>

        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={settings.onlyPublishedPages}
            onChange={(e) =>
              void saveSettings({ onlyPublishedPages: e.target.checked })
            }
            disabled={busy}
          />
          Nur veröffentlichte Seiten berücksichtigen
        </label>

        <div>
          <label className={labelClassName}>Maximale API-Aufrufe pro Tag</label>
          <input
            type="number"
            min={0}
            className={inputClassName}
            value={settings.maxApiCallsPerDay}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxApiCallsPerDay: Number(e.target.value) || 0,
              })
            }
          />
          <button
            type="button"
            className={`${secondaryButtonClassName} mt-2`}
            disabled={busy}
            onClick={() =>
              void saveSettings({ maxApiCallsPerDay: settings.maxApiCallsPerDay })
            }
          >
            Limit speichern
          </button>
          <p className="mt-2 text-xs text-aw-muted">
            Heute verbraucht: {settings.apiCallsToday} / {settings.maxApiCallsPerDay}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface p-6 space-y-3">
        <h2 className="font-display text-lg font-bold text-aw-cream">Aktionen</h2>
        <p className="text-sm text-aw-muted">
          Warteschlange: {queuePending} ausstehende Jobs · {pendingCount} Vorschläge warten auf
          Freigabe. Blog-Artikel werden separat im Magazin-Editor freigegeben.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryButtonClassName} disabled={busy} onClick={() => void runScan()}>
            SEO für alle öffentlichen Seiten prüfen
          </button>
          <button type="button" className={secondaryButtonClassName} disabled={busy} onClick={() => void runGenerateMissing()}>
            Fehlende SEO-Daten automatisch erzeugen
          </button>
          <button type="button" className={secondaryButtonClassName} disabled={busy} onClick={() => void runRegenerateAuto()}>
            Automatische SEO-Daten neu generieren
          </button>
          <button type="button" className={secondaryButtonClassName} disabled={busy} onClick={() => void runProcessQueue()}>
            Warteschlange verarbeiten
          </button>
        </div>
      </section>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">Öffentliche Seiten</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-aw-muted">
              <tr>
                <th className="px-2 py-2">Pfad</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Quelle</th>
                <th className="px-2 py-2">Zuletzt erzeugt</th>
                <th className="px-2 py-2">Geändert</th>
                <th className="px-2 py-2">Freigabe</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-aw-border/60">
                  <td className="px-2 py-2 text-aw-cream">
                    <div>{page.path}</div>
                    {page.draftMetaTitle ? (
                      <div className="text-xs text-aw-gold">Vorschlag: {page.draftMetaTitle}</div>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">{page.statusLabel}</td>
                  <td className="px-2 py-2">
                    {page.seoSource === "manual" ? "Freigegeben" : "KI-Vorschlag"}
                  </td>
                  <td className="px-2 py-2 text-aw-muted">
                    {formatDate(page.lastGeneratedAt)}
                  </td>
                  <td className="px-2 py-2 text-aw-muted">
                    {page.isContentStale ? "Ja" : "Nein"}
                  </td>
                  <td className="px-2 py-2">
                    {page.hasPendingDraft ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={primaryButtonClassName}
                          disabled={busy}
                          onClick={() => void reviewDraft(page.routeKey, "approve")}
                        >
                          Freigeben
                        </button>
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={busy}
                          onClick={() => void reviewDraft(page.routeKey, "reject")}
                        >
                          Verwerfen
                        </button>
                      </div>
                    ) : (
                      <span className="text-aw-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
