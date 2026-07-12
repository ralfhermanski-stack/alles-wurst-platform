"use client";

import Link from "next/link";

import { CHECKOUT_CONSENT_TEXTS_V1 } from "@/lib/legal/legal-consent-texts";
import {
  defaultLegalProductType,
  resolveProductLegalConfig,
} from "@/lib/legal/legal-types";
import type { ProductKind } from "@prisma/client";

export type CheckoutLegalConsentState = {
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  immediateAccessConsent: boolean;
  withdrawalLossAcknowledged: boolean;
};

type CheckoutLegalSectionProps = {
  productKind: ProductKind;
  legalConfig: unknown;
  value: CheckoutLegalConsentState;
  onChange: (value: CheckoutLegalConsentState) => void;
};

export default function CheckoutLegalSection({
  productKind,
  legalConfig,
  value,
  onChange,
}: CheckoutLegalSectionProps) {
  const config = resolveProductLegalConfig(productKind, legalConfig);
  const requiresImmediateConsent =
    config.requireImmediateAccessConsent && config.allowImmediateAccess;

  function patch(partial: Partial<CheckoutLegalConsentState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <fieldset className="mt-6 space-y-3">
      <legend className="text-sm font-semibold text-aw-cream">
        Rechtliche Bestätigungen
      </legend>

      <label className="flex items-start gap-3 rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-cream">
        <input
          type="checkbox"
          checked={value.termsAccepted}
          onChange={(event) => patch({ termsAccepted: event.target.checked })}
          className="mt-1 accent-aw-gold"
          required
        />
        <span>
          {CHECKOUT_CONSENT_TEXTS_V1.termsPrefix}{" "}
          <Link href="/agb" className="text-aw-gold underline" target="_blank">
            AGB
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-cream">
        <input
          type="checkbox"
          checked={value.privacyAcknowledged}
          onChange={(event) =>
            patch({ privacyAcknowledged: event.target.checked })
          }
          className="mt-1 accent-aw-gold"
          required
        />
        <span>
          {CHECKOUT_CONSENT_TEXTS_V1.privacyPrefix}{" "}
          <Link
            href="/datenschutz"
            className="text-aw-gold underline"
            target="_blank"
          >
            Datenschutzerklärung
          </Link>
        </span>
      </label>

      {requiresImmediateConsent && (
        <>
          <p className="text-xs text-aw-muted">
            Vertragsart:{" "}
            {defaultLegalProductType(productKind).replace(/_/g, " ")}. Ohne die
            folgenden Erklärungen wird der Kurszugang erst nach Ablauf der
            Widerrufsfrist ({config.withdrawalPeriodDays} Tage) freigeschaltet.
          </p>

          <label className="flex items-start gap-3 rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={value.immediateAccessConsent}
              onChange={(event) =>
                patch({ immediateAccessConsent: event.target.checked })
              }
              className="mt-1 accent-aw-gold"
            />
            <span>{CHECKOUT_CONSENT_TEXTS_V1.immediateAccess}</span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-aw-border bg-aw-bg px-4 py-3 text-sm text-aw-cream">
            <input
              type="checkbox"
              checked={value.withdrawalLossAcknowledged}
              onChange={(event) =>
                patch({ withdrawalLossAcknowledged: event.target.checked })
              }
              className="mt-1 accent-aw-gold"
            />
            <span>{CHECKOUT_CONSENT_TEXTS_V1.withdrawalLoss}</span>
          </label>

          <p className="text-xs text-aw-warning">
            Diese Formulierungen sind technische Platzhalter und müssen vor
            Produktivbetrieb rechtlich geprüft werden.
          </p>
        </>
      )}

      <p className="text-xs text-aw-muted">
        <Link href="/widerrufsbelehrung" className="text-aw-gold underline">
          Widerrufsbelehrung
        </Link>
      </p>
    </fieldset>
  );
}
