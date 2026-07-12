"use client";

import { useCallback, useEffect, useState } from "react";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import type { AdminShareListItem } from "@/lib/sharing/share-types";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  DISABLED: "Deaktiviert",
  REVOKED: "Gelöscht",
  ADMIN_BLOCKED: "Gesperrt",
};

const TYPE_LABELS: Record<string, string> = {
  CERTIFICATE: "Zertifikat",
  DIPLOMA: "Urkunde",
  RECIPE: "Rezept",
};

export default function AdminSharesPanel() {
  const [rows, setRows] = useState<AdminShareListItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/shares", { credentials: "include" });
    const json = (await response.json()) as { success: boolean; data?: AdminShareListItem[] };
    if (json.success && json.data) setRows(json.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(shareId: string, status: "ADMIN_BLOCKED" | "REVOKED") {
    setLoading(true);
    const response = await fetch("/api/admin/shares", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareId,
        status,
        adminNote: status === "ADMIN_BLOCKED" ? "Vom Admin gesperrt" : "Vom Admin gelöscht",
      }),
    });
    const json = (await response.json()) as { success: boolean; message?: string };
    setLoading(false);
    setMessage(json.message ?? "Aktualisiert.");
    if (json.success) await load();
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-aw-cream">Freigaben</h2>
      <p className="mt-2 text-sm text-aw-muted">
        Übersicht aller öffentlichen Freigaben von Zertifikaten, Urkunden und Rezepten.
      </p>

      {message ? <p className="mt-4 text-sm text-aw-muted">{message}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm text-aw-muted">
          <thead className="bg-aw-surface/60 text-xs uppercase tracking-wide text-aw-cream">
            <tr>
              <th className="px-4 py-3">Benutzer</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Titel</th>
              <th className="px-4 py-3">Aufrufe</th>
              <th className="px-4 py-3">Erstellt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-aw-border/70">
                <td className="px-4 py-3">
                  <div className="text-aw-cream">{row.ownerName}</div>
                  <div className="text-xs">{row.ownerEmail}</div>
                </td>
                <td className="px-4 py-3">{TYPE_LABELS[row.contentType] ?? row.contentType}</td>
                <td className="px-4 py-3 text-aw-cream">{row.title}</td>
                <td className="px-4 py-3">{row.viewCount}</td>
                <td className="px-4 py-3">{new Date(row.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3">{STATUS_LABELS[row.status] ?? row.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.status === "ACTIVE" ? (
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={loading}
                        onClick={() => void setStatus(row.id, "ADMIN_BLOCKED")}
                      >
                        Sperren
                      </button>
                    ) : null}
                    {row.status !== "REVOKED" ? (
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={loading}
                        onClick={() => void setStatus(row.id, "REVOKED")}
                      >
                        Löschen
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
