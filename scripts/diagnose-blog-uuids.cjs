/**
 * Diagnose invalid UUID values in blog-related tables.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

async function main() {
  const jsonRows = await prisma.$queryRaw`
    SELECT id, title, related_post_ids::text AS related_post_ids,
           linked_course_ids::text AS linked_course_ids,
           linked_recipe_ids::text AS linked_recipe_ids
    FROM blog_posts
  `;

  console.log("=== JSON ID arrays ===");
  for (const row of jsonRows) {
    for (const [field, raw] of [
      ["related_post_ids", row.related_post_ids],
      ["linked_course_ids", row.linked_course_ids],
      ["linked_recipe_ids", row.linked_recipe_ids],
    ]) {
      if (!raw || raw === "[]") continue;

      let values = [];
      try {
        values = JSON.parse(raw);
      } catch {
        console.log(row.id, field, "INVALID JSON", String(raw).slice(0, 100));
        continue;
      }

      for (const value of values) {
        if (!isUuid(String(value))) {
          console.log(row.id, row.title, field, "BAD VALUE:", String(value).slice(0, 80));
        }
      }
    }
  }

  console.log("\n=== simulate related lookup ===");
  for (const row of jsonRows) {
    let relatedIds = [];
    try {
      relatedIds = JSON.parse(row.related_post_ids || "[]");
    } catch {
      relatedIds = [];
    }

    if (relatedIds.length === 0) continue;

    try {
      await prisma.blogPost.findMany({
        where: { id: { in: relatedIds } },
        select: { id: true },
      });
      console.log("OK", row.id);
    } catch (error) {
      console.log("FAIL", row.id, row.title, error.message);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
