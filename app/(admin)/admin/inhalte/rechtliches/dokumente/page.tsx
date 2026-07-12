import AdminLegalDocumentsPanel from "@/components/admin/legal/AdminLegalDocumentsPanel";
import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";
import {
  ensureDefaultLegalDocuments,
  listAdminLegalDocuments,
} from "@/lib/legal/legal-document-service";

export default async function AdminRechtlichesDokumentePage() {
  await ensureDefaultLegalDocuments();
  const documents = await listAdminLegalDocuments();

  return (
    <AdminLegalNav>
      <AdminLegalDocumentsPanel initialDocuments={documents} />
    </AdminLegalNav>
  );
}
