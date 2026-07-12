import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin – Adminrechte",
};

export default function AdminRightsOverviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10 space-y-4">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Adminrechte</h1>
      <p className="text-sm text-aw-muted">
        Granulare Adminbereiche (Dashboard, Benutzer, Kurse, Buchhaltung, SEO usw.)
        werden pro Gruppe freigegeben. Bearbeiten Sie die Matrix in der jeweiligen{" "}
        <Link href="/admin/benutzer-rechte/gruppen" className="text-aw-gold hover:underline">
          Benutzergruppe
        </Link>
        .
      </p>
      <p className="text-sm text-aw-muted">
        Beispiel Support: Tickets und Benutzergrunddaten — keine Zahlungen, keine Rollenvergabe.
        Beispiel Buchhaltung: Bestellungen und Rechnungen — keine Kursbearbeitung.
      </p>
    </div>
  );
}
