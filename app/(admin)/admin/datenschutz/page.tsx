import Link from "next/link";

import AdminPrivacyNav from "@/components/admin/privacy/AdminPrivacyNav";

export default function AdminDatenschutzPage() {
  return (
    <AdminPrivacyNav>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/datenschutz/anfragen"
          className="rounded-xl border border-aw-border bg-aw-surface p-5 hover:border-aw-gold/50"
        >
          <h2 className="font-display text-lg font-bold text-aw-cream">Anfragen</h2>
          <p className="mt-2 text-sm text-aw-muted">
            Auskunft, Löschung, Export und weitere Datenschutzanfragen.
          </p>
        </Link>
        <Link
          href="/admin/datenschutz/exporte"
          className="rounded-xl border border-aw-border bg-aw-surface p-5 hover:border-aw-gold/50"
        >
          <h2 className="font-display text-lg font-bold text-aw-cream">Exporte</h2>
          <p className="mt-2 text-sm text-aw-muted">
            Ausstehende und abgelaufene Datenexporte.
          </p>
        </Link>
      </div>
    </AdminPrivacyNav>
  );
}
