/**
 * Organisiert bestehende Foren in Ober-/Unterforen (phpBB-Stil).
 * Idempotent: kann mehrfach laufen, ändert keine Kind-Slugs.
 *
 * Usage: node scripts/organize-forum-hierarchy.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** @typedef {{
 *   title: string;
 *   slug: string;
 *   description: string;
 *   sortOrder: number;
 *   forumType: 'general' | 'mini_course_global' | 'membership';
 *   readAccess: 'registered' | 'mini_course_access' | 'membership';
 *   requiredMembershipRole: 'wurstclub' | 'meisterclub' | null;
 *   childSlugs: string[];
 * }} CategorySpec */

/** @type {CategorySpec[]} */
const CATEGORIES = [
  {
    title: "Allgemein / Community",
    slug: "allgemein-community",
    description:
      "Vorstellung, Stammtisch und Projekte — der offene Treffpunkt der Community.",
    sortOrder: 10,
    forumType: "general",
    readAccess: "registered",
    requiredMembershipRole: null,
    childSlugs: [
      "vorstellungsrunde",
      "dies-das-der-stammtisch",
      "zeig-uns-dein-projekt",
    ],
  },
  {
    title: "Minikurse",
    slug: "minikurse",
    description: "Gemeinsame Foren für alle Minikurs-Teilnehmer.",
    sortOrder: 20,
    forumType: "mini_course_global",
    readAccess: "mini_course_access",
    requiredMembershipRole: null,
    childSlugs: [
      "minikurse-vorstellungsforum",
      "minikurse-fragen-und-antworten",
      "minikurse-verbesserungen",
    ],
  },
  {
    title: "Wurstclub",
    slug: "wurstclub",
    description: "Exklusive Foren für aktive Wurstclub-Mitglieder.",
    sortOrder: 30,
    forumType: "membership",
    readAccess: "membership",
    requiredMembershipRole: "wurstclub",
    childSlugs: [
      "rezept-des-monats",
      "monats-meeting-fragen",
      "wurst-club-stammtisch",
    ],
  },
  {
    title: "Meisterclub",
    slug: "meisterclub",
    description: "Exklusive Foren für aktive Meisterclub-Mitglieder.",
    sortOrder: 40,
    forumType: "membership",
    readAccess: "membership",
    requiredMembershipRole: "meisterclub",
    childSlugs: [
      "meisterclub-intern",
      "rezeptentwicklung-produktinnovation",
      "fehleranalyse-problemloesungen",
      "meisterwerkstatt-expertenrunde",
    ],
  },
];

async function ensureCategory(spec) {
  const existing = await prisma.forum.findUnique({
    where: { slug: spec.slug },
  });

  const data = {
    title: spec.title,
    description: spec.description,
    forumType: spec.forumType,
    forumPurpose: "custom",
    readAccess: spec.readAccess,
    writeEnabled: false,
    requiredMembershipRole: spec.requiredMembershipRole,
    parentForumId: null,
    isActive: true,
    sortOrder: spec.sortOrder,
    courseId: null,
  };

  if (existing) {
    const updated = await prisma.forum.update({
      where: { id: existing.id },
      data,
    });
    console.log(`  OK Oberforum aktualisiert: ${updated.slug} (${updated.id})`);
    return updated;
  }

  const created = await prisma.forum.create({
    data: {
      ...data,
      slug: spec.slug,
    },
  });
  console.log(`  OK Oberforum angelegt: ${created.slug} (${created.id})`);
  return created;
}

async function attachChildren(parent, childSlugs) {
  const children = await prisma.forum.findMany({
    where: { slug: { in: childSlugs } },
    select: { id: true, slug: true, title: true, parentForumId: true },
  });

  const bySlug = new Map(children.map((child) => [child.slug, child]));

  for (let index = 0; index < childSlugs.length; index += 1) {
    const slug = childSlugs[index];
    const child = bySlug.get(slug);

    if (!child) {
      console.warn(`  WARN Kind-Forum fehlt: ${slug}`);
      continue;
    }

    if (child.id === parent.id) {
      console.warn(`  WARN übersprungen (Selbstbezug): ${slug}`);
      continue;
    }

    const updated = await prisma.forum.update({
      where: { id: child.id },
      data: {
        parentForumId: parent.id,
        sortOrder: (index + 1) * 10,
      },
    });

    console.log(
      `  OK Unterforum: ${updated.slug} → ${parent.slug} (sort ${updated.sortOrder})`,
    );
  }
}

async function main() {
  console.log("Forum-Hierarchie organisieren…\n");

  for (const spec of CATEGORIES) {
    console.log(`• ${spec.title}`);
    const parent = await ensureCategory(spec);
    await attachChildren(parent, spec.childSlugs);
    console.log("");
  }

  const tree = await prisma.forum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      title: true,
      slug: true,
      parentForumId: true,
      sortOrder: true,
      writeEnabled: true,
    },
  });

  const byId = new Map(tree.map((forum) => [forum.id, forum]));
  console.log("Aktuelle Struktur:");
  for (const forum of tree) {
    if (forum.parentForumId) {
      continue;
    }
    console.log(`- ${forum.title} [${forum.slug}]`);
    for (const child of tree.filter((item) => item.parentForumId === forum.id)) {
      console.log(`  └─ ${child.title} [${child.slug}]`);
    }
  }

  const orphans = tree.filter(
    (forum) =>
      forum.parentForumId && !byId.has(forum.parentForumId),
  );
  if (orphans.length > 0) {
    console.warn("\nWARN verwaiste parentForumId:", orphans.map((o) => o.slug));
  }

  console.log("\nFertig.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
