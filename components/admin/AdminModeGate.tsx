"use client";

/**
 * @file AdminModeGate.tsx
 * @purpose Provisorischer Adminmodus mit Token-Eingabe und Warnbanner.
 */

import { useEffect, useState, type FormEvent } from "react";

import {
  clearAdminToken,
  hasAdminToken,
  setAdminToken,
} from "@/lib/admin/admin-session";
import { verifyAdminTokenApi } from "@/lib/admin/admin-client";

type AdminModeGateProps = {
  children: React.ReactNode;
};

/**
 * Schützt Admin-Inhalte mit Token-Prüfung (Prototyp ohne echte Auth).
 */
export default function AdminModeGate({ children }: AdminModeGateProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verifyStoredTokenEffect() {
      const hasToken = hasAdminToken();
      const response = await (hasToken
        ? verifyAdminTokenApi()
        : Promise.resolve(null));

      if (cancelled) {
        return;
      }

      if (response?.success) {
        setVerified(true);
      } else if (response) {
        clearAdminToken();
        setVerified(false);
        setError(response.error.message);
      }

      setChecking(false);
    }

    void verifyStoredTokenEffect();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setAdminToken(tokenInput);
    setChecking(true);

    const response = await verifyAdminTokenApi();

    if (response.success) {
      setVerified(true);
      setChecking(false);
      return;
    }

    clearAdminToken();
    setVerified(false);
    setError(response.error.message);
    setChecking(false);
  }

  function handleLogout() {
    clearAdminToken();
    setVerified(false);
    setTokenInput("");
  }

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm text-aw-muted">Adminmodus wird geprüft …</p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="mx-auto max-w-lg p-6 sm:p-10">
        <div className="rounded-2xl border border-aw-warning/40 bg-aw-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-aw-warning">
            Prototyp — kein echtes Login
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-aw-cream">
            Adminmodus aktivieren
          </h1>
          <p className="mt-3 text-sm text-aw-muted">
            Der Adminbereich ist vorbereitet, aber noch nicht über Benutzerkonten
            abgesichert. Gib den{" "}
            <code className="text-aw-cream">RECIPE_ADMIN_TOKEN</code> aus der
            Server-Umgebung ein.
          </p>

          <form className="mt-6 space-y-4" onSubmit={(e) => void handleLogin(e)}>
            <div>
              <label
                htmlFor="admin-token"
                className="block text-sm font-semibold text-aw-cream"
              >
                Admin-Token
              </label>
              <input
                id="admin-token"
                type="password"
                autoComplete="off"
                className="mt-2 w-full rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-cream"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-aw-warning" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-aw-gold px-5 py-2.5 text-sm font-semibold text-aw-bg hover:bg-aw-cream"
            >
              Adminmodus starten
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-aw-warning/30 bg-aw-warning/10 px-4 py-2 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-aw-warning sm:text-sm">
            <strong>Adminmodus (Prototyp):</strong> Keine echte Authentifizierung
            — Zugriff nur über Umgebungs-Token. Nicht für Produktion freigeben.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-aw-cream underline hover:text-aw-gold"
          >
            Adminmodus beenden
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
