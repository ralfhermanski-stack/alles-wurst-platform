import Icon from "@/components/brand/Icon";
import type { HelpOption } from "@/lib/placeholder-data";

/**
 * Hilfe-Karte für den Bereich „Hilfe & Unterstützung" auf der Startseite.
 * Reine Design-Vorschau – keine Funktion.
 */
export default function HelpSupportCard({ option }: { option: HelpOption }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-aw-border bg-aw-surface p-6 transition-all hover:-translate-y-1 hover:border-aw-gold/50 hover:shadow-[0_18px_40px_-24px_rgba(212,175,55,0.5)]">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border transition-colors group-hover:bg-aw-gold/15 group-hover:ring-aw-gold/40">
        <Icon name={option.icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold text-aw-cream">
        {option.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{option.description}</p>
    </article>
  );
}
