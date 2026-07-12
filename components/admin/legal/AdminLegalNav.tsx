"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const legalNav = [
  { href: "/admin/inhalte/rechtliches", label: "Übersicht" },
  { href: "/admin/inhalte/rechtliches/dokumente", label: "Dokumente" },
  { href: "/admin/inhalte/rechtliches/synchronisierung", label: "Synchronisierung" },
  { href: "/admin/inhalte/rechtliches/versionen", label: "Versionen" },
  { href: "/admin/inhalte/rechtliches/widerrufe", label: "Widerrufsanfragen" },
  { href: "/admin/inhalte/rechtliches/einstellungen", label: "Einstellungen" },
  { href: "/admin/inhalte/rechtliches/protokoll", label: "Prüfprotokoll" },
];

type AdminLegalNavProps = {
  children: React.ReactNode;
};

export default function AdminLegalNav({ children }: AdminLegalNavProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Rechtliches
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Rechtstexte verwalten, synchronisieren, versionieren und Widerrufe
          bearbeiten.
        </p>
      </div>

      <nav
        aria-label="Rechtliches Admin"
        className="mb-8 flex flex-wrap gap-2 border-b border-aw-border pb-4"
      >
        {legalNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin/inhalte/rechtliches" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-aw-gold/15 text-aw-gold"
                  : "text-aw-muted hover:bg-aw-surface hover:text-aw-cream"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
