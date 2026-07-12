"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Logo from "@/components/brand/Logo";
import UserAvatar from "@/components/member/UserAvatar";
import { useAuth } from "@/lib/auth/use-auth";

/**
 * Kopfleiste des Mitgliederbereichs mit Session-Nutzer und Logout.
 */
export default function MemberTopbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/anmelden");
    router.refresh();
  }

  const displayName = user?.displayName ?? "Wurstfreund";

  return (
    <header className="border-b border-aw-border bg-aw-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hidden text-sm font-medium text-aw-cream/70 hover:text-aw-cream sm:inline"
          >
            Zur Website
          </Link>
          <span className="flex items-center gap-2 rounded-full bg-aw-surface px-2 py-1 ring-1 ring-aw-border">
            {loading ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aw-gold text-sm font-bold text-aw-bg">
                …
              </span>
            ) : (
              <UserAvatar profile={user?.profile} size="sm" />
            )}
            <span className="hidden pr-1 text-sm text-aw-cream/90 sm:inline">
              {loading ? "Laden …" : displayName}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-sm font-medium text-aw-muted hover:text-aw-cream"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
}
