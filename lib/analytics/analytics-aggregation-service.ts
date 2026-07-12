/**
 * @file analytics-aggregation-service.ts
 * @purpose Tägliche Aggregation und Löschung alter Rohdaten.
 */

import { prisma } from "@/lib/db/prisma";

import { ANALYTICS_FUNNELS } from "./analytics-funnels";
import { RAW_DATA_RETENTION_DAYS } from "./analytics-config";
import { toStatDate } from "./analytics-date-range";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

async function upsertDailyMetric(statDate: Date, metricKey: string, value: number) {
  await prisma.analyticsDailyMetric.upsert({
    where: {
      statDate_metricKey: {
        statDate,
        metricKey,
      },
    },
    create: {
      statDate,
      metricKey,
      value,
    },
    update: {
      value,
    },
  });
}

async function aggregatePageStatsForDate(day: Date): Promise<number> {
  const statDate = toStatDate(day);
  const from = startOfDay(day);
  const to = endOfDay(day);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      pagePath: { not: null },
    },
    select: {
      pagePath: true,
      pageType: true,
      trackingLevel: true,
      eventType: true,
      sessionId: true,
      metadataJson: true,
    },
  });

  const byPage = new Map<
    string,
    {
      pageType: string;
      basicViews: number;
      statisticsViews: number;
      sessionIds: Set<string>;
      totalDuration: number;
      durationSamples: number;
      totalScroll: number;
      scrollSamples: number;
      bounces: number;
    }
  >();

  for (const event of events) {
    if (!event.pagePath) {
      continue;
    }

    const key = event.pagePath;
    const entry =
      byPage.get(key) ??
      {
        pageType: event.pageType ?? "page",
        basicViews: 0,
        statisticsViews: 0,
        sessionIds: new Set<string>(),
        totalDuration: 0,
        durationSamples: 0,
        totalScroll: 0,
        scrollSamples: 0,
        bounces: 0,
      };

    if (event.trackingLevel === "basic" && event.eventType === "basic_pageview") {
      entry.basicViews += 1;
    }

    if (event.trackingLevel === "statistics" && event.eventType === "pageview") {
      entry.statisticsViews += 1;

      if (event.sessionId) {
        entry.sessionIds.add(event.sessionId);
      }
    }

    if (event.eventType === "page_duration") {
      const duration = Number(
        (event.metadataJson as { durationSeconds?: number } | null)?.durationSeconds ?? 0,
      );

      if (duration > 0) {
        entry.totalDuration += duration;
        entry.durationSamples += 1;
      }
    }

    if (event.eventType === "scroll_depth") {
      const depth = Number(
        (event.metadataJson as { depth?: number } | null)?.depth ?? 0,
      );

      if (depth > 0) {
        entry.totalScroll += depth;
        entry.scrollSamples += 1;
      }
    }

    byPage.set(key, entry);
  }

  const sessions = await prisma.analyticsSession.findMany({
    where: {
      startedAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      pageviewCount: true,
      entryPage: true,
    },
  });

  for (const session of sessions) {
    if (session.pageviewCount <= 1 && session.entryPage) {
      const entry = byPage.get(session.entryPage);

      if (entry) {
        entry.bounces += 1;
      }
    }
  }

  let upserted = 0;

  for (const [pagePath, stats] of byPage.entries()) {
    await prisma.analyticsDailyPageStat.upsert({
      where: {
        statDate_pagePath: {
          statDate,
          pagePath,
        },
      },
      create: {
        statDate,
        pagePath,
        pageType: stats.pageType,
        basicViews: stats.basicViews,
        statisticsViews: stats.statisticsViews,
        uniqueSessions: stats.sessionIds.size,
        totalDurationSeconds: stats.totalDuration,
        durationSamples: stats.durationSamples,
        totalScrollDepth: stats.totalScroll,
        scrollSamples: stats.scrollSamples,
        bounces: stats.bounces,
      },
      update: {
        pageType: stats.pageType,
        basicViews: stats.basicViews,
        statisticsViews: stats.statisticsViews,
        uniqueSessions: stats.sessionIds.size,
        totalDurationSeconds: stats.totalDuration,
        durationSamples: stats.durationSamples,
        totalScrollDepth: stats.totalScroll,
        scrollSamples: stats.scrollSamples,
        bounces: stats.bounces,
      },
    });

    upserted += 1;
  }

  return upserted;
}

async function aggregateFunnelStatsForDate(day: Date): Promise<number> {
  const statDate = toStatDate(day);
  const from = startOfDay(day);
  const to = endOfDay(day);
  let upserted = 0;

  for (const funnel of ANALYTICS_FUNNELS) {
    const sessionEvents = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        trackingLevel: "statistics",
        sessionId: { not: null },
      },
      select: {
        sessionId: true,
        eventType: true,
        pageType: true,
        pagePath: true,
      },
    });

    const sessions = new Map<string, Set<string>>();

    for (const event of sessionEvents) {
      if (!event.sessionId) {
        continue;
      }

      const set = sessions.get(event.sessionId) ?? new Set<string>();
      set.add(event.eventType);

      if (event.pageType) {
        set.add(`page:${event.pageType}`);
      }

      sessions.set(event.sessionId, set);
    }

    let previousCount = sessions.size;

    for (let index = 0; index < funnel.steps.length; index += 1) {
      const step = funnel.steps[index]!;
      let enteredCount = 0;

      for (const eventSet of sessions.values()) {
        const matched = step.eventTypes.some((eventType) => {
          if (eventType === "pageview" && step.key === "home") {
            return eventSet.has("pageview");
          }

          if (eventType === "pageview" && step.key === "course_page") {
            return eventSet.has("page:course");
          }

          if (eventType === "pageview" && step.key === "workshop_page") {
            return eventSet.has("page:workshop");
          }

          return eventSet.has(eventType);
        });

        if (matched) {
          enteredCount += 1;
        }
      }

      const droppedCount = Math.max(0, previousCount - enteredCount);

      await prisma.analyticsDailyFunnelStat.upsert({
        where: {
          statDate_funnelId_stepKey: {
            statDate,
            funnelId: funnel.id,
            stepKey: step.key,
          },
        },
        create: {
          statDate,
          funnelId: funnel.id,
          stepKey: step.key,
          stepOrder: index,
          enteredCount,
          completedCount: enteredCount,
          droppedCount,
        },
        update: {
          stepOrder: index,
          enteredCount,
          completedCount: enteredCount,
          droppedCount,
        },
      });

      previousCount = enteredCount;
      upserted += 1;
    }
  }

  return upserted;
}

async function aggregateDailyMetricsForDate(day: Date): Promise<number> {
  const statDate = toStatDate(day);
  const from = startOfDay(day);
  const to = endOfDay(day);

  const [
    visitors,
    pageviews,
    checkoutAbandons,
    registrations,
    purchases,
    memberships,
    newsletter,
    tickets,
    community,
  ] = await Promise.all([
    prisma.analyticsSession.count({
      where: { startedAt: { gte: from, lte: to } },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: { in: ["pageview", "basic_pageview"] },
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: "checkout_abandon",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: "registration_completed",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: "course_purchased",
      },
    }),
    prisma.membership.count({
      where: { createdAt: { gte: from, lte: to } },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: "newsletter_signup",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: "ticket_created",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: from, lte: to },
        eventType: { in: ["forum_opened", "post_created"] },
      },
    }),
  ]);

  const metrics: [string, number][] = [
    ["visitors", visitors],
    ["pageviews", pageviews],
    ["checkout_abandons", checkoutAbandons],
    ["registrations", registrations],
    ["purchases", purchases],
    ["memberships", memberships],
    ["newsletter_signups", newsletter],
    ["tickets", tickets],
    ["community_activity", community],
  ];

  for (const [metricKey, value] of metrics) {
    await upsertDailyMetric(statDate, metricKey, value);
  }

  return metrics.length;
}

export async function runAnalyticsAggregation(daysBack = 2): Promise<{
  pageStats: number;
  funnelStats: number;
  metrics: number;
}> {
  const today = startOfDay(new Date());
  let pageStats = 0;
  let funnelStats = 0;
  let metrics = 0;

  for (let offset = 0; offset < daysBack; offset += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - offset);

    pageStats += await aggregatePageStatsForDate(day);
    funnelStats += await aggregateFunnelStatsForDate(day);
    metrics += await aggregateDailyMetricsForDate(day);
  }

  return { pageStats, funnelStats, metrics };
}

export async function purgeOldAnalyticsRawData(): Promise<{
  deletedEvents: number;
  deletedSessions: number;
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RAW_DATA_RETENTION_DAYS);

  const deletedEvents = await prisma.analyticsEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  const deletedSessions = await prisma.analyticsSession.deleteMany({
    where: { lastActivityAt: { lt: cutoff } },
  });

  return {
    deletedEvents: deletedEvents.count,
    deletedSessions: deletedSessions.count,
  };
}
