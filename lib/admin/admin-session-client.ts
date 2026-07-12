/**
 * @file admin-session-client.ts
 * @purpose Browser-Client für Admin-Session-Prüfung.
 */

import { adminFetch, type AdminApiResponse } from "./admin-fetch";
import type { AdminActor } from "./admin-types";

export async function verifyAdminSessionApi(): Promise<
  AdminApiResponse<AdminActor>
> {
  return adminFetch<AdminActor>("/api/admin/session");
}
