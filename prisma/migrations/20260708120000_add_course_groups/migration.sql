-- Schritt 32: Kursgruppen und Untergruppen

CREATE TABLE "course_groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "image_storage_key" TEXT,
    "image_file_name" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_subgroups" (
    "id" UUID NOT NULL,
    "course_group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "image_storage_key" TEXT,
    "image_file_name" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_subgroups_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "courses" ADD COLUMN "course_group_id" UUID;
ALTER TABLE "courses" ADD COLUMN "course_subgroup_id" UUID;

CREATE UNIQUE INDEX "course_groups_slug_key" ON "course_groups"("slug");
CREATE INDEX "course_groups_is_active_sort_order_idx" ON "course_groups"("is_active", "sort_order");

CREATE UNIQUE INDEX "course_subgroups_course_group_id_slug_key" ON "course_subgroups"("course_group_id", "slug");
CREATE INDEX "course_subgroups_course_group_id_is_active_sort_order_idx" ON "course_subgroups"("course_group_id", "is_active", "sort_order");

CREATE INDEX "courses_course_group_id_idx" ON "courses"("course_group_id");
CREATE INDEX "courses_course_subgroup_id_idx" ON "courses"("course_subgroup_id");

ALTER TABLE "course_subgroups" ADD CONSTRAINT "course_subgroups_course_group_id_fkey" FOREIGN KEY ("course_group_id") REFERENCES "course_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_group_id_fkey" FOREIGN KEY ("course_group_id") REFERENCES "course_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_subgroup_id_fkey" FOREIGN KEY ("course_subgroup_id") REFERENCES "course_subgroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
