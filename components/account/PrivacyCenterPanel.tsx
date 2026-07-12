"use client";

import { useEffect, useState } from "react";

import AccountMessagesPanel from "@/components/member/AccountMessagesPanel";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type PrivacyOverview = {
  requests: Array<{ id: string; requestNumber: string; type: string; status: string }>;
  exports: Array<{
    id: string;
    status: string;
    expiresAt: string | null;
    generatedAt: string | null;
    downloadable: boolean;
  }>;
};

export default function PrivacyCenterPanel() {
  const [overview, setOverview] = useState<PrivacyOverview | null>(null);
  const [password, setPassword] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/account/privacy/overview", { credentials: "include" })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: PrivacyOverview }) => {
        if (json.success && json.data) {
          setOverview(json.data);
        }
      });
  }, []);

  async function requestExport() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/account/privacy/export", {
      method: "POST",
      credentials: "include",
    });

    const json = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    setLoading(false);
    setMessage(
      json.success
        ? "Bestätigungs-E-Mail wurde gesendet. Bitte bestätige deine Identität per E-Mail."
        : json.error?.message ?? "Export fehlgeschlagen.",
    );
  }

  async function requestDeletion() {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/account/privacy/deletion/request", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, acknowledged }),
    });

    const json = (await response.json()) as {
      success: boolean;
      error?: { message: string };
    };

    setLoading(false);
    setMessage(
      json.success
        ? "Bestätigungs-E-Mail wurde gesendet."
        : json.error?.message ?? "Löschantrag fehlgeschlagen.",
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">Konto-Nachrichten</h2>
        <p className="mt-2 text-sm text-aw-muted">
          Bestätigungen zu Exporten, Löschanträgen und anderen Datenschutz-Vorgängen.
        </p>
        <div className="mt-4">
          <AccountMessagesPanel compact limit={5} />
        </div>
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">Übersicht</h2>
        <p className="mt-2 text-sm text-aw-muted">
          Verwalte deine Daten, Einwilligungen und Datenschutzanfragen.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-aw-muted">
          <li>Kontodaten und Profil</li>
          <li>Bestellungen und Vertragsnachweise</li>
          <li>Kurse, Zertifikate, Tickets</li>
          <li>Einwilligungen (Cookies, Marketing)</li>
        </ul>
        <LinkBlock href="/cookie-einstellungen" label="Cookie-Einstellungen öffnen" />
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">Datenexport</h2>
        <p className="mt-2 text-sm text-aw-muted">
          Fordere eine Kopie deiner gespeicherten Daten an. Nach E-Mail-Bestätigung
          erhältst du ein ZIP-Archiv mit JSON, HTML und PDF.
        </p>
        <button
          type="button"
          onClick={() => void requestExport()}
          disabled={loading}
          className={`${primaryButtonClassName} mt-4`}
        >
          Meine Daten anfordern
        </button>
        {overview?.exports[0] && (
          <div className="mt-4 space-y-2 text-sm text-aw-muted">
            <p>
              Letzter Export: {overview.exports[0].status}
              {overview.exports[0].expiresAt && (
                <> · gültig bis {new Date(overview.exports[0].expiresAt).toLocaleDateString("de-DE")}</>
              )}
            </p>
            {overview.exports[0].downloadable && (
              <a
                href={`/api/account/privacy/export/${overview.exports[0].id}/download`}
                className={`${primaryButtonClassName} inline-block`}
              >
                ZIP herunterladen
              </a>
            )}
            {overview.exports[0].status === "REQUESTED" && (
              <p className="text-xs">
                Warte auf E-Mail-Bestätigung, bevor der Export erstellt wird.
              </p>
            )}
            {(overview.exports[0].status === "PROCESSING") && (
              <p className="text-xs">Export wird vorbereitet …</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Meine Datenschutzanfragen
        </h2>
        {overview?.requests.length ? (
          <ul className="mt-4 space-y-2 text-sm text-aw-muted">
            {overview.requests.map((request) => (
              <li key={request.id}>
                {request.requestNumber} · {request.type} · {request.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-aw-muted">Keine Anfragen vorhanden.</p>
        )}
      </section>

      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Konto und Daten löschen
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          Rechnungen, Vertragsnachweise und offene Vorgänge können gesetzlich
          aufbewahrt werden. Öffentliche Beiträge können anonymisiert werden.
        </p>
        <label className="mt-4 block">
          <span className={labelClassName}>Aktuelles Passwort</span>
          <input
            type="password"
            className={inputClassName}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="mt-4 flex items-start gap-3 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            className="mt-1 accent-aw-gold"
          />
          <span>
            Ich habe verstanden, dass mein Zugang nach Abschluss des Vorgangs nicht
            wiederhergestellt werden kann.
          </span>
        </label>
        <button
          type="button"
          onClick={() => void requestDeletion()}
          disabled={loading || !password || !acknowledged}
          className={`${secondaryButtonClassName} mt-4 border-amber-500/50 text-amber-200`}
        >
          Löschung beantragen
        </button>
      </section>

      {message && (
        <p className="rounded-lg border border-aw-border bg-aw-surface px-4 py-3 text-sm text-aw-muted">
          {message}
        </p>
      )}
    </div>
  );
}

function LinkBlock({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="mt-4 inline-block text-sm text-aw-gold hover:underline">
      {label}
    </a>
  );
}
