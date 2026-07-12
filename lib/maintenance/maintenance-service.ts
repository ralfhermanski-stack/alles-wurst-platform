/**
 * @file maintenance-service.ts
 * @purpose Wartungsmodus-Einstellungen und Newsletter-Anmeldungen.
 */

import { prisma } from "@/lib/db/prisma";

import { invalidateMaintenanceCache, setMaintenanceCache } from "./maintenance-cache";
import {
  getMaintenanceImagePublicUrl,
  type MaintenanceImageKind,
  saveMaintenanceImage,
} from "./maintenance-image-storage";
import type {
  MaintenanceHttpStatus,
  MaintenanceSettingsData,
  MaintenanceStatusResponse,
  UpdateMaintenanceSettingsInput,
} from "./maintenance-types";
import { DEFAULT_MAINTENANCE_TEXT } from "./maintenance-types";

const SETTINGS_ID = "default";

function parseHttpStatus(value: string): MaintenanceHttpStatus {
  return value === "200" ? "200" : "503";
}

function mapSettings(row: {
  enabled: boolean;
  title: string;
  text: string;
  showLogo: boolean;
  logoStorageKey: string | null;
  backgroundStorageKey: string | null;
  countdownEnabled: boolean;
  endDate: Date | null;
  httpStatus: string;
  newsletterEnabled: boolean;
  updatedAt: Date;
}): MaintenanceSettingsData {
  return {
    enabled: row.enabled,
    title: row.title,
    text: row.text,
    showLogo: row.showLogo,
    logoUrl: row.logoStorageKey ? getMaintenanceImagePublicUrl("logo") : null,
    backgroundUrl: row.backgroundStorageKey
      ? getMaintenanceImagePublicUrl("background")
      : null,
    countdownEnabled: row.countdownEnabled,
    endDate: row.endDate?.toISOString() ?? null,
    httpStatus: parseHttpStatus(row.httpStatus),
    newsletterEnabled: row.newsletterEnabled,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureMaintenanceSettings() {
  return prisma.maintenanceSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      text: DEFAULT_MAINTENANCE_TEXT,
    },
    update: {},
  });
}

export async function getMaintenanceSettings(): Promise<MaintenanceSettingsData> {
  const row = await ensureMaintenanceSettings();
  return mapSettings(row);
}

export async function getMaintenanceImageMeta(kind: MaintenanceImageKind): Promise<{
  storageKey: string;
  mimeType: string;
} | null> {
  const row = await ensureMaintenanceSettings();

  if (kind === "logo") {
    if (!row.logoStorageKey || !row.logoMimeType) {
      return null;
    }

    return {
      storageKey: row.logoStorageKey,
      mimeType: row.logoMimeType,
    };
  }

  if (!row.backgroundStorageKey || !row.backgroundMimeType) {
    return null;
  }

  return {
    storageKey: row.backgroundStorageKey,
    mimeType: row.backgroundMimeType,
  };
}

export async function uploadMaintenanceImage(
  kind: MaintenanceImageKind,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<MaintenanceSettingsData> {
  const saved = await saveMaintenanceImage(kind, fileName, mimeType, bytes);

  const data =
    kind === "logo"
      ? {
          logoStorageKey: saved.storageKey,
          logoFileName: saved.fileName,
          logoMimeType: saved.mimeType,
        }
      : {
          backgroundStorageKey: saved.storageKey,
          backgroundFileName: saved.fileName,
          backgroundMimeType: saved.mimeType,
        };

  await ensureMaintenanceSettings();

  const row = await prisma.maintenanceSettings.update({
    where: { id: SETTINGS_ID },
    data,
  });

  invalidateMaintenanceCache();
  setMaintenanceCache(row.enabled, parseHttpStatus(row.httpStatus));

  return mapSettings(row);
}

export async function removeMaintenanceImage(
  kind: MaintenanceImageKind,
): Promise<MaintenanceSettingsData> {
  await ensureMaintenanceSettings();

  const data =
    kind === "logo"
      ? {
          logoStorageKey: null,
          logoFileName: null,
          logoMimeType: null,
        }
      : {
          backgroundStorageKey: null,
          backgroundFileName: null,
          backgroundMimeType: null,
        };

  const row = await prisma.maintenanceSettings.update({
    where: { id: SETTINGS_ID },
    data,
  });

  invalidateMaintenanceCache();
  setMaintenanceCache(row.enabled, parseHttpStatus(row.httpStatus));

  return mapSettings(row);
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatusResponse> {
  const cached = await getMaintenanceSettingsCached();

  return {
    enabled: cached.enabled,
    httpStatus: cached.httpStatus,
  };
}

export async function getMaintenanceSettingsCached(): Promise<MaintenanceStatusResponse & {
  title: string;
  text: string;
  showLogo: boolean;
  backgroundUrl: string | null;
  logoUrl: string | null;
  countdownEnabled: boolean;
  endDate: string | null;
  newsletterEnabled: boolean;
}> {
  const settings = await getMaintenanceSettings();

  setMaintenanceCache(settings.enabled, settings.httpStatus);

  return settings;
}

export async function updateMaintenanceSettings(
  input: UpdateMaintenanceSettingsInput,
): Promise<MaintenanceSettingsData> {
  await ensureMaintenanceSettings();

  const data: Record<string, unknown> = {};

  if (input.enabled !== undefined) data.enabled = input.enabled;
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.text !== undefined) data.text = input.text;
  if (input.showLogo !== undefined) data.showLogo = input.showLogo;
  if (input.countdownEnabled !== undefined) {
    data.countdownEnabled = input.countdownEnabled;
  }
  if (input.endDate !== undefined) {
    data.endDate = input.endDate ? new Date(input.endDate) : null;
  }
  if (input.httpStatus !== undefined) data.httpStatus = input.httpStatus;
  if (input.newsletterEnabled !== undefined) {
    data.newsletterEnabled = input.newsletterEnabled;
  }

  const row = await prisma.maintenanceSettings.update({
    where: { id: SETTINGS_ID },
    data,
  });

  invalidateMaintenanceCache();
  setMaintenanceCache(row.enabled, parseHttpStatus(row.httpStatus));

  return mapSettings(row);
}

export async function subscribeMaintenanceNewsletter(
  email: string,
): Promise<{ created: boolean }> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Bitte eine gültige E-Mail-Adresse eingeben.");
  }

  try {
    await prisma.maintenanceNewsletterSignup.create({
      data: {
        email: normalized,
        source: "maintenance",
      },
    });

    return { created: true };
  } catch (error) {
    if (
      typeof error === "object"
      && error !== null
      && "code" in error
      && error.code === "P2002"
    ) {
      return { created: false };
    }

    throw error;
  }
}

export async function listMaintenanceNewsletterSignups(limit = 100): Promise<
  { email: string; createdAt: string }[]
> {
  const rows = await prisma.maintenanceNewsletterSignup.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { email: true, createdAt: true },
  });

  return rows.map((row) => ({
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  }));
}
