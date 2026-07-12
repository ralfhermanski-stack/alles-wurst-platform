"use client";

/**
 * @file ForgotPasswordForm.tsx
 * @purpose Passwort-Reset per E-Mail anfordern.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";

import DevActionLinkHint from "@/components/auth/DevActionLinkHint";
import { requestPasswordResetApi } from "@/lib/auth/auth-client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDevLink(null);
    setLoading(true);

    const response = await requestPasswordResetApi(email);

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(response.data.message);

    if (response.data.devActionLink) {
      setDevLink(response.data.devActionLink);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {error && (
        <p
          className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          className="rounded-lg border border-aw-success/40 bg-aw-success/10 px-4 py-3 text-sm text-aw-success"
          role="status"
        >
          {message}
        </p>
      )}

      {devLink && <DevActionLinkHint link={devLink} />}

      <div>
        <label htmlFor="reset-email" className={labelClassName}>
          E-Mail
        </label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          required
          className={`${inputClassName} mt-2`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className={`${primaryButtonClassName} w-full`}
        disabled={loading}
      >
        {loading ? "Wird gesendet …" : "Link zum Zurücksetzen anfordern"}
      </button>

      <p className="text-center text-sm text-aw-muted">
        <Link href="/anmelden" className="font-semibold text-aw-gold hover:text-aw-cream">
          Zurück zur Anmeldung
        </Link>
      </p>
    </form>
  );
}
