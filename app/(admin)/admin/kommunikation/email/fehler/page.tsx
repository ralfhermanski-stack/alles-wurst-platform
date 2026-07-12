import AdminEmailSubPage from "@/components/admin/email/AdminEmailSubPage";

export default function AdminEmailErrorsPage() {
  return (
    <AdminEmailSubPage
      title="Zustellfehler"
      resource="logs"
      query={{ status: "FAILED" }}
      description="Fehlgeschlagene und zurückgewiesene E-Mails."
    />
  );
}
