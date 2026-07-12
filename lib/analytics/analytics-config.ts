/**
 * @file analytics-config.ts
 * @purpose Konfiguration für Analytics (Retention, Admin-Ausschluss).
 */

export const CONSENT_COOKIE_NAME = "aw_consent";
export const ANALYTICS_SESSION_COOKIE_NAME = "aw_analytics_sid";

export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const ANALYTICS_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export const RAW_DATA_RETENTION_DAYS = Number(
  process.env.ANALYTICS_RAW_RETENTION_DAYS ?? "90",
);

export function isAnalyticsExcludeAdminsEnabled(): boolean {
  const value = process.env.ANALYTICS_EXCLUDE_ADMINS?.trim().toLowerCase();

  if (!value) {
    return true;
  }

  return value !== "false" && value !== "0";
}

export function getAnalyticsCronSecret(): string | null {
  return (
    process.env.ANALYTICS_CRON_SECRET?.trim() ??
    process.env.PAGE_SEO_CRON_SECRET?.trim() ??
    null
  );
}

export const ANALYTICS_PRIVACY_NOTE =
  "Alle angezeigten Statistiken sind aggregiert. Es werden keine einzelnen Nutzerprofile angezeigt.";
