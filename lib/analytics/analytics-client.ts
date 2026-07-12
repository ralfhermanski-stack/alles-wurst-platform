/**
 * @file analytics-client.ts
 * @purpose Client-seitiges First-Party-Tracking (nur mit Statistik-Consent).
 */

import type { AnalyticsConsentState } from "./analytics-types";

type QueuedEvent = {
  eventType: string;
  pagePath?: string;
  pageType?: string;
  metadata?: Record<string, unknown>;
  durationSeconds?: number;
};

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let consentState: AnalyticsConsentState | null = null;
let currentPath: string | null = null;
let pageEnteredAt = Date.now();
let scrollMarks = new Set<number>();

function canTrack(): boolean {
  return Boolean(consentState?.statistics);
}

function scheduleFlush() {
  if (flushTimer) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushQueue();
  }, 1500);
}

async function flushQueue() {
  if (!canTrack() || queue.length === 0) {
    return;
  }

  const events = [...queue];
  queue = [];

  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events,
        pagePath: currentPath,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    });
  } catch {
    queue = [...events, ...queue];
  }
}

export function setAnalyticsConsent(state: AnalyticsConsentState | null) {
  consentState = state;

  if (!state?.statistics) {
    queue = [];
    scrollMarks.clear();
  }
}

export function trackAnalyticsEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
) {
  if (!canTrack()) {
    return;
  }

  queue.push({
    eventType,
    pagePath: currentPath ?? window.location.pathname,
    metadata,
  });

  scheduleFlush();
}

export function trackPageview(pathname: string) {
  if (!canTrack()) {
    return;
  }

  const previousPath = currentPath;

  if (previousPath) {
    const durationSeconds = Math.round((Date.now() - pageEnteredAt) / 1000);

    if (durationSeconds > 0) {
      queue.push({
        eventType: "page_duration",
        pagePath: previousPath,
        durationSeconds,
      });
    }
  }

  currentPath = pathname;
  pageEnteredAt = Date.now();
  scrollMarks = new Set();

  queue.push({
    eventType: "pageview",
    pagePath: pathname,
  });

  scheduleFlush();
}

export function initScrollTracking() {
  if (!canTrack()) {
    return;
  }

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const height = doc.scrollHeight - window.innerHeight;

    if (height <= 0) {
      return;
    }

    const percent = Math.round((scrollTop / height) * 100);

    for (const mark of [25, 50, 75, 100]) {
      if (percent >= mark && !scrollMarks.has(mark)) {
        scrollMarks.add(mark);
        trackAnalyticsEvent("scroll_depth", { depth: mark });
      }
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}

export function initClickTracking() {
  if (!canTrack()) {
    return;
  }

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const element = target?.closest("[data-analytics-event]") as HTMLElement | null;

    if (!element) {
      return;
    }

    const eventType = element.dataset.analyticsEvent;

    if (!eventType) {
      return;
    }

    const metadata: Record<string, unknown> = {};

    if (element.dataset.analyticsLabel) {
      metadata.label = element.dataset.analyticsLabel;
    }

    if (element.dataset.analyticsCourse) {
      metadata.courseSlug = element.dataset.analyticsCourse;
    }

    trackAnalyticsEvent(eventType, metadata);
  });
}

export function flushAnalyticsBeforeUnload() {
  if (!canTrack() || queue.length === 0) {
    return;
  }

  const events = [...queue];
  queue = [];

  const blob = new Blob(
    [
      JSON.stringify({
        events,
        pagePath: currentPath,
        referrer: document.referrer || null,
      }),
    ],
    { type: "application/json" },
  );

  navigator.sendBeacon("/api/analytics/event", blob);
}
