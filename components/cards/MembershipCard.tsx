import Link from "next/link";
import Icon from "@/components/brand/Icon";
import type { Membership, MembershipTier } from "@/lib/placeholder-data";

/**
 * Premium-Preisbox für Mitgliedschaften.
 * Vier Stufen (Bronze, Silber, Gold, Gold-Premium) mit eigenem Akzent,
 * Ersparnis-Hinweis, „Beliebteste“-Kennzeichnung und Hervorhebung der Top-Stufe.
 */

type TierStyle = {
  label: string;
  ring: string;
  accentText: string;
  priceText: string;
  iconWrap: string;
  cta: string;
  medal: string; // Verlauf für Stufen-Medaille oben
};

const tierStyles: Record<MembershipTier, TierStyle> = {
  bronze: {
    label: "Bronze",
    ring: "border-aw-bronze/40",
    accentText: "text-aw-bronze",
    priceText: "text-aw-cream",
    iconWrap: "bg-aw-bronze/15 text-aw-bronze ring-aw-bronze/30",
    cta: "text-aw-bronze ring-1 ring-aw-bronze/50 hover:bg-aw-bronze hover:text-aw-bg",
    medal: "from-aw-bronze to-aw-bronze-dark",
  },
  silver: {
    label: "Silber",
    ring: "border-aw-silver/40",
    accentText: "text-aw-silver",
    priceText: "text-aw-cream",
    iconWrap: "bg-aw-silver/15 text-aw-silver ring-aw-silver/30",
    cta: "text-aw-silver ring-1 ring-aw-silver/50 hover:bg-aw-silver hover:text-aw-bg",
    medal: "from-aw-silver to-aw-silver-dark",
  },
  gold: {
    label: "Gold",
    ring: "border-aw-gold/40",
    accentText: "text-aw-gold",
    priceText: "text-aw-gold",
    iconWrap: "bg-aw-gold/15 text-aw-gold ring-aw-gold/30",
    cta: "text-aw-gold ring-1 ring-aw-gold/50 hover:bg-aw-gold hover:text-aw-bg",
    medal: "from-aw-gold to-aw-gold-dark",
  },
  "gold-premium": {
    label: "Gold Premium",
    ring: "border-aw-gold",
    accentText: "text-aw-gold",
    priceText: "text-aw-gold",
    iconWrap: "bg-aw-gold/20 text-aw-gold ring-aw-gold/40",
    cta: "bg-aw-gold text-aw-bg hover:bg-aw-gold-dark hover:text-aw-cream",
    medal: "from-aw-gold via-yellow-200 to-aw-gold-dark",
  },
};

export default function MembershipCard({
  plan,
}: {
  plan: Membership & { checkoutHref?: string };
}) {
  const style = tierStyles[plan.tier];
  const isYearly = plan.period.includes("Jahr");

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-aw-surface p-6 transition-transform ${
        style.ring
      } ${
        plan.featured
          ? "bg-gradient-to-b from-aw-gold/10 to-aw-surface shadow-[0_0_0_1px_rgba(212,175,55,0.5),0_20px_50px_-20px_rgba(212,175,55,0.45)] lg:-translate-y-2"
          : ""
      }`}
    >
      {/* Kennzeichnungs-Bänder oben */}
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-aw-silver px-4 py-1 text-xs font-bold uppercase tracking-wider text-aw-bg">
          ★ Beliebteste
        </span>
      )}
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-aw-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-aw-bg">
          👑 Premium
        </span>
      )}

      {/* Stufe */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${style.medal} text-aw-bg shadow-inner`}
          aria-hidden="true"
        >
          <Icon name={plan.tier === "bronze" ? "spark" : plan.tier === "silver" ? "check" : "crown"} className="h-5 w-5" />
        </span>
        <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${style.accentText}`}>
          {style.label}
        </span>
      </div>

      {/* Name */}
      <h3 className="mt-4 font-display text-xl font-bold leading-snug text-aw-cream">
        {plan.name}
      </h3>

      {/* Preis */}
      <div className="mt-4">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-display text-4xl font-bold ${style.priceText}`}>
            {plan.price}
          </span>
          <span className="text-sm text-aw-muted">/ {plan.period.replace("pro ", "")}</span>
        </div>
        {plan.priceNote && (
          <p className="mt-1 text-xs text-aw-muted">{plan.priceNote}</p>
        )}
      </div>

      {/* Ersparnis bei Jahresmitgliedschaft */}
      {isYearly && plan.savings && (
        <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-aw-success/15 px-3 py-1 text-xs font-semibold text-aw-success">
          <Icon name="coin" className="h-4 w-4" />
          {plan.savings}
        </p>
      )}

      {/* Beschreibung */}
      <p className="mt-4 text-sm leading-6 text-aw-muted">{plan.tagline}</p>

      {/* Vorteile – linksbündig mit Icon */}
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-3 text-left">
            <span
              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1 ${style.iconWrap}`}
            >
              <Icon name={feature.icon} className="h-4 w-4" />
            </span>
            <span
              className={`text-sm leading-6 ${
                feature.highlight ? "font-semibold text-aw-cream" : "text-aw-cream/90"
              }`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.checkoutHref ?? "/mitgliedschaft"}
        className={`mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-colors ${style.cta}`}
      >
        {plan.cta}
      </Link>
    </article>
  );
}
