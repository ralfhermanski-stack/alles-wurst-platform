/**
 * @file page-guard.ts
 * @purpose Serverseitige Seitenzugriffsprüfung per Route-Permission.
 */

import { redirect } from "next/navigation";

import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { hasPermission, isSuperAdmin } from "@/lib/permissions/permission-service";
import { findRoutePermission } from "@/lib/permissions/route-permissions";
import { isAdminSystemRole } from "@/lib/users/system-role";
import { prisma } from "@/lib/db/prisma";

export async function requirePagePermission(pathname: string): Promise<void> {
  const route = findRoutePermission(pathname);

  if (!route) {
    return;
  }

  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    if (route.permissionKey.startsWith("workshop.")) {
      const publicTools = [
        "workshop.home.view",
        "workshop.salt-calculator.view",
        "workshop.product-recommendations.view",
      ];

      if (publicTools.includes(route.permissionKey)) {
        return;
      }
    }

    redirect(`/anmelden?next=${encodeURIComponent(pathname)}`);
  }

  if (await isSuperAdmin(userId)) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true },
  });

  if (isAdminSystemRole(user?.systemRole)) {
    return;
  }

  const allowed = await hasPermission(userId, route.permissionKey);

  if (!allowed) {
    // Öffentliche Werkstatt-Tools bleiben auch für eingeloggte Nutzer ohne
    // explizite Permission nutzbar — sonst wären sie schlechter gestellt als Gäste.
    if (route.permissionKey.startsWith("workshop.")) {
      const publicTools = [
        "workshop.home.view",
        "workshop.salt-calculator.view",
        "workshop.product-recommendations.view",
      ];

      if (publicTools.includes(route.permissionKey)) {
        return;
      }
    }

    if (pathname.startsWith("/admin")) {
      redirect("/?error=forbidden");
    }

    if (pathname.startsWith("/mein-bereich") || pathname.startsWith("/account")) {
      redirect("/?error=forbidden");
    }

    redirect("/werkstatt?error=forbidden");
  }
}
