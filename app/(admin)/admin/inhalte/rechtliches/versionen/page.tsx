import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";
import { listLegalDocumentVersions } from "@/lib/legal/legal-admin-service";

export default async function AdminRechtlichesVersionenPage() {
  const versions = await listLegalDocumentVersions();

  return (
    <AdminLegalNav>
      <div className="overflow-x-auto rounded-xl border border-aw-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-aw-surface text-aw-muted">
            <tr>
              <th className="px-4 py-3">Dokument</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Prüfsumme</th>
              <th className="px-4 py-3">Importiert</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.id} className="border-t border-aw-border">
                <td className="px-4 py-3 text-aw-cream">
                  {version.document.title}
                </td>
                <td className="px-4 py-3 text-aw-muted">
                  v{version.versionNumber}
                </td>
                <td className="px-4 py-3 text-aw-muted">{version.status}</td>
                <td className="px-4 py-3 font-mono text-xs text-aw-muted">
                  {version.checksum.slice(0, 12)}…
                </td>
                <td className="px-4 py-3 text-aw-muted">
                  {new Date(version.importedAt).toLocaleString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLegalNav>
  );
}
