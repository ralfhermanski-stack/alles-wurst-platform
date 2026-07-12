import Link from "next/link";

import BlogCoverImage from "@/components/blog/BlogCoverImage";
import type { BlogPostSummary } from "@/lib/blog/blog-types";

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value));
}

export default function BlogArticleCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-aw-border bg-aw-surface transition-all hover:-translate-y-1 hover:border-aw-gold/50">
      <Link href={`/magazin/${post.slug}`} className="relative block overflow-hidden bg-aw-surface-2">
        <BlogCoverImage
          src={post.coverUrl}
          alt={post.coverAltText ?? post.title}
          aspectClassName="aspect-[16/9] h-44 sm:h-auto"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-aw-muted">
          {formatDate(post.publishedAt)} · {post.readingTimeMinutes} Min. Lesezeit
        </p>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-aw-cream">
          <Link href={`/magazin/${post.slug}`} className="hover:text-aw-gold">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{post.excerpt ?? post.summary}</p>
        <Link
          href={`/magazin/${post.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aw-gold hover:text-aw-cream"
        >
          Weiterlesen →
        </Link>
      </div>
    </article>
  );
}
