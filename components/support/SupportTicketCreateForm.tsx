"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import type { SupportCategoryEntry } from "@/lib/support/support-types";
import type { SupportTicketPriority } from "@prisma/client";

import { trackAnalyticsEvent } from "@/lib/analytics/analytics-client";

type SupportTicketCreateFormProps = {
  defaultCategorySlug?: string;
  lockCategory?: boolean;
  hidePriority?: boolean;
  successRedirectBase?: string;
  cancelHref?: string;
  showPageHeader?: boolean;
};

async function fetchCategories(): Promise<SupportCategoryEntry[]> {
  const response = await fetch("/api/support/categories", {
    credentials: "include",
  });
  const json = (await response.json()) as {
    success: boolean;
    data?: SupportCategoryEntry[];
    error?: { message: string };
  };

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "Kategorien konnten nicht geladen werden.");
  }

  return json.data;
}

export default function SupportTicketCreateForm({
  defaultCategorySlug,
  lockCategory = false,
  hidePriority = false,
  successRedirectBase = "/mein-bereich/support",
  cancelHref,
  showPageHeader = true,
}: SupportTicketCreateFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<SupportCategoryEntry[]>([]);
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<SupportTicketPriority>("normal");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCategories()
      .then((data) => {
        setCategories(data);
        const preferred = defaultCategorySlug
          ? data.find((category) => category.slug === defaultCategorySlug)
          : undefined;
        setCategoryId(preferred?.id ?? data[0]?.id ?? "");
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kategorien konnten nicht geladen werden.",
        );
      });
  }, [defaultCategorySlug]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          categoryId,
          priority: hidePriority ? "normal" : priority,
          message,
        }),
      });

      const json = (await response.json()) as {
        success: boolean;
        data?: { ticketNumber: string };
        error?: { message: string };
      };

      if (!json.success || !json.data) {
        throw new Error(json.error?.message ?? "Ticket konnte nicht erstellt werden.");
      }

      if (searchParams.get("fromFaq") === "1") {
        trackAnalyticsEvent("help_ticket_from_faq", {
          faqSlug: searchParams.get("faqSlug") ?? null,
          subject: subject.trim().slice(0, 120),
        });
      }

      if (files && files.length > 0) {
        const formData = new FormData();

        for (const file of Array.from(files)) {
          formData.append("files", file);
        }

        await fetch(
          `/api/support/tickets/${encodeURIComponent(json.data.ticketNumber)}/attachments`,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          },
        );
      }

      router.push(
        `${successRedirectBase}/${encodeURIComponent(json.data.ticketNumber)}`,
      );
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Ticket konnte nicht erstellt werden.",
      );
      setLoading(false);
    }
  }

  const cancelTarget = cancelHref ?? successRedirectBase;

  return (
    <div className={showPageHeader ? "mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6" : "space-y-6"}>
      {showPageHeader && (
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Neues Support-Ticket
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Beschreibe dein Anliegen — wir antworten in deinem Ticket-Posteingang.
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <div>
          <label className="mb-1 block text-sm text-aw-muted">Betreff *</label>
          <input
            className={inputClassName}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Kurze Zusammenfassung"
          />
        </div>

        <div className={`grid gap-4 ${hidePriority ? "" : "sm:grid-cols-2"}`}>
          <div>
            <label className="mb-1 block text-sm text-aw-muted">Kategorie *</label>
            <select
              className={inputClassName}
              value={categoryId}
              disabled={lockCategory}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {!hidePriority && (
            <div>
              <label className="mb-1 block text-sm text-aw-muted">Priorität *</label>
              <select
                className={inputClassName}
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as SupportTicketPriority)
                }
              >
                <option value="normal">Normal</option>
                <option value="important">Wichtig</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm text-aw-muted">Nachricht *</label>
          <textarea
            className={`${inputClassName} min-h-40 w-full`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Bitte beschreibe dein Anliegen so genau wie möglich …"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-aw-muted">
            Anhang (optional, max. 3 Dateien à 10 MB)
          </label>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,image/*,application/pdf,text/plain"
            onChange={(event) => setFiles(event.target.files)}
            className="block w-full text-sm text-aw-muted file:mr-3 file:rounded-lg file:border-0 file:bg-aw-gold file:px-3 file:py-2 file:text-sm file:font-semibold file:text-aw-bg"
          />
        </div>

        {error && <p className="text-sm text-aw-warning">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={loading || !subject.trim() || !message.trim() || !categoryId}
            onClick={() => void handleSubmit()}
          >
            {loading ? "Wird gesendet …" : "Ticket erstellen"}
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => router.push(cancelTarget)}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
