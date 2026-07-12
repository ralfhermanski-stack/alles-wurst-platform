"use client";

import { useState } from "react";

import AdminEmailNav from "@/components/admin/email/AdminEmailNav";
import { primaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

export default function AdminEmailQueuePage() {
  const [message, setMessage] = useState<string | null>(null);

  async function processQueue() {
    const response = await fetch("/api/admin/email", {
      method: "POST",
      credentials: "include",
    });
    const json = (await response.json()) as {
      success: boolean;
      data?: { processed: number; sent: number; failed: number; retried: number };
      error?: { message: string };
    };

    setMessage(
      json.success
        ? `Verarbeitet: ${json.data?.processed ?? 0}, gesendet: ${json.data?.sent ?? 0}`
        : json.error?.message ?? "Fehler",
    );
  }

  return (
    <AdminEmailNav>
      <p className="text-sm text-aw-muted">
        Offene E-Mails werden per Cronjob oder manuell verarbeitet. Retry-Intervalle:
        sofort, 5 Min., 30 Min., 2 Std., 12 Std.
      </p>
      <button
        type="button"
        className={`${primaryButtonClassName} mt-4`}
        onClick={() => void processQueue()}
      >
        Warteschlange jetzt verarbeiten
      </button>
      {message && <p className="mt-4 text-sm text-aw-muted">{message}</p>}
    </AdminEmailNav>
  );
}
