/**
 * Erweiterte Tests für Social Media & Community Challenges (Diagnose/Setup).
 * Usage: node scripts/test-social-challenges.cjs
 */

const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log("  OK:", message);
    passed += 1;
  } else {
    console.error("  FAIL:", message);
    failed += 1;
  }
}

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function exists(rel) {
  return existsSync(join(root, rel));
}

async function main() {
  console.log("Social Media & Challenges — Tests\n");

  const schema = read("prisma/schema.prisma");
  assert(schema.includes("model SocialMediaChannel"), "SocialMediaChannel-Modell");
  assert(schema.includes("model CommunityChallenge"), "CommunityChallenge-Modell");
  assert(schema.includes("model ChallengeSubmission"), "ChallengeSubmission-Modell");
  assert(schema.includes("isTestData"), "isTestData-Felder im Schema");

  assert(
    !read("app/(marketing)/page.tsx").includes("socialPlatforms"),
    "Startseite ohne statische socialPlatforms",
  );
  assert(
    !read("app/(marketing)/page.tsx").includes("monthlyChallenge"),
    "Startseite ohne statische monthlyChallenge",
  );
  assert(
    read("components/marketing/HomepageCommunitySocialSection.tsx").includes(
      "getHomepageSocialCards",
    ),
    "Dynamische Social-Sektion",
  );

  assert(exists("lib/social-media/social-credential-crypto.ts"), "Credential-Verschlüsselung");
  assert(
    read("lib/social-media/social-credential-crypto.ts").includes("encryptSocialCredential"),
    "AES-Verschlüsselung vorhanden",
  );
  assert(exists("lib/social-media/providers/youtube-provider.ts"), "YouTube-Provider");
  assert(exists("lib/social-media/social-media-env-check.ts"), "Env-Prüfung");
  assert(exists("lib/social-media/social-media-setup-service.ts"), "Setup-Service");
  assert(exists("lib/social-media/social-media-cron-auth.ts"), "Cron-Auth mit timing-safe");
  assert(
    read("lib/social-media/social-media-cron-auth.ts").includes("timingSafeEqual"),
    "Timing-safe Secret-Vergleich",
  );
  assert(exists("lib/social-media/social-media-youtube-test.ts"), "YouTube-Verbindungstest");
  assert(exists("lib/challenges/challenge-test-data-service.ts"), "Testdaten-Service");

  const cronRoute = read("app/api/cron/social-media/route.ts");
  assert(cronRoute.includes("authorizeSocialMediaCron"), "Cron nutzt zentrale Auth");
  assert(!cronRoute.includes("console.error"), "Cron ohne interne Fehlerdetails in Logs");

  assert(exists("app/api/admin/social-media/setup/route.ts"), "Setup-API");
  assert(exists("app/api/admin/social-media/cron/simulate/route.ts"), "Cron-Simulations-API");
  assert(exists("app/(admin)/admin/marketing/social-media/einrichtung/page.tsx"), "Einrichtungsseite");
  assert(exists("app/(admin)/admin/marketing/social-media/cronjob/page.tsx"), "Cronjob-Seite");
  assert(exists("app/(admin)/admin/system/testdaten/page.tsx"), "Testdaten-Seite");

  const adminNav = read("lib/admin/admin-nav.ts");
  assert(adminNav.includes("Einrichtung"), "Admin-Navigation Einrichtung");
  assert(adminNav.includes("Cronjob"), "Admin-Navigation Cronjob");
  assert(adminNav.includes("Testdaten"), "Admin-Navigation Testdaten");

  const defaults = read("lib/platform-text/platform-text-defaults.ts");
  assert(defaults.includes('"homepage.social.title"'), "Textschlüssel homepage.social.title");
  assert(defaults.includes('"admin.social.setup.title"'), "Textschlüssel admin.social.setup.title");
  assert(defaults.includes('"admin.challenge.testCreate"'), "Textschlüssel admin.challenge.testCreate");

  assert(
    read("components/cards/SocialPlatformCard.tsx").includes('rel="noopener noreferrer"'),
    "Sichere externe Links",
  );
  assert(
    !read("components/cards/SocialPlatformCard.tsx").includes("+1.200"),
    "Keine erfundenen Follower-Zahlen",
  );

  assert(
    read("lib/social-media/social-media-homepage-service.ts").includes("isTestData: false"),
    "Startseite filtert Testdaten",
  );

  const urlValidation = read("lib/social-media/social-media-url-validation.ts");
  assert(urlValidation.includes("validateSocialProfileUrl"), "URL-Validierung für Kanäle");

  const testDataService = read("lib/challenges/challenge-test-data-service.ts");
  assert(
    testDataService.includes("isNonProductionEnvironment"),
    "Testdaten nur außerhalb Produktion",
  );

  assert(exists("docs/SOCIAL_MEDIA_CHALLENGE_PRAXISTEST.md"), "Praxistest-Dokumentation");

  try {
    await prisma.socialMediaChannel.findMany({ take: 1 });
    await prisma.communityChallenge.findMany({ take: 1 });
    assert(true, "DB-Tabellen abfragbar");
  } catch (error) {
    assert(false, `DB: ${error.message}`);
  }

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
