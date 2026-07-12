import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import CreditNotePrintDocument from "@/components/invoices/CreditNotePrintDocument";
import CreditNotePrintToolbar from "@/components/invoices/CreditNotePrintToolbar";
import { assertAccountingAccessFromCookies } from "@/lib/accounting/accounting-auth";
import { getCreditNotePrintData } from "@/lib/invoices/credit-note-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getCreditNotePrintData(id);

  if (!result.success || !result.data) {
    return { title: "Gutschrift", robots: { index: false, follow: false } };
  }

  return {
    title: `Gutschrift ${result.data.creditNoteNumber}`,
    robots: { index: false, follow: false },
  };
}

export default async function CreditNotePrintPage({ params }: PageProps) {
  const { id } = await params;
  const access = await assertAccountingAccessFromCookies();

  if (!access.success) {
    redirect(`/anmelden?next=/admin/buchhaltung/gutschrift/${id}`);
  }

  const result = await getCreditNotePrintData(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const creditNote = result.data;

  return (
    <div className="min-h-screen bg-aw-bg print:bg-white">
      <CreditNotePrintToolbar creditNoteNumber={creditNote.creditNoteNumber} />
      <div className="px-4 py-8 print:p-0">
        <CreditNotePrintDocument creditNote={creditNote} />
      </div>
    </div>
  );
}
