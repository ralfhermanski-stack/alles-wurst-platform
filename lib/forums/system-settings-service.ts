/**
 * @file system-settings-service.ts
 * @purpose Systemweite Einstellungen.
 */

import { prisma } from "@/lib/db/prisma";

const MINI_COURSE_GLOBAL_FORUMS_KEY = "mini_course_global_forums_enabled";

export async function isMiniCourseGlobalForumsEnabled(): Promise<boolean> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: MINI_COURSE_GLOBAL_FORUMS_KEY },
  });

  return setting?.value === "true";
}

export async function setMiniCourseGlobalForumsEnabled(
  enabled: boolean,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: MINI_COURSE_GLOBAL_FORUMS_KEY },
    create: {
      key: MINI_COURSE_GLOBAL_FORUMS_KEY,
      value: enabled ? "true" : "false",
    },
    update: {
      value: enabled ? "true" : "false",
    },
  });
}
