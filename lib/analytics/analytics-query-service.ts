/**
 * @file analytics-query-service.ts
 * @purpose Admin-Auswertungen und Dashboard-Kacheln.
 */

import { prisma } from "@/lib/db/prisma";

import { ANALYTICS_PRIVACY_NOTE } from "./analytics-config";
import {
  resolveAnalyticsDateRange,
  toStatDate,
} from "./analytics-date-range";
import {
  ANALYTICS_FUNNELS,
  getFunnelStepLabel,
} from "./analytics-funnels";
import type {
  AnalyticsCheckoutStat,
  AnalyticsCourseStat,
  AnalyticsDashboardTiles,
  AnalyticsDateRange,
  AnalyticsFunnelResult,
  AnalyticsOverviewStats,
  AnalyticsPageStat,
  AnalyticsTimeRange,
} from "./analytics-types";

function calcRate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

async function countVisitorsBetween(from: Date, to: Date): Promise<number> {
  const [sessions, basicViews] = await Promise.all([
    prisma.analyticsSession.count({
      where: { startedAt: { gte: from, lte: to } },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["pagePath"],
      where: {
        createdAt: { gte: from, lte: to },
        trackingLevel: "basic",
        eventType: "basic_pageview",
      },
      _count: { _all: true },
    }),
  ]);

  const basicEstimate = basicViews.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );

  return Math.max(sessions, Math.round(basicEstimate / 3));
}

async function countPageviewsBetween(from: Date, to: Date): Promise<number> {
  return prisma.analyticsEvent.count({
    where: {
      createdAt: { gte: from, lte: to },
      eventType: { in: ["pageview", "basic_pageview"] },
    },
  });
}

export async function getAnalyticsOverview(
  preset: AnalyticsTimeRange = "last_7_days",
  customFrom?: string | null,
  customTo?: string | null,
): Promise<AnalyticsOverviewStats> {
  const now = new Date();
  const todayRange = resolveAnalyticsDateRange("today", null, null, now);
  const last7 = resolveAnalyticsDateRange("last_7_days", null, null, now);
  const last30 = resolveAnalyticsDateRange("last_30_days", null, null, now);
  const selected = resolveAnalyticsDateRange(preset, customFrom, customTo, now);

  const [
    visitorsToday,
    visitors7Days,
    visitors30Days,
    pageviewsToday,
    pageviews7Days,
    pageviews30Days,
    checkoutAbandons,
    membershipSignups,
    newsletterConversions,
    ticketVolume,
    communityActivity,
    sessionsInRange,
    durationEvents,
    bounceSessions,
    deviceGroups,
    browserGroups,
    countryGroups,
    referrerGroups,
    topPages,
    entryPages,
    exitPages,
    registrations,
    checkoutStarts,
    purchases,
    courseStarts,
    courseCompletions,
    topCourseEvent,
  ] = await Promise.all([
    countVisitorsBetween(todayRange.from, todayRange.to),
    countVisitorsBetween(last7.from, last7.to),
    countVisitorsBetween(last30.from, last30.to),
    countPageviewsBetween(todayRange.from, todayRange.to),
    countPageviewsBetween(last7.from, last7.to),
    countPageviewsBetween(last30.from, last30.to),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "checkout_abandon",
      },
    }),
    prisma.membership.count({
      where: { createdAt: { gte: selected.from, lte: selected.to } },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "newsletter_signup",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "ticket_created",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: { in: ["forum_opened", "post_created"] },
      },
    }),
    prisma.analyticsSession.findMany({
      where: { startedAt: { gte: selected.from, lte: selected.to } },
      select: {
        durationSeconds: true,
        pageviewCount: true,
        deviceType: true,
        browserFamily: true,
        countryCode: true,
        referrerDomain: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "page_duration",
      },
      select: { metadataJson: true },
    }),
    prisma.analyticsSession.count({
      where: {
        startedAt: { gte: selected.from, lte: selected.to },
        pageviewCount: { lte: 1 },
      },
    }),
    prisma.analyticsSession.groupBy({
      by: ["deviceType"],
      where: { startedAt: { gte: selected.from, lte: selected.to } },
      _count: { _all: true },
    }),
    prisma.analyticsSession.groupBy({
      by: ["browserFamily"],
      where: { startedAt: { gte: selected.from, lte: selected.to } },
      _count: { _all: true },
    }),
    prisma.analyticsSession.groupBy({
      by: ["countryCode"],
      where: {
        startedAt: { gte: selected.from, lte: selected.to },
        countryCode: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.analyticsSession.groupBy({
      by: ["referrerDomain"],
      where: {
        startedAt: { gte: selected.from, lte: selected.to },
        referrerDomain: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { referrerDomain: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.groupBy({
      by: ["pagePath"],
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: { in: ["pageview", "basic_pageview"] },
        pagePath: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { pagePath: "desc" } },
      take: 10,
    }),
    prisma.analyticsSession.groupBy({
      by: ["entryPage"],
      where: {
        startedAt: { gte: selected.from, lte: selected.to },
        entryPage: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { entryPage: "desc" } },
      take: 10,
    }),
    prisma.analyticsSession.groupBy({
      by: ["exitPage"],
      where: {
        startedAt: { gte: selected.from, lte: selected.to },
        exitPage: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { exitPage: "desc" } },
      take: 10,
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "registration_completed",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "checkout_start",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "course_purchased",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "course_started",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: "lesson_completed",
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["metadataJson"],
      where: {
        createdAt: { gte: selected.from, lte: selected.to },
        eventType: { in: ["course_started", "lesson_started", "pageview"] },
      },
      _count: { _all: true },
      orderBy: { _count: { metadataJson: "desc" } },
      take: 1,
    }),
  ]);

  const totalDuration = durationEvents.reduce((sum, event) => {
    const value = Number(
      (event.metadataJson as { durationSeconds?: number } | null)?.durationSeconds ?? 0,
    );

    return sum + Math.max(0, value);
  }, 0);

  const sessionDuration = sessionsInRange.reduce(
    (sum, session) => sum + session.durationSeconds,
    0,
  );

  const durationSamples = durationEvents.length + sessionsInRange.length;
  const avgDurationSeconds =
    durationSamples > 0
      ? Math.round((totalDuration + sessionDuration) / durationSamples)
      : null;

  const bounceRate = calcRate(bounceSessions, sessionsInRange.length || 1);

  const deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };

  for (const row of deviceGroups) {
    const key = (row.deviceType ?? "desktop") as keyof typeof deviceBreakdown;

    if (key in deviceBreakdown) {
      deviceBreakdown[key] += row._count._all;
    }
  }

  const visitorsInRange = sessionsInRange.length;

  const topPage =
    topPages[0]?.pagePath != null
      ? { path: topPages[0].pagePath, views: topPages[0]._count._all }
      : null;

  const funnelDrop = await getStrongestFunnelDrop(selected);

  let topCourseSlug: string | null = null;
  let topCourseActivity = 0;

  if (topCourseEvent[0]?.metadataJson) {
    const meta = topCourseEvent[0].metadataJson as { courseSlug?: string };

    if (meta.courseSlug) {
      topCourseSlug = meta.courseSlug;
      topCourseActivity = topCourseEvent[0]._count._all;
    }
  }

  return {
    visitorsToday,
    visitors7Days,
    visitors30Days,
    pageviewsToday,
    pageviews7Days,
    pageviews30Days,
    avgDurationSeconds,
    bounceRate,
    checkoutAbandons,
    topPage,
    topFunnelDrop: funnelDrop,
    topCourse: topCourseSlug
      ? { courseSlug: topCourseSlug, activity: topCourseActivity }
      : null,
    deviceBreakdown,
    browserBreakdown: browserGroups
      .filter((row) => row.browserFamily)
      .map((row) => ({
        browser: row.browserFamily!,
        count: row._count._all,
      })),
    countryBreakdown: countryGroups
      .filter((row) => row.countryCode)
      .map((row) => ({
        countryCode: row.countryCode!,
        count: row._count._all,
      })),
    referrerDomains: referrerGroups
      .filter((row) => row.referrerDomain)
      .map((row) => ({
        domain: row.referrerDomain!,
        count: row._count._all,
      })),
    conversionRates: {
      visitorToRegistration: calcRate(registrations, visitorsInRange),
      visitorToCheckout: calcRate(checkoutStarts, visitorsInRange),
      checkoutToPurchase: calcRate(purchases, checkoutStarts),
      registrationToCourseStart: calcRate(courseStarts, registrations),
      courseStartToCompletion: calcRate(courseCompletions, courseStarts),
    },
    membershipSignups,
    newsletterConversions,
    ticketVolume,
    communityActivity,
    privacyNote: ANALYTICS_PRIVACY_NOTE,
  };
}

async function getStrongestFunnelDrop(
  range: AnalyticsDateRange,
): Promise<{ funnelId: string; stepKey: string; dropRate: number } | null> {
  const statDateFrom = toStatDate(range.from);
  const statDateTo = toStatDate(range.to);

  const stats = await prisma.analyticsDailyFunnelStat.findMany({
    where: {
      statDate: { gte: statDateFrom, lte: statDateTo },
    },
  });

  let strongest: { funnelId: string; stepKey: string; dropRate: number } | null =
    null;

  for (const row of stats) {
    const entered = row.enteredCount + row.droppedCount;

    if (entered <= 0) {
      continue;
    }

    const dropRate = Math.round((row.droppedCount / entered) * 1000) / 10;

    if (!strongest || dropRate > strongest.dropRate) {
      strongest = {
        funnelId: row.funnelId,
        stepKey: row.stepKey,
        dropRate,
      };
    }
  }

  return strongest;
}

export async function getAnalyticsPages(
  preset: AnalyticsTimeRange = "last_7_days",
  customFrom?: string | null,
  customTo?: string | null,
): Promise<AnalyticsPageStat[]> {
  const range = resolveAnalyticsDateRange(preset, customFrom, customTo);

  const stats = await prisma.analyticsDailyPageStat.findMany({
    where: {
      statDate: {
        gte: toStatDate(range.from),
        lte: toStatDate(range.to),
      },
    },
  });

  const grouped = new Map<string, AnalyticsPageStat>();

  for (const row of stats) {
    const existing =
      grouped.get(row.pagePath) ??
      {
        pagePath: row.pagePath,
        pageType: row.pageType,
        views: 0,
        uniqueSessions: 0,
        avgDurationSeconds: null,
        avgScrollDepth: null,
        bounceRate: null,
        entryCount: 0,
        exitCount: 0,
      };

    existing.views += row.basicViews + row.statisticsViews;
    existing.uniqueSessions += row.uniqueSessions;

    const duration =
      row.durationSamples > 0
        ? Math.round(row.totalDurationSeconds / row.durationSamples)
        : null;

    const scroll =
      row.scrollSamples > 0
        ? Math.round(row.totalScrollDepth / row.scrollSamples)
        : null;

    existing.avgDurationSeconds = duration;
    existing.avgScrollDepth = scroll;
    existing.bounceRate = calcRate(row.bounces, row.uniqueSessions || row.statisticsViews || 1);

    grouped.set(row.pagePath, existing);
  }

  const [entries, exits] = await Promise.all([
    prisma.analyticsSession.groupBy({
      by: ["entryPage"],
      where: {
        startedAt: { gte: range.from, lte: range.to },
        entryPage: { not: null },
      },
      _count: { _all: true },
    }),
    prisma.analyticsSession.groupBy({
      by: ["exitPage"],
      where: {
        startedAt: { gte: range.from, lte: range.to },
        exitPage: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  for (const row of entries) {
    if (!row.entryPage) {
      continue;
    }

    const stat = grouped.get(row.entryPage);

    if (stat) {
      stat.entryCount = row._count._all;
    }
  }

  for (const row of exits) {
    if (!row.exitPage) {
      continue;
    }

    const stat = grouped.get(row.exitPage);

    if (stat) {
      stat.exitCount = row._count._all;
    }
  }

  return [...grouped.values()].sort((a, b) => b.views - a.views);
}

export async function getAnalyticsFunnels(
  preset: AnalyticsTimeRange = "last_7_days",
  customFrom?: string | null,
  customTo?: string | null,
): Promise<AnalyticsFunnelResult[]> {
  const range = resolveAnalyticsDateRange(preset, customFrom, customTo);

  const stats = await prisma.analyticsDailyFunnelStat.findMany({
    where: {
      statDate: {
        gte: toStatDate(range.from),
        lte: toStatDate(range.to),
      },
    },
    orderBy: [{ funnelId: "asc" }, { stepOrder: "asc" }],
  });

  return ANALYTICS_FUNNELS.map((funnel) => {
    const funnelStats = stats.filter((row) => row.funnelId === funnel.id);
    const aggregated = new Map<string, { entered: number; dropped: number; order: number }>();

    for (const row of funnelStats) {
      const current = aggregated.get(row.stepKey) ?? {
        entered: 0,
        dropped: 0,
        order: row.stepOrder,
      };

      current.entered += row.enteredCount;
      current.dropped += row.droppedCount;
      aggregated.set(row.stepKey, current);
    }

    let strongestDropStep: string | null = null;
    let strongestDropRate = -1;

    const steps = funnel.steps.map((step, index) => {
      const values = aggregated.get(step.key) ?? {
        entered: 0,
        dropped: 0,
        order: index,
      };

      const total = values.entered + values.dropped;
      const dropRate = calcRate(values.dropped, total);

      if (dropRate != null && dropRate > strongestDropRate) {
        strongestDropRate = dropRate;
        strongestDropStep = step.key;
      }

      return {
        stepKey: step.key,
        stepLabel: step.label,
        stepOrder: index,
        sessions: values.entered,
        dropRate,
        isStrongestDrop: false,
      };
    });

    return {
      funnelId: funnel.id,
      funnelLabel: funnel.label,
      steps: steps.map((step) => ({
        ...step,
        isStrongestDrop: step.stepKey === strongestDropStep,
      })),
      strongestDropStep,
    };
  });
}

export async function getAnalyticsCourses(
  preset: AnalyticsTimeRange = "last_7_days",
  customFrom?: string | null,
  customTo?: string | null,
): Promise<AnalyticsCourseStat[]> {
  const range = resolveAnalyticsDateRange(preset, customFrom, customTo);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      eventType: {
        in: ["pageview", "course_started", "lesson_started", "lesson_completed"],
      },
    },
    select: {
      eventType: true,
      pagePath: true,
      metadataJson: true,
    },
  });

  const byCourse = new Map<
    string,
    {
      views: number;
      starts: number;
      completions: number;
      lessons: Map<string, { starts: number; completions: number; title: string | null }>;
    }
  >();

  for (const event of events) {
    const meta = (event.metadataJson ?? {}) as {
      courseSlug?: string;
      lessonId?: string;
      lessonTitle?: string;
    };

    const slug =
      meta.courseSlug ??
      (event.pagePath?.includes("/akademie/kurse/")
        ? event.pagePath.split("/akademie/kurse/")[1]?.split("/")[0]
        : null);

    if (!slug) {
      continue;
    }

    const entry =
      byCourse.get(slug) ??
      {
        views: 0,
        starts: 0,
        completions: 0,
        lessons: new Map(),
      };

    if (event.eventType === "pageview") {
      entry.views += 1;
    }

    if (event.eventType === "course_started") {
      entry.starts += 1;
    }

    if (event.eventType === "lesson_completed") {
      entry.completions += 1;
    }

    if (event.eventType === "lesson_started" && meta.lessonId) {
      const lesson =
        entry.lessons.get(meta.lessonId) ??
        { starts: 0, completions: 0, title: meta.lessonTitle ?? null };

      lesson.starts += 1;
      entry.lessons.set(meta.lessonId, lesson);
    }

    if (event.eventType === "lesson_completed" && meta.lessonId) {
      const lesson =
        entry.lessons.get(meta.lessonId) ??
        { starts: 0, completions: 0, title: meta.lessonTitle ?? null };

      lesson.completions += 1;
      entry.lessons.set(meta.lessonId, lesson);
    }

    byCourse.set(slug, entry);
  }

  const slugs = [...byCourse.keys()];
  const courses = slugs.length
    ? await prisma.course.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, title: true },
      })
    : [];

  const titleBySlug = new Map(courses.map((course) => [course.slug, course.title]));

  return [...byCourse.entries()]
    .map(([courseSlug, stats]) => {
      const lessonDropoffs = [...stats.lessons.entries()]
        .map(([lessonId, lesson]) => ({
          lessonId,
          lessonTitle: lesson.title,
          dropRate: calcRate(Math.max(0, lesson.starts - lesson.completions), lesson.starts),
        }))
        .filter(
          (
            lesson,
          ): lesson is {
            lessonId: string;
            lessonTitle: string | null;
            dropRate: number;
          } => lesson.dropRate != null,
        )
        .sort((a, b) => b.dropRate - a.dropRate)
        .slice(0, 5);

      return {
        courseSlug,
        courseTitle: titleBySlug.get(courseSlug) ?? null,
        views: stats.views,
        starts: stats.starts,
        completions: stats.completions,
        abandonRate: calcRate(Math.max(0, stats.starts - stats.completions), stats.starts),
        lessonDropoffs,
      };
    })
    .sort((a, b) => b.views - a.views);
}

export async function getAnalyticsCheckout(
  preset: AnalyticsTimeRange = "last_7_days",
  customFrom?: string | null,
  customTo?: string | null,
): Promise<AnalyticsCheckoutStat> {
  const range = resolveAnalyticsDateRange(preset, customFrom, customTo);

  const [checkoutStarts, checkoutAbandons, purchases] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        eventType: "checkout_start",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        eventType: "checkout_abandon",
      },
    }),
    prisma.analyticsEvent.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        eventType: "course_purchased",
      },
    }),
  ]);

  return {
    checkoutStarts,
    checkoutAbandons,
    purchases,
    conversionRate: calcRate(purchases, checkoutStarts),
  };
}

export async function getAnalyticsDashboardTiles(): Promise<AnalyticsDashboardTiles> {
  const overview = await getAnalyticsOverview("today");
  const funnelDrop = overview.topFunnelDrop;

  return {
    visitorsToday: overview.visitorsToday,
    pageviewsToday: overview.pageviewsToday,
    checkoutAbandons: overview.checkoutAbandons,
    topPage: overview.topPage,
    topFunnelDrop: funnelDrop
      ? {
          funnelId: funnelDrop.funnelId,
          stepKey: funnelDrop.stepKey,
          label: getFunnelStepLabel(funnelDrop.funnelId, funnelDrop.stepKey),
        }
      : null,
    topCourse: overview.topCourse,
  };
}

export async function getTopSearchTerms(
  preset: AnalyticsTimeRange = "last_7_days",
  customFrom?: string | null,
  customTo?: string | null,
): Promise<{ term: string; count: number }[]> {
  const range = resolveAnalyticsDateRange(preset, customFrom, customTo);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      eventType: "search_used",
    },
    select: { metadataJson: true },
  });

  const counts = new Map<string, number>();

  for (const event of events) {
    const term = String(
      (event.metadataJson as { query?: string } | null)?.query ?? "",
    )
      .trim()
      .toLowerCase();

    if (!term) {
      continue;
    }

    counts.set(term, (counts.get(term) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}
