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

const DEFAULT_ALLOWED_VARIABLES = [
  "publicName",
  "firstName",
  "email",
  "courseName",
  "orderNumber",
  "ticketNumber",
  "withdrawalNumber",
  "privacyRequestNumber",
  "challengeTitle",
  "verificationUrl",
  "resetUrl",
  "accountUrl",
  "supportUrl",
  "documentDownloadUrl",
  "actionUrl",
  "productName",
  "amount",
  "bodyHtml",
];

type TemplateRow = {
  id: string;
  key: string;
  name: string;
  category: EmailCategoryClient;
  status: string;
  activeVersion: number | null;
  activeVersionStatus: string | null;
  updatedAt: string;
};

type TemplateForm = {
  id: string;
  key: string;
  name: string;
  category: EmailCategoryClient;
  preheader: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  allowedVariables: string[];
  testRecipientEmail: string;
};

const EMPTY_FORM: TemplateForm = {
  id: "",
  key: "",
  name: "",
  category: "SYSTEM",
  preheader: "",
  subject: "",
  htmlContent: "<p>Hallo {{firstName}},</p>\n<p>…</p>",
  textContent: "Hallo {{firstName}},\n\n…\n",
  allowedVariables: ["firstName"],
  testRecipientEmail: "",
};

export default function AdminEmailTemplatesPanel() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);

    try {
      const response = await fetch("/api/admin/email/templates", { credentials: "include" });
      const json = (await response.json()) as {
        success: boolean;
        data?: TemplateRow[];
        error?: { message?: string };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? "Vorlagen konnten nicht geladen werden.");
      }

      setTemplates(json.data);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Vorlagen konnten nicht geladen werden.",
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadTemplateDetail(id: string) {
    const response = await fetch(`/api/admin/email/templates?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: TemplateForm & {
        category: EmailCategoryClient;
        key: string;
        name: string;
      };
      error?: { message?: string };
    };

    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.error?.message ?? "Vorlage konnte nicht geladen werden.");
    }

    setForm({
      id: json.data.id,
      key: json.data.key,
      name: json.data.name,
      category: json.data.category,
      preheader: json.data.preheader,
      subject: json.data.subject,
      htmlContent: json.data.htmlContent,
      textContent: json.data.textContent,
      allowedVariables: json.data.allowedVariables,
      testRecipientEmail: form.testRecipientEmail,
    });
    setIsCreateMode(false);
    setMessage(null);
  }

  function startCreate() {
    setForm(EMPTY_FORM);
    setIsCreateMode(true);
    setMessage(null);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setIsCreateMode(false);
    setMessage(null);
  }

  function toggleVariable(variable: string) {
    setForm((prev) => ({
      ...prev,
      allowedVariables: prev.allowedVariables.includes(variable)
        ? prev.allowedVariables.filter((entry) => entry !== variable)
        : [...prev.allowedVariables, variable],
    }));
  }

  async function saveTemplate() {
    setLoading(true);
    setMessage(null);

    const action = isCreateMode || !form.id ? "create" : "save";
    const payload =
      action === "create"
        ? {
            action,
            key: form.key,
            name: form.name,
            category: form.category,
            subject: form.subject,
            preheader: form.preheader || undefined,
            htmlContent: form.htmlContent,
            textContent: form.textContent,
            allowedVariables: form.allowedVariables,
          }
        : {
            action,
            id: form.id,
            name: form.name,
            category: form.category,
            subject: form.subject,
            preheader: form.preheader || undefined,
            htmlContent: form.htmlContent,
            textContent: form.textContent,
            allowedVariables: form.allowedVariables,
          };

    const response = await fetch("/api/admin/email/templates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as {
      success: boolean;
      message?: string;
      data?: { id: string; key: string };
      error?: { message: string };
    };

    setLoading(false);
    setMessage(json.message ?? json.error?.message ?? "Gespeichert.");

    if (json.success) {
      setIsCreateMode(false);
      if (json.data?.id) {
        await loadTemplateDetail(json.data.id);
      }
      await load();
    }
  }

  async function sendTestEmail() {
    if (!form.key.trim() || !form.testRecipientEmail.trim()) {
      setMessage("Bitte Vorlagen-Schlüssel und Testempfänger angeben.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/email/templates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "test",
        key: form.key,
        testRecipientEmail: form.testRecipientEmail,
      }),
    });

    const json = (await response.json()) as {
      success: boolean;
      message?: string;
      error?: { message: string };
    };

    setLoading(false);
    setMessage(json.message ?? json.error?.message ?? "Test versendet.");
  }

  return (
    <AdminEmailNav>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-aw-cream">
                {isCreateMode || !form.id ? "Neue Vorlage anlegen" : "Vorlage bearbeiten"}
              </h2>
              <p className="mt-2 text-sm text-aw-muted">
                Platzhalter im Format <code className="text-aw-gold">{"{{firstName}}"}</code>{" "}
                verwenden. Änderungen an Standardvorlagen wirken sofort nach dem Speichern.
              </p>
            </div>
            <button type="button" className={secondaryButtonClassName} onClick={startCreate}>
              Neue Vorlage
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClassName}>Interner Schlüssel</span>
                <input
                  className={inputClassName}
                  value={form.key}
                  disabled={!!form.id}
                  onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="z. B. custom.welcome"
                />
              </label>
              <label className="block">
                <span className={labelClassName}>Anzeigename</span>
                <input
                  className={inputClassName}
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Willkommensmail"
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClassName}>Kategorie</span>
              <select
                className={inputClassName}
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as EmailCategoryClient,
                  }))
                }
              >
                {EMAIL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {EMAIL_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClassName}>Betreff</span>
              <input
                className={inputClassName}
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Betreff mit {{platzhaltern}}"
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Preheader (optional)</span>
              <input
                className={inputClassName}
                value={form.preheader}
                onChange={(e) => setForm((prev) => ({ ...prev, preheader: e.target.value }))}
                placeholder="Kurzvorschau in Postfächern"
              />
            </label>

            <label className="block">
              <span className={labelClassName}>HTML-Inhalt</span>
              <textarea
                className={`${inputClassName} min-h-40 font-mono text-xs`}
                value={form.htmlContent}
                onChange={(e) => setForm((prev) => ({ ...prev, htmlContent: e.target.value }))}
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Text-Inhalt</span>
              <textarea
                className={`${inputClassName} min-h-28 font-mono text-xs`}
                value={form.textContent}
                onChange={(e) => setForm((prev) => ({ ...prev, textContent: e.target.value }))}
              />
            </label>

            <fieldset>
              <legend className={labelClassName}>Erlaubte Platzhalter</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_ALLOWED_VARIABLES.map((variable) => (
                  <label key={variable} className="flex items-center gap-2 text-sm text-aw-cream">
                    <input
                      type="checkbox"
                      checked={form.allowedVariables.includes(variable)}
                      onChange={() => toggleVariable(variable)}
                    />
                    <code className="text-xs text-aw-muted">{`{{${variable}}}`}</code>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className={labelClassName}>Testempfänger (optional)</span>
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
                onClick={() => void saveTemplate()}
              >
                {isCreateMode || !form.id ? "Vorlage anlegen" : "Änderungen speichern"}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={loading || !form.key}
                onClick={() => void sendTestEmail()}
              >
                Test senden
              </button>
              {(form.id || isCreateMode) && (
                <button type="button" className={secondaryButtonClassName} onClick={resetForm}>
                  Abbrechen
                </button>
              )}
            </div>

            {message && <p className="text-sm text-aw-muted">{message}</p>}
          </div>
        </section>

        <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h2 className="font-display text-lg font-bold text-aw-cream">Vorhandene Vorlagen</h2>
          {loadError ? <p className="mt-4 text-sm text-red-300">{loadError}</p> : null}
          <ul className="mt-4 space-y-3">
            {initialLoading ? (
              <li className="text-sm text-aw-muted">Lade …</li>
            ) : templates.length > 0 ? (
              templates.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-aw-border/70 p-3 text-sm text-aw-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-aw-cream">{row.name}</p>
                      <p>
                        <code className="text-xs text-aw-gold">{row.key}</code>
                      </p>
                      <p>
                        {EMAIL_CATEGORY_LABELS[row.category]} · {row.status}
                        {row.activeVersion ? ` · v${row.activeVersion}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-aw-gold hover:underline"
                      onClick={() => void loadTemplateDetail(row.id).catch((error: unknown) => {
                        setMessage(
                          error instanceof Error
                            ? error.message
                            : "Vorlage konnte nicht geladen werden.",
                        );
                      })}
                    >
                      Bearbeiten
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li>Noch keine Vorlagen vorhanden.</li>
            )}
          </ul>
        </section>
      </div>
    </AdminEmailNav>
  );
}
