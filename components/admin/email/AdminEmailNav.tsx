"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { label: "Übersicht", href: "/admin/kommunikation/email" },
  { label: "Absender", href: "/admin/kommunikation/email/absender" },
  { label: "Provider", href: "/admin/kommunikation/email/provider" },
  { label: "Vorlagen", href: "/admin/kommunikation/email/vorlagen" },
  { label: "Versand", href: "/admin/kommunikation/email/versand" },
  { label: "Warteschlange", href: "/admin/kommunikation/email/warteschlange" },
  { label: "Protokoll", href: "/admin/kommunikation/email/protokoll" },
  { label: "Zustellfehler", href: "/admin/kommunikation/email/fehler" },
  { label: "Einstellungen", href: "/admin/kommunikation/email/einstellungen" },
  { label: "Testversand", href: "/admin/kommunikation/email/test" },
];

export default function AdminEmailNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">E-Mail</h1>
        <p className="mt-1 text-sm text-aw-muted">
          Zentrales E-Mail-Center: Provider, Absender, Vorlagen, Warteschlange und
          Versandprotokoll.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV.map((item) => {
          const active =
            item.href === "/admin/kommunikation/email"
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
