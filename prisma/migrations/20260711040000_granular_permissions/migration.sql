-- Granulares Berechtigungssystem: Gruppen, Katalog, Audit

CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

CREATE TYPE "UserGroupStatus" AS ENUM ('active', 'deactivated', 'archived');

CREATE TYPE "PermissionAuditAction" AS ENUM (
  'group_created',
  'group_updated',
  'group_deleted',
  'group_duplicated',
  'group_archived',
  'group_deactivated',
  'group_member_added',
  'group_member_removed',
  'group_permission_allowed',
  'group_permission_denied',
  'group_permission_removed',
  'user_permission_allowed',
  'user_permission_denied',
  'user_permission_removed',
  'admin_right_granted',
  'admin_right_revoked',
  'superadmin_change_attempt',
  'unauthorized_access',
  'membership_group_sync'
);

ALTER TYPE "UserSystemRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

CREATE TABLE "permissions" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "area_key" TEXT,
  "action_key" TEXT,
  "is_critical" BOOLEAN NOT NULL DEFAULT false,
  "super_admin_only" BOOLEAN NOT NULL DEFAULT false,
  "is_system" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "permissions_category_idx" ON "permissions"("category");
CREATE INDEX "permissions_area_key_idx" ON "permissions"("area_key");

CREATE TABLE "user_groups" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "internal_note" TEXT,
  "color" TEXT DEFAULT '#C9A227',
  "priority" INTEGER NOT NULL DEFAULT 100,
  "is_system" BOOLEAN NOT NULL DEFAULT false,
  "status" "UserGroupStatus" NOT NULL DEFAULT 'active',
  "linked_membership_role" "MembershipRole",
  "linked_system_role" "UserSystemRole",
  "archived_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_groups_slug_key" ON "user_groups"("slug");
CREATE UNIQUE INDEX "user_groups_linked_membership_role_key" ON "user_groups"("linked_membership_role");
CREATE UNIQUE INDEX "user_groups_linked_system_role_key" ON "user_groups"("linked_system_role");
CREATE INDEX "user_groups_status_idx" ON "user_groups"("status");
CREATE INDEX "user_groups_priority_idx" ON "user_groups"("priority");

CREATE TABLE "user_group_permissions" (
  "id" UUID NOT NULL,
  "group_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  "effect" "PermissionEffect" NOT NULL DEFAULT 'ALLOW',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_group_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_group_permissions_group_id_permission_id_key" ON "user_group_permissions"("group_id", "permission_id");
CREATE INDEX "user_group_permissions_permission_id_idx" ON "user_group_permissions"("permission_id");

CREATE TABLE "user_group_members" (
  "id" UUID NOT NULL,
  "group_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "valid_from" TIMESTAMP(3),
  "valid_until" TIMESTAMP(3),
  "is_manual" BOOLEAN NOT NULL DEFAULT true,
  "assigned_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_group_members_group_id_user_id_key" ON "user_group_members"("group_id", "user_id");
CREATE INDEX "user_group_members_user_id_idx" ON "user_group_members"("user_id");
CREATE INDEX "user_group_members_valid_until_idx" ON "user_group_members"("valid_until");

CREATE TABLE "user_permissions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  "effect" "PermissionEffect" NOT NULL,
  "valid_from" TIMESTAMP(3),
  "valid_until" TIMESTAMP(3),
  "assigned_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key" ON "user_permissions"("user_id", "permission_id");
CREATE INDEX "user_permissions_permission_id_idx" ON "user_permissions"("permission_id");
CREATE INDEX "user_permissions_valid_until_idx" ON "user_permissions"("valid_until");

CREATE TABLE "route_permissions" (
  "id" UUID NOT NULL,
  "route_key" TEXT NOT NULL,
  "route_pattern" TEXT NOT NULL,
  "permission_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "route_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "route_permissions_route_key_key" ON "route_permissions"("route_key");
CREATE INDEX "route_permissions_permission_id_idx" ON "route_permissions"("permission_id");

CREATE TABLE "feature_permissions" (
  "id" UUID NOT NULL,
  "feature_key" TEXT NOT NULL,
  "permission_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feature_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feature_permissions_feature_key_key" ON "feature_permissions"("feature_key");
CREATE INDEX "feature_permissions_permission_id_idx" ON "feature_permissions"("permission_id");

CREATE TABLE "permission_audit_logs" (
  "id" UUID NOT NULL,
  "action" "PermissionAuditAction" NOT NULL,
  "actor_user_id" UUID,
  "target_user_id" UUID,
  "target_group_id" UUID,
  "target_group_name" TEXT,
  "permission_key" TEXT,
  "previous_values" JSONB,
  "new_values" JSONB,
  "summary" TEXT NOT NULL,
  "note" TEXT,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permission_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "permission_audit_logs_actor_user_id_idx" ON "permission_audit_logs"("actor_user_id");
CREATE INDEX "permission_audit_logs_target_user_id_idx" ON "permission_audit_logs"("target_user_id");
CREATE INDEX "permission_audit_logs_target_group_id_idx" ON "permission_audit_logs"("target_group_id");
CREATE INDEX "permission_audit_logs_created_at_idx" ON "permission_audit_logs"("created_at");
CREATE INDEX "permission_audit_logs_action_idx" ON "permission_audit_logs"("action");

ALTER TABLE "user_group_permissions" ADD CONSTRAINT "user_group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_group_permissions" ADD CONSTRAINT "user_group_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "route_permissions" ADD CONSTRAINT "route_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feature_permissions" ADD CONSTRAINT "feature_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
