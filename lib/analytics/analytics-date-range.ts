/**
 * @file analytics-date-range.ts
 * @purpose Zeitraumfilter für Admin-Auswertungen.
 */

import type { AnalyticsDateRange, AnalyticsTimeRange } from "./analytics-types";

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

export function resolveAnalyticsDateRange(
  preset: AnalyticsTimeRange,
  customFrom?: string | null,
  customTo?: string | null,
  now = new Date(),
): AnalyticsDateRange {
  const today = startOfDay(now);

  switch (preset) {
    case "today":
      return { from: today, to: endOfDay(now), preset };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: endOfDay(yesterday), preset };
    }
    case "last_7_days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay(now), preset };
    }
    case "last_30_days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay(now), preset };
    }
    case "this_month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: endOfDay(now), preset };
    }
    case "last_month": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
      return { from, to, preset };
    }
    case "custom": {
      const from = customFrom ? startOfDay(new Date(customFrom)) : today;
      const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      return { from, to, preset };
    }
    default:
      return resolveAnalyticsDateRange("last_7_days", null, null, now);
  }
}

export function toStatDate(date: Date): Date {
  return startOfDay(date);
}
