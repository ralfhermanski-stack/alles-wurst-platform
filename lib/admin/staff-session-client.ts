/**
 * @file staff-session-client.ts
 * @purpose Browser-Client für Staff-Session-Prüfung.
 */

import { adminFetch, type AdminApiResponse } from "./admin-fetch";
import type { AdminActor } from "./admin-types";

export async function verifyStaffSessionApi(): Promise<
  AdminApiResponse<AdminActor>
> {
  return adminFetch<AdminActor>("/api/admin/support/session");
}
