import type { Metadata } from "next";
import { headers } from "next/headers";

import MaintenancePageContent from "@/components/maintenance/MaintenancePageContent";
import { getMaintenanceSettings } from "@/lib/maintenance/maintenance-service";

export const metadata: Metadata = {
  title: "Wartungsarbeiten – Alles Wurst",
  description: "Die Plattform wird gerade überarbeitet. Wir sind bald wieder für Sie da.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MaintenancePage() {
  const settings = await getMaintenanceSettings();
  const headerList = await headers();
  const isRewritten = headerList.get("x-middleware-rewrite")?.includes("/wartung");

  return (
    <main className="min-h-screen bg-aw-bg">
      {isRewritten ? null : (
        <span className="sr-only">Wartungsmodus aktiv</span>
      )}
      <MaintenancePageContent settings={settings} />
    </main>
  );
}
