/**
 * @file navigation-permissions.ts
 * @purpose Berechtigungsschlüssel für Mitglieder- und Werkstatt-Navigation.
 */

export type NavPermissionItem = {
  label: string;
  href: string;
  permissionKey: string;
};

export const MEMBER_NAV_PERMISSIONS: NavPermissionItem[] = [
  { label: "Übersicht", href: "/mein-bereich", permissionKey: "general.member-area.view" },
  { label: "Mitgliedschaft", href: "/mein-bereich/mitgliedschaft", permissionKey: "general.member-area.view" },
  { label: "Meine Kurse", href: "/mein-bereich/kurse", permissionKey: "course.list.view" },
  { label: "Bestellungen", href: "/mein-bereich/bestellungen", permissionKey: "general.member-area.view" },
  { label: "Nachrichten", href: "/mein-bereich/nachrichten", permissionKey: "messages.own.view" },
  { label: "Foren", href: "/mein-bereich/foren", permissionKey: "forum.view" },
  { label: "Freigaben", href: "/mein-bereich/freigaben", permissionKey: "social.share.own" },
  { label: "Challenges", href: "/mein-bereich/challenges", permissionKey: "membership.benefits.view" },
  { label: "Support", href: "/mein-bereich/support", permissionKey: "tickets.own.view" },
  { label: "Zertifikate", href: "/mein-bereich/zertifikate", permissionKey: "certificate.download" },
  { label: "Datenschutz", href: "/account/datenschutz", permissionKey: "profile.own.view" },
];

export const TOOL_PERMISSION_BY_SLUG: Record<string, string> = {
  salzrechner: "workshop.salt-calculator.view",
  lakerechner: "workshop.brine-calculator.view",
  rezeptgenerator: "workshop.recipe-generator.view",
  rezeptdatenbank: "workshop.recipe-database.view",
  "marinaden-generator": "workshop.marinade-generator.view",
  rezeptanalyse: "workshop.spice-calculator.view",
  empfehlungen: "workshop.product-recommendations.view",
};

export const ADMIN_NAV_PERMISSION_BY_HREF: Record<string, string> = {
  "/admin": "admin.dashboard.view",
  "/admin/benutzer": "admin.users.view",
  "/admin/benutzer-rechte/gruppen": "admin.user-groups.view",
  "/admin/benutzer-rechte/rollen": "admin.roles.view",
  "/admin/benutzer-rechte/berechtigungen": "admin.roles.view",
  "/admin/benutzer-rechte/funktionen": "admin.roles.view",
  "/admin/benutzer-rechte/adminrechte": "admin.roles.view",
  "/admin/benutzer-rechte/protokoll": "admin.audit-log.view",
  "/admin/benutzer-rechte/vergleich": "admin.user-groups.view",
  "/admin/kommunikation/email": "admin.email.view",
  "/admin/inhalte/seiteneditor": "admin.media.view",
  "/admin/inhalte/texte": "admin.media.view",
  "/admin/inhalte/rechtliches": "admin.privacy.view",
  "/admin/datenschutz": "admin.privacy.view",
  "/admin/inhalte/medien": "admin.media.view",
  "/admin/wartungsmodus": "admin.maintenance.view",
  "/admin/system/testdaten": "admin.system-settings.view",
  "/admin/seo": "admin.seo.view",
  "/admin/statistiken": "admin.analytics.view",
  "/admin/stripe": "admin.stripe.view",
  "/admin/einstellungen": "admin.system-settings.view",
  "/admin/support": "admin.tickets.view",
  "/admin/mitgliedschaften": "admin.memberships.view",
  "/admin/bestellungen": "admin.orders.view",
  "/admin/buchhaltung": "admin.accounting.view",
  "/admin/kurse": "admin.courses.view",
  "/admin/kurse/gruppen": "admin.course-groups.view",
  "/admin/bewertungen": "admin.reviews.view",
  "/admin/zertifikate": "admin.certificates.view",
  "/admin/magazin": "admin.blog.view",
  "/admin/marketing/social-media": "admin.newsletter.view",
  "/admin/foren": "admin.forums.view",
  "/admin/community/challenges": "admin.forums.view",
  "/admin/community/freigaben": "admin.sharing.view",
  "/admin/werkstatt/rezeptgenerator": "admin.workshop-settings.view",
  "/admin/werkstatt/produktempfehlungen": "admin.product-recommendations.view",
  "/admin/einstellungen/partnerprogramme": "admin.product-recommendations.manage",
  "/admin/sicherheit": "admin.security.view",
};

export function resolveAdminNavPermission(href: string): string | null {
  const base = href.split("?")[0].split("#")[0];

  if (ADMIN_NAV_PERMISSION_BY_HREF[base]) {
    return ADMIN_NAV_PERMISSION_BY_HREF[base];
  }

  const sorted = Object.entries(ADMIN_NAV_PERMISSION_BY_HREF).sort(
    (a, b) => b[0].length - a[0].length,
  );

  for (const [path, key] of sorted) {
    if (base.startsWith(`${path}/`) || base === path) {
      return key;
    }
  }

  return null;
}

export function filterNavByPermissions<T extends { href: string }>(
  items: T[],
  allowedKeys: Set<string>,
  resolveKey: (href: string) => string | null,
): T[] {
  return items.filter((item) => {
    const key = resolveKey(item.href);
    return !key || allowedKeys.has(key);
  });
}
