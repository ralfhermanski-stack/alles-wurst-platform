"use client";

/**
 * @file AccountingUserPanel.tsx
 * @purpose Nutzerdetail, Mitgliedschaftskorrekturen und Audit-Verlauf.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  executeAccountingActionApi,
  fetchAccountingUserDetailApi,
} from "@/lib/accounting/accounting-client";
import AccountingPositionsPanel from "@/components/accounting/AccountingPositionsPanel";
import CourseAccessPanel from "@/components/accounting/CourseAccessPanel";
import CertificateReadOnlyPanel from "@/components/accounting/CertificateReadOnlyPanel";
import type {
  AccountingAuditEntry,
  AccountingUserDetail,
} from "@/lib/accounting/accounting-types";
import type {
  AccountingPositionEntry,
  AccountingPositionTotals,
} from "@/lib/accounting/accounting-position-types";
import { AUDIT_ACTION_LABELS } from "@/lib/accounting/accounting-audit";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import {
  MEMBERSHIP_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/users/membership-labels";
import type { MembershipRole, PaymentStatus } from "@prisma/client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AccountingUserPanelProps = {
  userId: string;
};

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "overdue",
  "refunded",
];

const ROLE_OPTIONS: MembershipRole[] = [
  "registered",
  "wurstclub",
  "meisterclub",
  "accounting",
  "admin",
];

function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("de-DE");
}

function formatAddress(user: AccountingUserDetail): string {
  const profile = user.profile;

  if (!profile) {
    return "Kein Profil hinterlegt";
  }

  const lines = [
    [profile.street, profile.houseNumber].filter(Boolean).join(" "),
    profile.addressLine2,
    [profile.postalCode, profile.city].filter(Boolean).join(" "),
    profile.stateRegion,
    profile.country,
  ].filter(Boolean);

  return lines.join(", ");
}

export default function AccountingUserPanel({ userId }: AccountingUserPanelProps) {
  const [user, setUser] = useState<AccountingUserDetail | null>(null);
  const [positions, setPositions] = useState<AccountingPositionEntry[]>([]);
  const [positionTotals, setPositionTotals] = useState<AccountingPositionTotals>({
    currency: "EUR",
    openAmount: 0,
    paidAmount: 0,
    openCount: 0,
    paidCount: 0,
  });
  const [auditLog, setAuditLog] = useState<AccountingAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [extendedUntil, setExtendedUntil] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [paymentNote, setPaymentNote] = useState("");
  const [accountingNote, setAccountingNote] = useState("");
  const [role, setRole] = useState<MembershipRole>("registered");
  const [actionNote, setActionNote] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchAccountingUserDetailApi(userId);

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      setUser(null);
      setPositions([]);
      setAuditLog([]);
      return;
    }

    setUser(response.data.user);
    setPositions(response.data.positions);
    setPositionTotals(response.data.positionTotals);
    setAuditLog(response.data.auditLog);

    const membership = response.data.user.membership;

    if (membership) {
      setPaymentNote(membership.paymentNote ?? "");
      setAccountingNote(membership.accountingNote ?? "");
      setRole(membership.role);
      setPaymentStatus(membership.paymentStatus);
      setBlockReason(membership.blockReason ?? "");
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setLoading(true);
      setError(null);

      const response = await fetchAccountingUserDetailApi(userId);

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (!response.success) {
        setError(response.error.message);
        setUser(null);
        setPositions([]);
        setAuditLog([]);
        return;
      }

      setUser(response.data.user);
      setPositions(response.data.positions);
      setPositionTotals(response.data.positionTotals);
      setAuditLog(response.data.auditLog);

      const membership = response.data.user.membership;

      if (membership) {
        setPaymentNote(membership.paymentNote ?? "");
        setAccountingNote(membership.accountingNote ?? "");
        setRole(membership.role);
        setPaymentStatus(membership.paymentStatus);
        setBlockReason(membership.blockReason ?? "");
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function runAction(
    action: Parameters<typeof executeAccountingActionApi>[1],
  ) {
    setActionError(null);
    setActionLoading(true);

    const response = await executeAccountingActionApi(userId, action);

    setActionLoading(false);

    if (!response.success) {
      setActionError(response.error.message);
      return;
    }

    await reload();
  }

  if (loading) {
    return <p className="p-8 text-sm text-aw-muted">Nutzer wird geladen …</p>;
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-sm text-aw-warning" role="alert">
          {error ?? "Nutzer nicht gefunden."}
        </p>
        <Link href="/admin/buchhaltung" className="mt-4 inline-block text-aw-gold">
          ← Zur Suche
        </Link>
      </div>
    );
  }

  const membership = user.membership;

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <div>
        <Link href="/admin/buchhaltung" className="text-sm text-aw-muted hover:text-aw-gold">
          ← Zur Nutzersuche
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold text-aw-cream">
          {user.profile
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.email}
        </h1>
        <p className="mt-1 font-mono text-xs text-aw-muted">{user.id}</p>
      </div>

      {actionError && (
        <p
          className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {actionError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-aw-border bg-aw-surface/60 p-5">
          <h2 className="font-display text-lg font-bold text-aw-gold">Profil & Adresse</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-aw-muted">E-Mail</dt>
              <dd className="text-aw-cream">{user.email}</dd>
            </div>
            {user.profile && (
              <>
                <div>
                  <dt className="text-aw-muted">Anrede</dt>
                  <dd>{user.profile.salutation ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-aw-muted">Firma</dt>
                  <dd>{user.profile.company ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-aw-muted">Telefon</dt>
                  <dd>{user.profile.phone ?? "—"}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-aw-muted">Adresse</dt>
              <dd>{formatAddress(user)}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Registriert am</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-aw-border bg-aw-surface/60 p-5">
          <h2 className="font-display text-lg font-bold text-aw-gold">
            Mitgliedschaft & Zahlung
          </h2>
          {membership ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-aw-muted">Rolle</dt>
                <dd>{MEMBERSHIP_ROLE_LABELS[membership.role]}</dd>
              </div>
              <div>
                <dt className="text-aw-muted">Status</dt>
                <dd>{MEMBERSHIP_STATUS_LABELS[membership.status]}</dd>
              </div>
              <div>
                <dt className="text-aw-muted">Zahlungsstatus</dt>
                <dd>{PAYMENT_STATUS_LABELS[membership.paymentStatus]}</dd>
              </div>
              <div>
                <dt className="text-aw-muted">Zugriff gesperrt</dt>
                <dd>{membership.accessBlocked ? "Ja" : "Nein"}</dd>
              </div>
              {membership.blockReason && (
                <div>
                  <dt className="text-aw-muted">Sperrgrund</dt>
                  <dd>{membership.blockReason}</dd>
                </div>
              )}
              <div>
                <dt className="text-aw-muted">Start / Ende / Verlängert bis</dt>
                <dd>
                  {formatDate(membership.startedAt)} · {formatDate(membership.endsAt)} ·{" "}
                  {formatDate(membership.extendedUntil)}
                </dd>
              </div>
              <div>
                <dt className="text-aw-muted">Abrechnung / Verlängerung</dt>
                <dd>
                  {membership.billingPeriod ?? "—"} ·{" "}
                  {membership.autoRenewEnabled ? "Auto-Verlängerung" : "Aus"}
                  {membership.cancelAtPeriodEnd ? " · Endet zum Periodenende" : ""}
                  {membership.cancelReason ? ` (${membership.cancelReason})` : ""}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-aw-muted">Keine Mitgliedschaft vorhanden.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-aw-gold/25 bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-gold">Manuelle Korrekturen</h2>

        <div className="mt-4">
          <label htmlFor="action-note" className={labelClassName}>
            Vermerk zur Aktion (optional)
          </label>
          <input
            id="action-note"
            className={`${inputClassName} mt-2`}
            value={actionNote}
            onChange={(e) => setActionNote(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={actionLoading}
            onClick={() =>
              void runAction({ type: "pause", note: actionNote || null })
            }
          >
            Pausieren
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={actionLoading}
            onClick={() =>
              void runAction({
                type: "reactivate",
                extendedUntil: extendedUntil || null,
                note: actionNote || null,
              })
            }
          >
            Reaktivieren
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={actionLoading}
            onClick={() =>
              void runAction({ type: "end", note: actionNote || null })
            }
          >
            Beenden
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={actionLoading || !blockReason.trim()}
            onClick={() =>
              void runAction({
                type: "block",
                blockReason: blockReason.trim(),
                note: actionNote || null,
              })
            }
          >
            Blockieren
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={actionLoading}
            onClick={() =>
              void runAction({ type: "unlock", note: actionNote || null })
            }
          >
            Freigeben
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="extend-until" className={labelClassName}>
              Verlängern bis
            </label>
            <input
              id="extend-until"
              type="date"
              className={`${inputClassName} mt-2`}
              value={extendedUntil}
              onChange={(e) => setExtendedUntil(e.target.value)}
            />
            <button
              type="button"
              className={`${primaryButtonClassName} mt-3`}
              disabled={actionLoading || !extendedUntil}
              onClick={() =>
                void runAction({
                  type: "extend",
                  extendedUntil: new Date(extendedUntil).toISOString(),
                  note: actionNote || null,
                })
              }
            >
              Verlängern
            </button>
          </div>

          <div>
            <label htmlFor="block-reason" className={labelClassName}>
              Sperrgrund (für Blockieren)
            </label>
            <input
              id="block-reason"
              className={`${inputClassName} mt-2`}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor="payment-status" className={labelClassName}>
              Zahlungsstatus setzen
            </label>
            <select
              id="payment-status"
              className={`${selectClassName} mt-2`}
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            >
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${secondaryButtonClassName} mt-3`}
              disabled={actionLoading}
              onClick={() =>
                void runAction({
                  type: "set_payment_status",
                  paymentStatus,
                  note: actionNote || null,
                })
              }
            >
              Zahlungsstatus speichern
            </button>
          </div>

          <div>
            <label htmlFor="membership-role" className={labelClassName}>
              Rolle setzen
            </label>
            <select
              id="membership-role"
              className={`${selectClassName} mt-2`}
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
            >
              {ROLE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {MEMBERSHIP_ROLE_LABELS[item]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${secondaryButtonClassName} mt-3`}
              disabled={actionLoading}
              onClick={() =>
                void runAction({
                  type: "set_role",
                  role,
                  note: actionNote || null,
                })
              }
            >
              Rolle speichern
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <label htmlFor="payment-note" className={labelClassName}>
              Zahlungsnotiz
            </label>
            <textarea
              id="payment-note"
              rows={4}
              className={`${inputClassName} mt-2`}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
            <button
              type="button"
              className={`${secondaryButtonClassName} mt-3`}
              disabled={actionLoading}
              onClick={() =>
                void runAction({ type: "set_payment_note", paymentNote })
              }
            >
              Zahlungsnotiz speichern
            </button>
          </div>

          <div>
            <label htmlFor="accounting-note" className={labelClassName}>
              Interner Buchhaltungsvermerk
            </label>
            <textarea
              id="accounting-note"
              rows={4}
              className={`${inputClassName} mt-2`}
              value={accountingNote}
              onChange={(e) => setAccountingNote(e.target.value)}
            />
            <button
              type="button"
              className={`${secondaryButtonClassName} mt-3`}
              disabled={actionLoading}
              onClick={() =>
                void runAction({
                  type: "set_accounting_note",
                  accountingNote,
                })
              }
            >
              Vermerk speichern
            </button>
          </div>
        </div>
      </section>

      <CourseAccessPanel userId={userId} />

      <CertificateReadOnlyPanel userId={userId} />

      <AccountingPositionsPanel
        userId={userId}
        positions={positions}
        totals={positionTotals}
        onUpdated={reload}
      />

      <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
        <h2 className="font-display text-lg font-bold text-aw-gold">Änderungsverlauf</h2>
        {auditLog.length === 0 ? (
          <p className="mt-4 text-sm text-aw-muted">Noch keine Buchhaltungsänderungen protokolliert.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {auditLog.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-aw-border/60 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-aw-cream">{entry.summary}</p>
                  <time className="text-xs text-aw-muted">
                    {formatDate(entry.createdAt)}
                  </time>
                </div>
                <p className="mt-1 text-xs text-aw-muted">
                  {AUDIT_ACTION_LABELS[entry.action]} · Ausgeführt von{" "}
                  {entry.actorRole === "admin" ? "Administrator" : "Buchhaltung"} (
                  {entry.actorUserId.slice(0, 8)}…)
                </p>
                {entry.note && (
                  <p className="mt-2 text-aw-muted">Vermerk: {entry.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
