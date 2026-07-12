/**
 * @file sync-membership-prices-runner.ts
 */

import "dotenv/config";

import { prisma } from "../lib/db/prisma";
import {
  calculateGermanGrossBreakdown,
  MEMBERSHIP_PRICE_CATALOG,
} from "../lib/membership/membership-price-catalog";

async function main() {
  let updated = 0;

  for (const entry of MEMBERSHIP_PRICE_CATALOG) {
    const product = await prisma.product.findUnique({
      where: { slug: entry.productSlug },
      include: {
        prices: {
          where: { billingPeriod: entry.billingPeriod },
        },
      },
    });

    if (!product) {
      console.warn(`Produkt fehlt: ${entry.productSlug}`);
      continue;
    }

    const price = product.prices[0];

    if (!price) {
      console.warn(`Preis fehlt: ${entry.productSlug} / ${entry.billingPeriod}`);
      continue;
    }

    const breakdown = calculateGermanGrossBreakdown(entry.grossAmount);

    await prisma.productPrice.update({
      where: { id: price.id },
      data: {
        grossAmount: entry.grossAmount,
        netAmount: breakdown.netAmount,
        taxRate: breakdown.taxRate,
        taxAmount: breakdown.taxAmount,
      },
    });

    updated += 1;
    console.log(
      `✓ ${entry.productSlug} ${entry.billingPeriod}: ${entry.grossAmount.toFixed(2)} EUR`,
    );
  }

  console.log(`\nAktualisiert: ${updated} Preise`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
