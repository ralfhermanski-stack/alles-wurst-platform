import Link from "next/link";
import Icon from "@/components/brand/Icon";
import type { Tool } from "@/lib/placeholder-data";

const accessTone: Record<Tool["access"], string> = {
  Öffentlich: "bg-aw-success/15 text-aw-success",
  Premium: "bg-aw-gold/15 text-aw-gold",
  Club: "bg-aw-bronze/15 text-aw-bronze",
  Meister: "bg-aw-brown/40 text-aw-gold",
};

/**
 * Werkzeugkarte für die Werkstatt (Rechner & Generatoren).
 * Zeigt Zugangsstufe als Badge – rein visuell, kein echtes Gating.
 *
 * Verlinkt produktive Tools auf ihre eigene Route (z. B. Salzrechner).
 * Noch nicht implementierte Tools verweisen weiterhin auf `/werkstatt`.
 */
export default function ToolCard({ tool }: { tool: Tool }) {
  // Produktive Tools mit eigener Seite
  const TOOL_ROUTES: Record<string, string> = {
    salzrechner: "/werkstatt/salzrechner",
    lakerechner: "/werkstatt/lakerechner",
    rezeptgenerator: "/werkstatt/rezeptgenerator",
    rezeptdatenbank: "/werkstatt/rezeptdatenbank",
    "marinaden-generator": "/werkstatt/marinaden-generator",
    empfehlungen: "/werkstatt/empfehlungen",
  };
  const href = TOOL_ROUTES[tool.slug] ?? "/werkstatt";
  return (
    <article className="group flex flex-col rounded-xl border border-aw-border bg-aw-surface p-5 transition-colors hover:border-aw-gold/50">
      <div className="flex items-start justify-between">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-aw-surface-2 text-aw-gold ring-1 ring-aw-border">
          <Icon name={tool.icon} />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${accessTone[tool.access]}`}
        >
          {tool.access}
        </span>
      </div>

      <h3 className="mt-4 font-display text-lg font-bold text-aw-cream">{tool.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-aw-muted">{tool.description}</p>

      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-aw-gold transition-colors hover:text-aw-cream"
      >
        Werkzeug öffnen
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </article>
  );
}
