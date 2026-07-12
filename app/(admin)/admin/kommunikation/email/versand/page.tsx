import AdminEmailManualSendPanel from "@/components/admin/email/AdminEmailManualSendPanel";
import AdminEmailNav from "@/components/admin/email/AdminEmailNav";

export default function AdminEmailSendPage() {
  return (
    <AdminEmailNav>
      <AdminEmailManualSendPanel />
    </AdminEmailNav>
  );
}
