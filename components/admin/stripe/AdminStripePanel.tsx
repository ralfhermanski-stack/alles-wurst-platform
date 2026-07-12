"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  createStripeTestCheckoutApi,
  fetchStripeAdminOverviewApi,
  fetchStripeTestPricesApi,
  saveStripeKeysApi,
  testStripeApiKeysApi,
  updateStripeActiveModeApi,
  type StripeTestProductPrice,
} from "@/lib/stripe/stripe-admin-client";
import type { StripeAdminOverview } from "@/lib/stripe/stripe-admin-service";
import type { StripeModeStatus } from "@/lib/stripe/stripe-settings-service";
import type { StripeActiveMode } from "@prisma/client";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

function ModeBadge({ mode, active }: { mode: StripeActiveMode; active: boolean }) {
  const label = mode === "live" ? "Livemodus" : "Testmodus";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? mode === "live"
            ? "bg-aw-warning/20 text-aw-warning"
            : "bg-aw-gold/20 text-aw-gold"
          : "bg-aw-border text-aw-muted"
      }`}
    >
      {label} {active ? "aktiv" : "inaktiv"}
    </span>
  );
}

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null) {
    return <span className="text-aw-muted">—</span>;
  }

  return (
    <span className={ok ? "text-aw-success" : "text-aw-warning"}>
      {ok ? "OK" : "Fehler"}
    </span>
  );
}

function serverKeyLabel(type: StripeModeStatus["serverKeyType"]): string {
  switch (type) {
    case "restricted":
      return "Restricted Key";
    case "secret":
      return "Secret Key";
    default:
      return "fehlt";
  }
}

function ModeKeyStatus({ status }: { status: StripeModeStatus }) {
  return (
    <dl className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">Im Admin gespeichert</dt>
        <dd>{status.keysSavedInAdmin ? "ja" : "nein"}</dd>
      </div>
      {status.keysSavedAt && (
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Zuletzt gespeichert</dt>
          <dd className="text-right text-xs">{status.keysSavedAt}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">Publishable Key</dt>
        <dd>
          {status.publishableKeyPresent ? "ja" : "nein"}
          {status.publishableKeyMasked && (
            <span className="mt-1 block font-mono text-xs text-aw-cream">
              {status.publishableKeyMasked}
            </span>
          )}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">Server-Key</dt>
        <dd>
          {serverKeyLabel(status.serverKeyType)}
          {status.serverKeyMasked && (
            <span className="mt-1 block font-mono text-xs text-aw-cream">
              {status.serverKeyMasked}
            </span>
          )}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">Webhook Secret</dt>
        <dd>
          {status.webhookSecretPresent ? "ja" : "nein"}
          {status.webhookSecretMasked && (
            <span className="mt-1 block font-mono text-xs text-aw-cream">
              {status.webhookSecretMasked}
            </span>
          )}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">Schlüsseltyp korrekt</dt>
        <dd>
          <StatusDot ok={status.keysCorrect} />
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">Checkout erlaubt</dt>
        <dd>
          <StatusDot ok={status.checkoutAllowed} />
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-aw-muted">API-Test</dt>
        <dd>
          <StatusDot ok={status.apiTestOk} />
        </dd>
      </div>
      {status.warnings.map((warning) => (
        <p key={warning} className="text-xs text-aw-warning">
          {warning}
        </p>
      ))}
      {status.errors.map((entry) => (
        <p key={entry} className="text-xs text-aw-warning">
          {entry}
        </p>
      ))}
    </dl>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="rounded-lg border border-aw-border px-3 py-1.5 text-xs font-medium text-aw-cream hover:border-aw-gold/50"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? "Kopiert" : label}
    </button>
  );
}

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-aw-border px-3 py-2 text-sm text-aw-cream hover:border-aw-gold/50"
    >
      {children}
    </a>
  );
}

export default function AdminStripePanel() {
  const [overview, setOverview] = useState<StripeAdminOverview | null>(null);
  const [prices, setPrices] = useState<StripeTestProductPrice[]>([]);
  const [selectedPriceId, setSelectedPriceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [keyMode, setKeyMode] = useState<StripeActiveMode>("test");
  const [publishableKey, setPublishableKey] = useState("");
  const [serverKey, setServerKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [overviewRes, pricesRes] = await Promise.all([
      fetchStripeAdminOverviewApi(),
      fetchStripeTestPricesApi(),
    ]);

    setLoading(false);

    if (!overviewRes.success) {
      setError(overviewRes.error.message);
      return;
    }

    setOverview(overviewRes.data);

    if (pricesRes.success) {
      setPrices(pricesRes.data.prices);
      setSelectedPriceId(pricesRes.data.prices[0]?.id ?? "");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleModeChange(mode: StripeActiveMode) {
    setBusy("mode");
    setMessage(null);
    setError(null);

    const result = await updateStripeActiveModeApi(mode);

    setBusy(null);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setOverview(result.data);
    setMessage(`Aktiver Modus: ${mode === "live" ? "Live" : "Test"}`);
  }

  async function handleApiTest(mode: StripeActiveMode) {
    setBusy(`api-${mode}`);
    setMessage(null);
    setError(null);

    const result = await testStripeApiKeysApi(mode);

    setBusy(null);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setMessage(result.data.message);
    await load();
  }

  async function handleTestCheckout() {
    if (!selectedPriceId) {
      setError("Bitte einen Produktpreis wählen.");
      return;
    }

    setBusy("checkout");
    setMessage(null);
    setError(null);

    const result = await createStripeTestCheckoutApi(selectedPriceId);

    setBusy(null);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    window.open(result.data.checkoutUrl, "_blank", "noopener,noreferrer");
    setMessage(`Test-Checkout erstellt (${result.data.checkoutId}).`);
    await load();
  }

  async function handleSaveKeys() {
    if (!publishableKey.trim() || !serverKey.trim() || !webhookSecret.trim()) {
      setError("Bitte alle drei Schlüsselfelder ausfüllen.");
      return;
    }

    setBusy("keys");
    setMessage(null);
    setError(null);

    const result = await saveStripeKeysApi({
      mode: keyMode,
      publishableKey: publishableKey.trim(),
      serverKey: serverKey.trim(),
      webhookSecret: webhookSecret.trim(),
    });

    setBusy(null);

    if (!result.success) {
      setError(result.error.message);
      return;
    }

    setPublishableKey("");
    setServerKey("");
    setWebhookSecret("");
    setOverview(result.data);
    setMessage(
      "Stripe-Schlüssel gespeichert. Sie werden aus Sicherheitsgründen nicht erneut angezeigt — zum Ersetzen einfach neue Werte eintragen.",
    );
    await load();
  }

  if (loading && !overview) {
    return <p className="text-sm text-aw-muted">Lade Stripe-Status …</p>;
  }

  if (!overview) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        {error ?? "Stripe-Status konnte nicht geladen werden."}
      </p>
    );
  }

  const membershipPrices = prices.filter((price) =>
    price.kind.includes("membership"),
  );
  const coursePrices = prices.filter(
    (price) => price.kind === "course" || price.kind === "workshop",
  );

  return (
    <div className="space-y-8">
      {overview.effectiveMode === "live" && (
        <div
          className="rounded-2xl border border-aw-warning/50 bg-aw-warning/10 px-5 py-4 text-sm text-aw-warning"
          role="alert"
        >
          <strong>Achtung:</strong> Livemodus ist aktiv. Echte Zahlungen werden
          verarbeitet.
        </div>
      )}

      {!overview.checkoutEnabled && (
        <div
          className="rounded-2xl border border-aw-warning/50 bg-aw-warning/10 px-5 py-4 text-sm text-aw-warning"
          role="alert"
        >
          Stripe-Checkout ist deaktiviert — Schlüssel-Konfiguration unvollständig
          oder ungültig. Nutzer sehen Stripe nicht im Checkout.
        </div>
      )}

      {overview.globalErrors.map((entry) => (
        <p
          key={entry}
          className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning"
          role="alert"
        >
          {entry}
        </p>
      ))}

      {overview.globalWarnings.map((entry) => (
        <p
          key={entry}
          className="rounded-lg border border-aw-gold/30 bg-aw-gold/10 px-4 py-3 text-sm text-aw-gold"
          role="status"
        >
          {entry}
        </p>
      ))}

      {overview.envMode && (
        <p className="text-sm text-aw-muted">
          STRIPE_MODE in ENV: <strong className="text-aw-cream">{overview.envMode}</strong>
          {overview.envMode !== overview.activeMode &&
            " (überschreibt Admin-Einstellung)"}
        </p>
      )}

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

      <section className="rounded-2xl border border-aw-gold/30 bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Stripe-Schlüssel eintragen
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          Trage hier deine Stripe-Schlüssel ein und speichere sie. Danach siehst
          du sie nicht mehr — nur noch einen maskierten Hinweis. Zum Ersetzen
          einfach einen neuen Satz eintragen und erneut speichern.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className={labelClassName} htmlFor="stripe-key-mode">
              Für welchen Modus?
            </label>
            <select
              id="stripe-key-mode"
              className={`${inputClassName} mt-2 w-full max-w-xs`}
              value={keyMode}
              onChange={(event) =>
                setKeyMode(event.target.value as StripeActiveMode)
              }
            >
              <option value="test">Testmodus (pk_test_, rk_test_/sk_test_)</option>
              <option value="live">Livemodus (pk_live_, rk_live_/sk_live_)</option>
            </select>
          </div>

          <div>
            <label className={labelClassName} htmlFor="stripe-publishable-key">
              Öffentlicher Schlüssel (Publishable Key)
            </label>
            <input
              id="stripe-publishable-key"
              type="password"
              autoComplete="off"
              className={`${inputClassName} mt-2 w-full font-mono text-sm`}
              value={publishableKey}
              onChange={(event) => setPublishableKey(event.target.value)}
              placeholder={keyMode === "live" ? "pk_live_..." : "pk_test_..."}
            />
            <p className="mt-1 text-xs text-aw-muted">
              Aus dem Stripe-Dashboard unter „API-Schlüssel“ — beginnt mit pk_
            </p>
          </div>

          <div>
            <label className={labelClassName} htmlFor="stripe-server-key">
              Geheimer Server-Schlüssel
            </label>
            <input
              id="stripe-server-key"
              type="password"
              autoComplete="off"
              className={`${inputClassName} mt-2 w-full font-mono text-sm`}
              value={serverKey}
              onChange={(event) => setServerKey(event.target.value)}
              placeholder={
                keyMode === "live" ? "rk_live_... oder sk_live_..." : "rk_test_... oder sk_test_..."
              }
            />
            <p className="mt-1 text-xs text-aw-muted">
              Bevorzugt Restricted Key (rk_). Secret Key (sk_) nur als Fallback.
            </p>
          </div>

          <div>
            <label className={labelClassName} htmlFor="stripe-webhook-secret">
              Webhook-Geheimnis
            </label>
            <input
              id="stripe-webhook-secret"
              type="password"
              autoComplete="off"
              className={`${inputClassName} mt-2 w-full font-mono text-sm`}
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
              placeholder="whsec_..."
            />
            <p className="mt-1 text-xs text-aw-muted">
              Aus Stripe → Webhooks → Endpunkt → Signing secret (oder Stripe CLI)
            </p>
          </div>

          <button
            type="button"
            className={primaryButtonClassName}
            disabled={busy !== null}
            onClick={() => void handleSaveKeys()}
          >
            {busy === "keys" ? "Speichere …" : "Schlüssel speichern"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">Modus</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <ModeBadge mode="test" active={overview.effectiveMode === "test"} />
          <ModeBadge mode="live" active={overview.effectiveMode === "live"} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={busy !== null || overview.activeMode === "test"}
            onClick={() => void handleModeChange("test")}
          >
            Testmodus aktivieren
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            disabled={busy !== null || overview.activeMode === "live"}
            onClick={() => void handleModeChange("live")}
          >
            Livemodus aktivieren
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-aw-border bg-aw-surface p-6">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Testmodus
          </h2>
          <ModeKeyStatus status={overview.test} />
          <button
            type="button"
            className={`${secondaryButtonClassName} mt-4`}
            disabled={busy !== null}
            onClick={() => void handleApiTest("test")}
          >
            {busy === "api-test" ? "Teste …" : "API-Key testen (Test)"}
          </button>
        </div>

        <div className="rounded-2xl border border-aw-border bg-aw-surface p-6">
          <h2 className="font-display text-lg font-bold text-aw-cream">
            Livemodus
          </h2>
          <ModeKeyStatus status={overview.live} />
          <button
            type="button"
            className={`${secondaryButtonClassName} mt-4`}
            disabled={busy !== null}
            onClick={() => void handleApiTest("live")}
          >
            {busy === "api-live" ? "Teste …" : "API-Key testen (Live)"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Stripe Dashboard & lokale Entwicklung
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          Mit dem Stripe-Plugin in Cursor/VS Code kannst du Webhooks lokal testen:
          <code className="mx-1 rounded bg-aw-bg px-1.5 py-0.5 font-mono text-xs">
            stripe listen --forward-to localhost:3000/api/stripe/webhook
          </code>
          — das ausgegebene <code className="font-mono text-xs">whsec_...</code> als
          Webhook-Geheimnis eintragen.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <DashboardLink href={overview.dashboardLinks.test}>
            Test-Dashboard
          </DashboardLink>
          <DashboardLink href={overview.dashboardLinks.live}>
            Live-Dashboard
          </DashboardLink>
          <DashboardLink href={overview.dashboardLinks.apiKeys}>
            API-Schlüssel
          </DashboardLink>
          <DashboardLink href={overview.dashboardLinks.webhooks}>
            Webhooks
          </DashboardLink>
        </div>
      </section>

      <section className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">Webhook</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-aw-muted">Webhook-URL</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-3">
              <span className="break-all font-mono text-xs text-aw-cream">
                {overview.webhookUrl}
              </span>
              <CopyButton value={overview.webhookUrl} label="URL kopieren" />
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-aw-muted">Verbunden (7 Tage)</dt>
            <dd>{overview.webhookConnected ? "Ja" : "Nein"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-aw-muted">Letzter Webhook</dt>
            <dd>{overview.lastWebhookAt ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-aw-muted">Letzter Fehler</dt>
            <dd className="text-right text-aw-warning">
              {overview.lastStripeError ?? "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-aw-cream">
            Erforderliche Webhook-Events
          </h3>
          <p className="mt-1 text-xs text-aw-muted">
            Diese Events im Stripe-Dashboard für den Endpunkt aktivieren:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {overview.requiredWebhookEvents.map((event) => {
              const received = overview.recentEvents.some(
                (entry) => entry.eventType === event.type,
              );

              return (
                <li
                  key={event.type}
                  className="flex items-start justify-between gap-4 border-t border-aw-border pt-2 first:border-t-0 first:pt-0"
                >
                  <div>
                    <p className="font-mono text-xs text-aw-cream">{event.type}</p>
                    <p className="text-aw-muted">{event.purpose}</p>
                  </div>
                  <span
                    className={`shrink-0 text-xs ${
                      received ? "text-aw-success" : "text-aw-muted"
                    }`}
                  >
                    {received ? "empfangen" : "noch nicht"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Testzahlungen
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          Erstellt einen echten Stripe-Checkout für den eingeloggten Admin-Nutzer.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="stripe-test-course">
              Kurs / Workshop
            </label>
            <select
              id="stripe-test-course"
              className={`${inputClassName} mt-2 w-full`}
              value={
                coursePrices.some((price) => price.id === selectedPriceId)
                  ? selectedPriceId
                  : coursePrices[0]?.id ?? ""
              }
              onChange={(event) => setSelectedPriceId(event.target.value)}
            >
              {coursePrices.map((price) => (
                <option key={price.id} value={price.id}>
                  {price.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${primaryButtonClassName} mt-3`}
              disabled={busy !== null || coursePrices.length === 0}
              onClick={() => {
                const id =
                  coursePrices.find((price) => price.id === selectedPriceId)
                    ?.id ?? coursePrices[0]?.id;

                if (id) {
                  setSelectedPriceId(id);
                  void handleTestCheckout();
                }
              }}
            >
              Testzahlung Kurs
            </button>
          </div>

          <div>
            <label className={labelClassName} htmlFor="stripe-test-membership">
              Mitgliedschaft
            </label>
            <select
              id="stripe-test-membership"
              className={`${inputClassName} mt-2 w-full`}
              value={
                membershipPrices.some((price) => price.id === selectedPriceId)
                  ? selectedPriceId
                  : membershipPrices[0]?.id ?? ""
              }
              onChange={(event) => setSelectedPriceId(event.target.value)}
            >
              {membershipPrices.map((price) => (
                <option key={price.id} value={price.id}>
                  {price.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${primaryButtonClassName} mt-3`}
              disabled={busy !== null || membershipPrices.length === 0}
              onClick={() => {
                const id =
                  membershipPrices.find((price) => price.id === selectedPriceId)
                    ?.id ?? membershipPrices[0]?.id;

                if (id) {
                  setSelectedPriceId(id);
                  void handleTestCheckout();
                }
              }}
            >
              Testzahlung Mitgliedschaft
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Letzte Stripe-Events (20)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-aw-muted">
              <tr>
                <th className="py-2 pr-4">Typ</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Fehler</th>
                <th className="py-2 pr-4">Live</th>
                <th className="py-2">Zeit</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentEvents.map((event) => (
                <tr key={event.id} className="border-t border-aw-border">
                  <td className="py-2 pr-4 font-mono text-xs">{event.eventType}</td>
                  <td className="py-2 pr-4">{event.processedStatus}</td>
                  <td className="max-w-xs py-2 pr-4 text-xs text-aw-warning">
                    {event.errorMessage ?? "—"}
                  </td>
                  <td className="py-2 pr-4">{event.livemode ? "Ja" : "Nein"}</td>
                  <td className="py-2">{event.createdAt}</td>
                </tr>
              ))}
              {overview.recentEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-aw-muted">
                    Noch keine Events empfangen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Letzte Stripe-Zahlungen (20)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-aw-muted">
              <tr>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Betrag</th>
                <th className="py-2 pr-4">Kunde</th>
                <th className="py-2">Bezahlt</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentPayments.map((payment) => (
                <tr key={payment.id} className="border-t border-aw-border">
                  <td className="py-2 pr-4">{payment.status}</td>
                  <td className="py-2 pr-4">
                    {payment.grossAmount.toFixed(2)} {payment.currency}
                  </td>
                  <td className="py-2 pr-4">
                    {payment.customerEmail ?? "—"}
                  </td>
                  <td className="py-2">{payment.paidAt ?? "—"}</td>
                </tr>
              ))}
              {overview.recentPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-aw-muted">
                    Noch keine Stripe-Zahlungen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <button
        type="button"
        className={secondaryButtonClassName}
        disabled={busy !== null}
        onClick={() => void load()}
      >
        Aktualisieren
      </button>
    </div>
  );
}
