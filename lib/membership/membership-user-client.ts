/**
 * @file membership-user-client.ts
 * @purpose Client-API für Nutzer-Mitgliedschaft (Status, Kündigung).
 */

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

export type UserMembershipStatus = {
  roleLabel: string;
  billingPeriodLabel: string | null;
  periodEndLabel: string;
  daysUntilEnd: number | null;
  leadDays: number | null;
  autoRenewEnabled: boolean;
  cancelAtPeriodEnd: boolean;
  cancelReasonLabel: string | null;
  willRenew: boolean;
  canCancel: boolean;
  canReactivate: boolean;
  isRecurring: boolean;
  statusLabel: string;
  paymentStatusLabel: string;
};

async function membershipRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiSuccess<T> | ApiFailure> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  return response.json() as Promise<ApiSuccess<T> | ApiFailure>;
}

export async function fetchUserMembershipStatusApi(): Promise<
  ApiSuccess<UserMembershipStatus> | ApiFailure
> {
  return membershipRequest<UserMembershipStatus>("/api/users/me/membership-status");
}

export async function cancelUserMembershipApi(): Promise<
  ApiSuccess<{ message: string; periodEndLabel: string }> | ApiFailure
> {
  return membershipRequest("/api/users/me/membership-cancel", { method: "POST" });
}

export async function reactivateUserMembershipApi(): Promise<
  ApiSuccess<{ message: string }> | ApiFailure
> {
  return membershipRequest("/api/users/me/membership-reactivate", {
    method: "POST",
  });
}
