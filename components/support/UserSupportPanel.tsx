"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SupportPriorityBadge,
  SupportStatusBadge,
} from "@/components/support/SupportBadges";
import type { SupportInboxSummary, SupportTicketSummary } from "@/lib/support/support-types";
import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  const json = (await response.json()) as { success: boolean; data?: T; error?: { message: string } };

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? "Laden fehlgeschlagen.");
  }

  return json.data;
}

function TicketRow({
  ticket,
  ticketBasePath,
}: {
  ticket: SupportTicketSummary;
  ticketBasePath: string;
}) {
  return (
    <Link
      href={`${ticketBasePath}/${encodeURIComponent(ticket.ticketNumber)}`}
      className="block rounded-xl border border-aw-border bg-aw-surface/40 p-4 transition-colors hover:border-aw-gold/40 hover:bg-aw-surface/60"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-aw-muted">{ticket.ticketNumber}</p>
          <h3 className="mt-1 font-medium text-aw-cream">{ticket.subject}</h3>
          <p className="mt-1 text-sm text-aw-muted">{ticket.categoryName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SupportStatusBadge status={ticket.status} />
          <SupportPriorityBadge priority={ticket.priority} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-aw-muted">
        <span>
          Aktualisiert:{" "}
          {new Intl.DateTimeFormat("de-DE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(ticket.updatedAt))}
        </span>
        {ticket.userUnreadCount > 0 && (
          <span className="rounded-full bg-aw-gold/20 px-2 py-0.5 text-aw-gold">
            {ticket.userUnreadCount} neu
          </span>
        )}
        {ticket.userHasReminder && (
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-300">
            Erinnerung
          </span>
        )}
      </div>
    </Link>
  );
}

export default function UserSupportPanel({
  ticketBasePath = "/mein-bereich/support",
}: {
  ticketBasePath?: string;
}) {
  const [inbox, setInbox] = useState<SupportInboxSummary | null>(null);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [inboxData, ticketData] = await Promise.all([
        fetchJson<SupportInboxSummary>("/api/support/inbox"),
        fetchJson<SupportTicketSummary[]>("/api/support/tickets"),
      ]);

      setInbox(inboxData);
      setTickets(ticketData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = tickets.filter((ticket) => {
    if (!query.trim()) {
      return true;
    }

    const q = query.trim().toLowerCase();

    return (
      ticket.ticketNumber.toLowerCase().includes(q) ||
      ticket.subject.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Meine Tickets
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Dein persönlicher Support-Posteingang — Antworten erscheinen hier.
          </p>
        </div>
        <Link href={`${ticketBasePath}/neu`} className={primaryButtonClassName}>
          Neues Ticket
        </Link>
      </div>

      {inbox && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-aw-border bg-aw-surface p-4">
            <p className="text-sm text-aw-muted">Ungelesen</p>
            <p className="mt-1 font-display text-2xl font-bold text-aw-gold">
              {inbox.unreadCount}
            </p>
          </div>
          <div className="rounded-xl border border-aw-border bg-aw-surface p-4">
            <p className="text-sm text-aw-muted">Offen</p>
            <p className="mt-1 font-display text-2xl font-bold text-aw-cream">
              {inbox.openCount}
            </p>
          </div>
          <div className="rounded-xl border border-aw-border bg-aw-surface p-4">
            <p className="text-sm text-aw-muted">Erinnerungen</p>
            <p className="mt-1 font-display text-2xl font-bold text-violet-300">
              {inbox.reminderCount}
            </p>
          </div>
        </div>
      )}

      <input
        className={inputClassName}
        placeholder="Suche nach Betreff oder Ticketnummer …"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
          Noch keine Tickets vorhanden. Erstelle dein erstes Support-Ticket.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} ticketBasePath={ticketBasePath} />
        ))}
      </div>
    </div>
  );
}
