import AdminEmailSubPage from "@/components/admin/email/AdminEmailSubPage";

export default function AdminEmailLogsPage() {
  return (
    <AdminEmailSubPage
      title="Versandprotokoll"
      resource="logs"
      description="Nachvollziehbare Versandhistorie mit maskierten Empfängeradressen."
    />
  );
}
