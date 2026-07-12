"use client";

import { useEffect, useState } from "react";

import { listPermissionAuditApi } from "@/lib/permissions/permissions-client";
import type { PermissionAuditEntry } from "@/lib/permissions/permissions-client";

export default function AdminPermissionAuditPanel() {
  const [logs, setLogs] = useState<PermissionAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await listPermissionAuditApi();
      setLoading(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setLogs(response.data);
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-aw-muted">Wird geladen …</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Änderungsprotokoll</h1>
        <p className="mt-2 text-sm text-aw-muted">
          Alle Änderungen an Gruppen und Berechtigungen. Einträge können von normalen
          Administratoren nicht gelöscht werden.
        </p>
      </div>

      {error && (
        <p className="text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface-2 text-aw-muted">
            <tr>
              <th className="px-3 py-2">Zeit</th>
              <th className="px-3 py-2">Aktion</th>
              <th className="px-3 py-2">Zusammenfassung</th>
              <th className="px-3 py-2">Gruppe</th>
              <th className="px-3 py-2">Berechtigung</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-aw-border/60">
                <td className="px-3 py-2 text-aw-muted">
                  {new Date(log.createdAt).toLocaleString("de-DE")}
                </td>
                <td className="px-3 py-2">{log.actionLabel}</td>
                <td className="px-3 py-2 text-aw-cream">{log.summary}</td>
                <td className="px-3 py-2 text-aw-muted">{log.targetGroupName ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-aw-muted">{log.permissionKey ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
