import Link from "next/link";
import Icon from "@/components/brand/Icon";
import type { CourseCategory } from "@/lib/placeholder-data";

/**
 * Klickbare Kategorie-Karte für die Kursbereiche auf der Startseite.
 * Verlinkt (Platzhalter) auf den Kurskatalog.
 */
export default function CategoryCard({ category }: { category: CourseCategory }) {
  return (
    <Link
      href="/akademie/kurse"
      className="group flex flex-col rounded-xl border border-aw-border bg-aw-surface p-5 transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border transition-colors group-hover:bg-aw-gold/15 group-hover:ring-aw-gold/40">
        <Icon name={category.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-bold text-aw-cream">
        {category.name}
      </h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-aw-muted">
        {category.description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aw-gold">
        Kurse ansehen
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
      </span>
    </Link>
  );
}
