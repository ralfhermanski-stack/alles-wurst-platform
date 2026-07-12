"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminMaintenanceBanner from "@/components/admin/maintenance/AdminMaintenanceBanner";
import { fetchAdminDashboardStatsApi } from "@/lib/admin/admin-platform-client";
import type { AdminDashboardStats } from "@/lib/admin/admin-dashboard-service";

function formatEuro(cents: number | null): string {
  if (cents === null) {
    return "—";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
      : tone === "warning"
        ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
        : "border-aw-border bg-aw-surface hover:border-aw-gold/50 hover:bg-aw-surface-2";

  const content = (
    <>
      <p className="text-sm text-aw-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-aw-cream">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-aw-muted">{hint}</p>}
    </>
  );

  if (!href) {
    return (
      <div className={`rounded-xl border p-5 ${toneClass}`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`block rounded-xl border p-5 transition-colors ${toneClass}`}>
      {content}
    </Link>
  );
}

export default function AdminDashboardContent() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetchAdminDashboardStatsApi();

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setLoading(false);
        return;
      }

      setStats(response.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-aw-muted">Dashboard wird geladen …</p>
    );
  }

  if (error || !stats) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        {error ?? "Dashboard konnte nicht geladen werden."}
      </p>
    );
  }

  return (
    <div>
      <AdminMaintenanceBanner />

      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Statistiken (heute)
            </h2>
            <p className="mt-1 text-sm text-aw-muted">
              First-Party-Analytics — aggregiert, ohne externe Tracker
            </p>
          </div>
          <Link
            href="/admin/statistiken"
            className="rounded-lg border border-aw-border bg-aw-surface px-4 py-2 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            Zur Statistikseite
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Besucher heute"
            value={stats.analytics.visitorsToday}
            href="/admin/statistiken"
          />
          <StatCard
            label="Seitenaufrufe heute"
            value={stats.analytics.pageviewsToday}
            href="/admin/statistiken"
          />
          <StatCard
            label="Checkout-Abbrüche"
            value={stats.analytics.checkoutAbandons}
            href="/admin/statistiken"
            tone={stats.analytics.checkoutAbandons > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Meistbesuchte Seite"
            value={stats.analytics.topPage?.path ?? "—"}
            hint={
              stats.analytics.topPage
                ? `${stats.analytics.topPage.views} Aufrufe`
                : "Noch keine Daten"
            }
            href="/admin/statistiken"
          />
          <StatCard
            label="Stärkster Funnel-Abbruch"
            value={stats.analytics.topFunnelDrop?.label ?? "—"}
            hint={
              stats.analytics.topFunnelDrop
                ? `${stats.analytics.topFunnelDrop.funnelId}`
                : "Noch keine Daten"
            }
            href="/admin/statistiken"
          />
          <StatCard
            label="Aktivster Kurs"
            value={stats.analytics.topCourse?.courseSlug ?? "—"}
            hint={
              stats.analytics.topCourse
                ? `${stats.analytics.topCourse.activity} Events`
                : "Noch keine Daten"
            }
            href="/admin/statistiken"
          />
        </div>
      </section>

      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Support-Tickets
            </h2>
            <p className="mt-1 text-sm text-aw-muted">
              Aktuelle Ticketlage auf einen Blick
            </p>
          </div>
          <Link
            href="/admin/support"
            className="rounded-lg border border-aw-border bg-aw-surface px-4 py-2 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            Zur Ticketübersicht
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Offene Tickets gesamt"
            value={stats.supportTickets.openTotal}
            hint="Offen, in Bearbeitung, Rückfrage"
            href="/admin/support?status=active"
          />
          <StatCard
            label="Überfällige Tickets"
            value={stats.supportTickets.overdue}
            hint="48h ohne Antwort"
            href="/admin/support?overdue=1"
            tone={stats.supportTickets.overdue > 0 ? "danger" : "default"}
          />
          <StatCard
            label="Ohne Bearbeiter"
            value={stats.supportTickets.unassigned}
            hint="Aktive Tickets ohne Zuweisung"
            href="/admin/support?assigneeId=unassigned&status=active"
            tone={stats.supportTickets.unassigned > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Rückfrage an User"
            value={stats.supportTickets.waitingUser}
            hint="Warten auf Nutzerantwort"
            href="/admin/support?status=waiting_user"
          />
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Nutzer gesamt" value={stats.userCount} href="/admin/benutzer" />
        <StatCard label="Administratoren" value={stats.adminCount} href="/admin/benutzer" />
        <StatCard label="Kurse gesamt" value={stats.courseCount} href="/admin/kurse" />
        <StatCard
          label="Veröffentlichte Kurse"
          value={stats.publishedCourseCount}
          href="/admin/kurse"
        />
        <StatCard
          label="Kursbuchungen (Zugriffe)"
          value={stats.courseEnrollmentCount}
          href="/admin/kurse"
        />
        <StatCard
          label="Buchhaltungspositionen"
          value={stats.orderCount}
          href="/admin/bestellungen"
        />
        <StatCard
          label="Umsatz (bezahlt)"
          value={formatEuro(stats.revenueCents)}
          hint={
            stats.modules.revenue
              ? "Summe bezahlter Positionen"
              : "Noch keine bezahlten Positionen"
          }
          href="/admin/bestellungen"
        />
        <StatCard
          label="Aktive Mitgliedschaften"
          value={stats.activeMembershipCount}
          href="/admin/mitgliedschaften"
        />
        <StatCard label="Bewertungen" value={stats.reviewCount} href="/admin/bewertungen" />
        <StatCard
          label="Ausgestellte Zertifikate"
          value={stats.certificateCount}
          href="/admin/zertifikate"
        />
      </div>

      {!stats.modules.stripePaypal && (
        <div className="mt-8 rounded-xl border border-aw-border bg-aw-surface/50 p-5">
          <p className="text-sm font-semibold text-aw-cream">
            Zahlungsanbieter
          </p>
          <p className="mt-2 text-sm text-aw-muted">
            Stripe und PayPal sind noch nicht produktiv angebunden. Bestellungen
            stammen derzeit aus manuellen Buchhaltungspositionen.
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Schnellzugriff
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/benutzer"
            className="rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            Benutzer verwalten
          </Link>
          <Link
            href="/admin/kurse/neu"
            className="rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            Neuen Kurs anlegen
          </Link>
          <Link
            href="/admin/buchhaltung"
            className="rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm font-medium text-aw-cream hover:border-aw-gold/50"
          >
            Buchhaltung öffnen
          </Link>
        </div>
      </div>
    </div>
  );
}
