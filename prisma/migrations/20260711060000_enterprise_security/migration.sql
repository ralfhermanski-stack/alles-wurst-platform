-- Enterprise Security Module

CREATE TYPE "SecurityEventType" AS ENUM (
  'LOGIN_FAILED',
  'ADMIN_LOGIN_FAILED',
  'TOTP_FAILED',
  'TOTP_SUCCESS',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_ABUSE',
  'REGISTRATION_ATTEMPT',
  'REGISTRATION_SPAM',
  'API_ABUSE',
  'MASS_REQUEST',
  'BOT_ACTIVITY',
  'SUSPICIOUS_URL',
  'FORM_MANIPULATION',
  'RATE_LIMIT_EXCEEDED',
  'IP_BLOCKED',
  'IP_UNBLOCKED',
  'SESSION_REVOKED',
  'UPLOAD_REJECTED',
  'CAPTCHA_REQUIRED',
  'SECURITY_WARNING'
);

CREATE TYPE "SecurityRiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE "IpBlockLevel" AS ENUM (
  'throttle',
  'captcha',
  'temporary_30m',
  'extended_24h',
  'permanent'
);

CREATE TYPE "SecurityAuditAction" AS ENUM (
  'ROLE_CHANGE',
  'USER_UPDATE',
  'USER_SUSPEND',
  'USER_UNSUSPEND',
  'MEMBERSHIP_CHANGE',
  'COURSE_ACCESS_GRANT',
  'COURSE_ACCESS_REVOKE',
  'CERTIFICATE_ISSUE',
  'CERTIFICATE_REVOKE',
  'PAYMENT_PROCESSED',
  'IP_BLOCK',
  'IP_UNBLOCK',
  'SETTINGS_CHANGE',
  'TOTP_ENABLED',
  'TOTP_DISABLED',
  'SESSION_REVOKED',
  'SECURITY_RULE_CHANGE',
  'PERMISSION_CHANGE',
  'OTHER'
);

CREATE TYPE "SecurityAuditResult" AS ENUM ('success', 'failure', 'denied');

CREATE TABLE "security_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_type" "SecurityEventType" NOT NULL,
  "risk_level" "SecurityRiskLevel" NOT NULL DEFAULT 'low',
  "ip_address" TEXT,
  "user_agent" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "country_code" TEXT,
  "region" TEXT,
  "asn" TEXT,
  "provider" TEXT,
  "user_id" UUID,
  "path" TEXT,
  "method" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blocked_ips" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "ip_address" TEXT NOT NULL,
  "level" "IpBlockLevel" NOT NULL DEFAULT 'temporary_30m',
  "reason" TEXT,
  "notes" TEXT,
  "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  "created_by_user_id" UUID,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "action" "SecurityAuditAction" NOT NULL,
  "result" "SecurityAuditResult" NOT NULL DEFAULT 'success',
  "entity_type" TEXT,
  "entity_id" UUID,
  "actor_user_id" UUID,
  "target_user_id" UUID,
  "ip_address" TEXT,
  "description" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "device_label" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "country_code" TEXT,
  "region" TEXT,
  "ip_address" TEXT,
  "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "is_new_device" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_totp" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "secret_encrypted" TEXT NOT NULL,
  "is_enabled" BOOLEAN NOT NULL DEFAULT false,
  "enabled_at" TIMESTAMP(3),
  "last_used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_totp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "totp_backup_codes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "code_hash" TEXT NOT NULL,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "totp_backup_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "suspicious_user_flags" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "risk_level" "SecurityRiskLevel" NOT NULL DEFAULT 'medium',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  CONSTRAINT "suspicious_user_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "security_settings" (
  "id" VARCHAR(32) NOT NULL DEFAULT 'default',
  "login_fail_threshold_throttle" INTEGER NOT NULL DEFAULT 5,
  "login_fail_threshold_captcha" INTEGER NOT NULL DEFAULT 8,
  "login_fail_threshold_30m" INTEGER NOT NULL DEFAULT 10,
  "login_fail_threshold_24h" INTEGER NOT NULL DEFAULT 15,
  "login_rate_limit_per_ip" INTEGER NOT NULL DEFAULT 20,
  "register_rate_limit_per_ip" INTEGER NOT NULL DEFAULT 5,
  "password_reset_rate_limit_per_ip" INTEGER NOT NULL DEFAULT 5,
  "api_rate_limit_per_ip" INTEGER NOT NULL DEFAULT 120,
  "retention_login_attempts_days" INTEGER NOT NULL DEFAULT 90,
  "retention_security_events_days" INTEGER NOT NULL DEFAULT 365,
  "retention_blocked_ips_days" INTEGER NOT NULL DEFAULT 180,
  "retention_audit_log_days" INTEGER NOT NULL DEFAULT 730,
  "totp_required_roles" JSONB NOT NULL DEFAULT '["ADMIN","SUPERADMIN","SUPPORT","INSTRUCTOR"]',
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "security_settings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "security_events"
  ADD CONSTRAINT "security_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "blocked_ips"
  ADD CONSTRAINT "blocked_ips_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "security_audit_logs"
  ADD CONSTRAINT "security_audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "security_audit_logs"
  ADD CONSTRAINT "security_audit_logs_target_user_id_fkey"
  FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_sessions"
  ADD CONSTRAINT "user_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_totp"
  ADD CONSTRAINT "user_totp_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "totp_backup_codes"
  ADD CONSTRAINT "totp_backup_codes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "suspicious_user_flags"
  ADD CONSTRAINT "suspicious_user_flags_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "security_events_event_type_idx" ON "security_events"("event_type");
CREATE INDEX "security_events_risk_level_idx" ON "security_events"("risk_level");
CREATE INDEX "security_events_ip_address_idx" ON "security_events"("ip_address");
CREATE INDEX "security_events_user_id_idx" ON "security_events"("user_id");
CREATE INDEX "security_events_created_at_idx" ON "security_events"("created_at");
CREATE INDEX "security_events_country_code_idx" ON "security_events"("country_code");

CREATE INDEX "blocked_ips_ip_address_idx" ON "blocked_ips"("ip_address");
CREATE INDEX "blocked_ips_is_active_idx" ON "blocked_ips"("is_active");
CREATE INDEX "blocked_ips_expires_at_idx" ON "blocked_ips"("expires_at");

CREATE INDEX "security_audit_logs_action_idx" ON "security_audit_logs"("action");
CREATE INDEX "security_audit_logs_actor_user_id_idx" ON "security_audit_logs"("actor_user_id");
CREATE INDEX "security_audit_logs_target_user_id_idx" ON "security_audit_logs"("target_user_id");
CREATE INDEX "security_audit_logs_created_at_idx" ON "security_audit_logs"("created_at");

CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");
CREATE INDEX "user_sessions_token_hash_idx" ON "user_sessions"("token_hash");
CREATE INDEX "user_sessions_revoked_at_idx" ON "user_sessions"("revoked_at");

CREATE UNIQUE INDEX "user_totp_user_id_key" ON "user_totp"("user_id");

CREATE INDEX "totp_backup_codes_user_id_idx" ON "totp_backup_codes"("user_id");
CREATE INDEX "totp_backup_codes_code_hash_idx" ON "totp_backup_codes"("code_hash");

CREATE INDEX "suspicious_user_flags_user_id_idx" ON "suspicious_user_flags"("user_id");
CREATE INDEX "suspicious_user_flags_is_active_idx" ON "suspicious_user_flags"("is_active");

INSERT INTO "security_settings" ("id", "updated_at")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
