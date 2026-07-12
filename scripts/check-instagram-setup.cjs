const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function validateInstagramUrl(url) {
  if (!url?.trim()) {
    return { valid: false, message: "Profil-URL fehlt" };
  }

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    const ok =
      (host === "instagram.com" || host === "www.instagram.com") &&
      (parsed.protocol === "https:" || parsed.protocol === "http:");

    return ok
      ? { valid: true }
      : { valid: false, message: "URL muss eine gültige instagram.com-Adresse sein" };
  } catch {
    return { valid: false, message: "Ungültige URL" };
  }
}

async function main() {
  const channels = await prisma.socialMediaChannel.findMany({
    where: { platform: "INSTAGRAM", isTestData: false },
    include: {
      posts: {
        where: { active: true, isTestData: false },
        orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
        take: 5,
      },
      _count: { select: { posts: true } },
    },
    orderBy: { displayOrder: "asc" },
  });

  if (channels.length === 0) {
    console.log("KEIN_INSTAGRAM_KANAL");
    return;
  }

  for (const channel of channels) {
    const urlCheck = validateInstagramUrl(channel.profileUrl);

    const checks = [
      { label: "Kanalname gesetzt", ok: Boolean(channel.name?.trim()) },
      { label: "Profil-URL gültig", ok: urlCheck.valid, detail: urlCheck.message },
      {
        label: "Öffentlicher Name",
        ok: Boolean(channel.publicName?.trim() || channel.name?.trim()),
      },
      {
        label: "Manueller Modus",
        ok: channel.integrationMode === "MANUAL",
        detail: channel.integrationMode,
      },
      { label: "Kanal aktiv", ok: channel.active },
      { label: "Auf Startseite", ok: channel.showOnHomepage },
    ];

    console.log(
      JSON.stringify(
        {
          name: channel.name,
          publicName: channel.publicName,
          handle: channel.handle,
          profileUrl: channel.profileUrl,
          description: channel.description?.slice(0, 80) ?? null,
          integrationMode: channel.integrationMode,
          active: channel.active,
          showOnHomepage: channel.showOnHomepage,
          displayOrder: channel.displayOrder,
          coverImage: channel.coverImageUrl ? "gesetzt" : "fehlt (Fallback möglich)",
          ctaLabel: channel.ctaLabel,
          ctaUrl: channel.ctaUrl,
          manualPosts: channel._count.posts,
          samplePosts: channel.posts.map((p) => p.title || p.permalink),
          checks,
          startseiteBereit:
            channel.active &&
            channel.showOnHomepage &&
            urlCheck.valid &&
            Boolean(channel.name?.trim()),
        },
        null,
        2,
      ),
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
