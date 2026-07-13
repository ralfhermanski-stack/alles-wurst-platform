"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import RegisterForm from "@/components/auth/RegisterForm";
import {
  acceptBetaInviteApi,
  fetchBetaInvitePreviewApi,
} from "@/lib/beta-test/beta-test-client";
import { useAuth } from "@/lib/auth/use-auth";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export default function InviteLandingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token")?.trim() ?? "";
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Awaited<
    ReturnType<typeof fetchBetaInvitePreviewApi>
  >["data"] | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Kein Einladungstoken in der URL.");
      return;
    }

    let cancelled = false;

    void (async () => {
      const response = await fetchBetaInvitePreviewApi(token);

      if (cancelled) {
        return;
      }

      if (!response.success || !response.data) {
        setError(response.error?.message ?? "Einladung nicht gefunden.");
        setLoading(false);
        return;
      }

      setPreview(response.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAccept() {
    if (!token) {
      return;
    }

    setAccepting(true);
    setError(null);

    const response = await acceptBetaInviteApi(token);
    setAccepting(false);

    if (!response.success) {
      setError(response.error?.message ?? "Einladung konnte nicht angenommen werden.");
      return;
    }

    router.push("/mein-bereich/betatest");
    router.refresh();
  }

  if (loading || authLoading) {
    return <p className="text-sm text-aw-muted">Einladung wird geladen …</p>;
  }

  if (!token || error || !preview) {
    return (
      <div className="rounded-xl border border-aw-warning/30 bg-aw-surface/40 p-6">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Einladung ungültig
        </h1>
        <p className="mt-3 text-sm text-aw-muted">
          {error ?? "Diese Einladung ist nicht mehr gültig."}
        </p>
        <Link href="/anmelden" className={`${secondaryButtonClassName} mt-6 inline-block`}>
          Zur Anmeldung
        </Link>
      </div>
    );
  }

  if (preview.revoked || preview.expired) {
    return (
      <div className="rounded-xl border border-aw-warning/30 bg-aw-surface/40 p-6">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Einladung abgelaufen
        </h1>
        <p className="mt-3 text-sm text-aw-muted">
          Bitte wende dich an das Alles-Wurst-Team für eine neue Einladung.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-aw-gold/25 bg-aw-surface/40 p-6">
        <h1 className="font-display text-2xl font-bold text-aw-cream">
          Willkommen im Betatest
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Du wurdest eingeladen, Alles Wurst vor dem öffentlichen Start zu testen.
        </p>

        {preview.personalMessage && (
          <p className="mt-4 rounded-lg border border-aw-border/60 bg-aw-bg/40 p-4 text-sm text-aw-cream">
            {preview.personalMessage}
          </p>
        )}

        {preview.tasks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-aw-muted">
              Deine Aufträge
            </h2>
            <ul className="mt-3 space-y-3">
              {preview.tasks.map((task) => (
                <li
                  key={`${task.title}-${task.description ?? ""}`}
                  className="rounded-lg border border-aw-border/60 bg-aw-bg/30 p-4"
                >
                  <p className="font-medium text-aw-cream">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-aw-muted">{task.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {user ? (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-6">
          <p className="text-sm text-aw-muted">
            Angemeldet als <strong className="text-aw-cream">{user.email}</strong>
          </p>
          {preview.accepted ? (
            <Link
              href="/mein-bereich/betatest"
              className={`${primaryButtonClassName} mt-4 inline-block`}
            >
              Zu meinen Aufträgen
            </Link>
          ) : (
            <button
              type="button"
              className={`${primaryButtonClassName} mt-4`}
              disabled={accepting}
              onClick={() => void handleAccept()}
            >
              {accepting ? "Wird übernommen …" : "Einladung annehmen"}
            </button>
          )}
        </section>
      ) : preview.existingAccount ? (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-6">
          <p className="text-sm text-aw-muted">
            Du hast bereits ein Konto mit <strong className="text-aw-cream">{preview.email}</strong>.
            Melde dich an und nimm die Einladung an.
          </p>
          <Link
            href={`/anmelden?next=${encodeURIComponent(`/einladung?token=${token}`)}`}
            className={`${primaryButtonClassName} mt-4 inline-block`}
          >
            Anmelden und Einladung annehmen
          </Link>
        </section>
      ) : (
        <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-6">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Konto erstellen
          </h2>
          <p className="mt-2 text-sm text-aw-muted">
            Registriere dich mit der eingeladenen E-Mail-Adresse{" "}
            <strong className="text-aw-cream">{preview.email}</strong>.
          </p>
          <div className="mt-6">
            <RegisterForm
              defaultEmail={preview.email}
              inviteToken={token}
              emailReadOnly
            />
          </div>
        </section>
      )}
    </div>
  );
}
