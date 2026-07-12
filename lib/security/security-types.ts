/**
 * @file security-types.ts
 * @purpose Typen für das Enterprise-Security-Modul.
 */

import type {
  IpBlockLevel,
  SecurityAuditAction,
  SecurityAuditResult,
  SecurityEventType,
  SecurityRiskLevel,
  UserSystemRole,
} from "@prisma/client";

export type {
  IpBlockLevel,
  SecurityAuditAction,
  SecurityAuditResult,
  SecurityEventType,
  SecurityRiskLevel,
};

export type SecurityRequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  countryCode: string | null;
  region: string | null;
  asn: string | null;
  provider: string | null;
  path: string | null;
  method: string | null;
};

export type RateLimitScope =
  | "login"
  | "admin_login"
  | "register"
  | "password_reset"
  | "password_reset_confirm"
  | "tickets"
  | "forum"
  | "reviews"
  | "comments"
  | "uploads"
  | "pdf"
  | "api"
  | "openai";

export type IpBlockCheckResult = {
  blocked: boolean;
  level: IpBlockLevel | null;
  retryAfterSeconds?: number;
  requireCaptcha?: boolean;
  throttleMs?: number;
};

export type SecurityDashboardStats = {
  failedLoginsToday: number;
  blockedIps: number;
  activeAdmins: number;
  suspiciousRegistrations: number;
  passwordResetRequests: number;
  apiAttacks: number;
  securityWarnings: number;
  topAttackCountries: Array<{ countryCode: string; count: number }>;
};

export type TotpRequiredRoles = UserSystemRole[];

export const DEFAULT_TOTP_REQUIRED_ROLES: UserSystemRole[] = [
  "ADMIN",
  "SUPERADMIN",
  "SUPPORT",
  "INSTRUCTOR",
];
