import Link from "next/link";

import BlogCoverImage from "@/components/blog/BlogCoverImage";
import type { BlogPostSummary } from "@/lib/blog/blog-types";

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

/**
 * Blogkarte für Magazin-Übersicht und Startseite.
 */
export default function BlogCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]">
      <Link href={`/magazin/${post.slug}`} className="relative block overflow-hidden">
        <BlogCoverImage
          src={post.coverUrl}
          alt={post.coverAltText ?? post.title}
          aspectClassName="aspect-[16/9] h-44 sm:h-auto"
        />
        {!post.coverUrl && (
          <span className="absolute bottom-4 left-4 rounded-full bg-aw-bg/70 px-2.5 py-1 text-xs font-medium text-aw-gold backdrop-blur-sm">
            {post.categoryName ?? "Magazin"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-aw-muted">
          {formatDate(post.publishedAt)} · {post.readingTimeMinutes} Min. Lesezeit
        </p>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-aw-cream">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{post.excerpt ?? post.summary}</p>

        <Link
          href={`/magazin/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aw-gold transition-colors hover:text-aw-cream"
        >
          Weiterlesen
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
