import type { Metadata } from "next";

import EditablePageHeader from "@/components/marketing/EditablePageHeader";
import ToolCard from "@/components/cards/ToolCard";
import { tools } from "@/lib/placeholder-data";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getEffectivePermissionKeysForUser } from "@/lib/permissions/granular-admin-auth";
import { TOOL_PERMISSION_BY_SLUG } from "@/lib/permissions/navigation-permissions";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/werkstatt", {
    title: "Werkstatt",
    description:
      "Digitale Werkzeuge: Salzrechner, Lakerechner, Rezept- und Marinaden-Generator, Rezeptanalyse und kuratierte Produkte.",
  });
}

export default async function WerkstattPage() {
  const userId = await getSessionUserIdFromCookies();
  let visibleTools = tools;

  if (userId) {
    const allowed = new Set(await getEffectivePermissionKeysForUser(userId));
    visibleTools = tools.filter((tool) => {
      const key = TOOL_PERMISSION_BY_SLUG[tool.slug];
      return !key || allowed.has(key);
    });
  } else {
    visibleTools = tools.filter((tool) => tool.access === "Öffentlich");
  }

  return (
    <>
      <EditablePageHeader
        eyebrowKey="werkstatt.header.eyebrow"
        titleKey="werkstatt.header.title"
        descriptionKey="werkstatt.header.description"
        imageKey="werkstatt.header.image"
        imageAltKey="werkstatt.header.image_alt"
        fallbacks={{
          eyebrow: "Werkstatt",
          title: "Werkzeuge für dein Handwerk",
          description:
            "Präzise Rechner und Generatoren für den Alltag am Wurstkessel – plus kuratierte Ausrüstung.",
        }}
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        {visibleTools.length === 0 && (
          <p className="rounded-xl border border-aw-border p-6 text-sm text-aw-muted">
            Für dein Konto sind aktuell keine Werkstatt-Werkzeuge freigeschaltet.
          </p>
        )}

        <div className="mt-12 rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-6 text-sm text-aw-muted">
          <strong className="text-aw-cream">Hinweis:</strong> Sichtbare Werkzeuge hängen von deiner
          Mitgliedschaft und den zugewiesenen Berechtigungen ab.
        </div>
      </section>
    </>
  );
}
