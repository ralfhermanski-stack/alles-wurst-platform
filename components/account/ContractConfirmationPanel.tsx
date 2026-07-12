import type { ReactNode } from "react";
import Link from "next/link";

import type { ContractConfirmationView } from "@/lib/legal/contract-confirmation-service";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type ContractConfirmationViewProps = {
  contract: ContractConfirmationView;
  orderId: string;
  legalDocuments: Array<{
    id: string;
    title: string;
    legalDocumentType: string;
    status: string;
  }>;
  withdrawalSection: ReactNode;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-aw-border bg-aw-surface p-6">
      <h2 className="font-display text-lg font-bold text-aw-cream">{title}</h2>
      <div className="mt-4 space-y-3 text-sm text-aw-cream">{children}</div>
    </section>
  );
}

export default function ContractConfirmationPanel({
  contract,
  orderId,
  legalDocuments,
  withdrawalSection,
}: ContractConfirmationViewProps) {
  const bothConfirmed =
    contract.withdrawal.immediateAccessConsented &&
    contract.withdrawal.withdrawalLossAcknowledged;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-aw-gold/30 bg-gradient-to-br from-aw-surface to-aw-bg p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-aw-gold">
          Vertragsbestätigung
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-aw-cream">
          Vielen Dank für Ihr Vertrauen.
        </h1>
        <p className="mt-3 text-sm text-aw-muted">
          Wir freuen uns, Sie bei ALLES WURST begrüßen zu dürfen.
        </p>
        <p className="mt-4 text-xs text-aw-muted">
          Vertragsnummer {contract.contractNumber}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Anbieter">
          <p className="font-semibold">ALLES WURST</p>
          <p>Ralf Hermanski</p>
          {contract.provider.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {contract.provider.email && (
            <p>
              <a
                href={`mailto:${contract.provider.email}`}
                className="text-aw-gold underline"
              >
                {contract.provider.email}
              </a>
            </p>
          )}
        </Section>

        <Section title="Vertragspartner">
          <p className="font-semibold">{contract.customer.name}</p>
          {contract.customer.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p>{contract.customer.email}</p>
        </Section>
      </div>

      <Section title="Vertragsgegenstand">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-aw-muted">Produkt</dt>
            <dd>{contract.productName}</dd>
          </div>
          {contract.membershipLabel && (
            <div>
              <dt className="text-xs uppercase text-aw-muted">Mitgliedschaft</dt>
              <dd>{contract.membershipLabel}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-aw-muted">Leistungsbeschreibung</dt>
            <dd>{contract.productDescription ?? contract.productName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-aw-muted">Vertragsbeginn</dt>
            <dd>{contract.contractStart}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-aw-muted">Laufzeit</dt>
            <dd>{contract.contractDuration}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase text-aw-muted">Verlängerungsbedingungen</dt>
            <dd>{contract.renewalConditions}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-aw-muted">Preis</dt>
            <dd className="font-semibold text-aw-gold">{contract.priceLabel}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Leistungsumfang">
        <ul className="list-disc space-y-2 pl-5">
          {contract.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </Section>

      <Section title="Zahlungsinformationen">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-aw-muted">Bestellnummer</dt>
            <dd>{contract.payment.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-aw-muted">Kaufdatum</dt>
            <dd>{contract.payment.purchaseDate}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-aw-muted">Zahlungsart</dt>
            <dd>{contract.payment.paymentMethod}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-aw-muted">Zahlungsstatus</dt>
            <dd>{contract.payment.paymentStatus}</dd>
          </div>
          {contract.payment.invoiceNumber && (
            <div>
              <dt className="text-xs uppercase text-aw-muted">Rechnungsnummer</dt>
              <dd>{contract.payment.invoiceNumber}</dd>
            </div>
          )}
        </dl>
      </Section>

      <Section title="Widerrufsinformationen">
        <ul className="space-y-2">
          <li className={bothConfirmed ? "text-emerald-300" : "text-amber-300"}>
            {bothConfirmed ? "✔" : "✖"}{" "}
            {contract.withdrawal.immediateAccessConsented
              ? "Sofortige Bereitstellung wurde ausdrücklich gewünscht."
              : "Sofortige Bereitstellung wurde nicht bestätigt."}
          </li>
          <li className={bothConfirmed ? "text-emerald-300" : "text-amber-300"}>
            {bothConfirmed ? "✔" : "✖"}{" "}
            {contract.withdrawal.withdrawalLossAcknowledged
              ? "Kenntnis über einen möglichen Verlust des Widerrufsrechts wurde bestätigt."
              : "Kenntnis über einen möglichen Verlust des Widerrufsrechts wurde nicht bestätigt."}
          </li>
        </ul>
        {contract.withdrawal.notice && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100">
            {contract.withdrawal.notice}
          </p>
        )}
        <p className="mt-3 text-xs text-aw-muted">
          {contract.withdrawal.immediateAccessStatus} ·{" "}
          {contract.withdrawal.withdrawalLossStatus}
        </p>
      </Section>

      <Section title="Vertragsunterlagen">
        <p className="text-aw-muted">
          Diese Unterlagen entsprechen den Fassungen, die zum Zeitpunkt Ihres
          Kaufs gültig waren, und sind unveränderbar archiviert.
        </p>
        <ul className="mt-4 space-y-3">
          {legalDocuments.length === 0 ? (
            <li className="text-aw-muted">
              Vertragsunterlagen werden nach dem Kauf erzeugt.
            </li>
          ) : (
            legalDocuments.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-aw-border px-4 py-3"
              >
                <span>{document.title}</span>
                {document.status === "GENERATED" && (
                  <a
                    href={`/api/account/orders/${orderId}/documents/${document.id}/download`}
                    className={secondaryButtonClassName}
                  >
                    PDF herunterladen
                  </a>
                )}
              </li>
            ))
          )}
        </ul>
        {(contract.documentVersions.terms ||
          contract.documentVersions.privacy ||
          contract.documentVersions.withdrawal) && (
          <p className="mt-4 text-xs text-aw-muted">
            Dokumentversionen zum Kaufzeitpunkt: AGB{" "}
            {contract.documentVersions.terms ?? "—"}, Datenschutz{" "}
            {contract.documentVersions.privacy ?? "—"}, Widerrufsbelehrung{" "}
            {contract.documentVersions.withdrawal ?? "—"}
          </p>
        )}
      </Section>

      <footer className="rounded-xl border border-aw-border bg-aw-surface p-8 text-center">
        <p className="text-sm text-aw-cream">
          Vielen Dank für Ihr Vertrauen.
        </p>
        <p className="mt-2 text-sm text-aw-muted">
          Wir wünschen Ihnen viel Freude und Erfolg mit Ihrer Mitgliedschaft bei
          ALLES WURST.
        </p>
        <p className="mt-6 text-sm text-aw-cream">
          Mit freundlichen Grüßen
          <br />
          <span className="font-semibold">Ralf Hermanski</span>
          <br />
          Fleischermeister
          <br />
          ALLES WURST
        </p>
      </footer>

      {withdrawalSection}
    </div>
  );
}

export function OrderWithdrawalSection({
  order,
}: {
  order: {
    openWithdrawalNumber: string | null;
    withdrawalEligible: boolean;
    withdrawalToken: string | null;
    withdrawalExpiredNotice: boolean;
  };
}) {
  return (
    <section className="rounded-xl border border-aw-border bg-aw-surface p-5">
      <h2 className="font-display text-lg font-bold text-aw-cream">Widerruf</h2>
      {order.openWithdrawalNumber ? (
        <p className="mt-2 text-sm text-aw-muted">
          Offene Widerrufsanfrage: {order.openWithdrawalNumber}
        </p>
      ) : order.withdrawalEligible && order.withdrawalToken ? (
        <>
          {order.withdrawalExpiredNotice && (
            <p className="mt-2 text-sm text-amber-300">
              Die reguläre Widerrufsfrist könnte bereits abgelaufen sein. Sie
              können Ihre Erklärung dennoch absenden. Sie wird individuell
              geprüft.
            </p>
          )}
          <Link
            href={`/widerrufsformular?order=${encodeURIComponent(order.withdrawalToken)}`}
            className={`${primaryButtonClassName} mt-4 inline-flex`}
          >
            Vertrag widerrufen
          </Link>
        </>
      ) : (
        <p className="mt-2 text-sm text-aw-muted">
          Für diese Bestellung ist aktuell kein Widerruf über das Konto möglich.
        </p>
      )}
    </section>
  );
}
