-- Optionaler Level-Badge für Lernpfade (z. B. Einsteiger, Fortgeschritten)
ALTER TABLE "course_groups"
ADD COLUMN "level_label" TEXT;
