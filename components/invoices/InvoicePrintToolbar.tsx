"use client";

/**
 * @file InvoicePrintToolbar.tsx
 * @purpose Druck-/PDF-Steuerung für Rechnungen.
 */

import { secondaryButtonClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type InvoicePrintToolbarProps = {
  invoiceNumber: string;
};

export default function InvoicePrintToolbar({
  invoiceNumber,
}: InvoicePrintToolbarProps) {
  return (
    <div className="print:hidden sticky top-0 z-10 border-b border-aw-border bg-aw-surface/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-aw-muted">
          Rechnung {invoiceNumber} — im Druckdialog „Als PDF speichern“ wählen.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => window.print()}
          >
            Als PDF speichern / Drucken
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => window.close()}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
