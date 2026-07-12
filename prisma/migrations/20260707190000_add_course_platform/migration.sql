-- AlterEnum
ALTER TYPE "CourseAccessSource" ADD VALUE 'membership_bonus';

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('minikurs', 'zertifikatskurs');
CREATE TYPE "CourseStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "CourseLessonType" AS ENUM ('video', 'text', 'download', 'recipe', 'certificate');
CREATE TYPE "CourseCertificateType" AS ENUM ('none', 'participation', 'achievement', 'masterclass');
CREATE TYPE "UserCertificateStatus" AS ENUM ('locked', 'available', 'issued');

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "learning_goals" TEXT,
    "course_type" "CourseType" NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'draft',
    "certificate_type" "CourseCertificateType" NOT NULL DEFAULT 'participation',
    "estimated_minutes" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "product_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lesson_type" "CourseLessonType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER,
    "text_content" TEXT,
    "vimeo_video_id" TEXT,
    "download_storage_key" TEXT,
    "download_file_name" TEXT,
    "recipe_id" UUID,
    "recipe_title" TEXT,
    "recipe_content" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_lesson_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "last_viewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_course_access" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "CourseAccessStatus" NOT NULL DEFAULT 'active',
    "source" "CourseAccessSource" NOT NULL,
    "granted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "note" TEXT,
    "course_access_id" UUID,
    "admin_granted_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_course_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_course_rules" (
    "id" UUID NOT NULL,
    "membership_role" "MembershipRole" NOT NULL,
    "course_id" UUID NOT NULL,
    "billing_period" "BillingPeriod",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_course_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_course_certificates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "certificate_type" "CourseCertificateType" NOT NULL,
    "status" "UserCertificateStatus" NOT NULL DEFAULT 'locked',
    "issued_at" TIMESTAMP(3),
    "certificate_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_course_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE UNIQUE INDEX "courses_product_id_key" ON "courses"("product_id");
CREATE INDEX "courses_status_idx" ON "courses"("status");
CREATE INDEX "courses_course_type_idx" ON "courses"("course_type");
CREATE INDEX "courses_sort_order_idx" ON "courses"("sort_order");

CREATE INDEX "course_modules_course_id_idx" ON "course_modules"("course_id");
CREATE INDEX "course_modules_course_id_sort_order_idx" ON "course_modules"("course_id", "sort_order");

CREATE UNIQUE INDEX "course_lessons_module_id_slug_key" ON "course_lessons"("module_id", "slug");
CREATE INDEX "course_lessons_module_id_idx" ON "course_lessons"("module_id");
CREATE INDEX "course_lessons_module_id_sort_order_idx" ON "course_lessons"("module_id", "sort_order");

CREATE UNIQUE INDEX "course_lesson_progress_user_id_lesson_id_key" ON "course_lesson_progress"("user_id", "lesson_id");
CREATE INDEX "course_lesson_progress_user_id_idx" ON "course_lesson_progress"("user_id");
CREATE INDEX "course_lesson_progress_lesson_id_idx" ON "course_lesson_progress"("lesson_id");

CREATE UNIQUE INDEX "user_course_access_user_id_course_id_key" ON "user_course_access"("user_id", "course_id");
CREATE UNIQUE INDEX "user_course_access_course_access_id_key" ON "user_course_access"("course_access_id");
CREATE INDEX "user_course_access_status_idx" ON "user_course_access"("status");
CREATE INDEX "user_course_access_course_id_idx" ON "user_course_access"("course_id");

CREATE UNIQUE INDEX "membership_course_rules_membership_role_course_id_key" ON "membership_course_rules"("membership_role", "course_id");
CREATE INDEX "membership_course_rules_membership_role_idx" ON "membership_course_rules"("membership_role");
CREATE INDEX "membership_course_rules_course_id_idx" ON "membership_course_rules"("course_id");

CREATE UNIQUE INDEX "user_course_certificates_user_id_course_id_key" ON "user_course_certificates"("user_id", "course_id");
CREATE INDEX "user_course_certificates_status_idx" ON "user_course_certificates"("status");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_lesson_progress" ADD CONSTRAINT "course_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_lesson_progress" ADD CONSTRAINT "course_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_course_rules" ADD CONSTRAINT "membership_course_rules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_course_certificates" ADD CONSTRAINT "user_course_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_course_certificates" ADD CONSTRAINT "user_course_certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: Beispielkurs mit Modulen und Lektionen
INSERT INTO "courses" (
    "id", "slug", "title", "subtitle", "description", "learning_goals",
    "course_type", "status", "certificate_type", "estimated_minutes",
    "sort_order", "product_id", "published_at", "updated_at"
) VALUES (
    'c1000000-0000-4000-8000-000000000001',
    'beispielkurs',
    'Grundlagen der Wurstherstellung',
    'Vom Fleisch zur fertigen Wurst',
    'Dieser Minikurs begleitet dich Schritt für Schritt vom rohen Fleisch bis zur fertigen Wurst.',
    'Fleischkunde verstehen|Werkzeuge & Hygiene|Erste eigene Wurst herstellen',
    'minikurs',
    'published',
    'participation',
    200,
    10,
    'a1000000-0000-4000-8000-000000000003',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "course_modules" ("id", "course_id", "title", "description", "sort_order", "updated_at")
VALUES
    ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Grundlagen', 'Fleisch, Werkzeuge und Hygiene', 10, CURRENT_TIMESTAMP),
    ('d1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Praxis', 'Wolfen, Würzen und Abfüllen', 20, CURRENT_TIMESTAMP),
    ('d1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000001', 'Abschluss', 'Zertifikat und Zusammenfassung', 30, CURRENT_TIMESTAMP);

INSERT INTO "course_lessons" (
    "id", "module_id", "slug", "title", "lesson_type", "sort_order",
    "duration_minutes", "text_content", "vimeo_video_id", "updated_at"
) VALUES
    ('e1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'fleischkunde', 'Fleisch- und Fettkunde', 'video', 10, 14, NULL, '76979871', CURRENT_TIMESTAMP),
    ('e1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'werkzeuge-hygiene', 'Werkzeuge & Hygiene', 'text', 20, 11, 'Sauberkeit und die richtigen Werkzeuge sind die Basis jeder guten Wurst. In dieser Lektion lernst du die wichtigsten Grundregeln.', NULL, CURRENT_TIMESTAMP),
    ('e1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002', 'wolfen-kuttern', 'Wolfen & Kuttern', 'video', 10, 22, NULL, '76979871', CURRENT_TIMESTAMP),
    ('e1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000003', 'zertifikat', 'Zertifikat freischalten', 'certificate', 10, NULL, NULL, NULL, CURRENT_TIMESTAMP);
