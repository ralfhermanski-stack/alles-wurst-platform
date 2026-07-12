/**
 * @file security-admin-service.ts
 * @purpose Admin-Operationen für die Sicherheitszentrale.
 */

import type { IpBlockLevel } from "@prisma/client";

import { blockIpManually, listBlockedIps, unblockIp } from "./ip-block-service";
import { listSecurityAuditLogs } from "./security-audit-service";
import { getSecurityDashboardStats, getSecuritySystemStatus, listSuspiciousUsers } from "./security-dashboard-service";
import { listSecurityEvents } from "./security-event-service";
import { getSecuritySettings, updateSecuritySettings } from "./security-settings-service";
import { listAllActiveSessions } from "./session-registry-service";

export async function getAdminSecurityDashboard() {
  const [stats, systemStatus] = await Promise.all([
    getSecurityDashboardStats(),
    getSecuritySystemStatus(),
  ]);

  return { stats, systemStatus };
}

export {
  listSecurityEvents,
  listBlockedIps,
  listAllActiveSessions,
  listSuspiciousUsers,
  listSecurityAuditLogs,
  getSecuritySettings,
  updateSecuritySettings,
  blockIpManually,
  unblockIp,
};

export type BlockIpInput = {
  ipAddress: string;
  level: IpBlockLevel;
  reason?: string;
  notes?: string;
  createdByUserId?: string;
  permanent?: boolean;
};
