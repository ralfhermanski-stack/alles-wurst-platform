/**
 * @file beta-test-client.ts
 */

import { adminFetch, type AdminApiResponse } from "@/lib/admin/admin-platform-client";
import type {
  BetaInviteDetail,
  BetaInviteListItem,
  BetaTesterTaskItem,
} from "@/lib/beta-test/beta-test-service";

export type BetaInviteCreateResult = {
  invite: BetaInviteDetail;
  inviteUrl: string;
};

export async function listBetaInvitesApi(): Promise<
  AdminApiResponse<{ invites: BetaInviteListItem[] }>
> {
  return adminFetch<{ invites: BetaInviteListItem[] }>("/api/admin/beta-test/invites");
}

export async function createBetaInviteApi(input: {
  email: string;
  personalMessage?: string;
  tasks: Array<{ title: string; description?: string; dueAt?: string }>;
}): Promise<AdminApiResponse<BetaInviteCreateResult>> {
  return adminFetch<BetaInviteCreateResult>("/api/admin/beta-test/invites", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function resendBetaInviteApi(
  inviteId: string,
): Promise<AdminApiResponse<BetaInviteDetail>> {
  return adminFetch<BetaInviteDetail>(`/api/admin/beta-test/invites/${inviteId}`, {
    method: "POST",
    body: JSON.stringify({ action: "resend" }),
  });
}

export async function revokeBetaInviteApi(
  inviteId: string,
): Promise<AdminApiResponse<BetaInviteDetail>> {
  return adminFetch<BetaInviteDetail>(`/api/admin/beta-test/invites/${inviteId}`, {
    method: "POST",
    body: JSON.stringify({ action: "revoke" }),
  });
}

export async function addBetaInviteTasksApi(
  inviteId: string,
  tasks: Array<{ title: string; description?: string; dueAt?: string }>,
): Promise<AdminApiResponse<BetaInviteDetail>> {
  return adminFetch<BetaInviteDetail>(`/api/admin/beta-test/invites/${inviteId}`, {
    method: "PATCH",
    body: JSON.stringify({ tasks }),
  });
}

export async function fetchBetaInvitePreviewApi(token: string): Promise<{
  success: boolean;
  data?: {
    email: string;
    personalMessage: string | null;
    tasks: Array<{ title: string; description: string | null }>;
    expired: boolean;
    revoked: boolean;
    accepted: boolean;
    existingAccount: boolean;
  };
  error?: { message: string };
}> {
  const response = await fetch(
    `/api/beta-test/invite?token=${encodeURIComponent(token)}`,
    { credentials: "include" },
  );
  return response.json();
}

export async function acceptBetaInviteApi(
  token: string,
): Promise<{ success: boolean; data?: { message: string; tasks: BetaTesterTaskItem[] }; error?: { message: string } }> {
  const response = await fetch("/api/account/beta-tasks", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return response.json();
}

export async function fetchMyBetaTasksApi(): Promise<{
  success: boolean;
  data?: { tasks: BetaTesterTaskItem[] };
  error?: { message: string };
}> {
  const response = await fetch("/api/account/beta-tasks", {
    credentials: "include",
  });
  return response.json();
}

export async function updateMyBetaTaskApi(input: {
  taskId: string;
  status: "OPEN" | "COMPLETED";
}): Promise<{
  success: boolean;
  data?: BetaTesterTaskItem;
  error?: { message: string };
}> {
  const response = await fetch("/api/account/beta-tasks", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return response.json();
}
