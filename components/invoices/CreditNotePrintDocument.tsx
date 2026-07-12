import type { CreditNotePrintData } from "@/lib/invoices/invoice-types";
import { formatMoney } from "@/lib/payments/format-money";

type CreditNotePrintDocumentProps = {
  creditNote: CreditNotePrintData;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("de-DE");
}

function formatCustomerName(creditNote: CreditNotePrintData): string {
  const { customer } = creditNote;
  const name = `${customer.firstName} ${customer.lastName}`.trim();

  if (customer.company) {
    return `${customer.company} · ${name}`;
  }

  return name;
}

function formatCustomerAddress(creditNote: CreditNotePrintData): string[] {
  const { customer } = creditNote;

  return [
    [customer.street, customer.houseNumber].filter(Boolean).join(" "),
    customer.addressLine2,
    [customer.postalCode, customer.city].filter(Boolean).join(" "),
    customer.stateRegion,
    customer.country,
  ].filter((line): line is string => Boolean(line?.trim()));
}

export default function CreditNotePrintDocument({
  creditNote,
}: CreditNotePrintDocumentProps) {
  const customerLines = formatCustomerAddress(creditNote);

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 text-gray-900 shadow-lg print:max-w-none print:shadow-none print:p-0">
      <header className="border-b border-gray-300 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Gutschrift
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-gray-900">
              {creditNote.creditNoteNumber}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Zu Rechnung {creditNote.referenceInvoiceNumber}
            </p>
          </div>
          <div className="text-right text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{creditNote.seller.name}</p>
            <p>{creditNote.seller.street}</p>
            <p>
              {creditNote.seller.postalCode} {creditNote.seller.city}
            </p>
            <p>{creditNote.seller.country}</p>
            {creditNote.seller.vatId && (
              <p className="mt-2">USt-IdNr.: {creditNote.seller.vatId}</p>
            )}
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Empfänger
          </h2>
          <div className="mt-3 text-sm leading-6 text-gray-800">
            {creditNote.customer.salutation && (
              <p>{creditNote.customer.salutation}</p>
            )}
            <p className="font-semibold text-gray-900">
              {formatCustomerName(creditNote)}
            </p>
            {customerLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2 text-gray-600">{creditNote.customer.email}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Gutschriftsdaten
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Gutschriftsdatum</dt>
              <dd className="font-medium">
                {formatDate(creditNote.creditNoteDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Referenz-Rechnung</dt>
              <dd className="font-medium font-mono">
                {creditNote.referenceInvoiceNumber}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
          Gutschriftsposition
        </h2>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-500">
              <th className="py-2 pr-4">Bezeichnung</th>
              <th className="py-2 pr-4 text-right">Netto</th>
              <th className="py-2 pr-4 text-right">MwSt. %</th>
              <th className="py-2 pr-4 text-right">MwSt.</th>
              <th className="py-2 text-right">Brutto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 pr-4 align-top">
                <p className="font-medium text-gray-900">
                  {creditNote.productName}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {creditNote.productTypeLabel}
                </p>
              </td>
              <td className="py-4 pr-4 text-right align-top text-red-700">
                −{formatMoney(creditNote.netAmount, creditNote.currency)}
              </td>
              <td className="py-4 pr-4 text-right align-top">
                {creditNote.taxRate.toFixed(2)} %
              </td>
              <td className="py-4 pr-4 text-right align-top text-red-700">
                −{formatMoney(creditNote.taxAmount, creditNote.currency)}
              </td>
              <td className="py-4 text-right align-top font-semibold text-red-700">
                −{formatMoney(creditNote.grossAmount, creditNote.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-8 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-red-700">
            <dt className="text-gray-600">Netto</dt>
            <dd>−{formatMoney(creditNote.netAmount, creditNote.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-red-700">
            <dt className="text-gray-600">
              MwSt. ({creditNote.taxRate.toFixed(0)} %)
            </dt>
            <dd>−{formatMoney(creditNote.taxAmount, creditNote.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-300 pt-2 text-base font-bold text-red-800">
            <dt>Gutschriftsbetrag</dt>
            <dd>−{formatMoney(creditNote.grossAmount, creditNote.currency)}</dd>
          </div>
        </dl>
      </section>

      {creditNote.noteText && (
        <section className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Hinweis
          </h2>
          <p className="mt-2 whitespace-pre-wrap">{creditNote.noteText}</p>
        </section>
      )}

      <footer className="mt-12 border-t border-gray-200 pt-4 text-xs text-gray-500">
        <p>
          Diese Gutschrift wurde elektronisch erstellt und ist ohne Unterschrift
          gültig.
        </p>
      </footer>
    </article>
  );
}
