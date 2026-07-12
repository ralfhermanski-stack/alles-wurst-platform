import Link from "next/link";

import AdminSystemStatusCard from "@/components/admin/social-media/AdminSystemStatusCard";
import {
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

const LINKS: Array<{
  href: string;
  title: string;
  description: string;
  highlight?: boolean;
}> = [
  {
    href: "/admin/marketing/social-media/einrichtung",
    title: "Einrichtung",
    description: "Schritt-für-Schritt-Assistent mit Status und Prüfungen.",
    highlight: true,
  },
  {
    href: "/admin/marketing/social-media/kanaele",
    title: "Kanäle",
    description: "Social-Media-Kanäle anlegen und verwalten.",
  },
  {
    href: "/admin/marketing/social-media/beitraege",
    title: "Beiträge",
    description: "Manuelle Beiträge und Homepage-Kuration.",
  },
  {
    href: "/admin/marketing/social-media/schnittstellen",
    title: "Schnittstellen",
    description: "API-Zugangsdaten pro Plattform hinterlegen.",
  },
  {
    href: "/admin/marketing/social-media/protokoll",
    title: "Sync-Protokoll",
    description: "Verlauf der automatischen Synchronisierungen.",
  },
  {
    href: "/admin/marketing/social-media/cronjob",
    title: "Cronjob",
    description: "Cron-Endpunkt, Diagnose und manuelle Auslösung.",
  },
  {
    href: "/admin/marketing/social-media/startseite",
    title: "Startseite",
    description: "Kanäle und Highlight-Beiträge für die Startseite.",
  },
  {
    href: "/admin/marketing/social-media/einstellungen",
    title: "Einstellungen",
    description: "Globale Social-Media-Einstellungen.",
  },
];

export default function AdminSocialMediaOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-aw-cream">Social Media</h1>
        <p className="mt-1 text-sm text-aw-muted">
          Kanäle, Beiträge und Schnittstellen für die Marketing-Startseite verwalten.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl border p-5 transition hover:border-aw-gold/40 ${
              link.highlight
                ? "border-aw-gold/50 bg-aw-gold/10"
                : "border-aw-border bg-aw-surface/40"
            }`}
          >
            <h2 className="font-display text-lg font-bold text-aw-cream">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-aw-muted">{link.description}</p>
          </Link>
        ))}
      </div>

      <AdminSystemStatusCard />

      <Link href="/admin" className={secondaryButtonClassName}>
        Zum Dashboard
      </Link>
    </div>
  );
}
