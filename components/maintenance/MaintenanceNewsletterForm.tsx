"use client";

import { useState } from "react";

import {
  inputClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type MaintenanceNewsletterFormProps = {
  disabled?: boolean;
};

export default function MaintenanceNewsletterForm({
  disabled = false,
}: MaintenanceNewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (disabled) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/maintenance/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        setError(data.message ?? "Anmeldung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      setMessage(data.message ?? "Vielen Dank für Ihre Anmeldung.");
      setEmail("");
      setLoading(false);
    } catch {
      setError("Netzwerkfehler. Bitte später erneut versuchen.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-8 w-full max-w-md"
      aria-disabled={disabled}
    >
      {disabled && (
        <p className="mb-3 text-xs text-aw-muted">Newsletter nur in der Vorschau sichtbar.</p>
      )}
      <label htmlFor="maintenance-email" className="sr-only">
        E-Mail für Benachrichtigung
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="maintenance-email"
          type="email"
          autoComplete="email"
          required={!disabled}
          className={inputClassName}
          placeholder="E-Mail eintragen und informiert werden"
          value={email}
          disabled={disabled}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          type="submit"
          className={primaryButtonClassName}
          disabled={loading || disabled}
        >
          {loading ? "Sendet …" : "Informieren"}
        </button>
      </div>
      {message && (
        <p className="mt-3 text-sm text-emerald-300" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
