/**
 * Tests für öffentliche Community-Bewertungen auf der Startseite.
 * Usage: node scripts/test-public-reviews.cjs
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

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

function readProjectFile(relativePath) {
  return readFileSync(join(__dirname, "..", relativePath), "utf8");
}

async function main() {
  console.log("Öffentliche Community-Bewertungen — Tests\n");

  const schema = readProjectFile("prisma/schema.prisma");

  assert(schema.includes("model PlatformReview"), "PlatformReview-Modell vorhanden");
  assert(
    schema.includes("model HomepageCommunityReviewsSettings"),
    "HomepageCommunityReviewsSettings vorhanden",
  );
  assert(
    schema.includes("featuredOnHomepage"),
    "CourseReview featuredOnHomepage vorhanden",
  );

  assert(
    readProjectFile("lib/reviews/public-review-service.ts").includes(
      "getPublicHomepageReviews",
    ),
    "public-review-service vorhanden",
  );

  assert(
    readProjectFile("lib/reviews/platform-review-service.ts").includes(
      "submitPlatformReview",
    ),
    "platform-review-service vorhanden",
  );

  assert(
    readProjectFile("components/marketing/HomepageReviewsCarousel.tsx").includes(
      "prefers-reduced-motion",
    ),
    "Karussell unterstützt prefers-reduced-motion",
  );

  assert(
    readProjectFile("components/marketing/HomepageReviewsCarousel.tsx").includes(
      "aria-label",
    ),
    "Karussell hat ARIA-Labels",
  );

  assert(
    !readProjectFile("app/(marketing)/page.tsx").includes("TestimonialCard"),
    "Startseite nutzt keine TestimonialCard mehr",
  );

  assert(
    !readProjectFile("lib/placeholder-data.ts").includes("Heiko W."),
    "Demo-Testimonials aus placeholder-data entfernt",
  );

  assert(
    readProjectFile("lib/platform-text/platform-text-defaults.ts").includes(
      "homepage.reviews.subtitle",
    ),
    "Textschlüssel homepage.reviews.subtitle vorhanden",
  );

  assert(
    readProjectFile("lib/reviews/member-count-service.ts").includes(
      "REGISTERED_PUBLIC_MEMBER_WHERE",
    ),
    "Mitgliederzählung nutzt zentrale Registrierungs-Filter",
  );

  assert(
    readProjectFile("lib/reviews/platform-review-sanitize.ts").includes(
      "replace(/<[^>]*>/g",
    ),
    "XSS-Schutz durch HTML-Entfernung",
  );

  assert(
    readProjectFile("app/api/users/me/platform-review/route.ts").includes(
      "getSessionUserIdFromRequest",
    ),
    "Plattformbewertung erfordert Authentifizierung",
  );

  assert(
    readProjectFile("components/member/PlatformReviewPanel.tsx").includes(
      "publicConsent",
    ),
    "Profil-UI mit Veröffentlichungszustimmung",
  );

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
