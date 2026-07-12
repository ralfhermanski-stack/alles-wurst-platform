/**
 * Unit- und API-Tests für Blog-SEO/KI.
 * Ausführung: node scripts/test-blog-seo-ai.cjs
 */

import {
  analyzeBlogSeoContent,
  isValidSchemaJson,
  validateBlogSeoAnalysis,
} from "../lib/blog/blog-seo-ai-service";
import { buildBlogMetadata, buildBlogPostingJsonLd } from "../lib/blog/blog-seo";
import {
  clampMetaDescription,
  truncateSeoTitle,
} from "../lib/blog/blog-seo-text-utils";
import type { BlogPostDetail } from "../lib/blog/blog-types";

let passed = 0;
let failed = 0;

function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

const sampleInput = {
  postId: "test-post",
  title: "Die Wurstvielfalt in Deutschland",
  slug: "die-wurstvielfalt-in-deutschland",
  excerpt: "Ein Überblick über regionale Wurstspezialitäten.",
  summary: null,
  body: "## Bratwurst\n\nDie Bratwurst ist eine beliebte Wurstsorte in Deutschland.\n\n## Leberwurst\n\nLeberwurst wird oft aufs Brot gestrichen.",
  coverAltText: null,
  coverUrl: null,
  categoryId: null,
  categoryName: "Wissen",
  categorySlug: "wissen",
  authorDisplayName: "Ralf Hermanski",
  authorUserId: "author-1",
  publishedAt: null,
  contentUpdatedAt: null,
  updatedAt: new Date().toISOString(),
  readingTimeMinutes: 3,
  tagNames: [],
  headings: ["Bratwurst", "Leberwurst"],
  plainText:
    "Die Bratwurst ist eine beliebte Wurstsorte in Deutschland. Leberwurst wird oft aufs Brot gestrichen.",
};

async function runServiceTests() {
  console.log("Service-Tests (Fallback ohne OPENAI_API_KEY)\n");

  delete process.env.OPENAI_API_KEY;

  const result = await analyzeBlogSeoContent(sampleInput, []);

  if (result.source === "fallback") {
    ok("Fallback-Analyse ohne API-Key");
  } else {
    fail("Fallback-Analyse ohne API-Key", `Quelle: ${result.source}`);
  }

  if (result.seoTitle.length <= 60) {
    ok("SEO-Titel max. 60 Zeichen");
  } else {
    fail("SEO-Titel max. 60 Zeichen", `${result.seoTitle.length} Zeichen`);
  }

  if (result.metaDescription.length >= 140 && result.metaDescription.length <= 165) {
    ok("Meta Description in sinnvoller Länge");
  } else if (result.metaDescription.length >= 80) {
    ok("Meta Description vorhanden (kurzer Artikel)");
  } else {
    fail("Meta Description Länge", `${result.metaDescription.length} Zeichen`);
  }

  if (isValidSchemaJson(result.schemaJson)) {
    ok("Schema.org JSON ist serialisierbar");
  } else {
    fail("Schema.org JSON ist serialisierbar");
  }

  const graph = result.schemaJson["@graph"];

  if (Array.isArray(graph) && graph.length >= 2) {
    ok("Schema enthält @graph mit Einträgen");
  } else {
    fail("Schema @graph");
  }

  const truncated = truncateSeoTitle("Ein sehr langer SEO-Titel der definitiv zu lang für Google ist");
  if (truncated.length <= 60) {
    ok("truncateSeoTitle");
  } else {
    fail("truncateSeoTitle");
  }

  const meta = clampMetaDescription("Kurz.");
  if (meta.length >= 3) {
    ok("clampMetaDescription");
  } else {
    fail("clampMetaDescription");
  }

  const invalid = validateBlogSeoAnalysis({ seoTitle: "", metaDescription: "x", focusKeyword: "y" });
  if (invalid === null) {
    ok("validateBlogSeoAnalysis lehnt ungültige Daten ab");
  } else {
    fail("validateBlogSeoAnalysis");
  }
}

function runMetadataTests() {
  console.log("\nÖffentliche Meta-Ausgabe\n");

  const post = {
    slug: "die-wurstvielfalt-in-deutschland",
    title: "Die Wurstvielfalt in Deutschland",
    seoTitle: "Wurstvielfalt in Deutschland – Überblick",
    metaDescription: "Regionaler Überblick über Wurstspezialitäten in Deutschland – von Bratwurst bis Leberwurst, kompakt erklärt für Einsteiger und Genießer.",
    excerpt: null,
    summary: null,
    canonicalUrl: null,
    coverUrl: "/api/blog/images/test",
    coverAltText: "Wurstvielfalt",
    authorDisplayName: "Ralf Hermanski",
    publishedAt: "2026-01-01T00:00:00.000Z",
    contentUpdatedAt: null,
    updatedAt: "2026-01-02T00:00:00.000Z",
    categoryName: "Wissen",
    categorySlug: "wissen",
    tagNames: ["Wurst"],
    robotsIndex: true,
    robotsFollow: true,
    ogTitle: "OG: Wurstvielfalt",
    ogDescription: "OG-Beschreibung zur Wurstvielfalt.",
    twitterTitle: "Twitter: Wurstvielfalt",
    twitterDescription: "Twitter-Beschreibung zur Wurstvielfalt.",
    body: sampleInput.body,
    focusKeyword: "Wurstvielfalt",
    authorUserId: "author-1",
    readingTimeMinutes: 3,
    faqItems: [{ question: "Was ist Bratwurst?", answer: "Eine beliebte Wurstsorte." }],
    schemaJson: null,
  } as BlogPostDetail;

  const metadata = buildBlogMetadata(post);

  if (metadata.openGraph.title === "OG: Wurstvielfalt") {
    ok("OpenGraph-Titel aus ogTitle");
  } else {
    fail("OpenGraph-Titel", String(metadata.openGraph.title));
  }

  if (metadata.twitter.title === "Twitter: Wurstvielfalt") {
    ok("Twitter-Titel aus twitterTitle");
  } else {
    fail("Twitter-Titel");
  }

  if (metadata.robots.index === true && metadata.robots.follow === true) {
    ok("Robots index/follow");
  } else {
    fail("Robots");
  }

  const jsonLd = buildBlogPostingJsonLd(post);
  const jsonString = JSON.stringify(jsonLd);

  if (jsonString.includes("FAQPage") || jsonString.includes("Question")) {
    ok("JSON-LD enthält FAQ");
  } else {
    fail("JSON-LD FAQ");
  }

  if (jsonString.includes("BreadcrumbList")) {
    ok("JSON-LD enthält BreadcrumbList");
  } else {
    fail("JSON-LD BreadcrumbList");
  }
}

async function runApiTests() {
  console.log("\nAPI-Tests (optional, Server muss laufen)\n");

  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const email = process.env.TEST_ADMIN_EMAIL ?? "ralf.hermanski@alles-wurst.de";
  const password = process.env.TEST_ADMIN_PASSWORD ?? "Admin123!";

  try {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const cookie = loginRes.headers.get("set-cookie")?.match(/aw_session=[^;]+/)?.[0];

    if (!loginRes.ok || !cookie) {
      console.log("  ⚠ API-Tests übersprungen (Server nicht erreichbar oder Login fehlgeschlagen)");
      return;
    }

    const postsRes = await fetch(`${base}/api/admin/blog/posts`, {
      headers: { Cookie: cookie },
    });
    const postsJson = await postsRes.json();
    const postId = postsJson.data?.[0]?.id;

    if (!postId) {
      fail("API-Tests übersprungen (kein Blogartikel)");
      return;
    }

    const analyzeRes = await fetch(`${base}/api/admin/blog/posts/${postId}/seo-analyze`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const analyzeJson = await analyzeRes.json();

    if (analyzeRes.ok && analyzeJson.success && analyzeJson.data.seoTitle) {
      ok("POST seo-analyze");
    } else {
      fail("POST seo-analyze", analyzeJson.error?.message);
    }

    const schemaRes = await fetch(`${base}/api/admin/blog/posts/${postId}/schema-validate`, {
      headers: { Cookie: cookie },
    });
    const schemaJson = await schemaRes.json();

    if (schemaRes.ok && schemaJson.success) {
      ok("GET schema-validate");
    } else {
      fail("GET schema-validate", schemaJson.error?.message);
    }
  } catch (error) {
    fail("API-Tests", error instanceof Error ? error.message : "Netzwerkfehler");
  }
}

async function main() {
  console.log("Blog SEO/KI Tests\n");

  await runServiceTests();
  runMetadataTests();
  await runApiTests();

  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);

  if (failed > 0) {
    process.exit(1);
  }
}

void main();
