import type { Metadata } from "next";

import AdminBetaTestPanel from "@/components/admin/beta-test/AdminBetaTestPanel";

export const metadata: Metadata = {
  title: "Admin – Betatest",
};

export default function AdminBetaTestPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Betatest</h1>
      <p className="mt-2 max-w-3xl text-sm text-aw-muted">
        Lade Tester per E-Mail ein, vergebe individuelle Aufträge und behalte den
        Überblick über angenommene Einladungen.
      </p>

      <div className="mt-8">
        <AdminBetaTestPanel />
      </div>
    </div>
  );
}
