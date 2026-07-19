"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchSessionApi } from "@/lib/auth/auth-client";
import { useMemberNotificationCounts } from "@/lib/member/use-member-notification-counts";
import { marketingNav } from "@/lib/placeholder-data";

function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/**
 * Hauptnavigation für das Marketing-Layout.
 */
export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { totalUnreadCount } = useMemberNotificationCounts(isLoggedIn);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const response = await fetchSessionApi();

      if (!cancelled && response.success) {
        setIsLoggedIn(Boolean(response.data));
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const meinBereichLabel = (
    <>
      Mein Bereich
      {isLoggedIn && totalUnreadCount > 0 && (
        <span
          className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-aw-gold px-1.5 py-0.5 text-xs font-bold text-aw-bg"
          aria-label={`${totalUnreadCount} ungelesen`}
        >
          {formatBadgeCount(totalUnreadCount)}
        </span>
      )}
    </>
  );

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Hauptnavigation">
        {marketingNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "text-aw-gold"
                : "text-aw-cream/80 hover:text-aw-cream"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        {isLoggedIn ? (
          <Link
            href="/mein-bereich"
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-aw-cream/80 transition-colors hover:text-aw-cream"
          >
            {meinBereichLabel}
          </Link>
        ) : (
          <Link
            href="/anmelden"
            className="rounded-md px-3 py-2 text-sm font-medium text-aw-cream/80 transition-colors hover:text-aw-cream"
          >
            Anmelden
          </Link>
        )}
        <Link
          href={isLoggedIn ? "/mitgliedschaft" : "/registrieren"}
          className="rounded-md bg-aw-gold px-4 py-2 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
        >
          Mitglied werden
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-md p-2 text-aw-cream md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Menü umschalten"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-aw-border bg-aw-surface px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-3 text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-aw-surface-2 text-aw-gold"
                    : "text-aw-cream/80 hover:bg-aw-surface-2 hover:text-aw-cream"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-aw-border pt-3">
              <Link
                href={isLoggedIn ? "/mein-bereich" : "/anmelden"}
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-md px-3 py-3 text-center text-base font-medium text-aw-cream/90 ring-1 ring-aw-border hover:bg-aw-surface-2"
              >
                {isLoggedIn ? meinBereichLabel : "Anmelden"}
              </Link>
              <Link
                href={isLoggedIn ? "/mitgliedschaft" : "/registrieren"}
                onClick={() => setOpen(false)}
                className="rounded-md bg-aw-gold px-3 py-3 text-center text-base font-semibold text-aw-bg hover:bg-aw-gold-dark hover:text-aw-cream"
              >
                Mitglied werden
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
