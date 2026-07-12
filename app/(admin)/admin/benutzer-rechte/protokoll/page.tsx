import type { Metadata } from "next";

import AdminPermissionAuditPanel from "@/components/admin/permissions/AdminPermissionAuditPanel";

export const metadata: Metadata = {
  title: "Admin – Änderungsprotokoll Rechte",
};

export default function AdminPermissionAuditPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminPermissionAuditPanel />
    </div>
  );
}
