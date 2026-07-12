"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  SupportPriorityBadge,
  SupportStatusBadge,
} from "@/components/support/SupportBadges";
import { adminFetch } from "@/lib/admin/admin-fetch";
import {
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_WAITING_ON_LABELS,
} from "@/lib/support/support-labels";
import type {
  SupportCategoryEntry,
  SupportDashboardStats,
  SupportStaffEntry,
  SupportTicketSummary,
} from "@/lib/support/support-types";
import {
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function StatCard({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger";
  href?: string;
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/5"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-aw-border bg-aw-surface";

  const content = (
    <>
      <p className="text-sm text-aw-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-aw-cream">{value}</p>
    </>
  );

  if (!href) {
    return <div className={`rounded-xl border p-5 ${toneClass}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`block rounded-xl border p-5 transition-colors hover:border-aw-gold/40 ${toneClass}`}>
      {content}
    </Link>
  );
}

export default function AdminSupportDashboard() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-aw-muted">Wird geladen …</p>}>
      <AdminSupportDashboardContent />
    </Suspense>
  );
}

function AdminSupportDashboardContent() {
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<SupportDashboardStats | null>(null);
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [categories, setCategories] = useState<SupportCategoryEntry[]>([]);
  const [staff, setStaff] = useState<SupportStaffEntry[]>([]);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [categoryId, setCategoryId] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [query, setQuery] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(searchParams.get("status") ?? "all");
    setPriority(searchParams.get("priority") ?? "all");
    setCategoryId(searchParams.get("categoryId") ?? "");
    setCategorySlug(searchParams.get("category") ?? "");
    setAssigneeId(searchParams.get("assigneeId") ?? "");
    setQuery(searchParams.get("query") ?? "");
    setOverdue(searchParams.get("overdue") === "1");
  }, [searchParams]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (status !== "all") params.set("status", status);
    if (priority !== "all") params.set("priority", priority);
    if (categoryId) params.set("categoryId", categoryId);
    if (categorySlug) params.set("category", categorySlug);
    if (assigneeId) params.set("assigneeId", assigneeId);
    if (query.trim()) params.set("query", query.trim());
    if (overdue) params.set("overdue", "1");

    return params.toString();
  }, [status, priority, categoryId, categorySlug, assigneeId, query, overdue]);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [statsRes, ticketsRes, categoriesRes, staffRes] = await Promise.all([
      adminFetch<SupportDashboardStats>("/api/admin/support/dashboard"),
      adminFetch<SupportTicketSummary[]>(`/api/admin/support/tickets?${queryString}`),
      adminFetch<SupportCategoryEntry[]>("/api/admin/support/categories"),
      adminFetch<SupportStaffEntry[]>("/api/admin/support/staff"),
    ]);

    if (!statsRes.success) {
      setError(statsRes.error.message);
      setLoading(false);
      return;
    }

    if (!ticketsRes.success) {
      setError(ticketsRes.error.message);
      setLoading(false);
      return;
    }

    setStats(statsRes.data);
    setTickets(ticketsRes.data);
    setCategories(categoriesRes.success ? categoriesRes.data : []);
    setStaff(staffRes.success ? staffRes.data : []);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, [queryString]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-aw-cream">
            Support
          </h1>
          <p className="mt-1 text-sm text-aw-muted">
            Tickets, Meister-Support und Wissensdatenbank auf einen Blick.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/support/wissensdatenbank" className={secondaryButtonClassName}>
            Wissensdatenbank
          </Link>
          <a
            href={`/api/admin/support/tickets/export?${queryString}`}
            className={secondaryButtonClassName}
          >
            CSV exportieren
          </a>
          <Link href="/admin/support/vorlagen" className={secondaryButtonClassName}>
            Antwortvorlagen
          </Link>
          <Link href="/admin/support/kategorien" className={secondaryButtonClassName}>
            Kategorien
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Offene Tickets" value={stats.open} href="/admin/support?status=open" />
          <StatCard
            label="Meister-Support offen"
            value={stats.openMasterTickets}
            tone="warning"
            href="/admin/support?category=meister-support&status=active"
          />
          <StatCard
            label="FAQ-Entwürfe"
            value={stats.knowledgeDraftCount}
            href="/admin/support/wissensdatenbank?status=draft"
          />
          <StatCard
            label="Ungelöste Suchanfragen"
            value={stats.unresolvedSearchCount}
            href="/admin/support/wissensdatenbank"
          />
        </div>
      )}

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="In Bearbeitung" value={stats.inProgress} href="/admin/support?status=in_progress" />
          <StatCard label="Rückfrage" value={stats.waitingUser} href="/admin/support?status=waiting_user" />
          <StatCard label="Überfällig" value={stats.overdue} tone="danger" href="/admin/support?overdue=1" />
          <StatCard label="Geschlossen" value={stats.closed} href="/admin/support?status=closed" />
          <StatCard
            label="Ohne Bearbeiter"
            value={stats.unassignedAlert}
            tone="warning"
            href="/admin/support?assigneeId=unassigned&status=active"
          />
        </div>
      )}

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className={inputClassName}
            placeholder="Suche Ticketnummer, Betreff, User …"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select className={inputClassName} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Alle Status</option>
            <option value="active">Offen (gesamt)</option>
            {Object.entries(SUPPORT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className={inputClassName} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">Alle Prioritäten</option>
            {Object.entries(SUPPORT_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select className={inputClassName} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Alle Kategorien</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select className={inputClassName} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Alle Bearbeiter</option>
            <option value="unassigned">Nicht zugewiesen</option>
            <option value="mine">Mir zugewiesen</option>
            {staff.map((member) => (
              <option key={member.userId} value={member.userId}>{member.displayName}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-md border border-aw-border bg-aw-surface px-3 py-2 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={overdue}
              onChange={(event) => setOverdue(event.target.checked)}
              className="rounded border-aw-border"
            />
            Nur überfällige
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-aw-warning">{error}</p>}
      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface text-aw-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priorität</th>
              <th className="px-4 py-3 font-semibold">Kategorie</th>
              <th className="px-4 py-3 font-semibold">Bearbeiter</th>
              <th className="px-4 py-3 font-semibold">Wartet auf</th>
              <th className="px-4 py-3 font-semibold">Aktualisiert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aw-border bg-aw-surface/30">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className={ticket.isOverdue ? "bg-red-500/5" : ""}>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/support/${encodeURIComponent(ticket.ticketNumber)}`}
                    className="font-medium text-aw-cream hover:text-aw-gold"
                  >
                    {ticket.ticketNumber}
                  </Link>
                  <p className="mt-1 text-xs text-aw-muted line-clamp-2">{ticket.subject}</p>
                </td>
                <td className="px-4 py-3"><SupportStatusBadge status={ticket.status} /></td>
                <td className="px-4 py-3"><SupportPriorityBadge priority={ticket.priority} /></td>
                <td className="px-4 py-3 text-aw-muted">{ticket.categoryName}</td>
                <td className="px-4 py-3 text-aw-muted">{ticket.assignedToDisplayName ?? "—"}</td>
                <td className="px-4 py-3 text-aw-muted">{SUPPORT_WAITING_ON_LABELS[ticket.waitingOn]}</td>
                <td className="px-4 py-3 text-aw-muted">
                  {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(ticket.updatedAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && tickets.length === 0 && (
        <p className="rounded-xl border border-aw-border bg-aw-surface/40 p-6 text-sm text-aw-muted">
          Keine Tickets für die aktuelle Filterauswahl.
        </p>
      )}
    </div>
  );
}
