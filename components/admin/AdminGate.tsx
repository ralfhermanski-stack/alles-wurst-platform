"use client";

/**
 * @file AdminGate.tsx
 * @purpose Schützt den Adminbereich — ADMIN-Systemrolle oder Buchhaltung.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AccountingGate from "@/components/accounting/AccountingGate";
import BlogGate from "@/components/admin/BlogGate";
import { logoutApi } from "@/lib/auth/auth-client";
import { verifyAdminSessionApi } from "@/lib/admin/admin-session-client";
import { verifyStaffSessionApi } from "@/lib/admin/staff-session-client";
import type { AdminActor } from "@/lib/admin/admin-types";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type AdminGateProps = {
  children: React.ReactNode;
};

function AdminOnlyGate({ children }: AdminGateProps) {
  const router = useRouter();
  const [actor, setActor] = useState<AdminActor | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogoutAndLogin() {
    setLoggingOut(true);
    await logoutApi();
    router.push("/anmelden?next=/admin");
    router.refresh();
  }

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const response = await verifyAdminSessionApi();

      if (cancelled) {
        return;
      }

      if (response.success) {
        setActor(response.data);
        setError(null);
      } else {
        setActor(null);
        setError(response.error.message);
      }

      setChecking(false);
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm text-aw-muted">Admin-Zugriff wird geprüft …</p>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-aw-warning/40 bg-aw-warning/10 p-6">
          <h1 className="font-display text-xl font-bold text-aw-cream">
            Adminbereich — Zugriff eingeschränkt
          </h1>
          <p className="mt-3 text-sm leading-6 text-aw-cream/90" role="alert">
            {error ??
              "Nur angemeldete Administratoren haben Zugang. Bitte mit einem Admin-Konto anmelden."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/anmelden?next=/admin" className={primaryButtonClassName}>
              Mit Admin-Konto anmelden
            </Link>
            <button
              type="button"
              onClick={() => void handleLogoutAndLogin()}
              disabled={loggingOut}
              className="rounded-lg border border-aw-border px-4 py-2.5 text-sm font-semibold text-aw-cream hover:border-aw-gold/50 disabled:opacity-60"
            >
              {loggingOut ? "Abmelden …" : "Abmelden und neu anmelden"}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-aw-border px-4 py-2.5 text-sm font-semibold text-aw-cream hover:border-aw-gold/50"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-aw-gold/20 bg-aw-gold/5 px-4 py-3 sm:px-6">
        <p className="text-sm text-aw-cream">
          <span className="font-semibold text-aw-gold">Admin</span>
          {" · "}
          Angemeldet als {actor.displayName} ({actor.email})
        </p>
      </div>
      {children}
    </div>
  );
}

function StaffGate({ children }: AdminGateProps) {
  const router = useRouter();
  const [actor, setActor] = useState<AdminActor | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogoutAndLogin() {
    setLoggingOut(true);
    await logoutApi();
    router.push("/anmelden?next=/admin/support");
    router.refresh();
  }

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const response = await verifyStaffSessionApi();

      if (cancelled) {
        return;
      }

      if (response.success) {
        setActor(response.data);
        setError(null);
      } else {
        setActor(null);
        setError(response.error.message);
      }

      setChecking(false);
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm text-aw-muted">Support-Zugriff wird geprüft …</p>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-aw-warning/40 bg-aw-warning/10 p-6">
          <h1 className="font-display text-xl font-bold text-aw-cream">
            Support — Zugriff eingeschränkt
          </h1>
          <p className="mt-3 text-sm leading-6 text-aw-cream/90" role="alert">
            {error ??
              "Nur angemeldete Administratoren oder Support-Mitarbeiter haben Zugang."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/anmelden?next=/admin/support"
              className={primaryButtonClassName}
            >
              Anmelden
            </Link>
            <button
              type="button"
              onClick={() => void handleLogoutAndLogin()}
              disabled={loggingOut}
              className="rounded-lg border border-aw-border px-4 py-2.5 text-sm font-semibold text-aw-cream hover:border-aw-gold/50 disabled:opacity-60"
            >
              {loggingOut ? "Abmelden …" : "Abmelden und neu anmelden"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-sky-500/20 bg-sky-500/5 px-4 py-3 sm:px-6">
        <p className="text-sm text-aw-cream">
          <span className="font-semibold text-sky-300">Support</span>
          {" · "}
          Angemeldet als {actor.displayName} ({actor.email})
        </p>
      </div>
      {children}
    </div>
  );
}

export default function AdminGate({ children }: AdminGateProps) {
  const pathname = usePathname();
  const isBuchhaltung = pathname?.startsWith("/admin/buchhaltung");
  const isSupport = pathname?.startsWith("/admin/support");
  const isBlog = pathname?.startsWith("/admin/magazin");

  if (isBuchhaltung) {
    return <AccountingGate>{children}</AccountingGate>;
  }

  if (isSupport) {
    return <StaffGate>{children}</StaffGate>;
  }

  if (isBlog) {
    return <BlogGate>{children}</BlogGate>;
  }

  return <AdminOnlyGate>{children}</AdminOnlyGate>;
}
