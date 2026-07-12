-- Admin-Benutzerverwaltung: Kontostatus, erweiterte Rollen, Audit-Aktionen

ALTER TYPE "UserSystemRole" ADD VALUE IF NOT EXISTS 'SUPPORT';
ALTER TYPE "UserSystemRole" ADD VALUE IF NOT EXISTS 'INSTRUCTOR';

CREATE TYPE "UserAccountStatus" AS ENUM ('active', 'suspended', 'deactivated');

ALTER TABLE "users" ADD COLUMN "account_status" "UserAccountStatus" NOT NULL DEFAULT 'active';

ALTER TYPE "MembershipAuditAction" ADD VALUE IF NOT EXISTS 'user_suspend';
ALTER TYPE "MembershipAuditAction" ADD VALUE IF NOT EXISTS 'user_activate';
ALTER TYPE "MembershipAuditAction" ADD VALUE IF NOT EXISTS 'user_deactivate';
ALTER TYPE "MembershipAuditAction" ADD VALUE IF NOT EXISTS 'system_role_change';
ALTER TYPE "MembershipAuditAction" ADD VALUE IF NOT EXISTS 'course_access_grant';
ALTER TYPE "MembershipAuditAction" ADD VALUE IF NOT EXISTS 'course_access_revoke';
