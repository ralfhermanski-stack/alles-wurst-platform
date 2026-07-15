-- CreateTable
CREATE TABLE "course_learning_path_assignments" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "course_group_id" UUID NOT NULL,
    "course_subgroup_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_learning_path_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_learning_path_assignments_course_group_id_idx" ON "course_learning_path_assignments"("course_group_id");

-- CreateIndex
CREATE INDEX "course_learning_path_assignments_course_subgroup_id_idx" ON "course_learning_path_assignments"("course_subgroup_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_learning_path_assignments_course_id_course_group_id_key" ON "course_learning_path_assignments"("course_id", "course_group_id");

-- AddForeignKey
ALTER TABLE "course_learning_path_assignments" ADD CONSTRAINT "course_learning_path_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_learning_path_assignments" ADD CONSTRAINT "course_learning_path_assignments_course_group_id_fkey" FOREIGN KEY ("course_group_id") REFERENCES "course_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_learning_path_assignments" ADD CONSTRAINT "course_learning_path_assignments_course_subgroup_id_fkey" FOREIGN KEY ("course_subgroup_id") REFERENCES "course_subgroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bestehende Einzelzuordnungen übernehmen
INSERT INTO "course_learning_path_assignments" (
    "id",
    "course_id",
    "course_group_id",
    "course_subgroup_id",
    "sort_order",
    "is_primary",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "id",
    "course_group_id",
    "course_subgroup_id",
    100,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "courses"
WHERE "course_group_id" IS NOT NULL;
