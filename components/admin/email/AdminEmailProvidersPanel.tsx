"use client";

import { useCallback, useEffect, useState } from "react";

import AdminEmailNav from "@/components/admin/email/AdminEmailNav";
import { PROVIDER_TYPE_OPTIONS } from "@/lib/email/email-categories-client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ProviderRow = {
  id: string;
  name: string;
  providerType: string;
  active: boolean;
  settings: Record<string, unknown>;
  hasCredentials: boolean;
  credentialsMasked: string | null;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  lastError: string | null;
};

type ProviderForm = {
  id: string;
  name: string;
  providerType: string;
  active: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  apiKey: string;
  smtpPassword: string;
  testRecipientEmail: string;
};

const EMPTY_FORM: ProviderForm = {
  id: "",
  name: "",
  providerType: "SMTP",
  active: false,
  host: "",
  port: "587",
  secure: false,
  user: "",
  apiKey: "",
  smtpPassword: "",
  testRecipientEmail: "",
};

export default function AdminEmailProvidersPanel() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [form, setForm] = useState<ProviderForm>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);

    try {
      const response = await fetch("/api/admin/email/providers", { credentials: "include" });
      const json = (await response.json()) as {
        success: boolean;
        data?: ProviderRow[];
        error?: { message?: string };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? "Provider konnten nicht geladen werden.");
      }

      setProviders(json.data);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Provider konnten nicht geladen werden.",
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function editProvider(row: ProviderRow) {
    setForm({
      id: row.id,
      name: row.name,
      providerType: row.providerType,
      active: row.active,
      host: String(row.settings.host ?? ""),
      port: String(row.settings.port ?? "587"),
      secure: String(row.settings.secure ?? "false") === "true",
      user: String(row.settings.user ?? ""),
      apiKey: "",
      smtpPassword: "",
      testRecipientEmail: form.testRecipientEmail,
    });
    setMessage(null);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  async function saveProvider() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/email/providers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save",
        id: form.id || undefined,
        name: form.name,
        providerType: form.providerType,
        active: form.active,
        settings: {
          host: form.host,
          port: form.port,
          secure: String(form.secure),
          user: form.user,
        },
        apiKey: form.apiKey || undefined,
        smtpPassword: form.smtpPassword || undefined,
      }),
    });

    const json = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: { message: string };
    };

    setLoading(false);
    setMessage(json.message ?? json.error?.message ?? "Gespeichert.");
    if (json.success) {
      resetForm();
      await load();
    }
  }

  async function testProvider() {
    if (!form.id) {
      setMessage("Bitte zuerst speichern, dann testen.");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/admin/email/providers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test",
        id: form.id,
        testRecipientEmail: form.testRecipientEmail,
      }),
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: { message: string };
      error?: { message: string };
    };

    setLoading(false);
    setMessage(json.data?.message ?? json.error?.message ?? "Test abgeschlossen.");
    await load();
  }

  const isSmtp = form.providerType === "SMTP";
  const isApiProvider = form.providerType === "RESEND" || form.providerType === "BREVO";

  return (
    <AdminEmailNav>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Provider verwalten
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            Lege SMTP- oder API-Provider an. Zugangsdaten werden verschlüsselt gespeichert
            und nie vollständig angezeigt.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className={labelClassName}>Name</span>
              <input
                className={inputClassName}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z. B. Produktion Resend"
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Provider-Typ</span>
              <select
                className={inputClassName}
                value={form.providerType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, providerType: e.target.value }))
                }
              >
                {PROVIDER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {isSmtp && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>SMTP-Host</span>
                  <input
                    className={inputClassName}
                    value={form.host}
                    onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className={labelClassName}>Port</span>
                  <input
                    className={inputClassName}
                    value={form.port}
                    onChange={(e) => setForm((prev) => ({ ...prev, port: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 pt-8 text-sm text-aw-cream">
                  <input
                    type="checkbox"
                    checked={form.secure}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, secure: e.target.checked }))
                    }
                  />
                  TLS/SSL (secure)
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Benutzername</span>
                  <input
                    className={inputClassName}
                    value={form.user}
                    onChange={(e) => setForm((prev) => ({ ...prev, user: e.target.value }))}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Passwort (nur bei Änderung)</span>
                  <input
                    type="password"
                    className={inputClassName}
                    value={form.smtpPassword}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, smtpPassword: e.target.value }))
                    }
                    placeholder="Leer lassen = unverändert"
                  />
                </label>
              </div>
            )}

            {isApiProvider && (
              <label className="block">
                <span className={labelClassName}>API-Schlüssel (nur bei Änderung)</span>
                <input
                  type="password"
                  className={inputClassName}
                  value={form.apiKey}
                  onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Leer lassen = unverändert"
                />
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Als aktiven Provider verwenden
            </label>

            <label className="block">
              <span className={labelClassName}>Testempfänger</span>
              <input
                className={inputClassName}
                value={form.testRecipientEmail}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, testRecipientEmail: e.target.value }))
                }
                placeholder="deine@email.de"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={loading}
                onClick={() => void saveProvider()}
              >
                {form.id ? "Provider aktualisieren" : "Provider anlegen"}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={loading || !form.id}
                onClick={() => void testProvider()}
              >
                Verbindung testen
              </button>
              {form.id && (
                <button type="button" className={secondaryButtonClassName} onClick={resetForm}>
                  Neu
                </button>
              )}
            </div>

            {message && <p className="text-sm text-aw-muted">{message}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">Vorhandene Provider</h2>
          {loadError ? (
            <p className="mt-4 text-sm text-red-300">{loadError}</p>
          ) : null}
          <ul className="mt-4 space-y-3">
            {initialLoading ? (
              <li className="text-sm text-aw-muted">Lade …</li>
            ) : providers.length > 0 ? (
              providers.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-aw-border/70 p-3 text-sm text-aw-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-aw-cream">
                        {row.name}{" "}
                        {row.active && (
                          <span className="text-xs text-aw-gold">(aktiv)</span>
                        )}
                      </p>
                      <p>{row.providerType}</p>
                      <p>
                        Zugangsdaten: {row.hasCredentials ? row.credentialsMasked : "fehlen"}
                      </p>
                      {row.lastTestStatus && <p>Letzter Test: {row.lastTestStatus}</p>}
                      {row.lastError && <p className="text-aw-warning">{row.lastError}</p>}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-aw-gold hover:underline"
                      onClick={() => editProvider(row)}
                    >
                      Bearbeiten
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li>Noch kein Provider angelegt.</li>
            )}
          </ul>
        </section>
      </div>
    </AdminEmailNav>
  );
}
