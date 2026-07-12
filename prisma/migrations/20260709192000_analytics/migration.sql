-- Analytics — First-Party, consent-basiert

CREATE TYPE "AnalyticsConsentAction" AS ENUM ('granted', 'denied', 'updated', 'revoked');
CREATE TYPE "AnalyticsTrackingLevel" AS ENUM ('basic', 'statistics');

CREATE TABLE "analytics_consent_log" (
    "id" TEXT NOT NULL,
    "statistics_consent" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "action" "AnalyticsConsentAction" NOT NULL,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_consent_log_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "analytics_consent_log_created_at_idx" ON "analytics_consent_log"("created_at");

CREATE TABLE "analytics_sessions" (
    "id" TEXT NOT NULL,
    "session_key" TEXT NOT NULL,
    "user_id" UUID,
    "entry_page" TEXT,
    "exit_page" TEXT,
    "device_type" TEXT,
    "browser_family" TEXT,
    "country_code" TEXT,
    "referrer_domain" TEXT,
    "pageview_count" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "analytics_sessions_session_key_key" ON "analytics_sessions"("session_key");
CREATE INDEX "analytics_sessions_user_id_idx" ON "analytics_sessions"("user_id");
CREATE INDEX "analytics_sessions_started_at_idx" ON "analytics_sessions"("started_at");
CREATE INDEX "analytics_sessions_last_activity_at_idx" ON "analytics_sessions"("last_activity_at");

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" UUID,
    "tracking_level" "AnalyticsTrackingLevel" NOT NULL DEFAULT 'statistics',
    "event_type" TEXT NOT NULL,
    "page_path" TEXT,
    "page_type" TEXT,
    "referrer_domain" TEXT,
    "device_type" TEXT,
    "browser_family" TEXT,
    "country_code" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events"("event_type");
CREATE INDEX "analytics_events_page_path_idx" ON "analytics_events"("page_path");
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");
CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events"("session_id");
CREATE INDEX "analytics_events_tracking_level_idx" ON "analytics_events"("tracking_level");
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analytics_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "analytics_daily_page_stats" (
    "id" TEXT NOT NULL,
    "stat_date" DATE NOT NULL,
    "page_path" TEXT NOT NULL,
    "page_type" TEXT NOT NULL DEFAULT 'page',
    "basic_views" INTEGER NOT NULL DEFAULT 0,
    "statistics_views" INTEGER NOT NULL DEFAULT 0,
    "unique_sessions" INTEGER NOT NULL DEFAULT 0,
    "total_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "duration_samples" INTEGER NOT NULL DEFAULT 0,
    "total_scroll_depth" INTEGER NOT NULL DEFAULT 0,
    "scroll_samples" INTEGER NOT NULL DEFAULT 0,
    "bounces" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "analytics_daily_page_stats_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "analytics_daily_page_stats_stat_date_page_path_key" ON "analytics_daily_page_stats"("stat_date", "page_path");
CREATE INDEX "analytics_daily_page_stats_stat_date_idx" ON "analytics_daily_page_stats"("stat_date");
CREATE INDEX "analytics_daily_page_stats_page_path_idx" ON "analytics_daily_page_stats"("page_path");

CREATE TABLE "analytics_daily_funnel_stats" (
    "id" TEXT NOT NULL,
    "stat_date" DATE NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "step_key" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "entered_count" INTEGER NOT NULL DEFAULT 0,
    "completed_count" INTEGER NOT NULL DEFAULT 0,
    "dropped_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "analytics_daily_funnel_stats_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "analytics_daily_funnel_stats_stat_date_funnel_id_step_key_key" ON "analytics_daily_funnel_stats"("stat_date", "funnel_id", "step_key");
CREATE INDEX "analytics_daily_funnel_stats_stat_date_idx" ON "analytics_daily_funnel_stats"("stat_date");
CREATE INDEX "analytics_daily_funnel_stats_funnel_id_idx" ON "analytics_daily_funnel_stats"("funnel_id");

CREATE TABLE "analytics_daily_metrics" (
    "id" TEXT NOT NULL,
    "stat_date" DATE NOT NULL,
    "metric_key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "analytics_daily_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "analytics_daily_metrics_stat_date_metric_key_key" ON "analytics_daily_metrics"("stat_date", "metric_key");
CREATE INDEX "analytics_daily_metrics_stat_date_idx" ON "analytics_daily_metrics"("stat_date");
