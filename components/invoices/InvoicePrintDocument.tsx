import type { InvoicePrintData } from "@/lib/invoices/invoice-types";
import { formatMoney } from "@/lib/payments/format-money";

type InvoicePrintDocumentProps = {
  invoice: InvoicePrintData;
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

function formatCustomerName(invoice: InvoicePrintData): string {
  const { customer } = invoice;
  const name = `${customer.firstName} ${customer.lastName}`.trim();

  if (customer.company) {
    return `${customer.company} · ${name}`;
  }

  return name;
}

function formatCustomerAddress(invoice: InvoicePrintData): string[] {
  const { customer } = invoice;

  return [
    [customer.street, customer.houseNumber].filter(Boolean).join(" "),
    customer.addressLine2,
    [customer.postalCode, customer.city].filter(Boolean).join(" "),
    customer.stateRegion,
    customer.country,
  ].filter((line): line is string => Boolean(line?.trim()));
}

export default function InvoicePrintDocument({
  invoice,
}: InvoicePrintDocumentProps) {
  const customerLines = formatCustomerAddress(invoice);
  const isCancelled = invoice.status === "cancelled";
  const isRefunded = invoice.status === "refunded";

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 text-gray-900 shadow-lg print:max-w-none print:shadow-none print:p-0">
      {(isCancelled || isRefunded) && (
        <div
          className={`mb-6 rounded-lg border-2 px-4 py-3 text-center text-sm font-bold uppercase tracking-wider ${
            isRefunded
              ? "border-red-400 bg-red-50 text-red-800"
              : "border-amber-400 bg-amber-50 text-amber-900"
          }`}
        >
          {isRefunded ? "Erstattet" : "Storniert"} — Status: {invoice.statusLabel}
        </div>
      )}

      <header className="border-b border-gray-300 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Rechnung
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
          </div>
          <div className="text-right text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{invoice.seller.name}</p>
            <p>{invoice.seller.street}</p>
            <p>
              {invoice.seller.postalCode} {invoice.seller.city}
            </p>
            <p>{invoice.seller.country}</p>
            {invoice.seller.vatId && (
              <p className="mt-2">USt-IdNr.: {invoice.seller.vatId}</p>
            )}
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Rechnungsempfänger
          </h2>
          <div className="mt-3 text-sm leading-6 text-gray-800">
            {invoice.customer.salutation && <p>{invoice.customer.salutation}</p>}
            <p className="font-semibold text-gray-900">
              {formatCustomerName(invoice)}
            </p>
            {customerLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="mt-2 text-gray-600">{invoice.customer.email}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Rechnungsdaten
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Rechnungsdatum</dt>
              <dd className="font-medium">{formatDate(invoice.invoiceDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Leistungsdatum</dt>
              <dd className="font-medium">{formatDate(invoice.serviceDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Fälligkeitsdatum</dt>
              <dd className="font-medium">{formatDate(invoice.dueDate)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Rechnungsstatus</dt>
              <dd className="font-medium">{invoice.statusLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600">Zahlungsstatus</dt>
              <dd className="font-medium">{invoice.paymentStatusLabel}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
          Positionen
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
                <p className="font-medium text-gray-900">{invoice.productName}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {invoice.productTypeLabel}
                </p>
              </td>
              <td className="py-4 pr-4 text-right align-top">
                {formatMoney(invoice.netAmount, invoice.currency)}
              </td>
              <td className="py-4 pr-4 text-right align-top">
                {invoice.taxRate.toFixed(2)} %
              </td>
              <td className="py-4 pr-4 text-right align-top">
                {formatMoney(invoice.taxAmount, invoice.currency)}
              </td>
              <td className="py-4 text-right align-top font-semibold">
                {formatMoney(invoice.grossAmount, invoice.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mt-8 flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">Netto</dt>
            <dd>{formatMoney(invoice.netAmount, invoice.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-600">
              MwSt. ({invoice.taxRate.toFixed(0)} %)
            </dt>
            <dd>{formatMoney(invoice.taxAmount, invoice.currency)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-300 pt-2 text-base font-bold">
            <dt>Gesamtbetrag</dt>
            <dd>{formatMoney(invoice.grossAmount, invoice.currency)}</dd>
          </div>
        </dl>
      </section>

      {invoice.noteText && (
        <section className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Hinweis
          </h2>
          <p className="mt-2 whitespace-pre-wrap">{invoice.noteText}</p>
        </section>
      )}

      <footer className="mt-12 border-t border-gray-200 pt-4 text-xs text-gray-500">
        <p>
          Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift
          gültig.
        </p>
      </footer>
    </article>
  );
}
