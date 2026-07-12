"use client";

import Link from "next/link";

import { CHECKOUT_CONSENT_TEXTS_V2 } from "@/lib/legal/legal-consent-texts";
import {
  defaultLegalProductType,
  resolveProductLegalConfig,
} from "@/lib/legal/legal-types";
import type { ProductKind } from "@prisma/client";

export type CheckoutLegalConsentState = {
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  immediateAccessConsent: boolean | null;
  withdrawalLossAcknowledged: boolean | null;
};

type CheckoutLegalSectionProps = {
  productKind: ProductKind;
  legalConfig: unknown;
  value: CheckoutLegalConsentState;
  onChange: (value: CheckoutLegalConsentState) => void;
};

function YesNoField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-aw-border bg-aw-bg px-4 py-3">
      <legend className="text-sm text-aw-cream">{label}</legend>
      <div className="mt-2 flex gap-6">
        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="radio"
            name={name}
            checked={value === true}
            onChange={() => onChange(true)}
            className="accent-aw-gold"
            required
          />
          Ja
        </label>
        <label className="flex items-center gap-2 text-sm text-aw-cream">
          <input
            type="radio"
            name={name}
            checked={value === false}
            onChange={() => onChange(false)}
            className="accent-aw-gold"
            required
          />
          Nein
        </label>
      </div>
    </fieldset>
  );
}

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

  const isMembership =
    productKind === "membership_wurstclub" ||
    productKind === "membership_meisterclub";

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
          {CHECKOUT_CONSENT_TEXTS_V2.termsPrefix}{" "}
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
          {CHECKOUT_CONSENT_TEXTS_V2.privacyPrefix}{" "}
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
            {defaultLegalProductType(productKind).replace(/_/g, " ")}.
            {config.allowPurchaseWithoutImmediateConsent ? (
              <>
                {" "}
                Ohne Zustimmung zu beiden Erklärungen erfolgt keine sofortige
                Freischaltung — die gesetzlichen Widerrufsrechte gelten
                uneingeschränkt ({config.withdrawalPeriodDays} Tage).
              </>
            ) : (
              <>
                {" "}
                Für die sofortige Freischaltung sind beide Erklärungen mit „Ja“
                erforderlich.
              </>
            )}
          </p>

          <YesNoField
            name="immediateAccessConsent"
            label={CHECKOUT_CONSENT_TEXTS_V2.immediateAccess}
            value={value.immediateAccessConsent}
            onChange={(next) => patch({ immediateAccessConsent: next })}
          />

          <YesNoField
            name="withdrawalLossAcknowledged"
            label={CHECKOUT_CONSENT_TEXTS_V2.withdrawalLoss}
            value={value.withdrawalLossAcknowledged}
            onChange={(next) => patch({ withdrawalLossAcknowledged: next })}
          />

          {isMembership && (
            <p className="text-xs text-aw-muted">
              Bei „Nein“ wird deine Mitgliedschaft erst nach Ablauf der
              Widerrufsfrist freigeschaltet. Die Zahlung wird dennoch
              verarbeitet.
            </p>
          )}
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
