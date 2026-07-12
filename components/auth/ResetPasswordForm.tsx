"use client";

/**
 * @file ResetPasswordForm.tsx
 * @purpose Neues Passwort mit Reset-Token setzen.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { confirmPasswordResetApi } from "@/lib/auth/auth-client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="space-y-4">
        <p
          className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          Der Link zum Zurücksetzen ist ungültig. Bitte fordere einen neuen Link an.
        </p>
        <Link
          href="/passwort-vergessen"
          className={`${primaryButtonClassName} inline-flex w-full justify-center`}
        >
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  return <ResetPasswordFormContent token={token} />;
}

type ResetPasswordFormContentProps = {
  token: string;
};

function ResetPasswordFormContent({ token }: ResetPasswordFormContentProps) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    const response = await confirmPasswordResetApi({ token, password });

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setMessage(response.data.message);
    setTimeout(() => {
      router.push("/anmelden");
    }, 2000);
  }

  if (message) {
    return (
      <div className="space-y-4">
        <p
          className="rounded-lg border border-aw-success/40 bg-aw-success/10 px-4 py-3 text-sm text-aw-success"
          role="status"
        >
          {message}
        </p>
        <p className="text-sm text-aw-muted">Du wirst zur Anmeldung weitergeleitet …</p>
      </div>
    );
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

      <div>
        <label htmlFor="new-password" className={labelClassName}>
          Neues Passwort
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={`${inputClassName} mt-2`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="new-password-confirm" className={labelClassName}>
          Passwort wiederholen
        </label>
        <input
          id="new-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={`${inputClassName} mt-2`}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className={`${primaryButtonClassName} w-full`}
        disabled={loading}
      >
        {loading ? "Wird gespeichert …" : "Neues Passwort speichern"}
      </button>
    </form>
  );
}
