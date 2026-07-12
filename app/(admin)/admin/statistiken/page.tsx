import type { Metadata } from "next";

import AdminAnalyticsPanel from "@/components/admin/analytics/AdminAnalyticsPanel";

export const metadata: Metadata = {
  title: "Admin – Statistiken",
};

export default function AdminStatistikenPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Statistiken
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        First-Party-Analytics der Plattform. Alle Daten sind aggregiert und
        DSGVO-/TDDDG-konform erfasst — ohne Google Analytics oder externe Tracker.
      </p>

      <div className="mt-8">
        <AdminAnalyticsPanel />
      </div>
    </div>
  );
}
