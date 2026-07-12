"use client";

import { useCallback } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics/analytics-client";

export function useAnalytics() {
  const track = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      trackAnalyticsEvent(eventType, metadata);
    },
    [],
  );

  return { track };
}
