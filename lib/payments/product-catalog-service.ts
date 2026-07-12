/**
 * @file product-catalog-service.ts
 * @purpose Produkt- und Preiskatalog für Mitgliedschaften und Kurse.
 */

import type { ProductKind } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  toProductEntry,
  toProductPriceEntry,
  type ProductEntry,
  type ProductPriceEntry,
  type ProductWithPrices,
} from "./payment-types";

/**
 * Listet alle aktiven Katalogprodukte mit Preisen.
 */
export async function listActiveProducts(): Promise<
  UserServiceResult<ProductWithPrices[]>
> {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        prices: {
          where: { active: true },
          orderBy: { grossAmount: "asc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return userSuccess(
      products.map((product) => ({
        ...toProductEntry(product),
        prices: product.prices.map(toProductPriceEntry),
      })),
    );
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Produktkatalog konnte nicht geladen werden.",
    });
  }
}

/**
 * Lädt ein Produkt anhand des Slugs.
 */
export async function getProductBySlug(
  slug: string,
): Promise<UserServiceResult<ProductWithPrices | null>> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        prices: {
          where: { active: true },
          orderBy: { grossAmount: "asc" },
        },
      },
    });

    if (!product) {
      return userSuccess(null);
    }

    return userSuccess({
      ...toProductEntry(product),
      prices: product.prices.map(toProductPriceEntry),
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Produkt konnte nicht geladen werden.",
    });
  }
}

/**
 * Lädt einen aktiven Preis inklusive Produkt.
 */
export async function getActiveProductPrice(priceId: string): Promise<
  UserServiceResult<{
    price: ProductPriceEntry;
    product: ProductEntry;
  } | null>
> {
  try {
    const price = await prisma.productPrice.findFirst({
      where: { id: priceId, active: true },
      include: { product: true },
    });

    if (!price || !price.product.active) {
      return userSuccess(null);
    }

    return userSuccess({
      price: toProductPriceEntry(price),
      product: toProductEntry(price.product),
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Produktpreis konnte nicht geladen werden.",
    });
  }
}

/**
 * Filtert Produkte nach Art.
 */
export async function listProductsByKind(
  kind: ProductKind,
): Promise<UserServiceResult<ProductWithPrices[]>> {
  const result = await listActiveProducts();

  if (!result.success) {
    return result;
  }

  return userSuccess(result.data.filter((product) => product.kind === kind));
}
