/**
 * @file blog-session-client.ts
 * @purpose Client-Verifikation für Magazin-Admin.
 */

import { adminFetch, type AdminApiResponse } from "@/lib/admin/admin-fetch";
import type { AdminActor } from "@/lib/admin/admin-types";

export async function verifyBlogSessionApi(): Promise<AdminApiResponse<AdminActor>> {
  return adminFetch<AdminActor>("/api/admin/blog/session");
}
