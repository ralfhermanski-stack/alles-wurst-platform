"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  cancelUserMembershipApi,
  fetchUserMembershipStatusApi,
  reactivateUserMembershipApi,
  type UserMembershipStatus,
} from "@/lib/membership/membership-user-client";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type MembershipManagePanelProps = {
  compact?: boolean;
};

function StatusBadge({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        ok
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-aw-warning/15 text-aw-warning"
      }`}
    >
      {label}
    </span>
  );
}

export default function MembershipManagePanel({
  compact = false,
}: MembershipManagePanelProps) {
  const [status, setStatus] = useState<UserMembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchUserMembershipStatusApi();

    if (!response.success) {
      if (response.error.code === "NOT_FOUND") {
        setStatus(null);
      } else {
        setError(response.error.message);
      }
      setLoading(false);
      return;
    }

    setStatus(response.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCancel() {
    if (
      !window.confirm(
        "Mitgliedschaft wirklich zum Periodenende kündigen? Dein Zugang bleibt bis dahin aktiv — es erfolgt keine weitere Abbuchung.",
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await cancelUserMembershipApi();
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(response.data.message);
    await load();
  }

  async function handleReactivate() {
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await reactivateUserMembershipApi();
    setBusy(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(response.data.message);
    await load();
  }

  if (loading) {
    return <p className="text-sm text-aw-muted">Mitgliedschaft wird geladen …</p>;
  }

  if (!status) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-aw-muted">
          Du nutzt aktuell den kostenlosen Basisbereich.
        </p>
        <Link
          href="/mitgliedschaft"
          className="inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
        >
          Mitgliedschaft entdecken →
        </Link>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-bold text-aw-cream">
            {status.roleLabel}
          </span>
          {status.willRenew ? (
            <StatusBadge ok label="Verlängert sich" />
          ) : status.cancelAtPeriodEnd ? (
            <StatusBadge ok={false} label="Endet" />
          ) : null}
        </div>
        {status.billingPeriodLabel && (
          <p className="text-aw-muted">
            {status.billingPeriodLabel} · bis {status.periodEndLabel}
            {status.daysUntilEnd != null && ` (${status.daysUntilEnd} Tage)`}
          </p>
        )}
        <Link
          href="/mein-bereich/mitgliedschaft"
          className="inline-flex font-semibold text-aw-gold hover:text-aw-cream"
        >
          Details & Kündigung →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-aw-border bg-aw-surface/50 p-4">
          <p className="text-xs uppercase tracking-wide text-aw-muted">Stufe</p>
          <p className="mt-1 font-display text-2xl font-bold text-aw-cream">
            {status.roleLabel}
          </p>
          {status.billingPeriodLabel && (
            <p className="mt-1 text-sm text-aw-muted">{status.billingPeriodLabel}</p>
          )}
        </div>
        <div className="rounded-xl border border-aw-border bg-aw-surface/50 p-4">
          <p className="text-xs uppercase tracking-wide text-aw-muted">Laufzeit</p>
          <p className="mt-1 font-display text-2xl font-bold text-aw-cream">
            {status.periodEndLabel}
          </p>
          {status.daysUntilEnd != null && (
            <p className="mt-1 text-sm text-aw-muted">
              noch {status.daysUntilEnd} Tag{status.daysUntilEnd === 1 ? "" : "e"}
            </p>
          )}
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-aw-muted">Status</dt>
          <dd className="font-medium text-aw-cream">{status.statusLabel}</dd>
        </div>
        <div>
          <dt className="text-aw-muted">Zahlung</dt>
          <dd className="font-medium text-aw-cream">{status.paymentStatusLabel}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-aw-muted">Verlängerung</dt>
          <dd className="mt-1">
            {status.willRenew ? (
              <p className="text-aw-cream">
                Verlängert sich automatisch am {status.periodEndLabel}.
                {status.leadDays != null && (
                  <span className="block text-aw-muted">
                    Du erhältst {status.leadDays} Tage vorher eine E-Mail-Erinnerung.
                  </span>
                )}
              </p>
            ) : status.cancelAtPeriodEnd ? (
              <p className="text-aw-warning">
                Endet am {status.periodEndLabel}
                {status.cancelReasonLabel ? ` (${status.cancelReasonLabel})` : ""}.
                Keine weitere Abbuchung.
              </p>
            ) : (
              <p className="text-aw-muted">Keine automatische Verlängerung.</p>
            )}
          </dd>
        </div>
      </dl>

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

      <div className="flex flex-wrap gap-3">
        {status.canCancel && (
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={busy}
            onClick={() => void handleCancel()}
          >
            {busy ? "Bitte warten …" : "Zum Periodenende kündigen"}
          </button>
        )}
        {status.canReactivate && (
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={busy}
            onClick={() => void handleReactivate()}
          >
            {busy ? "Bitte warten …" : "Kündigung widerrufen"}
          </button>
        )}
        <Link href="/mitgliedschaft" className={secondaryButtonClassName}>
          Upgrade / Wechsel
        </Link>
        <Link href="/mein-bereich/bestellungen" className={secondaryButtonClassName}>
          Rechnungen & Bestellungen
        </Link>
      </div>

      <p className="text-xs text-aw-muted">
        Bei Fragen zur Abrechnung:{" "}
        <Link href="/mein-bereich/support" className="text-aw-gold hover:text-aw-cream">
          Support kontaktieren
        </Link>
        . Widerruf innerhalb von 14 Tagen:{" "}
        <Link href="/widerrufsformular" className="text-aw-gold hover:text-aw-cream">
          Widerrufsformular
        </Link>
        .
      </p>
    </div>
  );
}
