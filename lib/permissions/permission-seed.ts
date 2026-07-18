/**
 * @file permission-seed.ts
 * @purpose Katalog, Standardgruppen und Migration bestehender Rollen.
 */

import type { MembershipRole, UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { PERMISSION_CATALOG } from "./permission-catalog";
import { applyStandardPermissionsToGroup } from "./group-service";
import { ROUTE_PERMISSIONS } from "./route-permissions";

const REGISTERED_PERMISSIONS = [
  "general.member-area.view",
  "general.public-content.view",
  "profile.own.view",
  "profile.own.edit",
  "messages.own.view",
  "tickets.own.create",
  "tickets.own.view",
  "blog.public.view",
  "recipe.view.public",
  "recipe.view.monthly",
  "recipe.create",
  "recipe.edit.own",
  "recipe.delete.own",
  "recipe.export.own",
  "recipe.pdf.own",
  "recipe.share.own",
  "workshop.home.view",
  "workshop.home.open",
  "workshop.recipe-generator.view",
  "workshop.recipe-generator.open",
  "workshop.recipe-generator.use",
  // Seite öffnen; Inhalt bleibt stufengefiltert (nur Rezept des Monats).
  "workshop.recipe-database.view",
  "workshop.recipe-database.open",
  "workshop.recipe-of-month.view",
  "workshop.recipe-of-month.open",
  "workshop.own-recipes.view",
  "workshop.own-recipes.open",
  "forum.view",
  "forum.open",
  "forum.reply.create",
  "forum.post.edit.own",
  "forum.post.delete.own",
  "workshop.product-recommendations.view",
  "workshop.product-recommendations.open",
  "workshop.product-recommendations.use",
  "course.list.view",
  "course.detail.view",
];

const WURSTCLUB_PERMISSIONS = [
  ...REGISTERED_PERMISSIONS,
  "membership.benefits.view",
  // Club-Inhalte in der Rezeptdatenbank (Ralf-Rezepte u. a.).
  "recipe.view.premium",
  "workshop.salt-calculator.view",
  "workshop.salt-calculator.open",
  "workshop.salt-calculator.use",
];

const WURSTCLUB_PRO_PERMISSIONS = [
  ...WURSTCLUB_PERMISSIONS,
  "workshop.brine-calculator.view",
  "workshop.brine-calculator.open",
  "workshop.brine-calculator.use",
  "workshop.marinade-generator.view",
  "workshop.marinade-generator.open",
  "workshop.marinade-generator.use",
];

const MEISTERCLUB_PERMISSIONS = [
  ...WURSTCLUB_PRO_PERMISSIONS,
  "workshop.spice-calculator.view",
  "workshop.spice-calculator.open",
  "workshop.spice-calculator.use",
  "workshop.production-calculator.view",
  "workshop.production-calculator.open",
  "workshop.production-calculator.use",
  "workshop.casing-calculator.view",
  "workshop.casing-calculator.open",
  "workshop.casing-calculator.use",
  "workshop.costing-calculator.view",
  "workshop.costing-calculator.open",
  "workshop.costing-calculator.use",
  "workshop.pdf-export.view",
  "workshop.pdf-export.open",
  "workshop.pdf-export.use",
  "workshop.favorites.view",
  "workshop.favorites.open",
  "recipe.submit",
  "recipe.publish.own",
];

const SUPPORT_PERMISSIONS = [
  "admin.dashboard.view",
  "admin.dashboard.open",
  "admin.tickets.view",
  "admin.tickets.open",
  "admin.tickets.edit",
  "admin.tickets.manage",
  "admin.users.view",
  "admin.users.open",
  "admin.orders.view",
  "admin.orders.open",
  "admin.forums.manage",
  "admin.reviews.manage",
  "admin.email.view",
  "admin.email.use",
];

const ACCOUNTING_PERMISSIONS = [
  "admin.dashboard.view",
  "admin.dashboard.open",
  "admin.accounting.view",
  "admin.accounting.open",
  "admin.accounting.manage",
  "admin.orders.view",
  "admin.orders.open",
  "admin.orders.manage",
  "admin.invoices.view",
  "admin.invoices.open",
  "admin.invoices.manage",
  "admin.memberships.view",
  "admin.memberships.open",
];

const INSTRUCTOR_PERMISSIONS = [
  "admin.dashboard.view",
  "admin.dashboard.open",
  "admin.courses.view",
  "admin.courses.open",
  "admin.courses.manage",
  "admin.lessons.view",
  "admin.lessons.manage",
  "admin.certificates.view",
  "admin.certificates.manage",
  "admin.blog.view",
  "admin.blog.edit",
  "admin.blog.publish",
];

const ADMIN_PERMISSIONS = PERMISSION_CATALOG
  .filter((entry) => !entry.superAdminOnly && entry.key !== "system.superadmin")
  .map((entry) => entry.key);

type GroupSeedDef = {
  name: string;
  slug: string;
  description: string;
  color: string;
  priority: number;
  isSystem: boolean;
  linkedMembershipRole?: MembershipRole | null;
  linkedSystemRole?: UserSystemRole | null;
  permissions: string[];
};

const GROUP_SEEDS: GroupSeedDef[] = [
  {
    name: "Registrierter Benutzer",
    slug: "registered",
    description: "Basisrechte nach Registrierung.",
    color: "#6B7280",
    priority: 10,
    isSystem: true,
    linkedMembershipRole: "registered",
    permissions: REGISTERED_PERMISSIONS,
  },
  {
    name: "Wurstclub",
    slug: "wurstclub",
    description: "Club-Mitgliedschaft Wurstclub.",
    color: "#C9A227",
    priority: 20,
    isSystem: true,
    linkedMembershipRole: "wurstclub",
    permissions: WURSTCLUB_PERMISSIONS,
  },
  {
    name: "Wurstclub Pro",
    slug: "wurstclub-pro",
    description: "Erweiterte Club-Stufe mit Premium-Werkzeugen.",
    color: "#D4AF37",
    priority: 25,
    isSystem: true,
    permissions: WURSTCLUB_PRO_PERMISSIONS,
  },
  {
    name: "Meisterclub",
    slug: "meisterclub",
    description: "Vollständige freigegebene Werkstatt und Rezeptentwicklung.",
    color: "#B8860B",
    priority: 30,
    isSystem: true,
    linkedMembershipRole: "meisterclub",
    permissions: MEISTERCLUB_PERMISSIONS,
  },
  {
    name: "Support",
    slug: "support",
    description: "Support-Mitarbeiter mit Ticket- und Benutzergrunddaten-Zugriff.",
    color: "#3B82F6",
    priority: 200,
    isSystem: true,
    linkedSystemRole: "SUPPORT",
    permissions: SUPPORT_PERMISSIONS,
  },
  {
    name: "Buchhaltung",
    slug: "accounting",
    description: "Buchhaltung mit Bestellungs- und Rechnungszugriff.",
    color: "#10B981",
    priority: 200,
    isSystem: true,
    linkedMembershipRole: "accounting",
    permissions: ACCOUNTING_PERMISSIONS,
  },
  {
    name: "Kursleiter",
    slug: "kursleiter",
    description: "Dozenten mit Kurs- und Blog-Zugriff.",
    color: "#8B5CF6",
    priority: 200,
    isSystem: true,
    linkedSystemRole: "INSTRUCTOR",
    permissions: INSTRUCTOR_PERMISSIONS,
  },
  {
    name: "Administrator",
    slug: "administrator",
    description: "Administratoren mit breitem Plattformzugriff.",
    color: "#EF4444",
    priority: 500,
    isSystem: true,
    linkedSystemRole: "ADMIN",
    permissions: ADMIN_PERMISSIONS,
  },
  {
    name: "Superadministrator",
    slug: "superadministrator",
    description: "Vollzugriff inkl. Rechteverwaltung.",
    color: "#991B1B",
    priority: 1000,
    isSystem: true,
    linkedSystemRole: "SUPERADMIN",
    permissions: PERMISSION_CATALOG.map((entry) => entry.key),
  },
];

export async function seedPermissionCatalog(): Promise<number> {
  let count = 0;

  for (const entry of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: entry.key },
      create: {
        key: entry.key,
        name: entry.name,
        description: entry.description,
        category: entry.category,
        areaKey: entry.areaKey ?? null,
        actionKey: entry.actionKey ?? null,
        isCritical: entry.isCritical ?? false,
        superAdminOnly: entry.superAdminOnly ?? false,
        isSystem: true,
        sortOrder: entry.sortOrder ?? 0,
      },
      update: {
        name: entry.name,
        description: entry.description,
        category: entry.category,
        areaKey: entry.areaKey ?? null,
        actionKey: entry.actionKey ?? null,
        isCritical: entry.isCritical ?? false,
        superAdminOnly: entry.superAdminOnly ?? false,
        sortOrder: entry.sortOrder ?? 0,
      },
    });

    count += 1;
  }

  return count;
}

export async function seedStandardGroups(): Promise<number> {
  let count = 0;

  for (const seed of GROUP_SEEDS) {
    const group = await prisma.userGroup.upsert({
      where: { slug: seed.slug },
      create: {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        color: seed.color,
        priority: seed.priority,
        isSystem: seed.isSystem,
        linkedMembershipRole: seed.linkedMembershipRole ?? null,
        linkedSystemRole: seed.linkedSystemRole ?? null,
      },
      update: {
        name: seed.name,
        description: seed.description,
        color: seed.color,
        priority: seed.priority,
        linkedMembershipRole: seed.linkedMembershipRole ?? null,
        linkedSystemRole: seed.linkedSystemRole ?? null,
      },
    });

    await applyStandardPermissionsToGroup(group.id, seed.permissions);
    count += 1;
  }

  return count;
}

export async function migrateExistingUsersToGroups(): Promise<{
  superAdminsPromoted: number;
  groupAssignments: number;
}> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: { membership: true },
  });

  const groups = await prisma.userGroup.findMany();
  const groupBySlug = new Map(groups.map((group) => [group.slug, group.id]));

  let superAdminsPromoted = 0;
  let groupAssignments = 0;

  for (const user of users) {
    let systemRole = user.systemRole;

    if (systemRole === "ADMIN") {
      const existingSuperAdmin = await prisma.user.count({
        where: { systemRole: "SUPERADMIN", deletedAt: null },
      });

      if (existingSuperAdmin === 0 && superAdminsPromoted === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { systemRole: "SUPERADMIN" },
        });
        systemRole = "SUPERADMIN";
        superAdminsPromoted += 1;
      }
    }

    const slugs: string[] = [];

    if (systemRole === "SUPERADMIN") {
      slugs.push("superadministrator");
    } else if (systemRole === "ADMIN") {
      slugs.push("administrator");
    } else if (systemRole === "SUPPORT") {
      slugs.push("support");
    } else if (systemRole === "INSTRUCTOR") {
      slugs.push("kursleiter");
    }

    const membershipRole = user.membership?.role;

    if (membershipRole === "registered") {
      slugs.push("registered");
    } else if (membershipRole === "wurstclub") {
      slugs.push("registered", "wurstclub");
    } else if (membershipRole === "meisterclub") {
      slugs.push("registered", "wurstclub", "wurstclub-pro", "meisterclub");
    } else if (membershipRole === "accounting") {
      slugs.push("accounting");
    } else if (systemRole === "USER") {
      // Registrierte Nutzer ohne Club-Rolle / ohne Membership → Basisgruppe
      slugs.push("registered");
    }

    for (const slug of slugs) {
      const groupId = groupBySlug.get(slug);

      if (!groupId) {
        continue;
      }

      await prisma.userGroupMember.upsert({
        where: { groupId_userId: { groupId, userId: user.id } },
        create: {
          groupId,
          userId: user.id,
          isManual: false,
        },
        update: {},
      });

      groupAssignments += 1;
    }
  }

  return { superAdminsPromoted, groupAssignments };
}

export async function seedRoutePermissions(): Promise<number> {
  let synced = 0;

  for (const route of ROUTE_PERMISSIONS) {
    const permission = await prisma.permission.findUnique({
      where: { key: route.permissionKey },
    });

    if (!permission) {
      continue;
    }

    await prisma.routePermission.upsert({
      where: { routeKey: route.routeKey },
      create: {
        routeKey: route.routeKey,
        routePattern: route.routePattern,
        permissionId: permission.id,
      },
      update: {
        routePattern: route.routePattern,
        permissionId: permission.id,
      },
    });

    synced += 1;
  }

  return synced;
}

export async function seedPermissionSystem(): Promise<{
  permissions: number;
  groups: number;
  routes: number;
  migration: { superAdminsPromoted: number; groupAssignments: number };
}> {
  const permissions = await seedPermissionCatalog();
  const groups = await seedStandardGroups();
  const routes = await seedRoutePermissions();
  const migration = await migrateExistingUsersToGroups();

  return { permissions, groups, routes, migration };
}

export async function syncMembershipGroupForUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  if (!user) {
    return;
  }

  const membershipGroups = await prisma.userGroup.findMany({
    where: { linkedMembershipRole: { not: null } },
  });

  const membershipRole = user.membership?.role ?? null;
  const accessBlocked = user.membership?.accessBlocked === true;
  const paidActive =
    user.membership?.status === "active" &&
    !accessBlocked &&
    (!user.membership.endsAt || user.membership.endsAt.getTime() > Date.now());

  /** Welche membership-verknüpften Gruppen der Nutzer haben soll. */
  const desiredRoles = new Set<MembershipRole>();

  if (!accessBlocked) {
    if (membershipRole === "registered") {
      // Basis-Registrierung: status ist typischerweise "none", kein Paid-Status nötig.
      desiredRoles.add("registered");
    } else if (membershipRole === "wurstclub") {
      desiredRoles.add("registered");
      if (paidActive) {
        desiredRoles.add("wurstclub");
      }
    } else if (membershipRole === "meisterclub") {
      desiredRoles.add("registered");
      if (paidActive) {
        desiredRoles.add("wurstclub");
        desiredRoles.add("meisterclub");
      }
    } else if (membershipRole === "accounting") {
      desiredRoles.add("accounting");
    } else if (user.systemRole === "USER") {
      // Fallback: normale Nutzer ohne Membership-Eintrag bekommen Basisrechte.
      desiredRoles.add("registered");
    }
  }

  for (const group of membershipGroups) {
    const linkedRole = group.linkedMembershipRole;
    if (!linkedRole) {
      continue;
    }

    const shouldHave = desiredRoles.has(linkedRole);

    if (shouldHave) {
      await prisma.userGroupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId } },
        create: { groupId: group.id, userId, isManual: false },
        update: {},
      });
    } else {
      await prisma.userGroupMember.deleteMany({
        where: {
          groupId: group.id,
          userId,
          isManual: false,
        },
      });
    }
  }

  // Meisterclub erbt zusätzlich die manuelle Pro-Gruppe (wie beim Seed-Migrate).
  const proGroup = await prisma.userGroup.findUnique({
    where: { slug: "wurstclub-pro" },
    select: { id: true },
  });

  if (proGroup) {
    const shouldHavePro =
      !accessBlocked && membershipRole === "meisterclub" && paidActive;

    if (shouldHavePro) {
      await prisma.userGroupMember.upsert({
        where: { groupId_userId: { groupId: proGroup.id, userId } },
        create: { groupId: proGroup.id, userId, isManual: false },
        update: {},
      });
    } else {
      await prisma.userGroupMember.deleteMany({
        where: {
          groupId: proGroup.id,
          userId,
          isManual: false,
        },
      });
    }
  }
}
