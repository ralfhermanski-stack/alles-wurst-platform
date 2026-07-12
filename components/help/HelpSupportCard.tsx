import Link from "next/link";

import Icon from "@/components/brand/Icon";

export type HelpSupportCardProps = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

/**
 * Hilfe-Karte für Hilfe-Center und Startseite.
 */
export default function HelpSupportCard({
  icon,
  title,
  description,
  href,
}: HelpSupportCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-aw-border bg-aw-surface p-6 transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border transition-colors group-hover:bg-aw-gold/15 group-hover:ring-aw-gold/40">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold text-aw-cream">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{description}</p>
      <span className="mt-4 text-sm font-semibold text-aw-gold group-hover:text-aw-cream">
        Mehr erfahren →
      </span>
    </Link>
  );
}
