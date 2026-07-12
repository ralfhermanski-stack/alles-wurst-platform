"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

export default function ExportConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [confirmed, setConfirmed] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Bestätigungslink unvollständig.");
      return;
    }

    void fetch(
      `/api/account/privacy/export/confirm-email?token=${encodeURIComponent(token)}`,
      { credentials: "include" },
    )
      .then((response) => response.json())
      .then(
        (json: {
          success: boolean;
          data?: { requestNumber: string };
          error?: { message: string };
        }) => {
          if (json.success && json.data) {
            setConfirmed(true);
            setRequestNumber(json.data.requestNumber);
          } else {
            setError(json.error?.message ?? "Link ungültig.");
          }
        },
      );
  }, [token]);

  return (
    <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Datenexport bestätigt
      </h1>
      <p className="mt-3 text-sm text-aw-muted">
        Nach der E-Mail-Bestätigung wird dein Export als ZIP-Archiv mit JSON,
        HTML und PDF erstellt.
      </p>

      {error && (
        <p className="mt-6 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning">
          {error}
        </p>
      )}

      {confirmed && (
        <div className="mt-6 space-y-3 rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm text-aw-muted">
          <p>
            Deine Identität wurde bestätigt
            {requestNumber ? ` (${requestNumber})` : ""}. Der Export wird jetzt
            vorbereitet.
          </p>
          <p>
            Du erhältst eine E-Mail mit Download-Link, sobald das Archiv bereit
            steht (in der Regel wenige Minuten).
          </p>
          <a href="/account/datenschutz" className={secondaryButtonClassName}>
            Zum Datenschutz-Center
          </a>
        </div>
      )}
    </section>
  );
}
