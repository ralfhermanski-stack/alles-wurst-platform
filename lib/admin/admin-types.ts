/**
 * @file admin-types.ts
 * @purpose Typen für session-basierten Admin-Zugriff.
 */

import type { UserSystemRole } from "@prisma/client";

export type AdminActor = {
  userId: string;
  email: string;
  displayName: string;
  systemRole: UserSystemRole;
};
