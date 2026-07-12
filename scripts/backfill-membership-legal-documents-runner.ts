/**
 * @file backfill-membership-legal-documents-runner.ts
 * @purpose Fehlende Vertragsunterlagen für bezahlte Mitgliedschafts-Bestellungen erzeugen.
 *
 * Aufruf: npx tsx scripts/backfill-membership-legal-documents-runner.ts
 */

import { generateOrderLegalDocuments } from "@/lib/account/order-legal-document-service";
import { createPurchaseLegalRecord } from "@/lib/legal/legal-checkout-service";
import { prisma } from "@/lib/db/prisma";

async function main(): Promise<void> {
  const positions = await prisma.accountingPosition.findMany({
    where: {
      productType: "membership",
      paymentStatus: "paid",
      checkoutIntent: { isNot: null },
    },
    include: {
      checkoutIntent: {
        include: {
          purchaseLegalRecord: true,
          productPrice: { include: { product: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let processed = 0;

  for (const position of positions) {
    const checkout = position.checkoutIntent;
    if (!checkout) {
      continue;
    }

    if (!checkout.purchaseLegalRecord) {
      await createPurchaseLegalRecord({
        checkoutIntentId: checkout.id,
        userId: position.userId,
        accountingPositionId: position.id,
        productKind: checkout.productPrice.product.kind,
        productName: checkout.productPrice.product.name,
        productSlug: checkout.productPrice.product.slug,
        billingPeriod: checkout.productPrice.billingPeriod,
        legalConfig: checkout.productPrice.product.legalConfig,
        accessMode: "IMMEDIATE",
        pendingAccessUntil: null,
        immediateAccessConsented: false,
        withdrawalLossAcknowledged: false,
      });
      console.log(`Legal record erstellt: ${position.id}`);
    }

    await generateOrderLegalDocuments({
      checkoutIntentId: checkout.id,
      userId: position.userId,
      accountingPositionId: position.id,
    });

    processed += 1;
    console.log(`Vertrags-PDFs verarbeitet: ${position.id}`);
  }

  console.log(`Fertig. ${processed} Mitgliedschafts-Bestellung(en) verarbeitet.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
