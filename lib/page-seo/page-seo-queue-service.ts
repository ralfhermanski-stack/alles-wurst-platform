/**
 * @file page-seo-queue-service.ts
 * @purpose Warteschlange für SEO-Generierung.
 */

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

import { loadPageContent } from "./page-seo-discovery";
import { generatePageSeoContent } from "./page-seo-ai-service";
import { computePageContentHash } from "./page-seo-hash";
import {
  canConsumePageSeoApiCall,
  getPageSeoSettings,
  recordPageSeoApiCall,
  upsertDiscoveredPage,
} from "./page-seo-service";
import type { PageSeoProcessSummary } from "./page-seo-types";

const BATCH_SIZE = 5;

export async function enqueuePageSeoJob(
  routeKey: string,
  action: "generate" | "regenerate" = "generate",
  priority = 0,
): Promise<void> {
  const existing = await prisma.pageSeoQueueJob.findFirst({
    where: {
      routeKey,
      status: { in: ["pending", "processing"] },
    },
  });

  if (existing) {
    return;
  }

  await prisma.pageSeoQueueJob.create({
    data: {
      routeKey,
      action,
      priority,
      status: "pending",
    },
  });

  await prisma.pageSeo.updateMany({
    where: { routeKey },
    data: { generationStatus: "queued" },
  });
}

export async function enqueuePageSeoJobs(
  routeKeys: string[],
  action: "generate" | "regenerate" = "generate",
): Promise<number> {
  let count = 0;

  for (const routeKey of routeKeys) {
    const before = await prisma.pageSeoQueueJob.count({
      where: { routeKey, status: { in: ["pending", "processing"] } },
    });

    if (before === 0) {
      await enqueuePageSeoJob(routeKey, action);
      count += 1;
    }
  }

  return count;
}

async function processQueueJob(jobId: string): Promise<"succeeded" | "failed" | "skipped"> {
  const job = await prisma.pageSeoQueueJob.findUnique({ where: { id: jobId } });

  if (!job || job.status !== "pending") {
    return "skipped";
  }

  const settings = await getPageSeoSettings();

  if (!settings.autoGenerateEnabled && job.action === "generate") {
    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMessage: "Automatische Erzeugung deaktiviert.",
      },
    });

    return "skipped";
  }

  const row = await prisma.pageSeo.findUnique({ where: { routeKey: job.routeKey } });

  if (!row) {
    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: "Seite nicht registriert.",
      },
    });

    return "failed";
  }

  if (row.seoSource === "manual" && job.action !== "regenerate") {
    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMessage: "Manuelle SEO-Daten haben Vorrang.",
      },
    });

    await prisma.pageSeo.update({
      where: { id: row.id },
      data: { generationStatus: "skipped" },
    });

    return "skipped";
  }

  if (row.seoSource === "manual" && job.action === "regenerate") {
    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMessage: "Manuelle SEO-Daten werden nicht überschrieben.",
      },
    });

    return "skipped";
  }

  const content = await loadPageContent(job.routeKey);

  if (!content) {
    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: "Seiteninhalt nicht gefunden.",
        attempts: { increment: 1 },
      },
    });

    return "failed";
  }

  if (settings.onlyPublishedPages && !content.isPublished) {
    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMessage: "Nur veröffentlichte Seiten.",
      },
    });

    return "skipped";
  }

  const canCallApi = await canConsumePageSeoApiCall();

  await prisma.pageSeoQueueJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  await prisma.pageSeo.update({
    where: { id: row.id },
    data: { generationStatus: "processing" },
  });

  try {
    let result;

    if (!canCallApi) {
      const { buildFallbackPageSeo } = await import("./page-seo-ai-service");
      result = buildFallbackPageSeo(content);
    } else {
      result = await generatePageSeoContent(content);

      if (result.source === "ai") {
        await recordPageSeoApiCall();
      }
    }

    const contentHash = computePageContentHash(content);
    const now = new Date();

    await prisma.pageSeo.update({
      where: { id: row.id },
      data: {
        seoDraft: {
          metaTitle: result.metaTitle,
          metaDescription: result.metaDescription,
          keywords: result.keywords,
          ogTitle: result.ogTitle,
          ogDescription: result.ogDescription,
          ogImage: result.ogImage,
          twitterTitle: result.twitterTitle,
          twitterDescription: result.twitterDescription,
          canonicalUrl: result.canonicalUrl,
          jsonLd: result.jsonLd,
          aiSummary: result.aiSummary,
          aiMainTopic: result.aiMainTopic,
          aiEntities: result.aiEntities,
          aiAudience: result.aiAudience,
          aiExpertise: result.aiExpertise,
          semanticKeywords: result.semanticKeywords,
          source: result.source,
          warnings: result.warnings,
          generatedAt: now.toISOString(),
        } as Prisma.InputJsonValue,
        contentHash,
        lastGeneratedAt: now,
        lastContentChangeAt: row.contentHash === contentHash ? row.lastContentChangeAt : now,
        generationStatus: "pending_review",
        errorMessage: result.warnings.length > 0 ? result.warnings.join(" ") : null,
        path: content.path,
        isPublished: content.isPublished,
      },
    });

    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    return "succeeded";
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generierung fehlgeschlagen.";

    await prisma.pageSeo.update({
      where: { id: row.id },
      data: {
        generationStatus: "failed",
        errorMessage: message,
      },
    });

    await prisma.pageSeoQueueJob.update({
      where: { id: jobId },
      data: {
        status: job.attempts + 1 >= job.maxAttempts ? "failed" : "pending",
        errorMessage: message,
        completedAt: job.attempts + 1 >= job.maxAttempts ? new Date() : null,
      },
    });

    return "failed";
  }
}

export async function processPageSeoQueue(
  limit = BATCH_SIZE,
): Promise<PageSeoProcessSummary> {
  const jobs = await prisma.pageSeoQueueJob.findMany({
    where: { status: "pending" },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    take: limit,
  });

  const summary: PageSeoProcessSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    limitReached: false,
  };

  for (const job of jobs) {
    const settings = await getPageSeoSettings();
    const canCall = await canConsumePageSeoApiCall();

    if (!canCall && settings.apiCallsToday >= settings.maxApiCallsPerDay) {
      summary.limitReached = true;
      break;
    }

    const outcome = await processQueueJob(job.id);
    summary.processed += 1;

    if (outcome === "succeeded") {
      summary.succeeded += 1;
    } else if (outcome === "failed") {
      summary.failed += 1;
    } else {
      summary.skipped += 1;
    }
  }

  return summary;
}

export async function requestPageSeoRefresh(
  routeKey: string,
  reason: "content_change" | "manual" = "content_change",
): Promise<void> {
  const settings = await getPageSeoSettings();

  if (reason === "content_change" && !settings.autoUpdateOnChange) {
    return;
  }

  const content = await loadPageContent(routeKey);

  if (!content) {
    return;
  }

  const contentHash = computePageContentHash(content);

  await upsertDiscoveredPage({
    ...content,
    contentHash,
  });

  const row = await prisma.pageSeo.findUnique({ where: { routeKey } });

  if (!row || row.seoSource === "manual") {
    return;
  }

  if (row.contentHash === contentHash && row.generationStatus === "completed") {
    return;
  }

  await prisma.pageSeo.update({
    where: { routeKey },
    data: {
      generationStatus: "stale",
      lastContentChangeAt: new Date(),
      contentHash,
    },
  });

  if (settings.autoGenerateEnabled) {
    await enqueuePageSeoJob(routeKey, "generate");
  }
}
