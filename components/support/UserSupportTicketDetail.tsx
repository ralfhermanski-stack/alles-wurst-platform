"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SupportPriorityBadge,
  SupportStatusBadge,
} from "@/components/support/SupportBadges";
import SupportConversation from "@/components/support/SupportConversation";
import ForumComposer from "@/components/forums/ForumComposer";
import type { SupportTicketDetail } from "@/lib/support/support-types";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

async function fetchTicket(ticketNumber: string): Promise<SupportTicketDetail> {
  const response = await fetch(
    `/api/support/tickets/${encodeURIComponent(ticketNumber)}`,
    { credentials: "include" },
  );
  const json = (await response.json()) as {
    success: boolean;
    data?: SupportTicketDetail;
    error?: { message: string };
  };

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "Ticket nicht gefunden.");
  }

  return json.data;
}

export default function UserSupportTicketDetail({
  ticketNumber,
  backHref = "/mein-bereich/support",
}: {
  ticketNumber: string;
  backHref?: string;
  ticketBasePath?: string;
}) {
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      setTicket(await fetchTicket(ticketNumber));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [ticketNumber]);

  async function sendReply(body: string) {
    const response = await fetch(
      `/api/support/tickets/${encodeURIComponent(ticketNumber)}/messages`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      },
    );
    const json = (await response.json()) as { success: boolean };

    if (!json.success) {
      return false;
    }

    await reload();
    return true;
  }

  async function markResolved() {
    const response = await fetch(
      `/api/support/tickets/${encodeURIComponent(ticketNumber)}/resolve`,
      { method: "POST", credentials: "include" },
    );
    const json = (await response.json()) as { success: boolean; error?: { message: string } };

    if (!json.success) {
      setError(json.error?.message ?? "Aktion fehlgeschlagen.");
      return;
    }

    setSuccess("Ticket als erledigt markiert.");
    await reload();
  }

  async function submitRating() {
    const response = await fetch(
      `/api/support/tickets/${encodeURIComponent(ticketNumber)}/rate`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: ratingComment }),
      },
    );
    const json = (await response.json()) as { success: boolean; error?: { message: string } };

    if (!json.success) {
      setError(json.error?.message ?? "Bewertung fehlgeschlagen.");
      return;
    }

    setSuccess("Danke für deine Bewertung!");
    await reload();
  }

  if (loading) {
    return <p className="px-4 py-8 text-sm text-aw-muted">Wird geladen …</p>;
  }

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-aw-warning">{error}</p>
        <Link href={backHref} className="mt-4 inline-block text-aw-gold">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Link href={backHref} className="text-sm text-aw-gold hover:underline">
        ← Zurück zu Meine Tickets
      </Link>

      <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-aw-muted">{ticket.ticketNumber}</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-aw-cream">
              {ticket.subject}
            </h1>
            <p className="mt-2 text-sm text-aw-muted">{ticket.categoryName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SupportStatusBadge status={ticket.status} />
            <SupportPriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {ticket.userHasReminder && (
          <p className="mt-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-200">
            Bitte antworte auf unsere Rückfrage — das Ticket wartet auf dich.
          </p>
        )}
      </div>

      {success && <p className="text-sm text-green-400">{success}</p>}
      {error && <p className="text-sm text-aw-warning">{error}</p>}

      <SupportConversation messages={ticket.messages} />

      {ticket.canReply && (
        <ForumComposer
          placeholder="Deine Antwort …"
          submitLabel="Antwort senden"
          onSubmit={sendReply}
        />
      )}

      {ticket.canMarkResolved && (
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={() => void markResolved()}
        >
          Als erledigt markieren
        </button>
      )}

      {ticket.canRate && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h2 className="font-semibold text-aw-cream">Wie zufrieden warst du?</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              className="rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
              value={rating}
              onChange={(event) => setRating(Number.parseInt(event.target.value, 10))}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} Sterne
                </option>
              ))}
            </select>
            <input
              className="min-w-[220px] flex-1 rounded-lg border border-aw-border bg-aw-bg px-3 py-2 text-sm text-aw-cream"
              placeholder="Optionaler Kommentar"
              value={ratingComment}
              onChange={(event) => setRatingComment(event.target.value)}
            />
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={() => void submitRating()}
            >
              Bewertung senden
            </button>
          </div>
        </section>
      )}

      {ticket.rating && (
        <p className="text-sm text-aw-muted">
          Deine Bewertung: {ticket.rating}/5
          {ticket.ratingComment ? ` — ${ticket.ratingComment}` : ""}
        </p>
      )}
    </div>
  );
}
