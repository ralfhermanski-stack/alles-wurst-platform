import AdminLegalDocumentsPanel from "@/components/admin/legal/AdminLegalDocumentsPanel";
import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";
import {
  ensureDefaultLegalDocuments,
  listAdminLegalDocuments,
} from "@/lib/legal/legal-document-service";

export default async function AdminRechtlichesSyncPage() {
  await ensureDefaultLegalDocuments();
  const documents = await listAdminLegalDocuments();

  return (
    <AdminLegalNav>
      <p className="mb-6 text-sm text-aw-muted">
        Externe Rechtstexte werden serverseitig abgerufen, bereinigt und als neue
        Version gespeichert. Bei Anbieterfehlern bleibt die zuletzt veröffentlichte
        Version öffentlich erreichbar.
      </p>
      <AdminLegalDocumentsPanel initialDocuments={documents} />
    </AdminLegalNav>
  );
}
