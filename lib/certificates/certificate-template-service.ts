/**
 * @file certificate-template-service.ts
 * @purpose Urkunden-/Zertifikatsvorlagen laden und speichern (pro Nachweistyp).
 */

import type { CertificateTemplate } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  buildDefaultPlaceholders,
  buildDefaultTextFields,
  defaultFormatForKind,
  defaultQrConfig,
  mergePlaceholderDefaults,
} from "./certificate-defaults";
import {
  isCertificateFormat,
  parseFreeTextFields,
  parsePlaceholderFields,
  parseQrConfig,
  type CertificateFormat,
  type CertificateFreeTextField,
  type CertificateKind,
  type CertificatePlaceholderField,
  type CertificateQrConfig,
  type CertificateTemplateEntry,
} from "./certificate-types";

export type UpdateCertificateTemplateInput = {
  format?: CertificateFormat;
  instructorName?: string;
  instructorTitle?: string;
  placeholders?: CertificatePlaceholderField[];
  textFields?: CertificateFreeTextField[];
  qrConfig?: CertificateQrConfig;
  backgroundStorageKey?: string | null;
  backgroundFileName?: string | null;
};

function normalizeKind(kind: CertificateKind): CertificateKind {
  return kind === "participation" ? "participation" : "certificate";
}

function toTemplateEntry(template: CertificateTemplate): CertificateTemplateEntry {
  const kind = normalizeKind(template.id as CertificateKind);
  const format: CertificateFormat = isCertificateFormat(template.format)
    ? template.format
    : defaultFormatForKind(kind);

  const parsedPlaceholders = parsePlaceholderFields(template.placeholders);
  const placeholders =
    parsedPlaceholders.length > 0
      ? mergePlaceholderDefaults(parsedPlaceholders, format)
      : buildDefaultPlaceholders(format);

  return {
    id: template.id,
    kind,
    format,
    backgroundFileName: template.backgroundFileName,
    hasBackground: Boolean(template.backgroundStorageKey),
    instructorName: template.instructorName,
    instructorTitle: template.instructorTitle,
    placeholders,
    textFields: parseFreeTextFields(template.textFields),
    qrConfig: parseQrConfig(template.qrConfig),
    updatedAt: template.updatedAt.toISOString(),
  };
}

/**
 * Lädt (und initialisiert bei Bedarf) die Vorlage eines Nachweistyps.
 * Neue Vorlagen erhalten Standardlayout, Standard-QR und den Rechtshinweis.
 */
export async function getCertificateTemplate(
  kind: CertificateKind = "certificate",
): Promise<CertificateTemplateEntry> {
  const normalized = normalizeKind(kind);
  const format = defaultFormatForKind(normalized);

  const template = await prisma.certificateTemplate.upsert({
    where: { id: normalized },
    create: {
      id: normalized,
      format,
      placeholders: buildDefaultPlaceholders(format) as unknown as Prisma.InputJsonValue,
      textFields: buildDefaultTextFields() as unknown as Prisma.InputJsonValue,
      qrConfig: defaultQrConfig(format) as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });

  return toTemplateEntry(template);
}

export async function getAllCertificateTemplates(): Promise<
  Record<CertificateKind, CertificateTemplateEntry>
> {
  const [certificate, participation] = await Promise.all([
    getCertificateTemplate("certificate"),
    getCertificateTemplate("participation"),
  ]);

  return { certificate, participation };
}

export async function updateCertificateTemplate(
  kind: CertificateKind,
  input: UpdateCertificateTemplateInput,
): Promise<UserServiceResult<CertificateTemplateEntry>> {
  try {
    const normalized = normalizeKind(kind);
    const format = input.format ?? defaultFormatForKind(normalized);

    const template = await prisma.certificateTemplate.upsert({
      where: { id: normalized },
      create: {
        id: normalized,
        format,
        instructorName: input.instructorName ?? "Ralf Hermanski",
        instructorTitle: input.instructorTitle ?? "Fleischermeister seit 1994",
        placeholders: (input.placeholders ??
          buildDefaultPlaceholders(format)) as unknown as Prisma.InputJsonValue,
        textFields: (input.textFields ??
          buildDefaultTextFields()) as unknown as Prisma.InputJsonValue,
        qrConfig: (input.qrConfig ??
          defaultQrConfig(format)) as unknown as Prisma.InputJsonValue,
        backgroundStorageKey: input.backgroundStorageKey ?? null,
        backgroundFileName: input.backgroundFileName ?? null,
      },
      update: {
        format: input.format,
        instructorName: input.instructorName,
        instructorTitle: input.instructorTitle,
        placeholders: input.placeholders
          ? (input.placeholders as unknown as Prisma.InputJsonValue)
          : undefined,
        textFields: input.textFields
          ? (input.textFields as unknown as Prisma.InputJsonValue)
          : undefined,
        qrConfig: input.qrConfig
          ? (input.qrConfig as unknown as Prisma.InputJsonValue)
          : undefined,
        backgroundStorageKey: input.backgroundStorageKey,
        backgroundFileName: input.backgroundFileName,
      },
    });

    return userSuccess(toTemplateEntry(template));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Vorlage konnte nicht gespeichert werden.",
    });
  }
}

export async function getCertificateBackgroundStorageKey(
  kind: CertificateKind = "certificate",
): Promise<string | null> {
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: normalizeKind(kind) },
    select: { backgroundStorageKey: true },
  });

  return template?.backgroundStorageKey ?? null;
}

/** Prüft, ob für einen Nachweistyp eine veröffentlichungsreife Vorlage existiert. */
export async function hasReadyCertificateTemplate(
  kind: CertificateKind,
): Promise<boolean> {
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: normalizeKind(kind) },
    select: { backgroundStorageKey: true },
  });

  return Boolean(template?.backgroundStorageKey);
}
