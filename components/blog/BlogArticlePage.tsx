import Link from "next/link";

import BlogArticleActions from "@/components/blog/BlogArticleActions";
import BlogArticleCard from "@/components/blog/BlogArticleCard";
import BlogAuthorBox from "@/components/blog/BlogAuthorBox";
import BlogToc, { BlogCtaBoxes, BlogFaqSection } from "@/components/blog/BlogArticleSections";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import BlogStructuredData from "@/components/blog/BlogStructuredData";
import Markdown from "@/components/ui/Markdown";
import { getBlogPostUrl } from "@/lib/blog/blog-seo";
import type { BlogPostDetail } from "@/lib/blog/blog-types";

function formatDate(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(value));
}

export default function BlogArticlePage({ post }: { post: BlogPostDetail }) {
  const updatedLabel = post.contentUpdatedAt ?? post.updatedAt;

  return (
    <article className="print:text-black">
      <BlogStructuredData post={post} />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 print:max-w-3xl print:pt-4">
        <div className="lg:grid lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-start lg:gap-x-10 xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          {/* Sidebar: nur ab lg, beginnt unterhalb des Headers */}
          <aside className="hidden lg:col-start-1 lg:row-start-2 lg:block print:hidden">
            <div className="sticky top-24 space-y-6">
              <BlogToc body={post.body} />
              <BlogAuthorBox post={post} />
            </div>
          </aside>

          {/* Kopfbereich: volle Hauptspalte, ohne Versatz durch Sidebar */}
          <header className="min-w-0 lg:col-start-2 lg:row-start-1">
            <nav aria-label="Brotkrumen" className="text-sm text-aw-muted print:hidden">
              <ol className="flex flex-wrap items-center gap-2">
                <li><Link href="/" className="hover:text-aw-gold">Start</Link></li>
                <li>/</li>
                <li><Link href="/magazin" className="hover:text-aw-gold">Magazin</Link></li>
                {post.categorySlug && (
                  <>
                    <li>/</li>
                    <li>
                      <Link href={`/magazin/kategorie/${post.categorySlug}`} className="hover:text-aw-gold">
                        {post.categoryName}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>

            {post.categoryName && (
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.25em] text-aw-gold">
                {post.categoryName}
              </p>
            )}

            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-aw-cream sm:text-4xl">
              {post.title}
            </h1>

            <p className="mt-4 text-sm text-aw-muted">
              Von {post.authorDisplayName}
              {post.publishedAt && <> · Veröffentlicht am {formatDate(post.publishedAt)}</>}
              {updatedLabel && <> · Aktualisiert am {formatDate(updatedLabel)}</>}
              {" · "}
              {post.readingTimeMinutes} Min. Lesezeit
            </p>

            {post.summary && (
              <p className="mt-6 rounded-xl border border-aw-border bg-aw-surface/40 p-5 text-base leading-7 text-aw-cream/90">
                {post.summary}
              </p>
            )}

            <figure className="mt-8 overflow-hidden rounded-xl border border-aw-border">
              <BlogCoverImage
                src={post.coverUrl}
                alt={post.coverAltText ?? post.title}
                priority
              />
            </figure>
          </header>

          {/* Artikelinhalt */}
          <div className="min-w-0 space-y-8 lg:col-start-2 lg:row-start-2">
            <div className="prose-blog max-w-none text-aw-cream/90">
              <Markdown content={post.body} />
            </div>

            {/* Mobile: TOC + Autor unter dem Einstieg */}
            <div className="space-y-6 lg:hidden print:hidden">
              <BlogToc body={post.body} />
              <BlogAuthorBox post={post} />
            </div>

            {post.definitionBoxes.length > 0 && (
              <section className="space-y-3">
                {post.definitionBoxes.map((box) => (
                  <div key={box.term} className="rounded-xl border border-aw-border bg-aw-surface/30 p-4">
                    <p className="font-semibold text-aw-gold">{box.term}</p>
                    <p className="mt-2 text-sm leading-6 text-aw-muted">{box.definition}</p>
                  </div>
                ))}
              </section>
            )}

            {post.internalLinks.length > 0 && (
              <section className="rounded-xl border border-aw-border p-5 print:hidden">
                <h2 className="font-display text-lg font-bold text-aw-cream">Weiterführende Links</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {post.internalLinks.map((link) => (
                    <li key={link.url}>
                      <Link href={link.url} className="text-aw-gold hover:text-aw-cream">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <BlogFaqSection faqItems={post.faqItems} />

            {post.sourcesNote && (
              <section className="rounded-xl border border-aw-border bg-aw-surface/20 p-5 text-sm text-aw-muted">
                <h2 className="font-semibold text-aw-cream">Quellen & Hinweise</h2>
                <p className="mt-2 whitespace-pre-wrap leading-6">{post.sourcesNote}</p>
              </section>
            )}

            {post.disclaimerNote && (
              <p className="text-xs leading-5 text-aw-muted">{post.disclaimerNote}</p>
            )}

            <BlogCtaBoxes post={post} />

            <BlogArticleActions shareUrl={getBlogPostUrl(post.slug)} />
          </div>
        </div>
      </div>

      {post.relatedPosts.length > 0 && (
        <section className="border-t border-aw-border bg-aw-surface/20 py-16 print:hidden">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-aw-cream">Verwandte Artikel</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {post.relatedPosts.map((related) => (
                <BlogArticleCard key={related.id} post={related} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
