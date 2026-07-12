import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin – Rollen",
};

export default function AdminRolesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10 space-y-4">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Rollen</h1>
      <p className="text-sm text-aw-muted">
        Systemrollen (USER, SUPPORT, INSTRUCTOR, ADMIN, SUPERADMIN) werden über
        Benutzergruppen mit Berechtigungen verknüpft. Verwalten Sie die konkreten
        Rechte in den{" "}
        <Link href="/admin/benutzer-rechte/gruppen" className="text-aw-gold hover:underline">
          Benutzergruppen
        </Link>
        .
      </p>
      <ul className="rounded-xl border border-aw-border p-4 text-sm text-aw-cream space-y-2">
        <li><strong>USER</strong> — Standardnutzer ohne Adminrechte</li>
        <li><strong>SUPPORT</strong> — Tickets, Benutzergrunddaten (Gruppe: Support)</li>
        <li><strong>INSTRUCTOR</strong> — Kurse, Blog (Gruppe: Kursleiter)</li>
        <li><strong>ADMIN</strong> — Breiter Adminzugriff (Gruppe: Administrator)</li>
        <li><strong>SUPERADMIN</strong> — Rechteverwaltung und kritische Systeme</li>
      </ul>
    </div>
  );
}
