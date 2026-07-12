"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { label: "Übersicht", href: "/admin/datenschutz" },
  { label: "Anfragen", href: "/admin/datenschutz/anfragen" },
  { label: "Exporte", href: "/admin/datenschutz/exporte" },
];

export default function AdminPrivacyNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Datenschutz</h1>
        <p className="mt-1 text-sm text-aw-muted">
          Datenschutzanfragen, Löschanträge und Datenexporte verwalten.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV.map((item) => {
          const active =
            item.href === "/admin/datenschutz"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-aw-gold/20 text-aw-gold"
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
