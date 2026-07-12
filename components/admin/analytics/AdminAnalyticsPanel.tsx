"use client";

import { useEffect, useState } from "react";

import {
  fetchAdminAnalyticsCheckoutApi,
  fetchAdminAnalyticsCoursesApi,
  fetchAdminAnalyticsFunnelsApi,
  fetchAdminAnalyticsOverviewApi,
  fetchAdminAnalyticsPagesApi,
} from "@/lib/admin/admin-analytics-client";
import type { AdminApiResponse } from "@/lib/admin/admin-fetch";
import type {
  AnalyticsCheckoutStat,
  AnalyticsCourseStat,
  AnalyticsFunnelResult,
  AnalyticsOverviewStats,
  AnalyticsPageStat,
  AnalyticsTimeRange,
} from "@/lib/analytics/analytics-types";

const RANGE_OPTIONS: { value: AnalyticsTimeRange; label: string }[] = [
  { value: "today", label: "Heute" },
  { value: "yesterday", label: "Gestern" },
  { value: "last_7_days", label: "Letzte 7 Tage" },
  { value: "last_30_days", label: "Letzte 30 Tage" },
  { value: "this_month", label: "Dieser Monat" },
  { value: "last_month", label: "Letzter Monat" },
  { value: "custom", label: "Benutzerdefiniert" },
];

function getAdminApiErrorMessage<T>(
  response: AdminApiResponse<T>,
): string | null {
  return response.success ? null : response.error.message;
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-aw-border bg-aw-surface p-4">
      <p className="text-sm text-aw-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-aw-cream">{value}</p>
      {hint && <p className="mt-1 text-xs text-aw-muted">{hint}</p>}
    </div>
  );
}

function formatPercent(value: number | null): string {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(1)} %`;
}

export default function AdminAnalyticsPanel() {
  const [range, setRange] = useState<AnalyticsTimeRange>("last_7_days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverviewStats | null>(null);
  const [pages, setPages] = useState<AnalyticsPageStat[]>([]);
  const [searchTerms, setSearchTerms] = useState<{ term: string; count: number }[]>([]);
  const [funnels, setFunnels] = useState<AnalyticsFunnelResult[]>([]);
  const [courses, setCourses] = useState<AnalyticsCourseStat[]>([]);
  const [checkout, setCheckout] = useState<AnalyticsCheckoutStat | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      const from = range === "custom" ? customFrom : undefined;
      const to = range === "custom" ? customTo : undefined;

      const [overviewRes, pagesRes, funnelsRes, coursesRes, checkoutRes] =
        await Promise.all([
          fetchAdminAnalyticsOverviewApi(range, from, to),
          fetchAdminAnalyticsPagesApi(range, from, to),
          fetchAdminAnalyticsFunnelsApi(range, from, to),
          fetchAdminAnalyticsCoursesApi(range, from, to),
          fetchAdminAnalyticsCheckoutApi(range, from, to),
        ]);

      if (cancelled) {
        return;
      }

      const errorMessage =
        getAdminApiErrorMessage(overviewRes) ??
        getAdminApiErrorMessage(pagesRes) ??
        getAdminApiErrorMessage(funnelsRes) ??
        getAdminApiErrorMessage(coursesRes) ??
        getAdminApiErrorMessage(checkoutRes);

      if (errorMessage) {
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (
        !overviewRes.success ||
        !pagesRes.success ||
        !funnelsRes.success ||
        !coursesRes.success ||
        !checkoutRes.success
      ) {
        setError("Statistiken konnten nicht geladen werden.");
        setLoading(false);
        return;
      }

      setOverview(overviewRes.data);
      setPages(pagesRes.data.pages);
      setSearchTerms(pagesRes.data.searchTerms);
      setFunnels(funnelsRes.data);
      setCourses(coursesRes.data);
      setCheckout(checkoutRes.data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [range, customFrom, customTo]);

  if (loading) {
    return <p className="text-sm text-aw-muted">Statistiken werden geladen …</p>;
  }

  if (error || !overview) {
    return (
      <p className="text-sm text-aw-warning" role="alert">
        {error ?? "Statistiken konnten nicht geladen werden."}
      </p>
    );
  }

  const hasData =
    overview.pageviewsToday > 0 ||
    pages.length > 0 ||
    funnels.some((funnel) => funnel.steps.some((step) => step.sessions > 0));

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 p-4 text-sm text-aw-muted">
        {overview.privacyNote}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-aw-muted">
          Zeitraum
          <select
            value={range}
            onChange={(event) =>
              setRange(event.target.value as AnalyticsTimeRange)
            }
            className="mt-1 block rounded-lg border border-aw-border bg-aw-surface px-3 py-2 text-aw-cream"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {range === "custom" && (
          <>
            <label className="text-sm text-aw-muted">
              Von
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="mt-1 block rounded-lg border border-aw-border bg-aw-surface px-3 py-2 text-aw-cream"
              />
            </label>
            <label className="text-sm text-aw-muted">
              Bis
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="mt-1 block rounded-lg border border-aw-border bg-aw-surface px-3 py-2 text-aw-cream"
              />
            </label>
          </>
        )}
      </div>

      {!hasData && (
        <div className="rounded-xl border border-aw-border bg-aw-surface p-6 text-sm text-aw-muted">
          Noch keine Statistikdaten vorhanden. Sobald Besucher die Website nutzen,
          erscheinen hier aggregierte Auswertungen.
        </div>
      )}

      <section>
        <h2 className="font-display text-lg font-bold text-aw-cream">Überblick</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Besucher heute" value={overview.visitorsToday} />
          <MetricCard label="Besucher 7 Tage" value={overview.visitors7Days} />
          <MetricCard label="Besucher 30 Tage" value={overview.visitors30Days} />
          <MetricCard label="Seitenaufrufe heute" value={overview.pageviewsToday} />
          <MetricCard label="Seitenaufrufe 7 Tage" value={overview.pageviews7Days} />
          <MetricCard label="Seitenaufrufe 30 Tage" value={overview.pageviews30Days} />
          <MetricCard
            label="Ø Verweildauer"
            value={
              overview.avgDurationSeconds != null
                ? `${overview.avgDurationSeconds} s`
                : "—"
            }
          />
          <MetricCard
            label="Absprungrate"
            value={formatPercent(overview.bounceRate)}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-aw-cream">Conversion</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Besucher → Registrierung"
            value={formatPercent(overview.conversionRates.visitorToRegistration)}
          />
          <MetricCard
            label="Besucher → Checkout"
            value={formatPercent(overview.conversionRates.visitorToCheckout)}
          />
          <MetricCard
            label="Checkout → Kauf"
            value={formatPercent(overview.conversionRates.checkoutToPurchase)}
          />
          <MetricCard
            label="Registrierung → Kursstart"
            value={formatPercent(overview.conversionRates.registrationToCourseStart)}
          />
          <MetricCard
            label="Kursstart → Abschluss"
            value={formatPercent(overview.conversionRates.courseStartToCompletion)}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Beliebteste Seiten</h3>
          {pages.length === 0 ? (
            <p className="mt-3 text-sm text-aw-muted">Keine Daten</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {pages.slice(0, 10).map((page) => (
                <li key={page.pagePath} className="flex justify-between gap-3">
                  <span className="truncate text-aw-cream">{page.pagePath}</span>
                  <span className="text-aw-muted">{page.views}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Interne Suche</h3>
          {searchTerms.length === 0 ? (
            <p className="mt-3 text-sm text-aw-muted">Keine Suchbegriffe</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {searchTerms.slice(0, 10).map((entry) => (
                <li key={entry.term} className="flex justify-between gap-3">
                  <span className="text-aw-cream">{entry.term}</span>
                  <span className="text-aw-muted">{entry.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-aw-cream">Funnels</h2>
        <div className="mt-4 space-y-4">
          {funnels.map((funnel) => (
            <div
              key={funnel.funnelId}
              className="rounded-xl border border-aw-border bg-aw-surface p-5"
            >
              <h3 className="font-semibold text-aw-cream">{funnel.funnelLabel}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {funnel.steps.map((step) => (
                  <div
                    key={step.stepKey}
                    className={`rounded-lg border p-3 text-sm ${
                      step.isStrongestDrop
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-aw-border"
                    }`}
                  >
                    <p className="font-medium text-aw-cream">{step.stepLabel}</p>
                    <p className="mt-1 text-aw-muted">Sessions: {step.sessions}</p>
                    <p className="text-aw-muted">
                      Abbruch: {formatPercent(step.dropRate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Kurse</h3>
          {courses.length === 0 ? (
            <p className="mt-3 text-sm text-aw-muted">Keine Kursdaten</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {courses.slice(0, 8).map((course) => (
                <li key={course.courseSlug} className="border-b border-aw-border pb-2">
                  <p className="font-medium text-aw-cream">
                    {course.courseTitle ?? course.courseSlug}
                  </p>
                  <p className="text-aw-muted">
                    Aufrufe {course.views} · Starts {course.starts} · Abschlüsse{" "}
                    {course.completions}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Checkout</h3>
          {checkout ? (
            <div className="mt-3 space-y-2 text-sm text-aw-muted">
              <p>Checkout gestartet: {checkout.checkoutStarts}</p>
              <p>Checkout abgebrochen: {checkout.checkoutAbandons}</p>
              <p>Käufe: {checkout.purchases}</p>
              <p>Conversion: {formatPercent(checkout.conversionRate)}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-aw-muted">Keine Checkout-Daten</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Geräte</h3>
          <ul className="mt-3 space-y-1 text-sm text-aw-muted">
            <li>Desktop: {overview.deviceBreakdown.desktop}</li>
            <li>Mobil: {overview.deviceBreakdown.mobile}</li>
            <li>Tablet: {overview.deviceBreakdown.tablet}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Browser</h3>
          <ul className="mt-3 space-y-1 text-sm text-aw-muted">
            {overview.browserBreakdown.slice(0, 6).map((entry) => (
              <li key={entry.browser}>
                {entry.browser}: {entry.count}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
          <h3 className="font-semibold text-aw-cream">Referrer</h3>
          <ul className="mt-3 space-y-1 text-sm text-aw-muted">
            {overview.referrerDomains.length === 0 ? (
              <li>Keine externen Referrer</li>
            ) : (
              overview.referrerDomains.map((entry) => (
                <li key={entry.domain}>
                  {entry.domain}: {entry.count}
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
