import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";
import { getLegalAdminOverview } from "@/lib/legal/legal-admin-service";
import { ensureDefaultLegalDocuments } from "@/lib/legal/legal-document-service";

export default async function AdminRechtlichesPage() {
  await ensureDefaultLegalDocuments();
  const overview = await getLegalAdminOverview();

  return (
    <AdminLegalNav>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Dokumente veröffentlicht",
            value: `${overview.stats.publishedCount}/${overview.stats.totalDocuments}`,
          },
          {
            label: "Neue Versionen",
            value: overview.stats.pendingVersions,
          },
          {
            label: "Sync-Fehler",
            value: overview.stats.syncErrors,
          },
          {
            label: "Offene Widerrufe",
            value: overview.stats.openWithdrawals,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-aw-border bg-aw-surface p-5"
          >
            <p className="text-xs uppercase tracking-wide text-aw-muted">
              {card.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-aw-gold">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Diagnose
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-aw-muted">
          {overview.documents.map((document) => (
            <li key={document.id} className="flex justify-between gap-4">
              <span>{document.title}</span>
              <span>
                {document.status === "PUBLISHED" ? "veröffentlicht" : document.status}
                {document.lastErrorMessage ? " · Fehler" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AdminLegalNav>
  );
}
