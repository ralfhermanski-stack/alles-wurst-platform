/**
 * @file route-permissions.ts
 * @purpose Zuordnung von Routen zu Berechtigungsschlüsseln.
 */

export type RoutePermissionDef = {
  routeKey: string;
  routePattern: string;
  permissionKey: string;
};

export const ROUTE_PERMISSIONS: RoutePermissionDef[] = [
  { routeKey: "admin.dashboard", routePattern: "/admin", permissionKey: "admin.dashboard.view" },
  { routeKey: "admin.users", routePattern: "/admin/benutzer", permissionKey: "admin.users.view" },
  { routeKey: "admin.user-groups", routePattern: "/admin/benutzer-rechte/gruppen", permissionKey: "admin.user-groups.view" },
  { routeKey: "admin.roles", routePattern: "/admin/benutzer-rechte/rollen", permissionKey: "admin.roles.view" },
  { routeKey: "admin.permissions", routePattern: "/admin/benutzer-rechte/berechtigungen", permissionKey: "admin.roles.view" },
  { routeKey: "admin.audit", routePattern: "/admin/benutzer-rechte/protokoll", permissionKey: "admin.audit-log.view" },
  { routeKey: "admin.support", routePattern: "/admin/support", permissionKey: "admin.tickets.view" },
  { routeKey: "admin.accounting", routePattern: "/admin/buchhaltung", permissionKey: "admin.accounting.view" },
  { routeKey: "admin.courses", routePattern: "/admin/kurse", permissionKey: "admin.courses.view" },
  { routeKey: "admin.blog", routePattern: "/admin/magazin", permissionKey: "admin.blog.view" },
  { routeKey: "admin.forums", routePattern: "/admin/community/foren", permissionKey: "admin.forums.view" },
  { routeKey: "admin.seo", routePattern: "/admin/seo", permissionKey: "admin.seo.view" },
  { routeKey: "admin.stripe", routePattern: "/admin/stripe", permissionKey: "admin.stripe.view" },
  { routeKey: "admin.sharing", routePattern: "/admin/community/freigaben", permissionKey: "admin.sharing.view" },
  { routeKey: "workshop.home", routePattern: "/werkstatt", permissionKey: "workshop.home.view" },
  { routeKey: "workshop.recipe-generator", routePattern: "/werkstatt/rezeptgenerator", permissionKey: "workshop.recipe-generator.view" },
  { routeKey: "workshop.recipe-database", routePattern: "/werkstatt/rezeptdatenbank", permissionKey: "workshop.recipe-database.view" },
  { routeKey: "workshop.salt-calculator", routePattern: "/werkstatt/salzrechner", permissionKey: "workshop.salt-calculator.view" },
  { routeKey: "workshop.brine-calculator", routePattern: "/werkstatt/lakerechner", permissionKey: "workshop.brine-calculator.view" },
  { routeKey: "workshop.marinade-generator", routePattern: "/werkstatt/marinaden-generator", permissionKey: "workshop.marinade-generator.view" },
  { routeKey: "workshop.product-recommendations", routePattern: "/werkstatt/empfehlungen", permissionKey: "workshop.product-recommendations.view" },
  { routeKey: "admin.product-recommendations", routePattern: "/admin/werkstatt/produktempfehlungen", permissionKey: "admin.product-recommendations.view" },
  { routeKey: "admin.security", routePattern: "/admin/sicherheit", permissionKey: "admin.security.view" },
  { routeKey: "member.area", routePattern: "/mein-bereich", permissionKey: "general.member-area.view" },
  { routeKey: "member.forums", routePattern: "/mein-bereich/foren", permissionKey: "forum.view" },
  { routeKey: "admin.communication", routePattern: "/admin/kommunikation", permissionKey: "admin.email.view" },
  { routeKey: "admin.content", routePattern: "/admin/inhalte", permissionKey: "admin.media.view" },
  { routeKey: "admin.billing", routePattern: "/admin/buchhaltung", permissionKey: "admin.accounting.view" },
  { routeKey: "admin.memberships", routePattern: "/admin/mitgliedschaften", permissionKey: "admin.memberships.view" },
  { routeKey: "admin.orders", routePattern: "/admin/bestellungen", permissionKey: "admin.orders.view" },
];

export function findRoutePermission(pathname: string): RoutePermissionDef | null {
  const normalized = pathname.split("?")[0];

  const exact = ROUTE_PERMISSIONS.find((entry) => entry.routePattern === normalized);

  if (exact) {
    return exact;
  }

  const sorted = [...ROUTE_PERMISSIONS].sort(
    (a, b) => b.routePattern.length - a.routePattern.length,
  );

  return (
    sorted.find(
      (entry) =>
        normalized === entry.routePattern ||
        normalized.startsWith(`${entry.routePattern}/`),
    ) ?? null
  );
}
