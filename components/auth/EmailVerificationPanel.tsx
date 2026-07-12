"use client";

/**
 * @file EmailVerificationPanel.tsx
 * @purpose E-Mail bestätigen (Token aus URL) oder Bestätigungslink anfordern.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import DevActionLinkHint from "@/components/auth/DevActionLinkHint";
import {
  confirmEmailVerificationApi,
  requestEmailVerificationApi,
} from "@/lib/auth/auth-client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type PanelState = "idle" | "confirming" | "confirmed" | "requesting";

export default function EmailVerificationPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [state, setState] = useState<PanelState>(
    tokenFromUrl ? "confirming" : "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = tokenFromUrl;

    if (!token) {
      return;
    }

    let cancelled = false;

    async function confirmToken(verifiedToken: string) {
      setState("confirming");
      setError(null);

      const response = await confirmEmailVerificationApi(verifiedToken);

      if (cancelled) {
        return;
      }

      if (!response.success) {
        setError(response.error.message);
        setState("idle");
        return;
      }

      setMessage(response.data.message);
      setState("confirmed");
      router.refresh();
    }

    void confirmToken(token);

    return () => {
      cancelled = true;
    };
  }, [tokenFromUrl, router]);

  async function handleRequest(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDevLink(null);
    setLoading(true);

    const response = await requestEmailVerificationApi({ email });

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

  if (state === "confirming" && !error) {
    return (
      <p className="text-sm text-aw-muted" role="status">
        E-Mail wird bestätigt …
      </p>
    );
  }

  if (state === "confirmed" && message) {
    return (
      <div className="space-y-5">
        <p
          className="rounded-lg border border-aw-success/40 bg-aw-success/10 px-4 py-3 text-sm text-aw-success"
          role="status"
        >
          {message}
        </p>
        <Link
          href="/mein-bereich"
          className={`${primaryButtonClassName} inline-flex w-full justify-center`}
        >
          Zum Mein-Bereich
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      <form onSubmit={(e) => void handleRequest(e)} className="space-y-5">
        <p className="text-sm text-aw-muted">
          Gib deine E-Mail-Adresse ein, um einen neuen Bestätigungslink zu erhalten.
        </p>

        <div>
          <label htmlFor="verify-email" className={labelClassName}>
            E-Mail
          </label>
          <input
            id="verify-email"
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
          {loading ? "Wird gesendet …" : "Bestätigungslink anfordern"}
        </button>
      </form>

      <p className="text-center text-sm text-aw-muted">
        Bereits bestätigt?{" "}
        <Link href="/anmelden" className="font-semibold text-aw-gold hover:text-aw-cream">
          Zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
