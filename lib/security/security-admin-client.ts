/**
 * @file security-admin-client.ts
 * @purpose Client-Helfer für Admin-Sicherheits-APIs.
 */

import type { IpBlockLevel, SecurityAuditAction, SecurityEventType, SecurityRiskLevel } from "@prisma/client";

import type { SecurityDashboardStats } from "./security-types";

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

async function securityAdminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return response.json() as Promise<ApiResult<T>>;
}

export async function fetchSecurityDashboardApi() {
  return securityAdminRequest<{
    stats: SecurityDashboardStats;
    systemStatus: Record<string, unknown>;
  }>("/api/admin/security/dashboard");
}

export async function fetchSecurityEventsApi(params?: {
  page?: number;
  eventType?: SecurityEventType;
  riskLevel?: SecurityRiskLevel;
  ipAddress?: string;
}) {
  const search = new URLSearchParams();

  if (params?.page) search.set("page", String(params.page));
  if (params?.eventType) search.set("eventType", params.eventType);
  if (params?.riskLevel) search.set("riskLevel", params.riskLevel);
  if (params?.ipAddress) search.set("ipAddress", params.ipAddress);

  const query = search.toString();

  return securityAdminRequest<{
    items: Array<Record<string, unknown>>;
    total: number;
  }>(`/api/admin/security/events${query ? `?${query}` : ""}`);
}

export async function fetchBlockedIpsApi(page = 1) {
  return securityAdminRequest<{
    items: Array<Record<string, unknown>>;
    total: number;
  }>(`/api/admin/security/blocked-ips?page=${page}`);
}

export async function blockIpApi(input: {
  ipAddress: string;
  level: IpBlockLevel;
  reason?: string;
  notes?: string;
  permanent?: boolean;
}) {
  return securityAdminRequest<true>("/api/admin/security/blocked-ips", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function unblockIpApi(ipAddress: string, notes?: string) {
  return securityAdminRequest<true>("/api/admin/security/blocked-ips", {
    method: "DELETE",
    body: JSON.stringify({ ipAddress, notes }),
  });
}

export async function fetchActiveSessionsApi(page = 1) {
  return securityAdminRequest<{
    items: Array<Record<string, unknown>>;
    total: number;
  }>(`/api/admin/security/sessions?page=${page}`);
}

export async function fetchSecurityRulesApi() {
  return securityAdminRequest<Record<string, unknown>>("/api/admin/security/rules");
}

export async function updateSecurityRulesApi(data: Record<string, unknown>) {
  return securityAdminRequest<Record<string, unknown>>("/api/admin/security/rules", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchSuspiciousUsersApi(page = 1) {
  return securityAdminRequest<{
    items: Array<Record<string, unknown>>;
    total: number;
  }>(`/api/admin/security/suspicious-users?page=${page}`);
}

export async function fetchSecurityAuditLogApi(page = 1, action?: SecurityAuditAction) {
  const search = new URLSearchParams({ page: String(page) });

  if (action) search.set("action", action);

  return securityAdminRequest<{
    items: Array<Record<string, unknown>>;
    total: number;
  }>(`/api/admin/security/audit-log?${search.toString()}`);
}

export async function fetchSecuritySystemStatusApi() {
  return securityAdminRequest<Record<string, unknown>>("/api/admin/security/system-status");
}
