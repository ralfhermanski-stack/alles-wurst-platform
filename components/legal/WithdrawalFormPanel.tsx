"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type WithdrawalFormPanelProps = {
  orderToken?: string | null;
};

type Prefill = {
  firstName: string;
  lastName: string;
  email: string;
  orderReference: string;
  productName: string;
  orderDate: string;
  contractDate: string;
  accessStatus: string | null;
  withdrawalExpiredNotice: boolean;
};

export default function WithdrawalFormPanel({
  orderToken = null,
}: WithdrawalFormPanelProps) {
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNumber, setSuccessNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    orderReference: "",
    productName: "",
    orderDate: "",
    contractDate: "",
    message: "",
    declarationText: "",
  });
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!orderToken) {
      return;
    }

    void fetch(`/api/legal/withdrawal/prefill?token=${encodeURIComponent(orderToken)}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((json: { success: boolean; data?: Prefill; error?: { message: string } }) => {
        if (!json.success || !json.data) {
          setError(json.error?.message ?? "Bestellung konnte nicht geladen werden.");
          return;
        }

        setPrefill(json.data);
        setFormData((current) => ({
          ...current,
          firstName: json.data!.firstName,
          lastName: json.data!.lastName,
          email: json.data!.email,
          orderReference: json.data!.orderReference,
          productName: json.data!.productName,
          orderDate: json.data!.orderDate.slice(0, 10),
          contractDate: json.data!.contractDate.slice(0, 10),
        }));
      });
  }, [orderToken]);

  function goToConfirm(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!formData.declarationText.trim()) {
      setError("Bitte gib deine Widerrufserklärung ein.");
      return;
    }

    setStep("confirm");
  }

  async function submitWithdrawal() {
    if (!confirmed) {
      setError("Bitte bestätige die Widerrufserklärung.");
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = orderToken ? "/api/legal/withdrawal/account" : "/api/legal/withdrawal";
    const payload = orderToken
      ? {
          token: orderToken,
          declarationText: formData.declarationText,
          message: formData.message,
          confirmed,
        }
      : formData;

    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as {
      success: boolean;
      data?: { withdrawalNumber: string };
      error?: { message: string };
    };

    setLoading(false);

    if (!json.success || !json.data) {
      setError(json.error?.message ?? "Die Widerrufserklärung konnte nicht gesendet werden.");
      return;
    }

    setSuccessNumber(json.data.withdrawalNumber);
    setStep("done");
  }

  if (step === "done" && successNumber) {
    return (
      <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-6">
        <h2 className="font-display text-xl font-bold text-aw-cream">Widerruf erhalten</h2>
        <p className="mt-3 text-sm text-aw-muted">
          Wir haben deine Widerrufserklärung erhalten. Sie wird unter der
          Vorgangsnummer <strong>{successNumber}</strong> bearbeitet.
        </p>
        <p className="mt-3 text-sm text-aw-muted">
          Es erfolgt noch keine Zusage zu Annahme oder Erstattung. Du erhältst eine
          Eingangsbestätigung per E-Mail und in deinem Konto.
        </p>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4 rounded-xl border border-aw-border bg-aw-surface p-6">
        <h2 className="font-display text-xl font-bold text-aw-cream">
          Widerruf bestätigen
        </h2>
        <p className="text-sm text-aw-muted">
          Du möchtest den folgenden Vertrag widerrufen:
        </p>
        <ul className="text-sm text-aw-cream">
          <li>Bestellnummer: {formData.orderReference || "—"}</li>
          <li>Produkt: {formData.productName || "—"}</li>
          <li>
            Kaufdatum:{" "}
            {formData.orderDate
              ? new Date(formData.orderDate).toLocaleDateString("de-DE")
              : "—"}
          </li>
          {prefill?.accessStatus && (
            <li>Zugriffsstatus: {prefill.accessStatus}</li>
          )}
        </ul>
        <label className="flex items-start gap-3 text-sm text-aw-cream">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 accent-aw-gold"
          />
          <span>
            Ich erkläre, dass ich den oben genannten Vertrag widerrufen möchte.
          </span>
        </label>
        {error && <p className="text-sm text-aw-warning">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void submitWithdrawal()}
            disabled={loading}
            className={primaryButtonClassName}
          >
            Widerruf verbindlich absenden
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className={secondaryButtonClassName}
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => goToConfirm(event)} className="space-y-4">
      {prefill?.withdrawalExpiredNotice && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Die reguläre Widerrufsfrist könnte bereits abgelaufen sein. Du kannst deine
          Erklärung dennoch absenden. Sie wird individuell geprüft.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-aw-warning/40 bg-aw-warning/10 px-4 py-3 text-sm text-aw-warning">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Vorname *</span>
          <input
            name="firstName"
            required
            readOnly={Boolean(orderToken)}
            className={inputClassName}
            value={formData.firstName}
            onChange={(event) =>
              setFormData({ ...formData, firstName: event.target.value })
            }
          />
        </label>
        <label className="block">
          <span className={labelClassName}>Nachname *</span>
          <input
            name="lastName"
            required
            readOnly={Boolean(orderToken)}
            className={inputClassName}
            value={formData.lastName}
            onChange={(event) =>
              setFormData({ ...formData, lastName: event.target.value })
            }
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClassName}>E-Mail-Adresse *</span>
        <input
          name="email"
          type="email"
          required
          readOnly={Boolean(orderToken)}
          className={inputClassName}
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Bestellnummer</span>
        <input
          name="orderReference"
          readOnly={Boolean(orderToken)}
          className={inputClassName}
          value={formData.orderReference}
          onChange={(event) =>
            setFormData({ ...formData, orderReference: event.target.value })
          }
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Produkt oder Kurs</span>
        <input
          name="productName"
          readOnly={Boolean(orderToken)}
          className={inputClassName}
          value={formData.productName}
          onChange={(event) =>
            setFormData({ ...formData, productName: event.target.value })
          }
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Widerrufserklärung *</span>
        <textarea
          name="declarationText"
          required
          rows={5}
          className={inputClassName}
          placeholder="Hiermit widerrufe ich den von mir abgeschlossenen Vertrag …"
          value={formData.declarationText}
          onChange={(event) =>
            setFormData({ ...formData, declarationText: event.target.value })
          }
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Optionale Nachricht</span>
        <textarea
          name="message"
          rows={3}
          className={inputClassName}
          value={formData.message}
          onChange={(event) =>
            setFormData({ ...formData, message: event.target.value })
          }
        />
      </label>

      <p className="text-xs text-aw-muted">
        Ein Widerrufsgrund ist nicht erforderlich.{" "}
        <Link href="/datenschutz" className="text-aw-gold underline">
          Datenschutzerklärung
        </Link>
      </p>

      <button
        type="submit"
        disabled={loading}
        className={`${primaryButtonClassName} w-full sm:w-auto`}
      >
        Weiter zur Bestätigung
      </button>
    </form>
  );
}
