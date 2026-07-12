/**
 * @file accounting-client.ts
 * @purpose Browser-Client für den Buchhaltungsbereich.
 */

import type { Membership } from "@prisma/client";

import type { UserErrorCode } from "@/lib/users/user-errors";

import type {
  AccountingActor,
  AccountingAuditEntry,
  AccountingMembershipAction,
  AccountingSearchResult,
  AccountingUserDetail,
} from "./accounting-types";
import type {
  AccountingPositionEntry,
  AccountingPositionTotals,
  CreateAccountingPositionInput,
} from "./accounting-position-types";

type AccountingApiError = {
  code: UserErrorCode;
  message: string;
};

type AccountingApiSuccess<T> = { success: true; data: T };
type AccountingApiFailure = { success: false; error: AccountingApiError };
export type AccountingApiResponse<T> =
  | AccountingApiSuccess<T>
  | AccountingApiFailure;

async function accountingRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<AccountingApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const json: unknown = await response.json();

    if (
      typeof json === "object" &&
      json !== null &&
      "success" in json &&
      json.success === true &&
      "data" in json
    ) {
      return { success: true, data: json.data as T };
    }

    if (
      typeof json === "object" &&
      json !== null &&
      "success" in json &&
      json.success === false &&
      "error" in json &&
      typeof json.error === "object" &&
      json.error !== null
    ) {
      return { success: false, error: json.error as AccountingApiError };
    }

    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unerwartete Server-Antwort.",
      },
    };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Netzwerkfehler — bitte Verbindung prüfen.",
      },
    };
  }
}

export async function verifyAccountingSessionApi(): Promise<
  AccountingApiResponse<AccountingActor>
> {
  return accountingRequest<AccountingActor>("/api/accounting/session");
}

export async function searchAccountingUsersApi(
  query: string,
): Promise<AccountingApiResponse<AccountingSearchResult[]>> {
  const params = new URLSearchParams({ q: query });

  return accountingRequest<AccountingSearchResult[]>(
    `/api/accounting/users/search?${params.toString()}`,
  );
}

export async function fetchAccountingUserDetailApi(
  userId: string,
): Promise<
  AccountingApiResponse<{
    user: AccountingUserDetail;
    positions: AccountingPositionEntry[];
    positionTotals: AccountingPositionTotals;
    auditLog: AccountingAuditEntry[];
  }>
> {
  return accountingRequest(`/api/accounting/users/${userId}`);
}

export async function createAccountingPositionApi(
  userId: string,
  input: CreateAccountingPositionInput,
): Promise<AccountingApiResponse<AccountingPositionEntry>> {
  return accountingRequest<AccountingPositionEntry>(
    `/api/accounting/users/${userId}/positions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export type PositionStatusAction =
  | "mark_paid"
  | "mark_pending"
  | "mark_overdue"
  | "mark_cancelled";

export async function updateAccountingPositionStatusApi(
  userId: string,
  positionId: string,
  action: PositionStatusAction,
  note?: string | null,
): Promise<AccountingApiResponse<AccountingPositionEntry>> {
  return accountingRequest<AccountingPositionEntry>(
    `/api/accounting/users/${userId}/positions/${positionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action, note }),
    },
  );
}

export async function createInvoiceFromPositionApi(
  userId: string,
  positionId: string,
): Promise<
  AccountingApiResponse<{ id: string; invoiceNumber: string }>
> {
  return accountingRequest<{ id: string; invoiceNumber: string }>(
    `/api/accounting/users/${userId}/positions/${positionId}/invoice`,
    {
      method: "POST",
    },
  );
}

export async function cancelInvoiceApi(
  invoiceId: string,
): Promise<AccountingApiResponse<{ id: string; invoiceNumber: string }>> {
  return accountingRequest<{ id: string; invoiceNumber: string }>(
    `/api/accounting/invoices/${invoiceId}/cancel`,
    {
      method: "POST",
    },
  );
}

export async function createCreditNoteApi(
  invoiceId: string,
): Promise<AccountingApiResponse<{ id: string; creditNoteNumber: string }>> {
  return accountingRequest<{ id: string; creditNoteNumber: string }>(
    `/api/accounting/invoices/${invoiceId}/credit-note`,
    {
      method: "POST",
    },
  );
}

export async function executeAccountingActionApi(
  userId: string,
  action: AccountingMembershipAction,
): Promise<AccountingApiResponse<Membership>> {
  return accountingRequest<Membership>(
    `/api/accounting/users/${userId}/actions`,
    {
      method: "POST",
      body: JSON.stringify(action),
    },
  );
}
