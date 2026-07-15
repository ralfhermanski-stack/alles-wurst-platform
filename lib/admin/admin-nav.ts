/**
 * @file admin-nav.ts
 * @purpose Navigation für den Adminbereich (ausklappbare Sektionen).
 */

export type AdminNavItem = {
  label: string;
  href: string;
  permissionKey?: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_STORAGE_KEY = "admin-nav-expanded-sections";

export const adminNavSections: AdminNavSection[] = [
  {
    id: "users-rights",
    label: "Benutzer & Rechte",
    items: [
      { label: "Benutzer", href: "/admin/benutzer" },
      { label: "Benutzergruppen", href: "/admin/benutzer-rechte/gruppen" },
      { label: "Rollen", href: "/admin/benutzer-rechte/rollen" },
      { label: "Berechtigungen", href: "/admin/benutzer-rechte/berechtigungen" },
      { label: "Seiten- und Funktionsrechte", href: "/admin/benutzer-rechte/funktionen" },
      { label: "Adminrechte", href: "/admin/benutzer-rechte/adminrechte" },
      { label: "Änderungsprotokoll", href: "/admin/benutzer-rechte/protokoll" },
      { label: "Gruppenvergleich", href: "/admin/benutzer-rechte/vergleich" },
    ],
  },
  {
    id: "communication",
    label: "Kommunikation",
    items: [
      { label: "E-Mail — Übersicht", href: "/admin/kommunikation/email" },
      { label: "E-Mail — Absender", href: "/admin/kommunikation/email/absender" },
      { label: "E-Mail — Provider", href: "/admin/kommunikation/email/provider" },
      { label: "E-Mail — Vorlagen", href: "/admin/kommunikation/email/vorlagen" },
      { label: "E-Mail — Versand", href: "/admin/kommunikation/email/versand" },
      { label: "E-Mail — Warteschlange", href: "/admin/kommunikation/email/warteschlange" },
      { label: "E-Mail — Protokoll", href: "/admin/kommunikation/email/protokoll" },
      { label: "E-Mail — Fehler", href: "/admin/kommunikation/email/fehler" },
      { label: "E-Mail — Einstellungen", href: "/admin/kommunikation/email/einstellungen" },
      { label: "E-Mail — Testversand", href: "/admin/kommunikation/email/test" },
    ],
  },
  {
    id: "content",
    label: "Inhalte",
    items: [
      { label: "Seiten bearbeiten", href: "/admin/inhalte/seiteneditor" },
      { label: "Textverwaltung", href: "/admin/inhalte/texte" },
      { label: "Rechtliches", href: "/admin/inhalte/rechtliches" },
      { label: "Datenschutz", href: "/admin/datenschutz" },
      { label: "Medien", href: "/admin/inhalte/medien" },
      { label: "Navigation", href: "/admin/inhalte/navigation" },
      { label: "E-Mail-Vorlagen", href: "/admin/inhalte/e-mail-vorlagen" },
      { label: "Hardcode-Report", href: "/admin/inhalte/texte?tab=report" },
    ],
  },
  {
    id: "security",
    label: "Sicherheit",
    items: [
      { label: "Sicherheitsübersicht", href: "/admin/sicherheit" },
      { label: "Angriffsversuche", href: "/admin/sicherheit?tab=attacks" },
      { label: "Gesperrte IPs", href: "/admin/sicherheit?tab=blocked-ips" },
      { label: "Aktive Sitzungen", href: "/admin/sicherheit?tab=sessions" },
      { label: "Sicherheitsregeln", href: "/admin/sicherheit?tab=rules" },
      { label: "Verdächtige Benutzer", href: "/admin/sicherheit?tab=suspicious" },
      { label: "Administrator-Protokoll", href: "/admin/sicherheit?tab=audit" },
      { label: "Systemstatus", href: "/admin/sicherheit?tab=status" },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { label: "Wartungsmodus", href: "/admin/wartungsmodus" },
      { label: "Betatest", href: "/admin/betatest" },
      { label: "Testdaten", href: "/admin/system/testdaten" },
      { label: "SEO", href: "/admin/seo" },
      { label: "Statistiken", href: "/admin/statistiken" },
      { label: "Stripe", href: "/admin/stripe" },
      { label: "Partnerprogramme", href: "/admin/einstellungen/partnerprogramme" },
    ],
  },
  {
    id: "general",
    label: "Allgemein",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Einstellungen", href: "/admin/einstellungen" },
    ],
  },
  {
    id: "tickets",
    label: "Support",
    items: [
      { label: "Übersicht", href: "/admin/support" },
      { label: "Tickets", href: "/admin/support?status=active" },
      { label: "Meister-Support", href: "/admin/support?category=meister-support" },
      { label: "Wissensdatenbank", href: "/admin/support/wissensdatenbank" },
      { label: "FAQ-Kategorien", href: "/admin/support/wissensdatenbank#kategorien" },
      { label: "Überfällige Tickets", href: "/admin/support?overdue=1" },
      {
        label: "Ohne Bearbeiter",
        href: "/admin/support?assigneeId=unassigned&status=active",
      },
      { label: "Rückfrage an User", href: "/admin/support?status=waiting_user" },
      { label: "Kategorien", href: "/admin/support/kategorien" },
      { label: "Antwortvorlagen", href: "/admin/support/vorlagen" },
    ],
  },
  {
    id: "billing",
    label: "Buchhaltung",
    items: [
      { label: "Mitgliedschaften", href: "/admin/mitgliedschaften" },
      { label: "Bestellungen", href: "/admin/bestellungen" },
      { label: "Buchhaltung", href: "/admin/buchhaltung" },
    ],
  },
  {
    id: "courses",
    label: "Kurse",
    items: [
      { label: "Kursübersicht", href: "/admin/kurse" },
      { label: "Lernpfade", href: "/admin/kurse/gruppen" },
      { label: "Bewertungen", href: "/admin/bewertungen" },
      { label: "Zertifikate", href: "/admin/zertifikate" },
    ],
  },
  {
    id: "magazin",
    label: "Magazin",
    items: [
      { label: "Artikelübersicht", href: "/admin/magazin" },
      { label: "Neuer Artikel", href: "/admin/magazin/neu" },
      { label: "Kategorien", href: "/admin/magazin/kategorien" },
      { label: "Schlagwörter", href: "/admin/magazin/schlagwoerter" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      { label: "Social Media", href: "/admin/marketing/social-media" },
      { label: "Einrichtung", href: "/admin/marketing/social-media/einrichtung" },
      { label: "Kanäle", href: "/admin/marketing/social-media/kanaele" },
      { label: "Beiträge", href: "/admin/marketing/social-media/beitraege" },
      { label: "Schnittstellen", href: "/admin/marketing/social-media/schnittstellen" },
      { label: "Cronjob", href: "/admin/marketing/social-media/cronjob" },
      { label: "Sync-Protokoll", href: "/admin/marketing/social-media/protokoll" },
      { label: "Startseite", href: "/admin/marketing/social-media/startseite" },
      { label: "Social-Media-Einstellungen", href: "/admin/marketing/social-media/einstellungen" },
    ],
  },
  {
    id: "community",
    label: "Community",
    items: [
      { label: "Foren", href: "/admin/foren" },
      { label: "Mitglieder", href: "/admin/benutzer" },
      { label: "Challenges", href: "/admin/community/challenges" },
      { label: "Freigaben", href: "/admin/community/freigaben" },
      { label: "Neue Challenge", href: "/admin/community/challenges/neu" },
      { label: "Challenge-Einstellungen", href: "/admin/community/challenges/einstellungen" },
    ],
  },
  {
    id: "werkstatt",
    label: "Werkstatt",
    items: [
      { label: "Rezeptgenerator", href: "/admin/werkstatt/rezeptgenerator" },
      {
        label: "Generator-Einstellungen",
        href: "/admin/werkstatt/rezeptgenerator/einstellungen",
      },
      { label: "Produktempfehlungen", href: "/admin/werkstatt/produktempfehlungen" },
    ],
  },
];

/** @deprecated Nutze adminNavSections */
export type AdminNavGroup = {
  group: string;
  items: AdminNavItem[];
};

/** @deprecated Nutze adminNavSections */
export const adminRecipeNav: AdminNavGroup[] = adminNavSections.map((section) => ({
  group: section.label,
  items: section.items,
}));

export function getAdminNavSectionForPath(pathname: string): string | null {
  for (const section of adminNavSections) {
    for (const item of section.items) {
      const baseHref = item.href.split("?")[0];

      if (baseHref === "/admin" && pathname === "/admin") {
        return section.id;
      }

      if (baseHref !== "/admin" && pathname.startsWith(baseHref)) {
        return section.id;
      }
    }
  }

  return null;
}

export function isAdminNavItemActive(
  pathname: string,
  href: string,
  currentSearch = "",
): boolean {
  const [baseHref, query = ""] = href.split("?");
  const itemParams = new URLSearchParams(query);
  const currentParams = new URLSearchParams(currentSearch);

  if (baseHref === "/admin") {
    return pathname === "/admin";
  }

  if (itemParams.size === 0) {
    if (pathname === baseHref) {
      if (baseHref === "/admin/support") {
        return currentParams.size === 0;
      }

      return true;
    }

    if (pathname.startsWith(`${baseHref}/`)) {
      return baseHref !== "/admin/support";
    }

    return false;
  }

  if (pathname !== baseHref) {
    return false;
  }

  for (const [key, value] of itemParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}
