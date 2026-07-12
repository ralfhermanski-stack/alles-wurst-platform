/**
 * @file analytics-types.ts
 * @purpose Typen für First-Party-Analytics.
 */

export type AnalyticsTimeRange =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom";

export type AnalyticsDateRange = {
  from: Date;
  to: Date;
  preset: AnalyticsTimeRange;
};

export type AnalyticsConsentState = {
  necessary: true;
  statistics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type AnalyticsEventInput = {
  eventType: string;
  pagePath?: string | null;
  pageType?: string | null;
  referrerDomain?: string | null;
  metadata?: Record<string, unknown> | null;
  durationSeconds?: number | null;
};

export type AnalyticsBatchInput = {
  events: AnalyticsEventInput[];
  pagePath?: string | null;
  referrer?: string | null;
};

export type AnalyticsOverviewStats = {
  visitorsToday: number;
  visitors7Days: number;
  visitors30Days: number;
  pageviewsToday: number;
  pageviews7Days: number;
  pageviews30Days: number;
  avgDurationSeconds: number | null;
  bounceRate: number | null;
  checkoutAbandons: number;
  topPage: { path: string; views: number } | null;
  topFunnelDrop: { funnelId: string; stepKey: string; dropRate: number } | null;
  topCourse: { courseSlug: string; activity: number } | null;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  browserBreakdown: { browser: string; count: number }[];
  countryBreakdown: { countryCode: string; count: number }[];
  referrerDomains: { domain: string; count: number }[];
  conversionRates: {
    visitorToRegistration: number | null;
    visitorToCheckout: number | null;
    checkoutToPurchase: number | null;
    registrationToCourseStart: number | null;
    courseStartToCompletion: number | null;
  };
  membershipSignups: number;
  newsletterConversions: number;
  ticketVolume: number;
  communityActivity: number;
  privacyNote: string;
};

export type AnalyticsPageStat = {
  pagePath: string;
  pageType: string;
  views: number;
  uniqueSessions: number;
  avgDurationSeconds: number | null;
  avgScrollDepth: number | null;
  bounceRate: number | null;
  entryCount: number;
  exitCount: number;
};

export type AnalyticsFunnelStep = {
  stepKey: string;
  stepLabel: string;
  stepOrder: number;
  sessions: number;
  dropRate: number | null;
  isStrongestDrop: boolean;
};

export type AnalyticsFunnelResult = {
  funnelId: string;
  funnelLabel: string;
  steps: AnalyticsFunnelStep[];
  strongestDropStep: string | null;
};

export type AnalyticsCourseStat = {
  courseSlug: string;
  courseTitle: string | null;
  views: number;
  starts: number;
  completions: number;
  abandonRate: number | null;
  lessonDropoffs: { lessonId: string; lessonTitle: string | null; dropRate: number }[];
};

export type AnalyticsCheckoutStat = {
  checkoutStarts: number;
  checkoutAbandons: number;
  purchases: number;
  conversionRate: number | null;
};

export type AnalyticsDashboardTiles = {
  visitorsToday: number;
  pageviewsToday: number;
  checkoutAbandons: number;
  topPage: { path: string; views: number } | null;
  topFunnelDrop: { funnelId: string; stepKey: string; label: string } | null;
  topCourse: { courseSlug: string; activity: number } | null;
};
