import type { Metadata } from "next";

import AdminProductRecommendationsPanel from "@/components/admin/werkstatt/AdminProductRecommendationsPanel";

export const metadata: Metadata = {
  title: "Admin – Produktempfehlungen",
};

export default function AdminProductRecommendationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-aw-cream">
        Werkstatt → Produktempfehlungen
      </h1>
      <AdminProductRecommendationsPanel />
    </div>
  );
}
