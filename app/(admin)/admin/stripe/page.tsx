import type { Metadata } from "next";

import AdminStripePanel from "@/components/admin/stripe/AdminStripePanel";

export const metadata: Metadata = {
  title: "Admin – Stripe",
};

export default function AdminStripePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Stripe</h1>
      <p className="mt-2 text-sm text-aw-muted">
        Konfiguration, Webhook-Status und Testzahlungen. Freischaltungen erfolgen
        ausschließlich über geprüfte Webhooks — nicht über die Success-URL.
      </p>

      <div className="mt-8">
        <AdminStripePanel />
      </div>
    </div>
  );
}
