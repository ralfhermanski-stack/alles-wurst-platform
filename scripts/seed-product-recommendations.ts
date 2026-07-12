/**
 * Seed für Produktempfehlungen (Kategorien + Partnerprogramme).
 * Usage: npx tsx scripts/seed-product-recommendations.ts
 */

import { seedProductRecommendationSystem } from "../lib/product-recommendations/product-recommendation-admin-service";

async function main() {
  const result = await seedProductRecommendationSystem();
  console.log("Produktempfehlungen initialisiert:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
