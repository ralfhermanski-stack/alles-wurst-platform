import type { Metadata } from "next";

import AdminUserGroupsPanel from "@/components/admin/permissions/AdminUserGroupsPanel";

export const metadata: Metadata = {
  title: "Admin – Benutzergruppen",
};

export default function AdminUserGroupsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminUserGroupsPanel />
    </div>
  );
}
