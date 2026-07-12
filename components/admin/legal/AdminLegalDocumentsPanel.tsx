"use client";

import { useState } from "react";

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  LEGAL_INTEGRATION_MODE_LABELS,
  type LegalDocumentAdminEntry,
} from "@/lib/legal/legal-types";

type AdminLegalDocumentsPanelProps = {
  initialDocuments: LegalDocumentAdminEntry[];
};

type DocumentFormState = {
  providerName: string;
  externalUrl: string;
  externalDocumentId: string;
  integrationMode: string;
  autoPublish: boolean;
  publicVisible: boolean;
};

function toFormState(document: LegalDocumentAdminEntry): DocumentFormState {
  return {
    providerName: document.providerName ?? "",
    externalUrl: document.externalUrl ?? "",
    externalDocumentId: document.externalDocumentId ?? "",
    integrationMode: document.integrationMode,
    autoPublish: document.autoPublish,
    publicVisible: document.publicVisible,
  };
}

export default function AdminLegalDocumentsPanel({
  initialDocuments,
}: AdminLegalDocumentsPanelProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentFormState | null>(null);

  async function refreshDocuments() {
    const refresh = await fetch("/api/admin/legal/documents", {
      credentials: "include",
    });
    const refreshed = (await refresh.json()) as {
      success: boolean;
      data?: LegalDocumentAdminEntry[];
    };

    if (refreshed.success && refreshed.data) {
      setDocuments(refreshed.data);
    }
  }

  async function syncDocument(documentId: string) {
    setLoadingId(documentId);
    setMessage(null);

    const response = await fetch("/api/admin/legal/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });

    const json = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    setLoadingId(null);

    if (!json.success) {
      setMessage(json.error?.message ?? "Synchronisierung fehlgeschlagen.");
      return;
    }

    setMessage("Synchronisierung abgeschlossen.");
    await refreshDocuments();
  }

  async function syncAll() {
    setLoadingId("all");
    setMessage(null);

    await fetch("/api/admin/legal/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    setLoadingId(null);
    setMessage("Alle Dokumente synchronisiert.");
    await refreshDocuments();
  }

  function startEditing(document: LegalDocumentAdminEntry) {
    setEditingId(document.id);
    setForm(toFormState(document));
    setMessage(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(null);
  }

  async function saveDocument(documentId: string) {
    if (!form) {
      return;
    }

    setLoadingId(`save-${documentId}`);
    setMessage(null);

    const response = await fetch(`/api/admin/legal/documents/${documentId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: LegalDocumentAdminEntry;
      error?: { message: string };
    };

    setLoadingId(null);

    if (!json.success || !json.data) {
      setMessage(json.error?.message ?? "Speichern fehlgeschlagen.");
      return;
    }

    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId ? json.data! : document,
      ),
    );
    setMessage("Einstellungen gespeichert.");
    setEditingId(null);
    setForm(null);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-aw-muted">
        Trage pro Dokument die <strong className="text-aw-cream">externe URL</strong>{" "}
        deines Rechtstexte-Anbieters ein, wähle die Einbindungsart und
        synchronisiere anschließend den Inhalt.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void syncAll()}
          disabled={loadingId === "all"}
          className={primaryButtonClassName}
        >
          Alle synchronisieren
        </button>
      </div>

      {message && (
        <p className="rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm text-aw-muted">
          {message}
        </p>
      )}

      <div className="space-y-4">
        {documents.map((document) => {
          const isEditing = editingId === document.id;

          return (
            <div
              key={document.id}
              className="rounded-xl border border-aw-border bg-aw-surface"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
                <div>
                  <p className="font-semibold text-aw-cream">{document.title}</p>
                  <p className="text-xs text-aw-muted">
                    /{document.slug} · {document.status}
                    {document.currentVersionNumber
                      ? ` · v${document.currentVersionNumber}`
                      : ""}
                  </p>
                  {document.externalUrl && !isEditing && (
                    <p className="mt-1 truncate text-xs text-aw-gold">
                      {document.externalUrl}
                    </p>
                  )}
                  {document.lastErrorMessage && (
                    <p className="mt-1 text-xs text-aw-warning">
                      {document.lastErrorMessage}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isEditing ? cancelEditing() : startEditing(document)
                    }
                    className={secondaryButtonClassName}
                  >
                    {isEditing ? "Abbrechen" : "Bearbeiten"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void syncDocument(document.id)}
                    disabled={loadingId === document.id || !document.externalUrl}
                    className={secondaryButtonClassName}
                    title={
                      document.externalUrl
                        ? "Inhalt von externer URL abrufen"
                        : "Zuerst externe URL hinterlegen"
                    }
                  >
                    Sync
                  </button>
                </div>
              </div>

              {isEditing && form && (
                <form
                  className="space-y-4 border-t border-aw-border px-4 py-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveDocument(document.id);
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block md:col-span-2">
                      <span className={labelClassName}>
                        Externe URL (Link zum Rechtstext)
                      </span>
                      <input
                        className={inputClassName}
                        value={form.externalUrl}
                        onChange={(event) =>
                          setForm({ ...form, externalUrl: event.target.value })
                        }
                        placeholder="https://itrk.legal/…-iframe.html"
                      />
                      <span className="mt-1 block text-xs text-aw-muted">
                        IT-Recht-Kanzlei: Iframe-URL (
                        <code>…-iframe.html</code>) bei Einbindungsart
                        „Iframe“ — oder HTML-URL bei „HTML-Abruf“ + Sync.
                        Domain muss freigegeben sein (
                        <code>itrk.legal</code>,{" "}
                        <code>it-recht-kanzlei.de</code>).
                      </span>
                    </label>

                    <label className="block">
                      <span className={labelClassName}>Anbietername</span>
                      <input
                        className={inputClassName}
                        value={form.providerName}
                        onChange={(event) =>
                          setForm({ ...form, providerName: event.target.value })
                        }
                        placeholder="z. B. eRecht24"
                      />
                    </label>

                    <label className="block">
                      <span className={labelClassName}>Einbindungsart</span>
                      <select
                        className={inputClassName}
                        value={form.integrationMode}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            integrationMode: event.target.value,
                          })
                        }
                      >
                        {Object.entries(LEGAL_INTEGRATION_MODE_LABELS).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label className="block md:col-span-2">
                      <span className={labelClassName}>
                        Externe Dokument-ID (optional)
                      </span>
                      <input
                        className={inputClassName}
                        value={form.externalDocumentId}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            externalDocumentId: event.target.value,
                          })
                        }
                        placeholder="ID beim Rechtstexte-Anbieter"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-aw-cream">
                      <input
                        type="checkbox"
                        checked={form.autoPublish}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            autoPublish: event.target.checked,
                          })
                        }
                        className="accent-aw-gold"
                      />
                      Änderungen automatisch veröffentlichen
                    </label>

                    <label className="flex items-center gap-2 text-sm text-aw-cream">
                      <input
                        type="checkbox"
                        checked={form.publicVisible}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            publicVisible: event.target.checked,
                          })
                        }
                        className="accent-aw-gold"
                      />
                      Öffentlich sichtbar
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingId === `save-${document.id}`}
                    className={primaryButtonClassName}
                  >
                    {loadingId === `save-${document.id}`
                      ? "Speichern …"
                      : "Einstellungen speichern"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
