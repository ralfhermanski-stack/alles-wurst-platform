"use client";

/**
 * @file AccountingPositionsPanel.tsx
 * @purpose Kurskosten, manuelle Positionen und Betrags-Summen.
 */

import { useState } from "react";

import {
  cancelInvoiceApi,
  createAccountingPositionApi,
  createCreditNoteApi,
  createInvoiceFromPositionApi,
  updateAccountingPositionStatusApi,
  type PositionStatusAction,
} from "@/lib/accounting/accounting-client";
import {
  ACCOUNTING_POSITION_STATUS_LABELS,
  ACCOUNTING_PRODUCT_TYPE_LABELS,
} from "@/lib/accounting/accounting-position-labels";
import { INVOICE_STATUS_LABELS } from "@/lib/invoices/invoice-labels";
import {
  canCancelInvoice,
  canCreateCreditNote,
} from "@/lib/invoices/invoice-status";
import type {
  AccountingPositionEntry,
  AccountingPositionTotals,
} from "@/lib/accounting/accounting-position-types";
import type { AccountingProductType } from "@prisma/client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  selectClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type AccountingPositionsPanelProps = {
  userId: string;
  positions: AccountingPositionEntry[];
  totals: AccountingPositionTotals;
  onUpdated: () => Promise<void>;
};

const PRODUCT_TYPES: AccountingProductType[] = [
  "membership",
  "course",
  "workshop",
  "manual",
];

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("de-DE");
}

function calculateTaxFromNet(net: number, taxRate: number) {
  const taxAmount = Math.round(net * (taxRate / 100) * 100) / 100;
  const grossAmount = Math.round((net + taxAmount) * 100) / 100;

  return { taxAmount, grossAmount };
}

export default function AccountingPositionsPanel({
  userId,
  positions,
  totals,
  onUpdated,
}: AccountingPositionsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [productType, setProductType] = useState<AccountingProductType>("course");
  const [productName, setProductName] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [taxRate, setTaxRate] = useState("19");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  async function handleCreate() {
    setError(null);

    const net = Number(netAmount.replace(",", "."));

    if (!productName.trim() || !Number.isFinite(net) || net <= 0) {
      setError("Bitte Produktname und einen gültigen Nettobetrag angeben.");
      return;
    }

    const rate = Number(taxRate.replace(",", "."));

    if (!Number.isFinite(rate) || rate < 0) {
      setError("Bitte einen gültigen Steuersatz angeben.");
      return;
    }

    const { taxAmount, grossAmount } = calculateTaxFromNet(net, rate);

    setLoading(true);

    const response = await createAccountingPositionApi(userId, {
      productType,
      productName: productName.trim(),
      grossAmount,
      netAmount: net,
      taxRate: rate,
      taxAmount,
      currency: "EUR",
      paymentStatus: "pending",
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      note: note.trim() || null,
    });

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setProductName("");
    setNetAmount("");
    setDueDate("");
    setNote("");
    await onUpdated();
  }

  async function handleStatusAction(
    positionId: string,
    action: PositionStatusAction,
  ) {
    setError(null);
    setLoading(true);

    const response = await updateAccountingPositionStatusApi(
      userId,
      positionId,
      action,
    );

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await onUpdated();
  }

  async function handleCreateInvoice(positionId: string) {
    setError(null);
    setLoading(true);

    const response = await createInvoiceFromPositionApi(userId, positionId);

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await onUpdated();
    window.open(
      `/admin/buchhaltung/rechnung/${response.data.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openInvoice(invoiceId: string) {
    window.open(
      `/admin/buchhaltung/rechnung/${invoiceId}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openCreditNote(creditNoteId: string) {
    window.open(
      `/admin/buchhaltung/gutschrift/${creditNoteId}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleCancelInvoice(invoiceId: string) {
    if (
      !window.confirm(
        "Rechnung wirklich stornieren? Die Originalrechnung bleibt erhalten.",
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);

    const response = await cancelInvoiceApi(invoiceId);

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await onUpdated();
  }

  async function handleCreateCreditNote(invoiceId: string) {
    if (
      !window.confirm(
        "Gutschrift erstellen? Die Buchhaltungsposition wird als erstattet markiert.",
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);

    const response = await createCreditNoteApi(invoiceId);

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    await onUpdated();
    openCreditNote(response.data.id);
  }

  return (
    <section className="rounded-xl border border-aw-gold/25 bg-aw-surface/40 p-5">
      <h2 className="font-display text-lg font-bold text-aw-gold">
        Kurskosten & Buchhaltungspositionen
      </h2>
      <p className="mt-1 text-xs text-aw-muted">
        Kurskäufe, Workshops und manuelle Posten — vorbereitet für LearnPress, noch
        ohne Zahlungsanbindung.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-aw-border bg-aw-bg/40 p-4">
          <p className="text-xs uppercase text-aw-muted">Offene Beträge</p>
          <p className="mt-1 text-2xl font-bold text-aw-warning">
            {formatMoney(totals.openAmount, totals.currency)}
          </p>
          <p className="text-xs text-aw-muted">{totals.openCount} Position(en)</p>
        </div>
        <div className="rounded-lg border border-aw-border bg-aw-bg/40 p-4">
          <p className="text-xs uppercase text-aw-muted">Bezahlte Beträge</p>
          <p className="mt-1 text-2xl font-bold text-aw-gold">
            {formatMoney(totals.paidAmount, totals.currency)}
          </p>
          <p className="text-xs text-aw-muted">{totals.paidCount} Position(en)</p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {positions.length === 0 ? (
        <p className="mt-4 text-sm text-aw-muted">
          Noch keine Buchhaltungspositionen für diesen Nutzer.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-aw-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-aw-surface text-xs uppercase text-aw-muted">
              <tr>
                <th className="px-3 py-2">Produkt</th>
                <th className="px-3 py-2">Brutto</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Fällig / Bezahlt</th>
                <th className="px-3 py-2">Rechnung</th>
                <th className="px-3 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aw-border">
              {positions.map((position) => (
                <tr key={position.id} className="text-aw-cream">
                  <td className="px-3 py-3">
                    <p className="font-medium">{position.productName}</p>
                    <p className="text-xs text-aw-muted">
                      {ACCOUNTING_PRODUCT_TYPE_LABELS[position.productType]} · Netto{" "}
                      {formatMoney(position.netAmount, position.currency)} · MwSt.{" "}
                      {position.taxRate} %
                    </p>
                    {position.note && (
                      <p className="mt-1 text-xs text-aw-muted">{position.note}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {formatMoney(position.grossAmount, position.currency)}
                  </td>
                  <td className="px-3 py-3 text-aw-muted">
                    {ACCOUNTING_POSITION_STATUS_LABELS[position.paymentStatus]}
                  </td>
                  <td className="px-3 py-3 text-xs text-aw-muted">
                    Fällig: {formatDate(position.dueDate)}
                    <br />
                    Bezahlt: {formatDate(position.paidAt)}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {position.invoiceId ? (
                      <div className="space-y-1">
                        <p className="font-mono text-aw-cream">
                          {position.invoiceNumber}
                        </p>
                        {position.invoiceStatus && (
                          <p className="text-aw-muted">
                            {INVOICE_STATUS_LABELS[position.invoiceStatus]}
                          </p>
                        )}
                        <button
                          type="button"
                          className="rounded border border-aw-gold/40 px-2 py-1 text-xs text-aw-gold hover:bg-aw-gold/10"
                          onClick={() => openInvoice(position.invoiceId!)}
                        >
                          Rechnung anzeigen
                        </button>
                        {position.creditNoteId && (
                          <div className="space-y-1 pt-1">
                            <p className="font-mono text-aw-cream">
                              {position.creditNoteNumber}
                            </p>
                            <button
                              type="button"
                              className="rounded border border-aw-gold/40 px-2 py-1 text-xs text-aw-gold hover:bg-aw-gold/10"
                              onClick={() =>
                                openCreditNote(position.creditNoteId!)
                              }
                            >
                              Gutschrift anzeigen
                            </button>
                          </div>
                        )}
                        {position.invoiceStatus &&
                          canCancelInvoice(position.invoiceStatus) &&
                          !position.creditNoteId && (
                            <button
                              type="button"
                              className="mt-1 block rounded border border-aw-warning/50 px-2 py-1 text-xs text-aw-warning hover:bg-aw-warning/10"
                              disabled={loading}
                              onClick={() =>
                                void handleCancelInvoice(position.invoiceId!)
                              }
                            >
                              Rechnung stornieren
                            </button>
                          )}
                        {position.invoiceStatus &&
                          canCreateCreditNote(
                            position.invoiceStatus,
                            Boolean(position.creditNoteId),
                          ) && (
                            <button
                              type="button"
                              className="mt-1 block rounded border border-aw-border px-2 py-1 text-xs hover:border-aw-gold/50"
                              disabled={loading}
                              onClick={() =>
                                void handleCreateCreditNote(position.invoiceId!)
                              }
                            >
                              Gutschrift erstellen
                            </button>
                          )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded border border-aw-border px-2 py-1 text-xs hover:border-aw-gold/50"
                        disabled={
                          loading ||
                          position.paymentStatus === "cancelled" ||
                          position.paymentStatus === "refunded"
                        }
                        onClick={() => void handleCreateInvoice(position.id)}
                      >
                        Rechnung erzeugen
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {position.paymentStatus !== "paid" && (
                        <button
                          type="button"
                          className="rounded border border-aw-border px-2 py-1 text-xs hover:border-aw-gold/50"
                          disabled={loading}
                          onClick={() =>
                            void handleStatusAction(position.id, "mark_paid")
                          }
                        >
                          Bezahlt
                        </button>
                      )}
                      {position.paymentStatus !== "pending" && (
                        <button
                          type="button"
                          className="rounded border border-aw-border px-2 py-1 text-xs hover:border-aw-gold/50"
                          disabled={loading}
                          onClick={() =>
                            void handleStatusAction(position.id, "mark_pending")
                          }
                        >
                          Offen
                        </button>
                      )}
                      {position.paymentStatus !== "overdue" && (
                        <button
                          type="button"
                          className="rounded border border-aw-border px-2 py-1 text-xs hover:border-aw-gold/50"
                          disabled={loading}
                          onClick={() =>
                            void handleStatusAction(position.id, "mark_overdue")
                          }
                        >
                          Überfällig
                        </button>
                      )}
                      {position.paymentStatus !== "cancelled" && (
                        <button
                          type="button"
                          className="rounded border border-aw-border px-2 py-1 text-xs text-aw-warning hover:border-aw-warning/50"
                          disabled={loading}
                          onClick={() =>
                            void handleStatusAction(position.id, "mark_cancelled")
                          }
                        >
                          Stornieren
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

      <div className="mt-8 rounded-lg border border-dashed border-aw-border p-4">
        <h3 className="text-sm font-semibold text-aw-cream">
          Manuelle Position hinzufügen
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pos-type" className={labelClassName}>
              Produkttyp
            </label>
            <select
              id="pos-type"
              className={`${selectClassName} mt-2`}
              value={productType}
              onChange={(e) =>
                setProductType(e.target.value as AccountingProductType)
              }
            >
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACCOUNTING_PRODUCT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pos-name" className={labelClassName}>
              Produktname *
            </label>
            <input
              id="pos-name"
              className={`${inputClassName} mt-2`}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="z. B. Kurs: Wurstgrundlagen"
            />
          </div>
          <div>
            <label htmlFor="pos-net" className={labelClassName}>
              Nettobetrag (EUR) *
            </label>
            <input
              id="pos-net"
              className={`${inputClassName} mt-2`}
              value={netAmount}
              onChange={(e) => setNetAmount(e.target.value)}
              placeholder="99,00"
            />
          </div>
          <div>
            <label htmlFor="pos-tax" className={labelClassName}>
              Steuersatz (%)
            </label>
            <input
              id="pos-tax"
              className={`${inputClassName} mt-2`}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pos-due" className={labelClassName}>
              Fällig am
            </label>
            <input
              id="pos-due"
              type="date"
              className={`${inputClassName} mt-2`}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pos-note" className={labelClassName}>
              Notiz
            </label>
            <input
              id="pos-note"
              className={`${inputClassName} mt-2`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className={`${primaryButtonClassName} mt-4`}
          disabled={loading}
          onClick={() => void handleCreate()}
        >
          Position anlegen
        </button>
      </div>
    </section>
  );
}
