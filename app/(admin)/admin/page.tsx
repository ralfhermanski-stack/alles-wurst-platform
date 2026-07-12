import type { Metadata } from "next";

import AdminDashboardContent from "@/components/admin/dashboard/AdminDashboardContent";

export const metadata: Metadata = {
  title: "Admin – Dashboard",
  description: "Verwaltungsübersicht der Alles-Wurst Plattform.",
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-aw-muted">
          Live-Kennzahlen aus der Datenbank.
        </p>
      </div>

      <div className="mt-8">
        <AdminDashboardContent />
      </div>
    </div>
  );
}
