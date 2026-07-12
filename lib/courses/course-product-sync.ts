/**
 * @file course-product-sync.ts
 * @purpose Hält je Kurs automatisch ein Verkaufsprodukt (+ Preis) synchron.
 *
 * Grundsatz: Ein Kurs = ein Verkaufsprodukt. Redakteure müssen keine Produkte
 * separat pflegen. Beim Speichern eines Kurses wird das zugehörige Produkt
 * erzeugt bzw. aktualisiert, beim Löschen wird das Produkt archiviert.
 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { CourseSalesProductStatus } from "./course-types";

export type { CourseSalesProductStatus };

/** Standard-Umsatzsteuersatz für Kurse (Prozent). */
const COURSE_TAX_RATE = 19;

/** Sortierwert für automatisch erzeugte Kursprodukte. */
const COURSE_PRODUCT_SORT_ORDER = 30;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function computePriceAmounts(priceCents: number): {
  gross: number;
  net: number;
  tax: number;
} {
  const gross = round2(priceCents / 100);
  const net = round2(gross / (1 + COURSE_TAX_RATE / 100));
  const tax = round2(gross - net);

  return { gross, net, tax };
}

async function allocateProductSlug(
  tx: Prisma.TransactionClient,
  baseSlug: string,
): Promise<string> {
  const normalized = baseSlug.toLowerCase().trim() || "kurs";
  let candidate = normalized;
  let counter = 2;

  while (await tx.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${normalized}-${counter}`;
    counter += 1;
  }

  return candidate;
}

/**
 * Synchronisiert den Preis eines Produkts mit dem Kurspreis.
 * Preis > 0 → genau ein aktiver one_time-Preis. Preis 0/null → kein aktiver Preis.
 * Bestehende Preise werden nie gelöscht (Checkout-Referenzen), nur deaktiviert.
 */
async function syncProductPrice(
  tx: Prisma.TransactionClient,
  productId: string,
  priceCents: number | null,
  currency: string,
): Promise<void> {
  const activePrices = await tx.productPrice.findMany({
    where: { productId, active: true },
  });

  if (priceCents === null || priceCents <= 0) {
    if (activePrices.length > 0) {
      await tx.productPrice.updateMany({
        where: { productId, active: true },
        data: { active: false },
      });
    }

    return;
  }

  const { gross, net, tax } = computePriceAmounts(priceCents);

  const matching = activePrices.find(
    (price) =>
      price.grossAmount.toNumber() === gross &&
      price.currency === currency &&
      price.billingPeriod === "one_time",
  );

  if (matching) {
    // Passenden Preis behalten, überzählige aktive Preise deaktivieren.
    const staleIds = activePrices
      .filter((price) => price.id !== matching.id)
      .map((price) => price.id);

    if (staleIds.length > 0) {
      await tx.productPrice.updateMany({
        where: { id: { in: staleIds } },
        data: { active: false },
      });
    }

    return;
  }

  if (activePrices.length > 0) {
    await tx.productPrice.updateMany({
      where: { productId, active: true },
      data: { active: false },
    });
  }

  await tx.productPrice.create({
    data: {
      productId,
      grossAmount: new Prisma.Decimal(gross),
      netAmount: new Prisma.Decimal(net),
      taxRate: new Prisma.Decimal(COURSE_TAX_RATE),
      taxAmount: new Prisma.Decimal(tax),
      currency,
      billingPeriod: "one_time",
      active: true,
    },
  });
}

/**
 * Erzeugt oder aktualisiert das Verkaufsprodukt eines Kurses.
 * Verknüpft `course.productId`, falls noch nicht vorhanden.
 */
export async function syncCourseProduct(courseId: string): Promise<void> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const name = course.title.trim() || "Kurs";
    const description =
      course.shortDescription?.trim() || course.subtitle?.trim() || null;

    let productId = course.productId;
    const existingProduct = productId
      ? await tx.product.findUnique({ where: { id: productId } })
      : null;

    if (existingProduct) {
      await tx.product.update({
        where: { id: existingProduct.id },
        data: { name, description, active: true },
      });
    } else {
      const slug = await allocateProductSlug(tx, `kurs-${course.slug}`);
      const created = await tx.product.create({
        data: {
          kind: "course",
          slug,
          name,
          description,
          active: true,
          sortOrder: COURSE_PRODUCT_SORT_ORDER,
        },
      });

      productId = created.id;
      await tx.course.update({
        where: { id: course.id },
        data: { productId: created.id },
      });
    }

    if (productId) {
      await syncProductPrice(tx, productId, course.priceCents, course.priceCurrency);
    }
  });
}

/**
 * Archiviert das Verkaufsprodukt eines Kurses (bei Kurslöschung).
 * Das Produkt bleibt für Buchhaltung/Referenzen erhalten, wird aber inaktiv.
 */
export async function archiveCourseProduct(
  productId: string | null,
): Promise<void> {
  if (!productId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });

    if (!product) {
      return;
    }

    await tx.product.update({
      where: { id: productId },
      data: { active: false },
    });
    await tx.productPrice.updateMany({
      where: { productId, active: true },
      data: { active: false },
    });
  });
}

/**
 * Liefert den Verkaufsstatus des Kursprodukts für die Admin-Anzeige.
 */
export async function getCourseSalesProductStatus(
  productId: string | null,
): Promise<CourseSalesProductStatus> {
  if (!productId) {
    return { exists: false, active: false, hasActivePrice: false, productSlug: null };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { prices: { where: { active: true } } },
  });

  if (!product) {
    return { exists: false, active: false, hasActivePrice: false, productSlug: null };
  }

  return {
    exists: true,
    active: product.active,
    hasActivePrice: product.prices.length > 0,
    productSlug: product.slug,
  };
}
