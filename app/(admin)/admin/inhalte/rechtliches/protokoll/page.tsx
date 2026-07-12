import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";
import { listLegalSyncLogs } from "@/lib/legal/legal-admin-service";

export default async function AdminRechtlichesProtokollPage() {
  const logs = await listLegalSyncLogs(100);

  return (
    <AdminLegalNav>
      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface text-aw-muted">
            <tr>
              <th className="px-4 py-3">Zeit</th>
              <th className="px-4 py-3">Dokument</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Geändert</th>
              <th className="px-4 py-3">Fehler</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-aw-border">
                <td className="px-4 py-3 text-aw-muted">
                  {new Date(log.startedAt).toLocaleString("de-DE")}
                </td>
                <td className="px-4 py-3 text-aw-cream">
                  {log.document?.title ?? "—"}
                </td>
                <td className="px-4 py-3 text-aw-muted">{log.status}</td>
                <td className="px-4 py-3 text-aw-muted">
                  {log.contentChanged ? "ja" : "nein"}
                </td>
                <td className="px-4 py-3 text-xs text-aw-warning">
                  {log.errorMessage ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLegalNav>
  );
}
