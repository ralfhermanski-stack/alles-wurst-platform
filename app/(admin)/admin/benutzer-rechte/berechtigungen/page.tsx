import type { Metadata } from "next";

import AdminPermissionsCatalogPanel from "@/components/admin/permissions/AdminPermissionsCatalogPanel";

export const metadata: Metadata = {
  title: "Admin – Berechtigungen",
};

export default function AdminPermissionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <AdminPermissionsCatalogPanel />
    </div>
  );
}
