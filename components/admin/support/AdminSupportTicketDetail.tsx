"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SupportPriorityBadge,
  SupportStatusBadge,
} from "@/components/support/SupportBadges";
import SupportConversation from "@/components/support/SupportConversation";
import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/lib/support/support-labels";
import type {
  SupportStaffEntry,
  SupportTemplateEntry,
  SupportTicketDetail,
} from "@/lib/support/support-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import type { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";

export default function AdminSupportTicketDetail({
  ticketNumber,
}: {
  ticketNumber: string;
}) {
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [staff, setStaff] = useState<SupportStaffEntry[]>([]);
  const [templates, setTemplates] = useState<SupportTemplateEntry[]>([]);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [assignComment, setAssignComment] = useState("");
  const [setWaitingUser, setSetWaitingUserFlag] = useState(false);
  const [status, setStatus] = useState<SupportTicketStatus>("open");
  const [priority, setPriority] = useState<SupportTicketPriority>("normal");
  const [closureNote, setClosureNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [ticketRes, staffRes, templatesRes] = await Promise.all([
      adminFetch<SupportTicketDetail>(
        `/api/admin/support/tickets/${encodeURIComponent(ticketNumber)}`,
      ),
      adminFetch<SupportStaffEntry[]>("/api/admin/support/staff"),
      adminFetch<SupportTemplateEntry[]>("/api/admin/support/templates"),
    ]);

    if (!ticketRes.success) {
      setError(ticketRes.error.message);
      setLoading(false);
      return;
    }

    setTicket(ticketRes.data);
    setStatus(ticketRes.data.status);
    setPriority(ticketRes.data.priority);
    setClosureNote(ticketRes.data.closureNote ?? "");
    setAssigneeId(ticketRes.data.assignedToUserId ?? "");
    setStaff(staffRes.success ? staffRes.data : []);
    setTemplates(templatesRes.success ? templatesRes.data : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, [ticketNumber]);

  async function sendReply() {
    const response = await adminFetch<unknown>(
      `/api/admin/support/tickets/${encodeURIComponent(ticketNumber)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ body: reply, setWaitingUser }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setReply("");
    setSuccess("Antwort gesendet.");
    await loadData();
  }

  async function saveInternalNote() {
    const response = await adminFetch<unknown>(
      `/api/admin/support/tickets/${encodeURIComponent(ticketNumber)}/internal-notes`,
      {
        method: "POST",
        body: JSON.stringify({ body: internalNote }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setInternalNote("");
    setSuccess("Interne Notiz gespeichert.");
    await loadData();
  }

  async function saveAssignment() {
    const response = await adminFetch<unknown>(
      `/api/admin/support/tickets/${encodeURIComponent(ticketNumber)}/assign`,
      {
        method: "POST",
        body: JSON.stringify({
          assigneeUserId: assigneeId,
          internalComment: assignComment || null,
        }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setAssignComment("");
    setSuccess("Bearbeiter aktualisiert.");
    await loadData();
  }

  async function saveMeta() {
    const response = await adminFetch<unknown>(
      `/api/admin/support/tickets/${encodeURIComponent(ticketNumber)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, priority, closureNote }),
      },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Ticket aktualisiert.");
    await loadData();
  }

  async function anonymizeTicket() {
    if (!window.confirm("Ticket wirklich anonymisieren?")) {
      return;
    }

    const response = await adminFetch<unknown>(
      `/api/admin/support/tickets/${encodeURIComponent(ticketNumber)}/anonymize`,
      { method: "POST" },
    );

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setSuccess("Ticket anonymisiert.");
    await loadData();
  }

  if (loading) {
    return <p className="px-4 py-8 text-sm text-aw-muted">Wird geladen …</p>;
  }

  if (!ticket) {
    return (
      <div className="px-4 py-8">
        <p className="text-sm text-aw-warning">{error ?? "Ticket nicht gefunden."}</p>
        <Link href="/admin/support" className="mt-4 inline-block text-aw-gold">
          Zurück
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/admin/support" className="text-sm text-aw-gold hover:underline">
        ← Zurück zur Übersicht
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-aw-muted">{ticket.ticketNumber}</p>
                <h1 className="mt-1 font-display text-2xl font-bold text-aw-cream">
                  {ticket.subject}
                </h1>
                <p className="mt-2 text-sm text-aw-muted">
                  {ticket.userDisplayName} · {ticket.userEmail}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <SupportStatusBadge status={ticket.status} />
                <SupportPriorityBadge priority={ticket.priority} />
              </div>
            </div>
            {ticket.isOverdue && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                Überfällig — bitte zeitnah bearbeiten.
              </p>
            )}
          </section>

          {success && <p className="text-sm text-green-400">{success}</p>}
          {error && <p className="text-sm text-aw-warning">{error}</p>}

          <SupportConversation messages={ticket.messages} />

          {ticket.canReply && (
            <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5 space-y-3">
              <h2 className="font-semibold text-aw-cream">Öffentliche Antwort</h2>
              {templates.length > 0 && (
                <select
                  className={inputClassName}
                  defaultValue=""
                  onChange={(event) => {
                    const template = templates.find((entry) => entry.id === event.target.value);
                    if (template) setReply(template.body);
                  }}
                >
                  <option value="">Antwortvorlage wählen …</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.title}</option>
                  ))}
                </select>
              )}
              <textarea
                className={`${inputClassName} min-h-32 w-full`}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Antwort an den Nutzer …"
              />
              <label className="flex items-center gap-2 text-sm text-aw-cream">
                <input
                  type="checkbox"
                  checked={setWaitingUser}
                  onChange={(event) => setSetWaitingUserFlag(event.target.checked)}
                />
                Rückfrage an User (Status: wartet auf User)
              </label>
              <button type="button" className={primaryButtonClassName} onClick={() => void sendReply()}>
                Antwort senden
              </button>
            </section>
          )}

          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5 space-y-3">
            <h2 className="font-semibold text-aw-cream">Interne Notiz</h2>
            <textarea
              className={`${inputClassName} min-h-24 w-full`}
              value={internalNote}
              onChange={(event) => setInternalNote(event.target.value)}
              placeholder="Nur für Admins/Bearbeiter sichtbar …"
            />
            <button type="button" className={secondaryButtonClassName} onClick={() => void saveInternalNote()}>
              Notiz speichern
            </button>
            {ticket.internalNotes && ticket.internalNotes.length > 0 && (
              <div className="space-y-2 pt-2">
                {ticket.internalNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                    <p className="font-medium text-amber-200">{note.authorDisplayName}</p>
                    <p className="mt-1 whitespace-pre-wrap text-aw-cream/90">{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-4 space-y-3">
            <h2 className="font-semibold text-aw-cream">Status & Priorität</h2>
            <select className={inputClassName} value={status} onChange={(e) => setStatus(e.target.value as SupportTicketStatus)}>
              {Object.entries(SUPPORT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select className={inputClassName} value={priority} onChange={(e) => setPriority(e.target.value as SupportTicketPriority)}>
              {Object.entries(SUPPORT_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <textarea
              className={`${inputClassName} min-h-20 w-full`}
              value={closureNote}
              onChange={(event) => setClosureNote(event.target.value)}
              placeholder="Abschlusskommentar (optional)"
            />
            <button type="button" className={primaryButtonClassName} onClick={() => void saveMeta()}>
              Speichern
            </button>
          </section>

          <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-4 space-y-3">
            <h2 className="font-semibold text-aw-cream">Bearbeiter</h2>
            <select className={inputClassName} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Nicht zugewiesen</option>
              {staff.map((member) => (
                <option key={member.userId} value={member.userId}>{member.displayName}</option>
              ))}
            </select>
            <textarea
              className={`${inputClassName} min-h-20 w-full`}
              value={assignComment}
              onChange={(event) => setAssignComment(event.target.value)}
              placeholder="Interner Kommentar beim Weiterreichen (optional)"
            />
            <button type="button" className={secondaryButtonClassName} onClick={() => void saveAssignment()}>
              Zuweisen / Weiterreichen
            </button>
          </section>

          {ticket.events && ticket.events.length > 0 && (
            <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-4">
              <h2 className="font-semibold text-aw-cream">Verlauf</h2>
              <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-xs text-aw-muted">
                {ticket.events.map((event) => (
                  <li key={event.id} className="border-b border-aw-border/50 pb-2">
                    <p className="text-aw-cream/90">{event.summary}</p>
                    <p className="mt-1">
                      {event.actorDisplayName ?? "System"} ·{" "}
                      {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(event.createdAt))}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <button
            type="button"
            className="w-full rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300"
            onClick={() => void anonymizeTicket()}
          >
            Ticket anonymisieren
          </button>
        </aside>
      </div>
    </div>
  );
}
