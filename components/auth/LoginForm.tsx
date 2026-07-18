"use client";

/**
 * @file LoginForm.tsx
 * @purpose Anmeldeformular mit Rezept-Verknüpfung.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { loginApi } from "@/lib/auth/auth-client";
import { resolvePostLoginPath } from "@/lib/auth/post-login-redirect";
import {
  getStoredRecipeUserId,
  setRecipeUserId,
} from "@/lib/tools/recipe-session";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const recipeUserId = getStoredRecipeUserId() ?? undefined;

    const response = await loginApi({
      email,
      password,
      recipeUserId,
    });

    setLoading(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setRecipeUserId(response.data.id);
    const targetPath = resolvePostLoginPath(response.data.systemRole, returnTo);
    router.push(targetPath);
    router.refresh();
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
        <label htmlFor="login-email" className={labelClassName}>
          E-Mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          className={`${inputClassName} mt-2`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="login-password" className={labelClassName}>
          Passwort
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          className={`${inputClassName} mt-2`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="mt-2 text-right text-sm">
          <Link
            href="/passwort-vergessen"
            className="font-medium text-aw-gold hover:text-aw-cream"
          >
            Passwort vergessen?
          </Link>
        </p>
      </div>

      <button
        type="submit"
        className={`${primaryButtonClassName} w-full`}
        disabled={loading}
      >
        {loading ? "Anmeldung …" : "Anmelden"}
      </button>

      <p className="text-center text-sm text-aw-muted">
        Noch kein Konto? Während der Beta ist die Registrierung nur mit{" "}
        <Link href="/registrieren" className="font-semibold text-aw-gold hover:text-aw-cream">
          Einladungslink
        </Link>{" "}
        möglich.
      </p>
    </form>
  );
}
