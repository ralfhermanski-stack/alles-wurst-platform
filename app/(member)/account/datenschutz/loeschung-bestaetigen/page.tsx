"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function DeletionConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [requestId, setRequestId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [finalMessage, setFinalMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setEmailError("Bestätigungslink unvollständig.");
      return;
    }

    void fetch(`/api/account/privacy/deletion/confirm-email?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: { requestId: string }; error?: { message: string } }) => {
        if (json.success && json.data) {
          setRequestId(json.data.requestId);
        } else {
          setEmailError(json.error?.message ?? "Link ungültig.");
        }
      });
  }, [token]);

  async function finalize() {
    if (!requestId) {
      return;
    }

    setLoading(true);

    const response = await fetch("/api/account/privacy/deletion/final-confirm", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    const json = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    setLoading(false);
    setFinalMessage(
      json.success
        ? "Deine Löschanfrage wurde bestätigt und wird bearbeitet."
        : json.error?.message ?? "Bestätigung fehlgeschlagen.",
    );
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Letzte Bestätigung</h1>
      <p className="mt-3 text-sm text-aw-muted">
        Bestätige endgültig die Löschung deines Kontos. Rechnungs- und Vertragsdaten
        können aus rechtlichen Gründen aufbewahrt werden.
      </p>

      {emailError && (
        <p className="mt-6 rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning">
          {emailError}
        </p>
      )}

      {finalMessage && (
        <p className="mt-6 rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm text-aw-muted">
          {finalMessage}
        </p>
      )}

      {requestId && !finalMessage && (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void finalize()}
            disabled={loading}
            className={primaryButtonClassName}
          >
            Löschung endgültig bestätigen
          </button>
          <a href="/account/datenschutz" className={secondaryButtonClassName}>
            Abbrechen
          </a>
        </div>
      )}
    </section>
  );
}
