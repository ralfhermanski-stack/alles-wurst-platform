/**
 * Entfernt ungültige Werte (z. B. URLs) aus Blog-ID-JSON-Feldern.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function filterValidUuidStrings(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => UUID_RE.test(value));
}

async function main() {
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      title: true,
      relatedPostIds: true,
      linkedCourseIds: true,
      linkedRecipeIds: true,
    },
  });

  let updated = 0;

  for (const post of posts) {
    const relatedPostIds = filterValidUuidStrings(post.relatedPostIds);
    const linkedCourseIds = filterValidUuidStrings(post.linkedCourseIds);
    const linkedRecipeIds = filterValidUuidStrings(post.linkedRecipeIds);

    const changed =
      JSON.stringify(relatedPostIds) !== JSON.stringify(post.relatedPostIds ?? [])
      || JSON.stringify(linkedCourseIds) !== JSON.stringify(post.linkedCourseIds ?? [])
      || JSON.stringify(linkedRecipeIds) !== JSON.stringify(post.linkedRecipeIds ?? []);

    if (!changed) {
      continue;
    }

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { relatedPostIds, linkedCourseIds, linkedRecipeIds },
    });

    console.log("fixed", post.id, post.title);
    updated += 1;
  }

  console.log(`Done. Updated ${updated} post(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
