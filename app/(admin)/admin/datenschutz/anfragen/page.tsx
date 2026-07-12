"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminPrivacyNav from "@/components/admin/privacy/AdminPrivacyNav";
import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type PrivacyRow = {
  id: string;
  requestNumber: string;
  type: string;
  status: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  finalConfirmedAt: string | null;
  user: { email: string };
  supportTicket: { ticketNumber: string } | null;
};

export default function AdminDatenschutzAnfragenPage() {
  const [rows, setRows] = useState<PrivacyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/privacy/requests", { credentials: "include" })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: PrivacyRow[] }) => {
        if (json.success && json.data) {
          setRows(json.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <AdminPrivacyNav>
      {loading ? (
        <p className="text-sm text-aw-muted">Lade Datenschutzanfragen …</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-aw-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-aw-surface text-aw-muted">
              <tr>
                <th className="px-4 py-3">Vorgang</th>
                <th className="px-4 py-3">Benutzer</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-aw-border">
                  <td className="px-4 py-3 text-aw-cream">
                    {row.requestNumber}
                    <div className="text-xs text-aw-muted">
                      {new Date(row.createdAt).toLocaleString("de-DE")}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-aw-muted">{row.user.email}</td>
                  <td className="px-4 py-3 text-aw-muted">{row.type}</td>
                  <td className="px-4 py-3 text-aw-cream">{row.status}</td>
                  <td className="px-4 py-3 text-aw-muted">
                    {row.supportTicket?.ticketNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/datenschutz/anfragen/${row.id}`}
                      className={secondaryButtonClassName}
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPrivacyNav>
  );
}
