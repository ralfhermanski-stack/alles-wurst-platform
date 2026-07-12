import type { Metadata } from "next";

import AccountingSearchPanel from "@/components/accounting/AccountingSearchPanel";

export const metadata: Metadata = {
  title: "Buchhaltung — Mitgliedschaften",
  description:
    "Manuelle Korrektur von Mitgliedschaften und Zahlungsstatus, wenn Webhooks nicht greifen.",
};

export default function BuchhaltungPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Mitgliedschaften & Zahlungen
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-aw-muted">
        Nutzer suchen und Mitgliedschaft, Zahlungsstatus sowie Zugriff manuell korrigieren —
        ohne Stripe- oder PayPal-Anbindung.
      </p>

      <div className="mt-8">
        <AccountingSearchPanel />
      </div>
    </div>
  );
}
