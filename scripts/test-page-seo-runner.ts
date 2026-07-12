/**
 * @file test-page-seo-runner.ts
 */

import { isPageSeoExcludedPath } from "../lib/page-seo/page-seo-exclusions";
import { computePageContentHash } from "../lib/page-seo/page-seo-hash";
import { buildFallbackPageSeo } from "../lib/page-seo/page-seo-ai-service";
import { getStaticPageContent } from "../lib/page-seo/page-seo-static-registry";
import { isValidPageJsonLd } from "../lib/page-seo/page-seo-jsonld";
import { buildStaticPageMetadata } from "../lib/page-seo/page-seo-static-metadata";
import {
  discoverPublicPages,
} from "../lib/page-seo/page-seo-discovery";
import {
  getPageSeoSettings,
  queueMissingPageSeo,
  scanPublicPages,
} from "../lib/page-seo/page-seo-service";
import { processPageSeoQueue } from "../lib/page-seo/page-seo-queue-service";

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

async function runTests() {
  console.log("Unit-Tests\n");

  if (isPageSeoExcludedPath("/admin/seo")) ok("Admin ausgeschlossen");
  else fail("Admin");

  if (isPageSeoExcludedPath("/mein-bereich/kurse")) ok("Mitgliederbereich ausgeschlossen");
  else fail("Mitgliederbereich");

  if (isPageSeoExcludedPath("/magazin/test-artikel")) ok("Blog-Artikel ausgeschlossen");
  else fail("Blog-Artikel");

  if (!isPageSeoExcludedPath("/akademie")) ok("Akademie eingeschlossen");
  else fail("Akademie");

  const staticContent = getStaticPageContent("/impressum");

  if (staticContent?.isLegalPage) ok("Rechtliche Seite markiert");
  else fail("Rechtliche Seite");

  const hash1 = computePageContentHash(staticContent!);
  const hash2 = computePageContentHash(staticContent!);

  if (hash1 === hash2) ok("Content-Hash stabil");
  else fail("Content-Hash");

  const fallback = buildFallbackPageSeo(staticContent!);

  if (fallback.metaTitle.length <= 60) ok("Meta-Title Länge");
  else fail("Meta-Title Länge", `${fallback.metaTitle.length}`);

  if (fallback.metaDescription.length <= 160) ok("Meta-Description Länge");
  else fail("Meta-Description Länge", `${fallback.metaDescription.length}`);

  if (isValidPageJsonLd(fallback.jsonLd)) ok("JSON-LD valide");
  else fail("JSON-LD");

  const metadata = await buildStaticPageMetadata("/impressum", {
    title: "Impressum",
    description: "Fallback",
  });

  if (metadata.title || metadata.description) ok("Metadata-Fallback");
  else fail("Metadata-Fallback");

  const settings = await getPageSeoSettings();

  if (typeof settings.maxApiCallsPerDay === "number") ok("Settings laden");
  else fail("Settings");

  const discovered = await discoverPublicPages(true);

  if (discovered.length > 5) ok(`Seiten erkannt (${discovered.length})`);
  else fail("Seiten erkannt", String(discovered.length));

  const scan = await scanPublicPages();

  if (scan.discovered >= discovered.length) ok("Scan");
  else fail("Scan");

  const queued = await queueMissingPageSeo();

  if (queued >= 0) ok(`Queue (${queued})`);
  else fail("Queue");

  const processed = await processPageSeoQueue(2);

  if (processed.processed >= 0) ok("Queue-Verarbeitung");
  else fail("Queue-Verarbeitung");
}

async function main() {
  console.log("Page-SEO Tests\n");
  await runTests();
  console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);

  if (failed > 0) {
    process.exit(1);
  }
}

void main();
