"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MEMBER_NAV_PERMISSIONS } from "@/lib/permissions/navigation-permissions";

/**
 * Horizontale Unter-Navigation für den Mitgliederbereich (permission-gefiltert).
 */
export default function MemberNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [allowedKeys, setAllowedKeys] = useState<Set<string> | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/account/messages/unread-count", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/account/permissions", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([messagesJson, permsJson]) => {
        if (messagesJson.success && messagesJson.data) {
          setUnreadCount(messagesJson.data.unreadCount);
        }

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

        const showBadge =
          item.href === "/mein-bereich/nachrichten" && unreadCount > 0;

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
              <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-aw-gold px-1.5 py-0.5 text-xs font-bold text-aw-bg">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
