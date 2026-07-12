import type { Metadata } from "next";

import AdminMaintenancePanel from "@/components/admin/maintenance/AdminMaintenancePanel";

export const metadata: Metadata = {
  title: "Admin – Wartungsmodus",
};

export default function AdminMaintenancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Wartungsmodus
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Besucher sehen während des Wartungsmodus nur die Wartungsseite. Administratoren
        und berechtigte Nutzer behalten vollen Zugriff.
      </p>

      <div className="mt-8">
        <AdminMaintenancePanel />
      </div>
    </div>
  );
}
