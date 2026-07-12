"use client";

/**
 * @file BlogGate.tsx
 * @purpose Schützt den Magazin-Admin (ADMIN + INSTRUCTOR).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { verifyBlogSessionApi } from "@/lib/blog/blog-session-client";
import { logoutApi } from "@/lib/auth/auth-client";
import type { AdminActor } from "@/lib/admin/admin-types";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type BlogGateProps = {
  children: React.ReactNode;
};

export default function BlogGate({ children }: BlogGateProps) {
  const router = useRouter();
  const [actor, setActor] = useState<AdminActor | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogoutAndLogin() {
    setLoggingOut(true);
    await logoutApi();
    router.push("/anmelden?next=/admin/magazin");
    router.refresh();
  }

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const response = await verifyBlogSessionApi();

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
        <p className="text-sm text-aw-muted">Magazin-Zugriff wird geprüft …</p>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-aw-warning/40 bg-aw-warning/10 p-6">
          <h1 className="font-display text-xl font-bold text-aw-cream">
            Magazin — Zugriff eingeschränkt
          </h1>
          <p className="mt-3 text-sm leading-6 text-aw-cream/90" role="alert">
            {error ??
              "Nur Administratoren und berechtigte Autoren haben Zugang."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/anmelden?next=/admin/magazin" className={primaryButtonClassName}>
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
      <div className="border-b border-emerald-500/20 bg-emerald-500/5 px-4 py-3 sm:px-6">
        <p className="text-sm text-aw-cream">
          <span className="font-semibold text-emerald-300">Magazin</span>
          {" · "}
          Angemeldet als {actor.displayName} ({actor.email})
        </p>
      </div>
      {children}
    </div>
  );
}
