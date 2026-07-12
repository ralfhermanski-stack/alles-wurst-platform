"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Logo from "@/components/brand/Logo";
import {
  ADMIN_NAV_STORAGE_KEY,
  adminNavSections,
  getAdminNavSectionForPath,
  isAdminNavItemActive,
} from "@/lib/admin/admin-nav";
import {
  filterNavByPermissions,
  resolveAdminNavPermission,
} from "@/lib/permissions/navigation-permissions";

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Admin-Sidebar mit ausklappbaren Navigationssektionen.
 */
export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [allowedKeys, setAllowedKeys] = useState<Set<string> | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  useEffect(() => {
    const activeSection = getAdminNavSectionForPath(pathname);
    let stored: string[] = [];

    try {
      const raw = localStorage.getItem(ADMIN_NAV_STORAGE_KEY);

      if (raw) {
        stored = JSON.parse(raw) as string[];
      }
    } catch {
      stored = [];
    }

    setExpandedSections((previous) => {
      const next = new Set(stored.length > 0 ? stored : previous);

      if (activeSection) {
        next.add(activeSection);
      }

      return next;
    });
  }, [pathname]);

  useEffect(() => {
    void fetch("/api/admin/permissions/session", { credentials: "include" })
      .then((response) => response.json())
      .then(
        (json: {
          success: boolean;
          data?: { permissionKeys: string[]; isSuperAdmin: boolean; isAdmin?: boolean };
        }) => {
        if (!json.success || !json.data) {
          return;
        }

        if (json.data.isSuperAdmin || json.data.isAdmin) {
          setAllowedKeys(null);
          return;
        }

        setAllowedKeys(new Set(json.data.permissionKeys));
      },
      )
      .catch(() => {
        setAllowedKeys(null);
      });
  }, []);

  const visibleSections = adminNavSections
    .map((section) => ({
      ...section,
      items:
        allowedKeys === null
          ? section.items
          : filterNavByPermissions(section.items, allowedKeys, resolveAdminNavPermission),
    }))
    .filter((section) => section.items.length > 0);

  const persistExpandedSections = useCallback((sections: Set<string>) => {
    try {
      localStorage.setItem(
        ADMIN_NAV_STORAGE_KEY,
        JSON.stringify([...sections]),
      );
    } catch {
      // localStorage nicht verfügbar
    }
  }, []);

  const toggleSection = useCallback(
    (sectionId: string) => {
      setExpandedSections((previous) => {
        const next = new Set(previous);

        if (next.has(sectionId)) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }

        persistExpandedSections(next);
        return next;
      });
    },
    [persistExpandedSections],
  );

  const isItemActive = useCallback(
    (href: string) => isAdminNavItemActive(pathname, href, currentSearch),
    [pathname, currentSearch],
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-aw-border bg-aw-surface px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="rounded-md p-2 text-aw-cream ring-1 ring-aw-border"
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar-nav"
          aria-label="Admin-Menü umschalten"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Admin-Menü schließen"
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="admin-sidebar-nav"
        className={`${
          mobileOpen ? "max-lg:block" : "max-lg:hidden"
        } relative z-30 border-b border-aw-border bg-aw-surface lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r`}
      >
        <div className="hidden h-16 items-center border-b border-aw-border px-6 lg:flex">
          <Logo />
        </div>

        <nav className="space-y-2 p-4" aria-label="Admin-Navigation">
          {visibleSections.map((section) => {
            const expanded = expandedSections.has(section.id);
            const sectionHasActiveItem = section.items.some((item) =>
              isItemActive(item.href),
            );

            return (
              <div key={section.id} className="rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={expanded}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
                    sectionHasActiveItem
                      ? "text-aw-gold"
                      : "text-aw-muted hover:text-aw-cream"
                  }`}
                >
                  <span>{section.label}</span>
                  <ChevronIcon expanded={expanded} />
                </button>

                {expanded && (
                  <div className="mt-1 space-y-1 pb-2 pl-1">
                    {section.items.map((item) => {
                      const active = isItemActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            active
                              ? "bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/30"
                              : "text-aw-cream/80 hover:bg-aw-surface-2 hover:text-aw-cream"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-aw-border pt-4">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-aw-cream/70 hover:bg-aw-surface-2 hover:text-aw-cream"
            >
              ← Zur Website
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
