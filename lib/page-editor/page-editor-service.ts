/**
 * @file page-editor-service.ts
 * @purpose Sessions, Seitenliste, Entwurf/Veröffentlichung für den visuellen Editor.
 */

import type { PlatformTextStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { ensurePlatformTextDefaults } from "@/lib/platform-text/platform-text-service";
import { scanHardcodedTexts } from "@/lib/platform-text/platform-text-scan";
import type { PlatformTextServiceResult } from "@/lib/platform-text/platform-text-types";

import { canManagePageContent } from "./page-editor-auth";
import {
  EDITABLE_PAGE_CATEGORY_LABELS,
  type EditablePageListItem,
  type PageEditorElementPayload,
} from "./page-editor-types";
import {
  EDITABLE_PAGE_REGISTRY,
  getEditablePageById,
} from "./page-registry";
import {
  createPageEditorPreviewToken,
  generatePageEditorPlainToken,
} from "./preview-token-edge";
import { PAGE_EDITOR_TOKEN_TTL_MS } from "./preview-token-constants";
import { hashPageEditorPlainToken } from "./page-editor-session-hash";
import { checkPageEditorWriteRateLimit } from "./page-editor-rate-limit";
import {
  sanitizePlainPlatformText,
  sanitizeRichPlatformText,
  validateTextLength,
} from "./page-editor-sanitize";

function success<T>(data: T): PlatformTextServiceResult<T> {
  return { success: true, data };
}

function failure(code: string, message: string): PlatformTextServiceResult<never> {
  return { success: false, error: { code, message } };
}

let registrySyncedAt = 0;
const REGISTRY_SYNC_TTL_MS = 5 * 60 * 1000;

async function ensureRegistrySynced(): Promise<void> {
  if (Date.now() - registrySyncedAt < REGISTRY_SYNC_TTL_MS) {
    return;
  }

  await syncEditablePagesFromRegistry();
  registrySyncedAt = Date.now();
}

export async function syncEditablePagesFromRegistry(): Promise<void> {
  await ensurePlatformTextDefaults();

  for (const page of EDITABLE_PAGE_REGISTRY) {
    await prisma.editablePage.upsert({
      where: { id: page.id },
      create: {
        id: page.id,
        name: page.name,
        path: page.path,
        category: page.category,
        enabled: true,
      },
      update: {
        name: page.name,
        path: page.path,
        category: page.category,
      },
    });

    for (let index = 0; index < page.textKeys.length; index++) {
      const element = page.textKeys[index];

      await prisma.platformText.updateMany({
        where: { key: element.key },
        data: { pagePath: page.path },
      });

      await prisma.editablePageElement.upsert({
        where: {
          pageId_textKey: {
            pageId: page.id,
            textKey: element.key,
          },
        },
        create: {
          pageId: page.id,
          textKey: element.key,
          elementType: element.elementType,
          label: element.label,
          sortOrder: index,
        },
        update: {
          elementType: element.elementType,
          label: element.label,
          sortOrder: index,
        },
      });
    }
  }
}

const PAGE_PATH_SCAN_HINTS: Record<string, string[]> = {
  "/": ["app/(marketing)/page.tsx", "components/marketing/Hero.tsx"],
  "/akademie": ["app/(marketing)/akademie"],
  "/akademie/kurse": ["app/(marketing)/akademie/kurse"],
  "/anmelden": ["app/(auth)/anmelden"],
  "/registrieren": ["app/(auth)/registrieren"],
  "/mitgliedschaft": ["app/(marketing)/mitgliedschaft"],
  "/impressum": ["app/(marketing)/impressum"],
  "/datenschutz": ["app/(marketing)/datenschutz"],
  "/werkstatt": ["app/(marketing)/werkstatt"],
  "/wartung": ["app/(marketing)/wartung", "app/wartung"],
};

let hardcodeScanCache: {
  at: number;
  scan: ReturnType<typeof scanHardcodedTexts>;
} | null = null;

const HARDCODE_SCAN_TTL_MS = 10 * 60 * 1000;

function getHardcodeScan(projectRoot: string): ReturnType<typeof scanHardcodedTexts> {
  try {
    if (
      hardcodeScanCache &&
      Date.now() - hardcodeScanCache.at < HARDCODE_SCAN_TTL_MS
    ) {
      return hardcodeScanCache.scan;
    }

    const scan = scanHardcodedTexts(projectRoot);
    hardcodeScanCache = { at: Date.now(), scan };
    return scan;
  } catch (error) {
    console.error("[page-editor-service] hardcode scan:", error);
    return {
      generatedAt: new Date().toISOString(),
      totalFindings: 0,
      managedKeys: 0,
      findings: [],
    };
  }
}

function countHardcodedForPage(
  pagePath: string,
  scan: ReturnType<typeof scanHardcodedTexts>,
): number {
  const hints = PAGE_PATH_SCAN_HINTS[pagePath] ?? [];

  if (hints.length === 0) {
    return 0;
  }

  return scan.findings.filter(
    (finding) =>
      !finding.managed &&
      hints.some((hint) => finding.file.includes(hint.replace(/\\/g, "/"))),
  ).length;
}

export async function listEditablePages(input?: {
  category?: string;
  search?: string;
  projectRoot?: string;
}): Promise<PlatformTextServiceResult<EditablePageListItem[]>> {
  try {
    await ensureRegistrySynced();

    const pages = await prisma.editablePage.findMany({
      where: input?.category ? { category: input.category } : undefined,
      include: {
        elements: {
          include: {
            text: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const root = input?.projectRoot ?? process.cwd();
    const hardcodeScan = getHardcodeScan(root);
    const items: EditablePageListItem[] = [];

    for (const page of pages) {
      const registry = getEditablePageById(page.id);
      const editableCount = page.elements.filter((element) => element.enabled).length;
      const draftCount = page.elements.filter(
        (element) =>
          element.text.status === "draft" ||
          (element.text.draftValue != null && element.text.draftValue !== element.text.value),
      ).length;

      const lastEdited = page.elements
        .map((element) => element.text.updatedAt)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      let status: EditablePageListItem["status"] = "published";

      if (draftCount > 0) {
        status = "draft";
      } else if (editableCount === 0) {
        status = "standard";
      }

      const item: EditablePageListItem = {
        id: page.id,
        name: page.name,
        path: page.path,
        category: page.category as EditablePageListItem["category"],
        categoryLabel:
          EDITABLE_PAGE_CATEGORY_LABELS[
            page.category as keyof typeof EDITABLE_PAGE_CATEGORY_LABELS
          ] ?? page.category,
        enabled: page.enabled,
        editableCount,
        hardcodedCount: countHardcodedForPage(page.path, hardcodeScan),
        draftCount,
        lastEditedAt: lastEdited?.toISOString() ?? null,
        lastEditedBy: null,
        status,
      };

      if (input?.search?.trim()) {
        const term = input.search.trim().toLowerCase();
        const matches =
          item.name.toLowerCase().includes(term) ||
          item.path.toLowerCase().includes(term) ||
          page.elements.some(
            (element) =>
              element.textKey.toLowerCase().includes(term) ||
              element.label.toLowerCase().includes(term) ||
              element.text.value.toLowerCase().includes(term) ||
              (element.text.draftValue?.toLowerCase().includes(term) ?? false),
          );

        if (!matches) {
          continue;
        }
      }

      items.push(item);
    }

    return success(items);
  } catch (error) {
    console.error("[page-editor-service] list:", error);

    const message =
      error instanceof Error &&
      (/does not exist|Unknown column|editable_pages/i.test(error.message) ||
        (error as { code?: string }).code === "P2021")
        ? "Datenbank-Migration fehlt. Bitte „npx prisma migrate deploy“ ausführen."
        : "Seitenliste konnte nicht geladen werden.";

    return failure("INTERNAL_ERROR", message);
  }
}

export async function getPageEditorElements(
  pageId: string,
): Promise<PlatformTextServiceResult<PageEditorElementPayload[]>> {
  try {
    await ensureRegistrySynced();

    const page = await prisma.editablePage.findUnique({
      where: { id: pageId },
      include: {
        elements: {
          include: { text: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      return failure("NOT_FOUND", "Seite nicht gefunden.");
    }

    return success(
      page.elements.map((element) => ({
        textKey: element.textKey,
        label: element.label,
        elementType: element.elementType as PageEditorElementPayload["elementType"],
        value: element.text.draftValue ?? element.text.value,
        draftValue: element.text.draftValue,
        publishedValue: element.text.value,
        defaultValue: element.text.defaultValue,
        status: element.text.status,
        maxLength: element.text.maxLength,
        allowRichText: element.text.allowRichText,
        pagePath: element.text.pagePath,
        category: element.text.category,
      })),
    );
  } catch (error) {
    console.error("[page-editor-service] elements:", error);
    return failure("INTERNAL_ERROR", "Seitenelemente konnten nicht geladen werden.");
  }
}

export async function createPageEditorSession(input: {
  pageId: string;
  userId: string;
}): Promise<
  PlatformTextServiceResult<{
    sessionId: string;
    previewToken: string;
    previewPath: string;
    frameUrl: string;
    expiresAt: string;
  }>
> {
  try {
    await ensureRegistrySynced();

    const page = await prisma.editablePage.findUnique({
      where: { id: input.pageId },
    });

    if (!page) {
      return failure("NOT_FOUND", "Seite nicht gefunden.");
    }

    const plainToken = generatePageEditorPlainToken();
    const expiresAt = new Date(Date.now() + PAGE_EDITOR_TOKEN_TTL_MS);

    const session = await prisma.pageEditorSession.create({
      data: {
        userId: input.userId,
        pageId: input.pageId,
        tokenHash: hashPageEditorPlainToken(plainToken),
        expiresAt,
      },
    });

    const signedPreview = await createPageEditorPreviewToken({
      sessionId: session.id,
      userId: input.userId,
      pageId: input.pageId,
      expiresAt: expiresAt.getTime(),
    });

    return success({
      sessionId: session.id,
      previewToken: signedPreview,
      previewPath: page.path,
      frameUrl: `/admin/inhalte/seiteneditor/frame/${input.pageId}?token=${encodeURIComponent(signedPreview)}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[page-editor-service] session:", error);
    return failure("INTERNAL_ERROR", "Editor-Sitzung konnte nicht erstellt werden.");
  }
}

export { validatePageEditorSession } from "./page-editor-session";

export async function savePageEditorDraft(input: {
  pageId: string;
  textKey: string;
  value: string;
  userId: string;
  pagePath?: string | null;
}): Promise<PlatformTextServiceResult<{ textKey: string; draftValue: string }>> {
  const rate = checkPageEditorWriteRateLimit(input.userId);

  if (!rate.allowed) {
    return failure(
      "RATE_LIMITED",
      "Zu viele Speichervorgänge. Bitte warte einen Moment.",
    );
  }

  try {
    const element = await prisma.editablePageElement.findFirst({
      where: {
        pageId: input.pageId,
        textKey: input.textKey,
        enabled: true,
      },
      include: { text: true },
    });

    if (!element) {
      return failure(
        "FORBIDDEN",
        "Dieser Inhalt gehört nicht zu dieser Seite oder ist nicht bearbeitbar.",
      );
    }

    const row = element.text;
    const sanitized = row.allowRichText
      ? sanitizeRichPlatformText(input.value)
      : sanitizePlainPlatformText(input.value);

    const lengthError = validateTextLength(sanitized, row.maxLength);

    if (lengthError) {
      return failure("VALIDATION_ERROR", lengthError);
    }

    const updated = await prisma.platformText.update({
      where: { key: input.textKey },
      data: {
        draftValue: sanitized,
        status: "draft" satisfies PlatformTextStatus,
        updatedBy: input.userId,
      },
    });

    await prisma.platformTextChangeLog.create({
      data: {
        textKey: input.textKey,
        action: `draft_save:${input.pagePath ?? input.pageId}`,
        oldValue: row.draftValue ?? row.value,
        newValue: sanitized,
        userId: input.userId,
      },
    });

    return success({
      textKey: updated.key,
      draftValue: updated.draftValue ?? sanitized,
    });
  } catch (error) {
    console.error("[page-editor-service] draft:", error);
    return failure("INTERNAL_ERROR", "Die Änderung konnte nicht als Entwurf gespeichert werden.");
  }
}

export async function publishPageDrafts(input: {
  pageId: string;
  userId: string;
}): Promise<PlatformTextServiceResult<{ published: number }>> {
  const rate = checkPageEditorWriteRateLimit(input.userId);

  if (!rate.allowed) {
    return failure("RATE_LIMITED", "Zu viele Veröffentlichungen. Bitte warte einen Moment.");
  }

  try {
    const page = await prisma.editablePage.findUnique({
      where: { id: input.pageId },
      include: {
        elements: { include: { text: true } },
      },
    });

    if (!page) {
      return failure("NOT_FOUND", "Seite nicht gefunden.");
    }

    let published = 0;
    const now = new Date();

    for (const element of page.elements) {
      const row = element.text;

      if (row.draftValue == null || row.draftValue === row.value) {
        continue;
      }

      const nextVersion = row.version + 1;

      await prisma.platformText.update({
        where: { key: row.key },
        data: {
          value: row.draftValue,
          draftValue: null,
          status: "published",
          version: nextVersion,
          publishedAt: now,
          publishedBy: input.userId,
          updatedBy: input.userId,
        },
      });

      await prisma.platformTextVersion.create({
        data: {
          textKey: row.key,
          version: nextVersion,
          value: row.draftValue,
          changedBy: input.userId,
          changeNote: `Veröffentlicht über Seiteneditor (${page.name})`,
        },
      });

      await prisma.platformTextChangeLog.create({
        data: {
          textKey: row.key,
          action: `publish:${page.path}`,
          oldValue: row.value,
          newValue: row.draftValue,
          userId: input.userId,
        },
      });

      published += 1;
    }

    if (published > 0) {
      await prisma.pageContentRelease.create({
        data: {
          pageId: page.id,
          status: "published",
          createdBy: input.userId,
          publishedBy: input.userId,
          publishedAt: now,
        },
      });
    }

    return success({ published });
  } catch (error) {
    console.error("[page-editor-service] publish:", error);
    return failure("INTERNAL_ERROR", "Die Seite konnte nicht veröffentlicht werden.");
  }
}

export async function discardPageDrafts(input: {
  pageId: string;
  userId: string;
}): Promise<PlatformTextServiceResult<{ discarded: number }>> {
  try {
    const page = await prisma.editablePage.findUnique({
      where: { id: input.pageId },
      include: { elements: { include: { text: true } } },
    });

    if (!page) {
      return failure("NOT_FOUND", "Seite nicht gefunden.");
    }

    let discarded = 0;

    for (const element of page.elements) {
      if (element.text.draftValue == null) {
        continue;
      }

      await prisma.platformText.update({
        where: { key: element.text.key },
        data: {
          draftValue: null,
          status: "published",
          updatedBy: input.userId,
        },
      });

      await prisma.platformTextChangeLog.create({
        data: {
          textKey: element.text.key,
          action: `discard_draft:${page.path}`,
          oldValue: element.text.draftValue,
          newValue: element.text.value,
          userId: input.userId,
        },
      });

      discarded += 1;
    }

    return success({ discarded });
  } catch (error) {
    console.error("[page-editor-service] discard:", error);
    return failure("INTERNAL_ERROR", "Entwürfe konnten nicht verworfen werden.");
  }
}

export async function resetPageEditorText(input: {
  pageId: string;
  textKey: string;
  userId: string;
}): Promise<PlatformTextServiceResult<{ value: string }>> {
  try {
    const element = await prisma.editablePageElement.findFirst({
      where: { pageId: input.pageId, textKey: input.textKey },
      include: { text: true },
    });

    if (!element) {
      return failure("FORBIDDEN", "Text gehört nicht zu dieser Seite.");
    }

    const row = element.text;
    const defaultValue = row.defaultValue;

    await prisma.platformText.update({
      where: { key: row.key },
      data: {
        draftValue: defaultValue,
        status: "draft",
        updatedBy: input.userId,
      },
    });

    await prisma.platformTextChangeLog.create({
      data: {
        textKey: row.key,
        action: `reset_to_default:${input.pageId}`,
        oldValue: row.draftValue ?? row.value,
        newValue: defaultValue,
        userId: input.userId,
      },
    });

    return success({ value: defaultValue });
  } catch (error) {
    console.error("[page-editor-service] reset:", error);
    return failure("INTERNAL_ERROR", "Standardtext konnte nicht wiederhergestellt werden.");
  }
}

export { canManagePageContent };
