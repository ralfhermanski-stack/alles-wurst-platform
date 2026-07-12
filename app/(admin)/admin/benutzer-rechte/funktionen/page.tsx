import type { Metadata } from "next";

import AdminPermissionsCatalogPanel from "@/components/admin/permissions/AdminPermissionsCatalogPanel";

export const metadata: Metadata = {
  title: "Admin – Seiten- und Funktionsrechte",
};

export default function AdminFunctionPermissionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-aw-cream">Seiten- und Funktionsrechte</h1>
        <p className="mt-2 text-sm text-aw-muted">
          Werkstatt-, Kurs- und Forenrechte im Katalog. Zuweisung über Benutzergruppen.
        </p>
      </div>
      <AdminPermissionsCatalogPanel />
    </div>
  );
}
