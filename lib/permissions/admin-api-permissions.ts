/**
 * @file admin-api-permissions.ts
 * @purpose API-Pfad → Berechtigungsschlüssel für granulare Admin-Guards.
 */

export type AdminApiPermissionDef = {
  pathPrefix: string;
  permissionKey: string;
};

export const ADMIN_API_PERMISSIONS: AdminApiPermissionDef[] = [
  { pathPrefix: "/api/admin/permissions", permissionKey: "admin.user-groups.view" },
  { pathPrefix: "/api/admin/users", permissionKey: "admin.users.view" },
  { pathPrefix: "/api/admin/memberships", permissionKey: "admin.memberships.view" },
  { pathPrefix: "/api/admin/orders", permissionKey: "admin.orders.view" },
  { pathPrefix: "/api/admin/courses", permissionKey: "admin.courses.view" },
  { pathPrefix: "/api/admin/certificates", permissionKey: "admin.certificates.view" },
  { pathPrefix: "/api/admin/zertifikate", permissionKey: "admin.certificates.view" },
  { pathPrefix: "/api/admin/reviews", permissionKey: "admin.reviews.view" },
  { pathPrefix: "/api/admin/bewertungen", permissionKey: "admin.reviews.view" },
  { pathPrefix: "/api/admin/forums", permissionKey: "admin.forums.view" },
  { pathPrefix: "/api/admin/foren", permissionKey: "admin.forums.view" },
  { pathPrefix: "/api/admin/blog", permissionKey: "admin.blog.view" },
  { pathPrefix: "/api/admin/magazin", permissionKey: "admin.blog.view" },
  { pathPrefix: "/api/admin/support", permissionKey: "admin.tickets.view" },
  { pathPrefix: "/api/admin/kommunikation/email", permissionKey: "admin.email.view" },
  { pathPrefix: "/api/admin/email", permissionKey: "admin.email.view" },
  { pathPrefix: "/api/admin/stripe", permissionKey: "admin.stripe.view" },
  { pathPrefix: "/api/admin/page-seo", permissionKey: "admin.seo.view" },
  { pathPrefix: "/api/admin/maintenance", permissionKey: "admin.maintenance.view" },
  { pathPrefix: "/api/admin/wartungsmodus", permissionKey: "admin.maintenance.view" },
  { pathPrefix: "/api/admin/beta-test", permissionKey: "admin.maintenance.view" },
  { pathPrefix: "/api/admin/page-editor", permissionKey: "admin.media.manage" },
  { pathPrefix: "/api/admin/platform-text", permissionKey: "admin.media.manage" },
  { pathPrefix: "/api/admin/legal", permissionKey: "admin.privacy.view" },
  { pathPrefix: "/api/admin/datenschutz", permissionKey: "admin.privacy.view" },
  { pathPrefix: "/api/admin/privacy", permissionKey: "admin.privacy.view" },
  { pathPrefix: "/api/admin/analytics", permissionKey: "admin.analytics.view" },
  { pathPrefix: "/api/admin/statistiken", permissionKey: "admin.analytics.view" },
  { pathPrefix: "/api/admin/shares", permissionKey: "admin.sharing.view" },
  { pathPrefix: "/api/admin/community/freigaben", permissionKey: "admin.sharing.view" },
  { pathPrefix: "/api/admin/community/challenges", permissionKey: "admin.forums.manage" },
  { pathPrefix: "/api/admin/challenges", permissionKey: "admin.forums.manage" },
  { pathPrefix: "/api/admin/recipes", permissionKey: "admin.recipes.view" },
  { pathPrefix: "/api/admin/categories", permissionKey: "admin.recipe-categories.view" },
  { pathPrefix: "/api/admin/werkstatt/produktempfehlungen", permissionKey: "admin.product-recommendations.view" },
  { pathPrefix: "/api/admin/security", permissionKey: "admin.security.view" },
  { pathPrefix: "/api/admin/einstellungen/partnerprogramme", permissionKey: "admin.product-recommendations.manage" },
  { pathPrefix: "/api/admin/settings/recipe-generator", permissionKey: "admin.workshop-settings.view" },
  { pathPrefix: "/api/admin/werkstatt", permissionKey: "admin.workshop-settings.view" },
  { pathPrefix: "/api/admin/knowledge-base", permissionKey: "admin.tickets.view" },
  { pathPrefix: "/api/admin/dashboard", permissionKey: "admin.dashboard.view" },
  { pathPrefix: "/api/admin/session", permissionKey: "admin.dashboard.view" },
  { pathPrefix: "/api/admin/test-data", permissionKey: "admin.system-settings.view" },
];

const SORTED = [...ADMIN_API_PERMISSIONS].sort(
  (a, b) => b.pathPrefix.length - a.pathPrefix.length,
);

export function findAdminApiPermission(pathname: string): string | null {
  const normalized = pathname.split("?")[0];

  for (const entry of SORTED) {
    if (
      normalized === entry.pathPrefix ||
      normalized.startsWith(`${entry.pathPrefix}/`)
    ) {
      return entry.permissionKey;
    }
  }

  if (normalized.startsWith("/api/admin/")) {
    return "admin.dashboard.view";
  }

  return null;
}
