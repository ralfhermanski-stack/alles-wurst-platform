"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const QUICK_LINKS = [
  { href: "/mein-bereich/kurse", label: "Meine Kurse", desc: "Fortschritt & Lektionen" },
  { href: "/mein-bereich/bestellungen", label: "Bestellungen", desc: "Rechnungen & Käufe" },
  { href: "/mein-bereich/nachrichten", label: "Nachrichten", desc: "System & Bestätigungen" },
  { href: "/mein-bereich/support", label: "Support", desc: "Hilfe & Tickets" },
  { href: "/mein-bereich/zertifikate", label: "Zertifikate", desc: "Abschlüsse & PDF" },
  { href: "/mein-bereich/mitgliedschaft", label: "Mitgliedschaft", desc: "Laufzeit & Kündigung" },
] as const;

export default function MemberQuickLinks() {
  const pathname = usePathname();

  return (
    <nav
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Schnellzugriff Mein Bereich"
    >
      {QUICK_LINKS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              active
                ? "border-aw-gold/50 bg-aw-gold/10"
                : "border-aw-border bg-aw-surface/40 hover:border-aw-gold/30"
            }`}
          >
            <p className="font-semibold text-aw-cream">{item.label}</p>
            <p className="mt-0.5 text-xs text-aw-muted">{item.desc}</p>
          </Link>
        );
      })}
    </nav>
  );
}
