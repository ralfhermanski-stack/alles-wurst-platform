import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import InvoicePrintDocument from "@/components/invoices/InvoicePrintDocument";
import InvoicePrintToolbar from "@/components/invoices/InvoicePrintToolbar";
import { assertAccountingAccessFromCookies } from "@/lib/accounting/accounting-auth";
import { getInvoicePrintData } from "@/lib/invoices/invoice-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getInvoicePrintData(id);

  if (!result.success || !result.data) {
    return { title: "Rechnung", robots: { index: false, follow: false } };
  }

  return {
    title: `Rechnung ${result.data.invoiceNumber}`,
    robots: { index: false, follow: false },
  };
}

export default async function InvoicePrintPage({ params }: PageProps) {
  const { id } = await params;
  const access = await assertAccountingAccessFromCookies();

  if (!access.success) {
    redirect(`/anmelden?next=/admin/buchhaltung/rechnung/${id}`);
  }

  const result = await getInvoicePrintData(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const invoice = result.data;

  return (
    <div className="min-h-screen bg-aw-bg print:bg-white">
      <InvoicePrintToolbar invoiceNumber={invoice.invoiceNumber} />
      <div className="px-4 py-8 print:p-0">
        <InvoicePrintDocument invoice={invoice} />
      </div>
    </div>
  );
}
