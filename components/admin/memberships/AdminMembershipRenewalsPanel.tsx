"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  fetchMembershipRenewalsAdminApi,
  postMembershipRenewalActionApi,
} from "@/lib/admin/admin-membership-renewal-client";
import type {
  MembershipRenewalOverviewEntry,
  MembershipRenewalReminderLogEntry,
} from "@/lib/membership/membership-renewal-service";
import { RENEWAL_REMINDER_STATUS_LABELS } from "@/lib/membership/membership-renewal-labels";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleDateString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  return new Date(iso).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
  });
}

export default function AdminMembershipRenewalsPanel() {
  const [overview, setOverview] = useState<MembershipRenewalOverviewEntry[]>(
    [],
  );
  const [logs, setLogs] = useState<MembershipRenewalReminderLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchMembershipRenewalsAdminApi();

    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setOverview(response.data.overview);
    setLogs(response.data.logs);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    membershipId: string,
    action:
      | "cancel_at_period_end"
      | "reenable_auto_renew"
      | "send_reminder"
      | "suppress_reminders",
  ) {
    setBusyId(membershipId);
    setMessage(null);
    setError(null);

    const response = await postMembershipRenewalActionApi(membershipId, action);

    setBusyId(null);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(
      "message" in response.data && typeof response.data.message === "string"
        ? response.data.message
        : "Aktion ausgeführt.",
    );
    await load();
  }

  const dueToday = overview.filter((entry) => entry.reminderDueToday);

  return (
    <div className="mt-10 space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-aw-cream">
          Verlängerungen & Erinnerungen
        </h2>
        <p className="mt-1 text-sm text-aw-muted">
          Jahresabos: Hinweis 30 Tage vor Ende · Monatsabos: 7 Tage vor Ende.
          Cron:{" "}
          <code className="rounded bg-aw-bg px-1.5 py-0.5 font-mono text-xs">
            POST /api/cron/membership-renewals
          </code>
        </p>
      </div>

      {loading && <p className="text-sm text-aw-muted">Wird geladen …</p>}

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="rounded-lg border border-aw-gold/30 bg-aw-gold/10 px-4 py-3 text-sm text-aw-cream">
          {message}
        </p>
      )}

      {!loading && dueToday.length > 0 && (
        <div
          className="rounded-xl border border-aw-gold/40 bg-aw-gold/10 px-4 py-3 text-sm text-aw-cream"
          role="status"
        >
          <strong>Heute fällig:</strong> {dueToday.length} Verlängerungshinweis
          {dueToday.length === 1 ? "" : "e"} (Cron oder manuell senden).
        </div>
      )}

      {!loading && overview.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3">Nutzer</th>
                <th className="px-4 py-3">Abo</th>
                <th className="px-4 py-3">Ende</th>
                <th className="px-4 py-3">Tage</th>
                <th className="px-4 py-3">Verlängerung</th>
                <th className="px-4 py-3">Hinweis</th>
                <th className="px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {overview.map((entry) => (
                <tr key={entry.membershipId}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/buchhaltung/${entry.userId}`}
                      className="text-aw-cream hover:text-aw-gold"
                    >
                      {entry.userName}
                    </Link>
                    <p className="text-xs text-aw-muted">{entry.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    {entry.roleLabel}
                    <p className="text-xs text-aw-muted">
                      {entry.billingPeriodLabel}
                    </p>
                  </td>
                  <td className="px-4 py-3">{formatDate(entry.periodEndAt)}</td>
                  <td className="px-4 py-3">
                    {entry.daysUntilEnd ?? "—"}
                    {entry.leadDays != null && (
                      <p className="text-xs text-aw-muted">
                        Frist: {entry.leadDays} T.
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.cancelAtPeriodEnd ? (
                      <span className="text-aw-warning">
                        Endet
                        {entry.cancelReasonLabel
                          ? ` (${entry.cancelReasonLabel})`
                          : ""}
                      </span>
                    ) : entry.autoRenewEnabled ? (
                      <span className="text-aw-cream">Automatisch</span>
                    ) : (
                      <span className="text-aw-muted">Aus</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entry.reminderDueToday ? (
                      <span className="font-medium text-aw-gold">Heute</span>
                    ) : entry.renewalRemindersSuppressed ? (
                      <span className="text-aw-muted">Unterdrückt</span>
                    ) : (
                      <span className="text-aw-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={busyId === entry.membershipId}
                        onClick={() =>
                          void runAction(entry.membershipId, "send_reminder")
                        }
                      >
                        Hinweis senden
                      </button>
                      {!entry.cancelAtPeriodEnd && (
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={busyId === entry.membershipId}
                          onClick={() =>
                            void runAction(
                              entry.membershipId,
                              "cancel_at_period_end",
                            )
                          }
                        >
                          Kündigen zum Ende
                        </button>
                      )}
                      {entry.cancelAtPeriodEnd && (
                        <button
                          type="button"
                          className={secondaryButtonClassName}
                          disabled={busyId === entry.membershipId}
                          onClick={() =>
                            void runAction(
                              entry.membershipId,
                              "reenable_auto_renew",
                            )
                          }
                        >
                          Verlängerung an
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
          <h3 className="font-display text-lg font-bold text-aw-cream">
            Protokoll (Erinnerungen)
          </h3>
          {logs.length === 0 ? (
            <p className="mt-4 text-sm text-aw-muted">
              Noch keine Verlängerungshinweise protokolliert.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-aw-border/60 px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-aw-cream">
                      {log.userEmail} · {log.leadDays} T. vor{" "}
                      {formatDate(log.periodEndAt)}
                    </span>
                    <span className="text-xs text-aw-muted">
                      {RENEWAL_REMINDER_STATUS_LABELS[log.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-aw-muted">
                    {formatDateTime(log.sentAt ?? log.createdAt)} ·{" "}
                    {log.triggeredBy}
                    {log.skipReason ? ` · ${log.skipReason}` : ""}
                    {log.errorMessage ? ` · ${log.errorMessage}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div>
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={loading}
          onClick={() => void load()}
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
}
