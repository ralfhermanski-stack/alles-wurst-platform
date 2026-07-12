"use client";

import { useCallback, useEffect, useState } from "react";

import AdminEmailNav from "@/components/admin/email/AdminEmailNav";
import {
  EMAIL_CATEGORIES,
  EMAIL_CATEGORY_LABELS,
  type EmailCategoryClient,
} from "@/lib/email/email-categories-client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type SenderRow = {
  id: string;
  providerConfigId: string;
  providerName: string;
  internalName: string;
  displayName: string;
  emailAddress: string;
  replyToAddress: string | null;
  active: boolean;
  verified: boolean;
  defaultSender: boolean;
  allowedCategories: EmailCategoryClient[];
  sortOrder: number;
};

type CategoryRow = {
  id: string;
  category: EmailCategoryClient;
  defaultSenderId: string | null;
};

type ProviderOption = { id: string; name: string };

type SenderForm = {
  id: string;
  providerConfigId: string;
  internalName: string;
  displayName: string;
  emailAddress: string;
  replyToAddress: string;
  active: boolean;
  verified: boolean;
  defaultSender: boolean;
  allowedCategories: EmailCategoryClient[];
  sortOrder: number;
};

const EMPTY_FORM: SenderForm = {
  id: "",
  providerConfigId: "",
  internalName: "",
  displayName: "",
  emailAddress: "",
  replyToAddress: "",
  active: true,
  verified: false,
  defaultSender: false,
  allowedCategories: [],
  sortOrder: 0,
};

export default function AdminEmailSendersPanel() {
  const [senders, setSenders] = useState<SenderRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [form, setForm] = useState<SenderForm>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);

    try {
      const [sendersRes, providersRes] = await Promise.all([
        fetch("/api/admin/email/senders?categories=1", { credentials: "include" }),
        fetch("/api/admin/email/providers", { credentials: "include" }),
      ]);

      const sendersJson = (await sendersRes.json()) as {
        success: boolean;
        data?: { senders: SenderRow[]; categories: CategoryRow[] };
        error?: { message?: string };
      };

      const providersJson = (await providersRes.json()) as {
        success: boolean;
        data?: Array<{ id: string; name: string }>;
        error?: { message?: string };
      };

      if (!sendersRes.ok || !sendersJson.success || !sendersJson.data) {
        throw new Error(sendersJson.error?.message ?? "Absender konnten nicht geladen werden.");
      }

      if (!providersRes.ok || !providersJson.success || !providersJson.data) {
        throw new Error(providersJson.error?.message ?? "Provider konnten nicht geladen werden.");
      }

      setSenders(sendersJson.data.senders);
      setCategories(sendersJson.data.categories);
      setProviders(providersJson.data.map((row) => ({ id: row.id, name: row.name })));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Daten konnten nicht geladen werden.",
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function editSender(row: SenderRow) {
    setForm({
      id: row.id,
      providerConfigId: row.providerConfigId,
      internalName: row.internalName,
      displayName: row.displayName,
      emailAddress: row.emailAddress,
      replyToAddress: row.replyToAddress ?? "",
      active: row.active,
      verified: row.verified,
      defaultSender: row.defaultSender,
      allowedCategories: row.allowedCategories,
      sortOrder: row.sortOrder,
    });
    setMessage(null);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  function toggleCategory(category: EmailCategoryClient) {
    setForm((prev) => ({
      ...prev,
      allowedCategories: prev.allowedCategories.includes(category)
        ? prev.allowedCategories.filter((entry) => entry !== category)
        : [...prev.allowedCategories, category],
    }));
  }

  async function saveSender() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/email/senders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-sender",
        ...form,
        id: form.id || undefined,
        replyToAddress: form.replyToAddress || undefined,
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

  async function assignCategory(category: EmailCategoryClient, defaultSenderId: string) {
    const response = await fetch("/api/admin/email/senders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assign-category",
        category,
        defaultSenderId: defaultSenderId || null,
      }),
    });

    const json = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: { message: string };
    };

    setMessage(json.message ?? json.error?.message ?? "Zuordnung gespeichert.");
    if (json.success) {
      await load();
    }
  }

  return (
    <AdminEmailNav>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Absenderadresse anlegen
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            Nur verifizierte und aktive Absender dürfen versenden. Markiere eine Adresse
            erst als verifiziert, wenn sie beim Provider eingerichtet ist.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className={labelClassName}>Provider</span>
              <select
                className={inputClassName}
                value={form.providerConfigId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, providerConfigId: e.target.value }))
                }
              >
                <option value="">Bitte wählen</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>Interner Name</span>
                <input
                  className={inputClassName}
                  value={form.internalName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, internalName: e.target.value }))
                  }
                  placeholder="support"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Anzeigename</span>
                <input
                  className={inputClassName}
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="Alles Wurst Support"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>E-Mail-Adresse (From)</span>
                <input
                  className={inputClassName}
                  value={form.emailAddress}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, emailAddress: e.target.value }))
                  }
                  placeholder="support@deine-domain.de"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Reply-To (optional)</span>
                <input
                  className={inputClassName}
                  value={form.replyToAddress}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, replyToAddress: e.target.value }))
                  }
                  placeholder="support@deine-domain.de"
                />
              </label>
            </div>

            <fieldset>
              <legend className={labelClassName}>Erlaubte Kategorien</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {EMAIL_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center gap-2 text-sm text-aw-cream">
                    <input
                      type="checkbox"
                      checked={form.allowedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    {EMAIL_CATEGORY_LABELS[category]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap gap-4 text-sm text-aw-cream">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Aktiv
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.verified}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, verified: e.target.checked }))
                  }
                />
                Verifiziert
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.defaultSender}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, defaultSender: e.target.checked }))
                  }
                />
                Standard-Absender
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={primaryButtonClassName}
                disabled={loading}
                onClick={() => void saveSender()}
              >
                {form.id ? "Absender aktualisieren" : "Absender anlegen"}
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

        <div className="space-y-6">
          {loadError ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {loadError}
            </p>
          ) : null}

          <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">Absender</h2>
            <ul className="mt-4 space-y-3">
              {initialLoading ? (
                <li className="text-sm text-aw-muted">Lade …</li>
              ) : senders.length > 0 ? (
                senders.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-lg border border-aw-border/70 p-3 text-sm text-aw-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-aw-cream">
                          {row.displayName} &lt;{row.emailAddress}&gt;
                        </p>
                        <p>
                          {row.verified ? "verifiziert" : "nicht verifiziert"} ·{" "}
                          {row.active ? "aktiv" : "inaktiv"}
                          {row.defaultSender ? " · Standard" : ""}
                        </p>
                        <p className="text-xs">Provider: {row.providerName}</p>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-aw-gold hover:underline"
                        onClick={() => editSender(row)}
                      >
                        Bearbeiten
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li>Noch keine Absender angelegt.</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Standard je Kategorie
            </h2>
            <p className="mt-2 text-sm text-aw-muted">
              Welche Absenderadresse für welche E-Mail-Kategorie verwendet wird.
            </p>
            <ul className="mt-4 space-y-3">
              {initialLoading ? (
                <li className="text-sm text-aw-muted">Lade …</li>
              ) : (
                categories.map((row) => (
                <li key={row.id} className="text-sm text-aw-muted">
                  <label className="block">
                    <span className="text-aw-cream">{EMAIL_CATEGORY_LABELS[row.category]}</span>
                    <select
                      className={`${inputClassName} mt-1`}
                      value={row.defaultSenderId ?? ""}
                      onChange={(e) =>
                        void assignCategory(row.category, e.target.value)
                      }
                    >
                      <option value="">— keiner —</option>
                      {senders
                        .filter((sender) => sender.verified && sender.active)
                        .map((sender) => (
                          <option key={sender.id} value={sender.id}>
                            {sender.displayName} ({sender.emailAddress})
                          </option>
                        ))}
                    </select>
                  </label>
                </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </AdminEmailNav>
  );
}
