"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useMemberNotificationCounts } from "@/lib/member/use-member-notification-counts";
import { MEMBER_NAV_PERMISSIONS } from "@/lib/permissions/navigation-permissions";

function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/**
 * Horizontale Unter-Navigation für den Mitgliederbereich (permission-gefiltert).
 */
export default function MemberNav() {
  const pathname = usePathname();
  const { messageUnreadCount, supportUnreadCount } = useMemberNotificationCounts();
  const [allowedKeys, setAllowedKeys] = useState<Set<string> | null>(null);

  useEffect(() => {
    void fetch("/api/account/permissions", { credentials: "include" })
      .then((response) => response.json())
      .then((permsJson) => {
        if (permsJson.success && permsJson.data?.permissionKeys) {
          setAllowedKeys(new Set(permsJson.data.permissionKeys as string[]));
        }
      })
      .catch(() => {
        setAllowedKeys(null);
      });
  }, [pathname]);

  const navItems = useMemo(() => {
    if (!allowedKeys) {
      return MEMBER_NAV_PERMISSIONS;
    }

    return MEMBER_NAV_PERMISSIONS.filter((item) => allowedKeys.has(item.permissionKey));
  }, [allowedKeys]);

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b border-aw-border bg-aw-surface/60 px-4 sm:px-6"
      aria-label="Mitgliederbereich-Navigation"
    >
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/mein-bereich" && pathname.startsWith(item.href));

        const badgeCount =
          item.href === "/mein-bereich/nachrichten"
            ? messageUnreadCount
            : item.href === "/mein-bereich/support"
              ? supportUnreadCount
              : 0;

        const showBadge = badgeCount > 0;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              active
                ? "border-aw-gold text-aw-gold"
                : "border-transparent text-aw-cream/70 hover:text-aw-cream"
            }`}
          >
            {item.label}
            {showBadge && (
              <span
                className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-aw-gold px-1.5 py-0.5 text-xs font-bold text-aw-bg"
                aria-label={`${badgeCount} ungelesen`}
              >
                {formatBadgeCount(badgeCount)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
