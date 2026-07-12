const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();

  try {
    const post = await prisma.blogPost.findFirst({
      select: { id: true, title: true },
    });

    if (!post) {
      console.log("Kein Blogartikel zum Testen vorhanden.");
      return;
    }

    const result = await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        seoAnalysisDraft: {
          seoTitle: "Test",
          metaDescription: "Testbeschreibung mit ausreichend Zeichen für die Validierung der SEO-Analyse in der Datenbank und dem Prisma-Client.",
          focusKeyword: "test",
          source: "fallback",
          analyzedAt: new Date().toISOString(),
        },
        seoScore: 50,
        readabilityScore: 80,
        lastSeoAnalysisAt: new Date(),
      },
      select: { id: true, seoScore: true },
    });

    console.log("Update erfolgreich:", result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Update fehlgeschlagen:", error.message);
  process.exit(1);
});
