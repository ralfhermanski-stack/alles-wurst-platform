import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin – Einstellungen",
};

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Einstellungen
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Zentrale Systemeinstellungen werden schrittweise ergänzt.
      </p>

      <ul className="mt-8 space-y-3">
        <li>
          <Link
            href="/admin/werkstatt/rezeptgenerator/einstellungen"
            className="text-aw-cream hover:text-aw-gold"
          >
            Rezeptgenerator-Einstellungen
          </Link>
        </li>
        <li>
          <Link
            href="/admin/zertifikate"
            className="text-aw-cream hover:text-aw-gold"
          >
            Zertifikatsvorlagen
          </Link>
        </li>
      </ul>
    </div>
  );
}
