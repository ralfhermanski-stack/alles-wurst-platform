"use client";

import Link from "next/link";

import type { LegalDocumentPublicView } from "@/lib/legal/legal-types";

type LegalDocumentPageProps = {
  document: LegalDocumentPublicView;
  showPrint?: boolean;
};

export default function LegalDocumentPageView({
  document,
  showPrint = true,
}: LegalDocumentPageProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      {document.isStale && document.hasPublishedContent && (
        <p
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          Hinweis: Dieses Dokument konnte zuletzt nicht mit der externen Quelle
          abgeglichen werden. Es wird die zuletzt veröffentlichte Version angezeigt.
        </p>
      )}

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-aw-cream">
            {document.title}
          </h1>
          {document.publishedAt && (
            <p className="mt-2 text-sm text-aw-muted">
              Stand:{" "}
              {new Date(document.publishedAt).toLocaleDateString("de-DE")}
              {document.versionNumber ? ` · Version ${document.versionNumber}` : ""}
            </p>
          )}
          {document.providerName && (
            <p className="mt-1 text-xs text-aw-muted">
              Quelle: {document.providerName}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {showPrint && (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-aw-border px-3 py-2 text-xs font-semibold text-aw-cream hover:border-aw-gold/50"
            >
              Drucken
            </button>
          )}
          {document.externalUrl && (
            <Link
              href={document.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-aw-border px-3 py-2 text-xs font-semibold text-aw-gold hover:border-aw-gold/50"
            >
              Original öffnen
            </Link>
          )}
        </div>
      </div>

      <article
        className="legal-document-content prose prose-invert max-w-none text-sm leading-7 text-aw-cream/90"
        {...(document.embedUrl
          ? {}
          : { dangerouslySetInnerHTML: { __html: document.contentHtml } })}
      >
        {document.embedUrl ? (
          <iframe
            src={document.embedUrl}
            title={document.title}
            className="min-h-[75vh] w-full rounded-lg border border-aw-border bg-aw-bg"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : null}
      </article>
    </section>
  );
}
