"use client";

export default function BlogArticleActions({ shareUrl }: { shareUrl: string }) {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-aw-border px-4 py-2 text-sm text-aw-cream hover:border-aw-gold/50"
      >
        Drucken
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noreferrer noopener"
        className="rounded-lg border border-aw-border px-4 py-2 text-sm text-aw-cream hover:border-aw-gold/50"
      >
        Teilen
      </a>
    </div>
  );
}
