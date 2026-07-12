"use client";

import { useEffect, useState } from "react";

import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import { WITHDRAWAL_STATUS_LABELS } from "@/lib/legal/legal-types";
import type { WithdrawalRequestStatus } from "@prisma/client";

type WithdrawalRow = {
  id: string;
  withdrawalNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  orderReference: string | null;
  productName: string | null;
  status: WithdrawalRequestStatus;
  receivedAt: string;
};

export default function AdminRechtlichesWiderrufePage() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/legal/withdrawals", { credentials: "include" })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: WithdrawalRow[] }) => {
        if (json.success && json.data) {
          setRows(json.data);
        }
        setLoading(false);
      });
  }, []);

  async function updateStatus(
    requestId: string,
    status: WithdrawalRequestStatus,
  ) {
    await fetch(`/api/admin/legal/withdrawals/${requestId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setRows((current) =>
      current.map((row) =>
        row.id === requestId ? { ...row, status } : row,
      ),
    );
  }

  return (
    <AdminLegalNav>
      {loading ? (
        <p className="text-sm text-aw-muted">Lade Widerrufsanfragen …</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3">Vorgang</th>
                <th className="px-4 py-3">Kunde</th>
                <th className="px-4 py-3">Bestellung</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-aw-border">
                  <td className="px-4 py-3 text-aw-cream">
                    {row.withdrawalNumber}
                    <div className="text-xs text-aw-muted">
                      {new Date(row.receivedAt).toLocaleString("de-DE")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {row.firstName} {row.lastName}
                    <div className="text-xs">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {row.orderReference ?? "—"}
                    <div className="text-xs">{row.productName ?? ""}</div>
                  </td>
                  <td className="px-4 py-3 text-aw-muted">
                    {WITHDRAWAL_STATUS_LABELS[row.status]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        onClick={() =>
                          void updateStatus(row.id, "UNDER_REVIEW")
                        }
                      >
                        Prüfen
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClassName}
                        onClick={() => void updateStatus(row.id, "ACCEPTED")}
                      >
                        Annehmen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLegalNav>
  );
}
