import type { Metadata } from "next";

import AdminPageSeoPanel from "@/components/admin/page-seo/AdminPageSeoPanel";

export const metadata: Metadata = {
  title: "Admin – SEO",
};

export default function AdminPageSeoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Automatisches SEO
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        SEO-Daten für öffentliche Seiten automatisch erzeugen und aktualisieren.
        Blog-Artikel bleiben im Magazin-Editor mit eigenem SEO-System.
      </p>

      <div className="mt-8">
        <AdminPageSeoPanel />
      </div>
    </div>
  );
}
