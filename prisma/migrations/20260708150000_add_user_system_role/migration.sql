-- Systemrolle (USER/ADMIN) getrennt von Mitgliedschaft
CREATE TYPE "UserSystemRole" AS ENUM ('USER', 'ADMIN');

ALTER TABLE "users" ADD COLUMN "system_role" "UserSystemRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);

-- Bestehende Membership-Admin-Rollen auf Systemrolle migrieren
UPDATE "users" u
SET "system_role" = 'ADMIN'
FROM "memberships" m
WHERE m."user_id" = u."id" AND m."role" = 'admin';
