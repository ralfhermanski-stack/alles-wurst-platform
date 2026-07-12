"use client";

import { useEffect, useState } from "react";

import AdminPrivacyNav from "@/components/admin/privacy/AdminPrivacyNav";

type ExportRow = {
  id: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  user: { email: string };
};

export default function AdminDatenschutzExportePage() {
  const [rows, setRows] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/privacy/exports", { credentials: "include" })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: ExportRow[] }) => {
        if (json.success && json.data) {
          setRows(json.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <AdminPrivacyNav>
      {loading ? (
        <p className="text-sm text-aw-muted">Lade Exporte …</p>
      ) : (
        <ul className="space-y-2 text-sm text-aw-muted">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg border border-aw-border px-4 py-3"
            >
              {row.user.email} · {row.status} ·{" "}
              {new Date(row.createdAt).toLocaleString("de-DE")}
              {row.expiresAt && (
                <span className="ml-2 text-xs">
                  (läuft ab {new Date(row.expiresAt).toLocaleString("de-DE")})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminPrivacyNav>
  );
}
