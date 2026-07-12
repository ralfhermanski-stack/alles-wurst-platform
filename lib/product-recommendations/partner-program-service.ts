/**
 * @file partner-program-service.ts
 * @purpose Zentrale Verwaltung von Partnerprogrammen und Affiliate-Links.
 */

import type { PartnerProgramType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  PartnerProgramEntry,
  ProductRecommendationSettingsEntry,
  UpsertPartnerProgramInput,
} from "./product-recommendation-types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapPartner(row: {
  id: string;
  name: string;
  slug: string;
  programType: PartnerProgramType;
  affiliateId: string | null;
  urlTemplate: string | null;
  baseUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  note: string | null;
}): PartnerProgramEntry {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    programType: row.programType,
    affiliateId: row.affiliateId,
    urlTemplate: row.urlTemplate,
    baseUrl: row.baseUrl,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    note: row.note,
  };
}

export async function ensureDefaultPartnerPrograms(): Promise<void> {
  await prisma.partnerProgram.upsert({
    where: { slug: "amazon-de" },
    create: {
      name: "Amazon PartnerNet (DE)",
      slug: "amazon-de",
      programType: "amazon",
      affiliateId: process.env.AMAZON_AFFILIATE_TAG ?? null,
      urlTemplate: "https://www.amazon.de/dp/{asin}?tag={tag}",
      baseUrl: "https://www.amazon.de",
      isActive: true,
      sortOrder: 10,
      note: "Standard-Amazon-Partnerprogramm für Deutschland.",
    },
    update: {
      affiliateId: process.env.AMAZON_AFFILIATE_TAG ?? undefined,
    },
  });

  await prisma.productRecommendationSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      affiliateDisclosureText:
        "Dieser Link kann ein Partnerlink sein. Für Sie entstehen keine zusätzlichen Kosten.",
    },
    update: {},
  });
}

export async function listPartnerPrograms(
  includeInactive = false,
): Promise<PartnerProgramEntry[]> {
  await ensureDefaultPartnerPrograms();

  const rows = await prisma.partnerProgram.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map(mapPartner);
}

export async function upsertPartnerProgram(
  input: UpsertPartnerProgramInput,
  existingId?: string,
): Promise<PartnerProgramEntry> {
  const slug = input.slug?.trim() || slugify(input.name);

  const row = existingId
    ? await prisma.partnerProgram.update({
        where: { id: existingId },
        data: {
          name: input.name.trim(),
          slug,
          programType: input.programType,
          affiliateId: input.affiliateId ?? null,
          urlTemplate: input.urlTemplate ?? null,
          baseUrl: input.baseUrl ?? null,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 100,
          note: input.note ?? null,
        },
      })
    : await prisma.partnerProgram.create({
        data: {
          name: input.name.trim(),
          slug,
          programType: input.programType,
          affiliateId: input.affiliateId ?? null,
          urlTemplate: input.urlTemplate ?? null,
          baseUrl: input.baseUrl ?? null,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 100,
          note: input.note ?? null,
        },
      });

  return mapPartner(row);
}

export async function getProductRecommendationSettings(): Promise<ProductRecommendationSettingsEntry> {
  await ensureDefaultPartnerPrograms();

  const settings = await prisma.productRecommendationSettings.findUnique({
    where: { id: "default" },
  });

  return {
    affiliateDisclosureText:
      settings?.affiliateDisclosureText ??
      "Dieser Link kann ein Partnerlink sein. Für Sie entstehen keine zusätzlichen Kosten.",
    defaultAmazonProgramId: settings?.defaultAmazonProgramId ?? null,
  };
}

export async function updateProductRecommendationSettings(input: {
  affiliateDisclosureText?: string;
  defaultAmazonProgramId?: string | null;
}): Promise<ProductRecommendationSettingsEntry> {
  await ensureDefaultPartnerPrograms();

  const settings = await prisma.productRecommendationSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      affiliateDisclosureText:
        input.affiliateDisclosureText ??
        "Dieser Link kann ein Partnerlink sein. Für Sie entstehen keine zusätzlichen Kosten.",
      defaultAmazonProgramId: input.defaultAmazonProgramId ?? null,
    },
    update: {
      affiliateDisclosureText: input.affiliateDisclosureText,
      defaultAmazonProgramId: input.defaultAmazonProgramId,
    },
  });

  return {
    affiliateDisclosureText: settings.affiliateDisclosureText,
    defaultAmazonProgramId: settings.defaultAmazonProgramId,
  };
}

export function buildAmazonUrl(input: {
  amazonLink: string | null;
  partnerProgram?: {
    affiliateId: string | null;
    urlTemplate: string | null;
  } | null;
  settingsAffiliateId?: string | null;
}): string | null {
  if (!input.amazonLink?.trim()) {
    return null;
  }

  const raw = input.amazonLink.trim();

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const tag =
      input.partnerProgram?.affiliateId ??
      input.settingsAffiliateId ??
      process.env.AMAZON_AFFILIATE_TAG;

    if (!tag) {
      return raw;
    }

    try {
      const url = new URL(raw);
      url.searchParams.set("tag", tag);
      return url.toString();
    } catch {
      return raw;
    }
  }

  const asin = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const tag =
    input.partnerProgram?.affiliateId ??
    input.settingsAffiliateId ??
    process.env.AMAZON_AFFILIATE_TAG;

  const template =
    input.partnerProgram?.urlTemplate ??
    "https://www.amazon.de/dp/{asin}?tag={tag}";

  if (!tag) {
    return template.replace("{asin}", asin).replace("?tag={tag}", "").replace("&tag={tag}", "");
  }

  return template.replace("{asin}", asin).replace("{tag}", tag);
}

export function buildAffiliateUrl(input: {
  affiliateLink: string | null;
  partnerProgram?: {
    affiliateId: string | null;
    urlTemplate: string | null;
    baseUrl: string | null;
  } | null;
}): string | null {
  if (!input.affiliateLink?.trim()) {
    return null;
  }

  const raw = input.affiliateLink.trim();

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const template = input.partnerProgram?.urlTemplate;
  const tag = input.partnerProgram?.affiliateId ?? "";

  if (template) {
    return template.replace("{url}", raw).replace("{tag}", tag).replace("{asin}", raw);
  }

  if (input.partnerProgram?.baseUrl) {
    return `${input.partnerProgram.baseUrl.replace(/\/$/, "")}/${raw}`;
  }

  return raw;
}
