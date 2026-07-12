import type { Metadata } from "next";

import AdminPartnerProgramsPanel from "@/components/admin/werkstatt/AdminPartnerProgramsPanel";

export const metadata: Metadata = {
  title: "Admin – Partnerprogramme",
};

export default function AdminPartnerProgramsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-aw-cream">
        Einstellungen → Partnerprogramme
      </h1>
      <AdminPartnerProgramsPanel />
    </div>
  );
}
