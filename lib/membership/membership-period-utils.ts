/**
 * @file membership-period-utils.ts
 * @purpose Hilfsfunktionen für Laufzeit und Erinnerungsfristen.
 */

import type { BillingPeriod, Membership } from "@prisma/client";

export const MEMBERSHIP_TIMEZONE = "Europe/Berlin";

export const RENEWAL_REMINDER_LEAD_DAYS: Record<
  Extract<BillingPeriod, "monthly" | "yearly">,
  number
> = {
  monthly: 7,
  yearly: 30,
};

export function getEffectiveMembershipEnd(
  membership: Pick<Membership, "extendedUntil" | "endsAt">,
): Date | null {
  return membership.extendedUntil ?? membership.endsAt ?? null;
}

/** Kalendertage zwischen zwei Zeitpunkten (Europe/Berlin, Mitternacht). */
export function calendarDaysUntil(
  target: Date,
  from: Date = new Date(),
  timeZone = MEMBERSHIP_TIMEZONE,
): number {
  const targetKey = dateKeyInTimeZone(target, timeZone);
  const fromKey = dateKeyInTimeZone(from, timeZone);
  const targetMs = parseDateKey(targetKey).getTime();
  const fromMs = parseDateKey(fromKey).getTime();
  return Math.round((targetMs - fromMs) / 86_400_000);
}

export function dateKeyInTimeZone(
  date: Date,
  timeZone = MEMBERSHIP_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatMembershipDate(
  date: Date | null | undefined,
  locale = "de-DE",
): string {
  if (!date) {
    return "—";
  }

  return date.toLocaleDateString(locale, {
    timeZone: MEMBERSHIP_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function resolveRenewalLeadDays(
  billingPeriod: BillingPeriod | null | undefined,
): number | null {
  if (billingPeriod === "monthly" || billingPeriod === "yearly") {
    return RENEWAL_REMINDER_LEAD_DAYS[billingPeriod];
  }

  return null;
}

export function isRecurringMembershipPeriod(
  billingPeriod: BillingPeriod | null | undefined,
): billingPeriod is Extract<BillingPeriod, "monthly" | "yearly"> {
  return billingPeriod === "monthly" || billingPeriod === "yearly";
}
