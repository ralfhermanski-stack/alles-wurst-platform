"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/use-auth";
import { useMemberNotificationCounts } from "@/lib/member/use-member-notification-counts";

const BASE_QUICK_LINKS = [
  { href: "/werkstatt", label: "Werkstatt", desc: "Rechner & Generatoren" },
  { href: "/akademie/kurse", label: "Kurskatalog", desc: "Kurse entdecken" },
  { href: "/mein-bereich/kurse", label: "Meine Kurse", desc: "Fortschritt & Lektionen" },
  { href: "/mein-bereich/bestellungen", label: "Bestellungen", desc: "Rechnungen & Käufe" },
  { href: "/mein-bereich/nachrichten", label: "Nachrichten", desc: "System & Bestätigungen" },
  { href: "/mein-bereich/support", label: "Support", desc: "Hilfe & Tickets" },
  { href: "/mein-bereich/zertifikate", label: "Zertifikate", desc: "Abschlüsse & PDF" },
  { href: "/mein-bereich/mitgliedschaft", label: "Mitgliedschaft", desc: "Laufzeit & Kündigung" },
] as const;

function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

export default function MemberQuickLinks() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { messageUnreadCount, supportUnreadCount } = useMemberNotificationCounts();

  const quickLinks = user?.maintenanceBypass
    ? [
        {
          href: "/mein-bereich/betatest",
          label: "Betatest",
          desc: "Deine Testaufträge",
        },
        ...BASE_QUICK_LINKS,
      ]
    : BASE_QUICK_LINKS;

  return (
    <nav
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Schnellzugriff Mein Bereich"
    >
      {quickLinks.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        const badgeCount =
          item.href === "/mein-bereich/nachrichten"
            ? messageUnreadCount
            : item.href === "/mein-bereich/support"
              ? supportUnreadCount
              : 0;

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
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-aw-cream">{item.label}</p>
              {badgeCount > 0 && (
                <span
                  className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-aw-gold px-1.5 py-0.5 text-xs font-bold text-aw-bg"
                  aria-label={`${badgeCount} ungelesen`}
                >
                  {formatBadgeCount(badgeCount)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-aw-muted">{item.desc}</p>
          </Link>
        );
      })}
    </nav>
  );
}
