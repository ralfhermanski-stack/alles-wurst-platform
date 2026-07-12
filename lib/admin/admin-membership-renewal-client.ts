/**
 * @file admin-membership-renewal-client.ts
 */

import { adminFetch, type AdminApiResponse } from "@/lib/admin/admin-fetch";
import type {
  MembershipRenewalOverviewEntry,
  MembershipRenewalReminderLogEntry,
} from "@/lib/membership/membership-renewal-service";

export async function fetchMembershipRenewalsAdminApi(): Promise<
  AdminApiResponse<{
    overview: MembershipRenewalOverviewEntry[];
    logs: MembershipRenewalReminderLogEntry[];
  }>
> {
  return adminFetch("/api/admin/memberships/renewals");
}

export async function postMembershipRenewalActionApi(
  membershipId: string,
  action:
    | "cancel_at_period_end"
    | "reenable_auto_renew"
    | "send_reminder"
    | "suppress_reminders",
): Promise<AdminApiResponse<{ message: string }>> {
  return adminFetch(`/api/admin/memberships/${membershipId}/renewal-actions`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}
