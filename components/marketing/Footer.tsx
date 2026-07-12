import Link from "next/link";
import Logo from "@/components/brand/Logo";
import { getPlatformTextsByCategory } from "@/lib/platform-text/platform-text-service";
import { getPlatformTextDefault, interpolatePlatformText } from "@/lib/platform-text/platform-text-defaults";

const footerLinkKeys = [
  { labelKey: "footer.link.akademie", href: "/akademie" },
  { labelKey: "footer.link.rezepte", href: "/rezepte" },
  { labelKey: "footer.link.werkstatt", href: "/werkstatt" },
  { labelKey: "footer.link.community", href: "/community" },
  { labelKey: "footer.link.membership", href: "/mitgliedschaft" },
  { labelKey: "footer.link.my_area", href: "/mein-bereich" },
  { labelKey: "footer.link.admin", href: "/admin" },
  { labelKey: "footer.link.contact", href: "/kontakt" },
  { labelKey: "footer.link.legal_overview", href: "/rechtliches" },
  { labelKey: "footer.link.imprint", href: "/impressum" },
  { labelKey: "footer.link.privacy", href: "/datenschutz" },
  { labelKey: "footer.link.terms", href: "/agb" },
  { labelKey: "footer.link.withdrawal_policy", href: "/widerrufsbelehrung" },
  { labelKey: "footer.link.withdrawal_form", href: "/widerrufsformular" },
  { labelKey: "footer.link.cookie_settings", href: "/cookie-einstellungen" },
] as const;

export default async function Footer() {
  const texts = await getPlatformTextsByCategory("footer");
  const t = (key: string, fallback: string) => texts[key] ?? fallback;
  const linkLabel = (key: string) =>
    texts[key] ?? getPlatformTextDefault(key)?.defaultValue ?? key;

  const footerColumns = [
    {
      titleKey: "footer.col.platform",
      titleFallback: "Plattform",
      links: footerLinkKeys.slice(0, 5),
    },
    {
      titleKey: "footer.col.account",
      titleFallback: "Konto",
      links: footerLinkKeys.slice(5, 8),
    },
    {
      titleKey: "footer.col.legal",
      titleFallback: "Rechtliches",
      links: footerLinkKeys.slice(8),
    },
  ];

  return (
    <footer className="mt-auto border-t border-aw-border bg-aw-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo variant="stacked" className="h-32 w-auto" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-aw-muted">
              {t(
                "footer.tagline",
                "Die digitale Heimat für handwerkliche Wurstherstellung, Räuchern und Fleischverarbeitung.",
              )}
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.titleKey}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-aw-gold">
                {t(col.titleKey, col.titleFallback)}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-sm text-aw-cream/80 transition-colors hover:text-aw-gold"
                    >
                      {linkLabel(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-aw-border pt-6 text-xs text-aw-muted sm:flex-row">
          <p>
            {interpolatePlatformText(
              t("footer.copyright", "© {year} Alles-Wurst. Alle Rechte vorbehalten."),
              { year: new Date().getFullYear() },
            )}
          </p>
          <p className="uppercase tracking-[0.2em] text-aw-gold/80">
            {t("footer.motto", "The Crest of Craftsmanship")}
          </p>
        </div>
      </div>
    </footer>
  );
}
