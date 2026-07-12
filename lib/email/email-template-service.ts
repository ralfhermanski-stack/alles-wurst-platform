/**
 * @file email-template-service.ts
 */

import { prisma } from "@/lib/db/prisma";

import {
  findMissingRequiredVariables,
  resolveTemplateString,
  type TemplateVariables,
} from "./email-placeholder-service";
import { wrapPlatformEmailHtml, htmlToPlainText } from "./email-layout";

import type { EmailCategory } from "@prisma/client";

export type ResolvedEmailContent = {
  subject: string;
  html: string;
  text: string;
  templateVersionId?: string;
};

export async function resolveTemplateByKey(input: {
  templateKey: string;
  variables: TemplateVariables;
  senderName?: string;
  preheader?: string;
}): Promise<ResolvedEmailContent | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: { key: input.templateKey },
    include: {
      activeVersion: true,
    },
  });

  if (!template?.activeVersion || template.activeVersion.status !== "ACTIVE") {
    return null;
  }

  const version = template.activeVersion;
  const allowedVariables = Array.isArray(version.allowedVariables)
    ? (version.allowedVariables as string[])
    : [];

  const missing = findMissingRequiredVariables(version.subject, input.variables);

  if (missing.length > 0) {
    throw new Error(
      `Pflichtplatzhalter fehlen für Vorlage ${input.templateKey}: ${missing.join(", ")}`,
    );
  }

  const subject = resolveTemplateString(version.subject, input.variables, allowedVariables);
  const bodyHtml = resolveTemplateString(version.htmlContent, input.variables, allowedVariables);
  const textBody = resolveTemplateString(version.textContent, input.variables, allowedVariables);

  const html = wrapPlatformEmailHtml({
    content: bodyHtml,
    senderName: input.senderName,
    preheader: input.preheader ?? version.preheader ?? undefined,
    automatedNotice: template.category !== "ADMIN_MANUAL",
  });

  const text = textBody || htmlToPlainText(html);

  return {
    subject,
    html,
    text,
    templateVersionId: version.id,
  };
}

export async function listEmailTemplates() {
  return prisma.emailTemplate.findMany({
    include: {
      activeVersion: true,
      versions: {
        orderBy: { version: "desc" },
        take: 3,
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getTemplatesByCategory(category: EmailCategory) {
  return prisma.emailTemplate.findMany({
    where: { category, status: "ACTIVE" },
    include: { activeVersion: true },
    orderBy: { name: "asc" },
  });
}

export type AdminTemplateListItem = {
  id: string;
  key: string;
  name: string;
  category: EmailCategory;
  status: string;
  activeVersion: number | null;
  activeVersionStatus: string | null;
  updatedAt: string;
};

export type AdminTemplateDetail = AdminTemplateListItem & {
  locale: string;
  preheader: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  allowedVariables: string[];
  versionId: string | null;
};

function mapTemplateListItem(
  row: Awaited<ReturnType<typeof listEmailTemplates>>[number],
): AdminTemplateListItem {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    category: row.category,
    status: row.status,
    activeVersion: row.activeVersion?.version ?? null,
    activeVersionStatus: row.activeVersion?.status ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapTemplateDetail(
  row: NonNullable<Awaited<ReturnType<typeof getEmailTemplateById>>>,
): AdminTemplateDetail {
  const version = row.activeVersion;

  return {
    ...mapTemplateListItem(row),
    locale: row.locale,
    preheader: version?.preheader ?? "",
    subject: version?.subject ?? "",
    htmlContent: version?.htmlContent ?? "",
    textContent: version?.textContent ?? "",
    allowedVariables: Array.isArray(version?.allowedVariables)
      ? (version.allowedVariables as string[])
      : [],
    versionId: version?.id ?? null,
  };
}

async function getEmailTemplateById(id: string) {
  return prisma.emailTemplate.findUnique({
    where: { id },
    include: {
      activeVersion: true,
      versions: {
        orderBy: { version: "desc" },
        take: 5,
      },
    },
  });
}

export async function listTemplatesForAdmin(): Promise<AdminTemplateListItem[]> {
  const rows = await listEmailTemplates();
  return rows.map(mapTemplateListItem);
}

export async function getTemplateDetailForAdmin(
  id: string,
): Promise<AdminTemplateDetail | null> {
  const row = await getEmailTemplateById(id);
  return row ? mapTemplateDetail(row) : null;
}

const TEMPLATE_KEY_PATTERN = /^[a-z][a-z0-9._-]*$/;

function normalizeAllowedVariables(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export async function createEmailTemplate(input: {
  key: string;
  name: string;
  category: EmailCategory;
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent: string;
  allowedVariables: string[];
  createdById?: string;
}) {
  const key = input.key.trim().toLowerCase();
  const name = input.name.trim();

  if (!TEMPLATE_KEY_PATTERN.test(key)) {
    throw new Error(
      "Der Vorlagen-Schlüssel muss mit einem Buchstaben beginnen und darf nur Kleinbuchstaben, Zahlen, Punkte, Bindestriche und Unterstriche enthalten.",
    );
  }

  if (!name || !input.subject.trim() || !input.htmlContent.trim()) {
    throw new Error("Name, Betreff und HTML-Inhalt sind erforderlich.");
  }

  const existing = await prisma.emailTemplate.findUnique({ where: { key } });

  if (existing) {
    throw new Error(`Eine Vorlage mit dem Schlüssel „${key}“ existiert bereits.`);
  }

  const allowedVariables = normalizeAllowedVariables(input.allowedVariables);

  return prisma.$transaction(async (tx) => {
    const template = await tx.emailTemplate.create({
      data: {
        key,
        name,
        category: input.category,
        status: "ACTIVE",
      },
    });

    const version = await tx.emailTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        subject: input.subject.trim(),
        preheader: input.preheader?.trim() || null,
        htmlContent: input.htmlContent.trim(),
        textContent: input.textContent.trim(),
        allowedVariables,
        status: "ACTIVE",
        createdById: input.createdById ?? null,
        publishedById: input.createdById ?? null,
        publishedAt: new Date(),
      },
    });

    return tx.emailTemplate.update({
      where: { id: template.id },
      data: { activeVersionId: version.id, status: "ACTIVE" },
      include: { activeVersion: true },
    });
  });
}

export async function updateEmailTemplate(input: {
  id: string;
  name?: string;
  category?: EmailCategory;
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent: string;
  allowedVariables: string[];
  updatedById?: string;
}) {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: input.id },
    include: { activeVersion: true },
  });

  if (!template) {
    throw new Error("Vorlage nicht gefunden.");
  }

  if (!input.subject.trim() || !input.htmlContent.trim()) {
    throw new Error("Betreff und HTML-Inhalt sind erforderlich.");
  }

  const allowedVariables = normalizeAllowedVariables(input.allowedVariables);
  const versionData = {
    subject: input.subject.trim(),
    preheader: input.preheader?.trim() || null,
    htmlContent: input.htmlContent.trim(),
    textContent: input.textContent.trim(),
    allowedVariables,
  };

  return prisma.$transaction(async (tx) => {
    if (template.activeVersion) {
      await tx.emailTemplateVersion.update({
        where: { id: template.activeVersion.id },
        data: {
          ...versionData,
          publishedById: input.updatedById ?? template.activeVersion.publishedById,
          publishedAt: template.activeVersion.publishedAt ?? new Date(),
        },
      });
    } else {
      const version = await tx.emailTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          ...versionData,
          status: "ACTIVE",
          createdById: input.updatedById ?? null,
          publishedById: input.updatedById ?? null,
          publishedAt: new Date(),
        },
      });

      await tx.emailTemplate.update({
        where: { id: template.id },
        data: { activeVersionId: version.id },
      });
    }

    return tx.emailTemplate.update({
      where: { id: template.id },
      data: {
        ...(input.name?.trim() ? { name: input.name.trim() } : {}),
        ...(input.category ? { category: input.category } : {}),
        status: "ACTIVE",
      },
      include: { activeVersion: true },
    });
  });
}
