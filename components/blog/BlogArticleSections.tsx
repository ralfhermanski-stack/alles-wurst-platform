import Link from "next/link";

import { extractTableOfContents } from "@/lib/blog/blog-seo";

export default function BlogToc({ body }: { body: string }) {
  const items = extractTableOfContents(body);

  if (items.length < 2) {
    return null;
  }

  return (
    <nav aria-label="Inhaltsverzeichnis" className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <p className="text-sm font-semibold text-aw-cream">Inhaltsverzeichnis</p>
      <ol className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "ml-4" : ""}>
            <a href={`#${item.id}`} className="text-aw-muted hover:text-aw-gold">
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function BlogFaqSection({ faqItems }: { faqItems: { question: string; answer: string }[] }) {
  if (faqItems.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="blog-faq-heading" className="rounded-xl border border-aw-border bg-aw-surface/30 p-6">
      <h2 id="blog-faq-heading" className="font-display text-xl font-bold text-aw-cream">
        Häufige Fragen
      </h2>
      <div className="mt-4 space-y-4">
        {faqItems.map((item) => (
          <details key={item.question} className="rounded-lg border border-aw-border p-4">
            <summary className="cursor-pointer font-semibold text-aw-cream">{item.question}</summary>
            <p className="mt-3 text-sm leading-6 text-aw-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function BlogCtaBoxes({ post }: { post: import("@/lib/blog/blog-types").BlogPostDetail }) {
  const cta = post.ctaConfig;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cta.showCourse && post.linkedCourses[0] && (
        <div className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-5">
          <p className="text-xs uppercase tracking-wider text-aw-gold">Passender Kurs</p>
          <p className="mt-2 font-display text-lg font-bold text-aw-cream">{post.linkedCourses[0].title}</p>
          <Link href={`/akademie/kurse/${post.linkedCourses[0].slug}`} className="mt-3 inline-block text-sm font-semibold text-aw-gold">
            Kurs ansehen →
          </Link>
        </div>
      )}
      {cta.showMembership && (
        <div className="rounded-xl border border-aw-border bg-aw-surface/50 p-5">
          <p className="text-xs uppercase tracking-wider text-aw-gold">Mitglied werden</p>
          <p className="mt-2 text-sm text-aw-muted">Mehr Wissen, Community und exklusive Inhalte im Wurstclub.</p>
          <Link href="/mitgliedschaft" className="mt-3 inline-block text-sm font-semibold text-aw-gold">
            Mitgliedschaft entdecken →
          </Link>
        </div>
      )}
      {cta.showNewsletter && (
        <div className="rounded-xl border border-aw-border bg-aw-surface/50 p-5 md:col-span-2">
          <p className="text-xs uppercase tracking-wider text-aw-gold">Newsletter</p>
          <p className="mt-2 text-sm text-aw-muted">Tipps, Rezepte und Neuigkeiten — datenschutzkonform per E-Mail.</p>
          <Link href="/newsletter" className="mt-3 inline-block text-sm font-semibold text-aw-gold">
            Newsletter abonnieren →
          </Link>
        </div>
      )}
    </div>
  );
}
