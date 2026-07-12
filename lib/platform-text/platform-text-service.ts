/**
 * @file platform-text-service.ts
 * @purpose CRUD, Versionierung und Runtime-Zugriff auf Plattformtexte.
 */

import type { PlatformText, PlatformTextFormat } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  getCachedPlatformText,
  invalidatePlatformTextCache,
  setCachedPlatformText,
} from "./platform-text-cache";
import {
  PLATFORM_TEXT_DEFAULTS,
  getPlatformTextDefault,
  interpolatePlatformText,
} from "./platform-text-defaults";
import type {
  PlatformTextChangeLogRecord,
  PlatformTextRecord,
  PlatformTextServiceResult,
  PlatformTextVersionRecord,
} from "./platform-text-types";

const DEFAULT_LOCALE = "de";

function success<T>(data: T): PlatformTextServiceResult<T> {
  return { success: true, data };
}

function failure(code: string, message: string): PlatformTextServiceResult<never> {
  return { success: false, error: { code, message } };
}

function mapRecord(row: PlatformText): PlatformTextRecord {
  return {
    key: row.key,
    category: row.category,
    locale: row.locale,
    value: row.value,
    defaultValue: row.defaultValue,
    label: row.label,
    description: row.description,
    format: row.format,
    version: row.version,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isCustomized: row.value !== row.defaultValue,
  };
}

async function writeChangeLog(input: {
  textKey: string;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  userId?: string | null;
}): Promise<void> {
  await prisma.platformTextChangeLog.create({
    data: {
      textKey: input.textKey,
      action: input.action,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      userId: input.userId ?? null,
    },
  });
}

async function writeVersionSnapshot(input: {
  textKey: string;
  version: number;
  value: string;
  changedBy?: string | null;
  changeNote?: string | null;
}): Promise<void> {
  await prisma.platformTextVersion.upsert({
    where: {
      textKey_version: {
        textKey: input.textKey,
        version: input.version,
      },
    },
    create: {
      textKey: input.textKey,
      version: input.version,
      value: input.value,
      changedBy: input.changedBy ?? null,
      changeNote: input.changeNote ?? null,
    },
    update: {
      value: input.value,
      changedBy: input.changedBy ?? null,
      changeNote: input.changeNote ?? null,
    },
  });
}

export async function ensurePlatformTextDefaults(): Promise<number> {
  let created = 0;

  for (const entry of PLATFORM_TEXT_DEFAULTS) {
    const existing = await prisma.platformText.findUnique({
      where: { key: entry.key },
    });

    if (existing) {
      continue;
    }

    await prisma.platformText.create({
      data: {
        key: entry.key,
        category: entry.category,
        locale: DEFAULT_LOCALE,
        value: entry.defaultValue,
        defaultValue: entry.defaultValue,
        label: entry.label,
        description: entry.description ?? null,
        format: entry.format ?? "plain",
      },
    });

    created += 1;
  }

  return created;
}

export async function listPlatformTexts(input?: {
  category?: string;
  search?: string;
  locale?: string;
}): Promise<PlatformTextServiceResult<PlatformTextRecord[]>> {
  try {
    await ensurePlatformTextDefaults();

    const where: {
      category?: string;
      locale?: string;
      OR?: Array<{
        key?: { contains: string; mode: "insensitive" };
        label?: { contains: string; mode: "insensitive" };
        value?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      locale: input?.locale ?? DEFAULT_LOCALE,
    };

    if (input?.category) {
      where.category = input.category;
    }

    if (input?.search?.trim()) {
      const term = input.search.trim();
      where.OR = [
        { key: { contains: term, mode: "insensitive" } },
        { label: { contains: term, mode: "insensitive" } },
        { value: { contains: term, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.platformText.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return success(rows.map(mapRecord));
  } catch (error) {
    console.error("[platform-text-service] list:", error);
    return failure("INTERNAL_ERROR", "Texte konnten nicht geladen werden.");
  }
}

export async function getPlatformTextRecord(
  key: string,
): Promise<PlatformTextServiceResult<PlatformTextRecord>> {
  try {
    await ensurePlatformTextDefaults();

    const row = await prisma.platformText.findUnique({ where: { key } });

    if (!row) {
      const fallback = getPlatformTextDefault(key);

      if (!fallback) {
        return failure("NOT_FOUND", `Textschlüssel „${key}“ nicht gefunden.`);
      }

      return failure("NOT_FOUND", `Textschlüssel „${key}“ ist noch nicht in der Datenbank.`);
    }

    return success(mapRecord(row));
  } catch (error) {
    console.error("[platform-text-service] get:", error);
    return failure("INTERNAL_ERROR", "Text konnte nicht geladen werden.");
  }
}

export async function updatePlatformText(input: {
  key: string;
  value: string;
  userId?: string | null;
  changeNote?: string | null;
}): Promise<PlatformTextServiceResult<PlatformTextRecord>> {
  try {
    const row = await prisma.platformText.findUnique({
      where: { key: input.key },
    });

    if (!row) {
      return failure("NOT_FOUND", "Text nicht gefunden.");
    }

    const nextVersion = row.version + 1;
    const updated = await prisma.platformText.update({
      where: { key: input.key },
      data: {
        value: input.value,
        version: nextVersion,
        updatedBy: input.userId ?? null,
      },
    });

    await writeVersionSnapshot({
      textKey: input.key,
      version: nextVersion,
      value: input.value,
      changedBy: input.userId ?? null,
      changeNote: input.changeNote ?? null,
    });

    await writeChangeLog({
      textKey: input.key,
      action: "update",
      oldValue: row.value,
      newValue: input.value,
      userId: input.userId ?? null,
    });

    invalidatePlatformTextCache(input.key);

    return success(mapRecord(updated));
  } catch (error) {
    console.error("[platform-text-service] update:", error);
    return failure("INTERNAL_ERROR", "Text konnte nicht gespeichert werden.");
  }
}

export async function resetPlatformText(input: {
  key: string;
  userId?: string | null;
}): Promise<PlatformTextServiceResult<PlatformTextRecord>> {
  try {
    const row = await prisma.platformText.findUnique({
      where: { key: input.key },
    });

    if (!row) {
      return failure("NOT_FOUND", "Text nicht gefunden.");
    }

    const nextVersion = row.version + 1;
    const updated = await prisma.platformText.update({
      where: { key: input.key },
      data: {
        value: row.defaultValue,
        version: nextVersion,
        updatedBy: input.userId ?? null,
      },
    });

    await writeVersionSnapshot({
      textKey: input.key,
      version: nextVersion,
      value: row.defaultValue,
      changedBy: input.userId ?? null,
      changeNote: "Zurückgesetzt auf Standardtext",
    });

    await writeChangeLog({
      textKey: input.key,
      action: "reset",
      oldValue: row.value,
      newValue: row.defaultValue,
      userId: input.userId ?? null,
    });

    invalidatePlatformTextCache(input.key);

    return success(mapRecord(updated));
  } catch (error) {
    console.error("[platform-text-service] reset:", error);
    return failure("INTERNAL_ERROR", "Text konnte nicht zurückgesetzt werden.");
  }
}

export async function listPlatformTextVersions(
  key: string,
): Promise<PlatformTextServiceResult<PlatformTextVersionRecord[]>> {
  try {
    const rows = await prisma.platformTextVersion.findMany({
      where: { textKey: key },
      orderBy: { version: "desc" },
    });

    return success(
      rows.map((row) => ({
        id: row.id,
        textKey: row.textKey,
        version: row.version,
        value: row.value,
        changedBy: row.changedBy,
        changeNote: row.changeNote,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("[platform-text-service] versions:", error);
    return failure("INTERNAL_ERROR", "Versionen konnten nicht geladen werden.");
  }
}

export async function listPlatformTextChangeLogs(
  key: string,
): Promise<PlatformTextServiceResult<PlatformTextChangeLogRecord[]>> {
  try {
    const rows = await prisma.platformTextChangeLog.findMany({
      where: { textKey: key },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return success(
      rows.map((row) => ({
        id: row.id,
        textKey: row.textKey,
        action: row.action,
        oldValue: row.oldValue,
        newValue: row.newValue,
        userId: row.userId,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("[platform-text-service] changelog:", error);
    return failure("INTERNAL_ERROR", "Protokoll konnte nicht geladen werden.");
  }
}

export async function exportPlatformTexts(locale = DEFAULT_LOCALE): Promise<
  PlatformTextServiceResult<{
    exportedAt: string;
    locale: string;
    texts: PlatformTextRecord[];
  }>
> {
  const result = await listPlatformTexts({ locale });

  if (!result.success) {
    return result;
  }

  return success({
    exportedAt: new Date().toISOString(),
    locale,
    texts: result.data,
  });
}

export async function importPlatformTexts(input: {
  texts: Array<{ key: string; value: string }>;
  userId?: string | null;
}): Promise<PlatformTextServiceResult<{ updated: number; skipped: number }>> {
  try {
    let updated = 0;
    let skipped = 0;

    for (const item of input.texts) {
      const row = await prisma.platformText.findUnique({
        where: { key: item.key },
      });

      if (!row) {
        skipped += 1;
        continue;
      }

      const result = await updatePlatformText({
        key: item.key,
        value: item.value,
        userId: input.userId ?? null,
        changeNote: "Import",
      });

      if (result.success) {
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    invalidatePlatformTextCache();

    return success({ updated, skipped });
  } catch (error) {
    console.error("[platform-text-service] import:", error);
    return failure("INTERNAL_ERROR", "Import fehlgeschlagen.");
  }
}

/** Runtime: Text mit Fallback (DB → Default-Registry → Parameter-Fallback) */
export async function getPlatformText(
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
): Promise<string> {
  return getPlatformTextWithMode(key, "published", fallback, vars);
}

type PendingPlatformTextLoad = {
  key: string;
  mode: "published" | "draft";
  fallback?: string;
  vars?: Record<string, string | number>;
  resolve: (value: string) => void;
};

let pendingPlatformTextLoads: PendingPlatformTextLoad[] = [];
let platformTextBatchScheduled = false;

function schedulePlatformTextBatchFlush(): void {
  if (platformTextBatchScheduled) {
    return;
  }

  platformTextBatchScheduled = true;

  queueMicrotask(() => {
    void flushPlatformTextBatch();
  });
}

async function flushPlatformTextBatch(): Promise<void> {
  platformTextBatchScheduled = false;
  const batch = pendingPlatformTextLoads;
  pendingPlatformTextLoads = [];

  if (batch.length === 0) {
    return;
  }

  const keys = [...new Set(batch.map((item) => item.key))];
  const rowMap = new Map<string, PlatformText>();

  try {
    const rows = await prisma.platformText.findMany({
      where: { key: { in: keys } },
    });

    for (const row of rows) {
      rowMap.set(row.key, row);
    }
  } catch {
    // DB nicht erreichbar — Fallbacks nutzen
  }

  for (const item of batch) {
    const row = rowMap.get(item.key);

    if (row) {
      const raw =
        item.mode === "draft" && row.draftValue != null ? row.draftValue : row.value;

      if (item.mode === "published") {
        setCachedPlatformText(item.key, row.value);
      }

      item.resolve(interpolatePlatformText(raw, item.vars));
      continue;
    }

    const registry = getPlatformTextDefault(item.key);
    const raw = registry?.defaultValue ?? item.fallback ?? item.key;
    item.resolve(interpolatePlatformText(raw, item.vars));
  }
}

/** Editor-Vorschau: Entwurf bevorzugen, sonst veröffentlicht */
export async function getPlatformTextForEditor(
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
): Promise<string> {
  return getPlatformTextWithMode(key, "draft", fallback, vars);
}

async function getPlatformTextWithMode(
  key: string,
  mode: "published" | "draft",
  fallback?: string,
  vars?: Record<string, string | number>,
): Promise<string> {
  if (mode === "published") {
    const cached = getCachedPlatformText(key);

    if (cached !== null) {
      return interpolatePlatformText(cached, vars);
    }
  }

  return new Promise((resolve) => {
    pendingPlatformTextLoads.push({
      key,
      mode,
      fallback,
      vars,
      resolve,
    });
    schedulePlatformTextBatchFlush();
  });
}

/** Registry-Defaults in die DB übernehmen (nur unveränderte Einträge oder erzwungen). */
export async function syncPlatformTextRegistryDefaults(input?: {
  keyPrefix?: string;
  keys?: string[];
  forceUpdate?: boolean;
}): Promise<{ updated: number; skipped: number }> {
  let updated = 0;
  let skipped = 0;

  const entries = PLATFORM_TEXT_DEFAULTS.filter((entry) => {
    if (input?.keys?.length) {
      return input.keys.includes(entry.key);
    }

    return !input?.keyPrefix || entry.key.startsWith(input.keyPrefix);
  });

  for (const entry of entries) {
    const row = await prisma.platformText.findUnique({
      where: { key: entry.key },
    });

    if (!row) {
      skipped += 1;
      continue;
    }

    const wasUnchanged = row.value === row.defaultValue;
    const registryChanged = row.defaultValue !== entry.defaultValue;

    if (!registryChanged && !input?.forceUpdate) {
      skipped += 1;
      continue;
    }

    const nextValue =
      input?.forceUpdate || wasUnchanged ? entry.defaultValue : row.value;

    await prisma.platformText.update({
      where: { key: entry.key },
      data: {
        defaultValue: entry.defaultValue,
        value: nextValue,
        label: entry.label,
        description: entry.description ?? null,
      },
    });

    invalidatePlatformTextCache(entry.key);
    updated += 1;
  }

  return { updated, skipped };
}

export async function getPlatformTexts(
  keys: string[],
): Promise<Record<string, string>> {
  const uniqueKeys = [...new Set(keys)];
  const result: Record<string, string> = {};

  await Promise.all(
    uniqueKeys.map(async (key) => {
      result[key] = await getPlatformText(key);
    }),
  );

  return result;
}

export async function getPlatformTextsByCategory(
  category: string,
): Promise<Record<string, string>> {
  try {
    await ensurePlatformTextDefaults();

    const rows = await prisma.platformText.findMany({
      where: { category, locale: DEFAULT_LOCALE },
    });

    const result: Record<string, string> = {};

    for (const row of rows) {
      result[row.key] = row.value;
      setCachedPlatformText(row.key, row.value);
    }

    return result;
  } catch {
    const result: Record<string, string> = {};

    for (const entry of PLATFORM_TEXT_DEFAULTS) {
      if (entry.category === category) {
        result[entry.key] = entry.defaultValue;
      }
    }

    return result;
  }
}

export function getAllDefaultKeys(): string[] {
  return PLATFORM_TEXT_DEFAULTS.map((entry) => entry.key);
}

export type ManagedTextStatus = {
  key: string;
  managed: boolean;
  category: string;
  label: string;
};

export function getManagedTextRegistry(): ManagedTextStatus[] {
  return PLATFORM_TEXT_DEFAULTS.map((entry) => ({
    key: entry.key,
    managed: true,
    category: entry.category,
    label: entry.label,
  }));
}
