"use client";

/**
 * @file AccountingGate.tsx
 * @purpose Schützt den Buchhaltungsbereich — Session mit Rolle accounting/admin.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import { verifyAccountingSessionApi } from "@/lib/accounting/accounting-client";
import type { AccountingActor } from "@/lib/accounting/accounting-types";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type AccountingGateProps = {
  children: React.ReactNode;
};

export default function AccountingGate({ children }: AccountingGateProps) {
  const [actor, setActor] = useState<AccountingActor | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const response = await verifyAccountingSessionApi();

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
        <p className="text-sm text-aw-muted">Buchhaltungs-Zugriff wird geprüft …</p>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-aw-warning/40 bg-aw-warning/10 p-6">
          <h1 className="font-display text-xl font-bold text-aw-cream">
            Buchhaltung — Zugriff eingeschränkt
          </h1>
          <p className="mt-3 text-sm leading-6 text-aw-cream/90" role="alert">
            {error ??
              "Nur angemeldete Nutzer mit der Rolle Buchhaltung oder Administrator haben Zugang."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/anmelden" className={primaryButtonClassName}>
              Anmelden
            </Link>
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
          <span className="font-semibold text-aw-gold">Buchhaltung</span>
          {" · "}
          Angemeldet als {actor.displayName} ({actor.role === "admin" ? "Administrator" : "Buchhaltung"})
        </p>
      </div>
      {children}
    </div>
  );
}
