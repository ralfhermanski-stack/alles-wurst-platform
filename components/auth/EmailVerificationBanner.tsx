"use client";

/**
 * @file EmailVerificationBanner.tsx
 * @purpose Hinweis für eingeloggte Nutzer ohne bestätigte E-Mail.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { requestEmailVerificationApi } from "@/lib/auth/auth-client";
import { useAuth } from "@/lib/auth/use-auth";

const DISMISS_KEY = "aw.emailVerificationBanner.dismissed";

export default function EmailVerificationBanner() {
  const { user, loading, refresh } = useAuth();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("verifyEmail") === "1";
  const isBeta = searchParams.get("beta") === "1";

  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (justRegistered) {
      setDismissed(false);
      try {
        sessionStorage.removeItem(DISMISS_KEY);
      } catch {
        // ignore
      }
      return;
    }

    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [justRegistered]);

  if (loading || !user || user.emailVerifiedAt || dismissed) {
    return null;
  }

  async function handleResend() {
    if (!user) {
      return;
    }

    setSending(true);
    setError(null);
    setFeedback(null);

    const response = await requestEmailVerificationApi({
      email: user.email,
    });

    setSending(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setFeedback(
      response.data.message ||
        "Falls nötig, wurde ein neuer Bestätigungslink an deine E-Mail gesendet.",
    );
    await refresh();
  }

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="border-b border-aw-gold/40 bg-aw-gold/10"
      role="status"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-aw-cream">
            {justRegistered
              ? "Bitte bestätige deine E-Mail-Adresse"
              : "E-Mail-Adresse noch nicht bestätigt"}
          </p>
          <p className="mt-1 text-sm text-aw-muted">
            {justRegistered
              ? `Wir haben einen Bestätigungslink an ${user.email} gesendet. Du kannst dich schon umsehen — bitte klicke den Link in der E-Mail, sobald du kannst.`
              : `Bitte bestätige ${user.email}, damit wir dir wichtige Hinweise zustellen können. Bis dahin kannst du die Seite weiter nutzen.`}
            {isBeta ? " Deine Betatest-Aufträge findest du unter Mein Bereich." : ""}
          </p>
          {feedback && (
            <p className="mt-2 text-sm text-aw-success">{feedback}</p>
          )}
          {error && (
            <p className="mt-2 text-sm text-aw-warning" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={sending}
            className="rounded-md bg-aw-gold px-3 py-2 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream disabled:opacity-60"
          >
            {sending ? "Wird gesendet …" : "Link erneut senden"}
          </button>
          <Link
            href="/email-bestaetigen"
            className="rounded-md px-3 py-2 text-sm font-semibold text-aw-gold ring-1 ring-aw-gold/40 transition-colors hover:bg-aw-gold/10"
          >
            Hilfe zur Bestätigung
          </Link>
          {isBeta && (
            <Link
              href="/mein-bereich/betatest"
              className="rounded-md px-3 py-2 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface"
            >
              Zu den Beta-Aufträgen
            </Link>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md px-3 py-2 text-sm text-aw-muted hover:text-aw-cream"
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}
