/**
 * @file accounting-types.ts
 * @purpose Typen für den Buchhaltungsbereich.
 */

import type {
  Membership,
  MembershipAuditAction,
  MembershipRole,
  MembershipStatus,
  PaymentStatus,
  User,
  UserProfile,
} from "@prisma/client";

export type AccountingStaffRole = Extract<MembershipRole, "accounting" | "admin">;

export type AccountingActor = {
  userId: string;
  email: string;
  displayName: string;
  role: AccountingStaffRole;
};

export type AccountingUserDetail = {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  profile: UserProfile | null;
  membership: Membership | null;
};

export type AccountingAuditEntry = {
  id: string;
  action: MembershipAuditAction;
  summary: string;
  actorUserId: string;
  actorRole: MembershipRole;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
};

export type AccountingSearchResult = {
  id: string;
  email: string;
  displayName: string;
  role: MembershipRole;
  membershipStatus: MembershipStatus;
  paymentStatus: PaymentStatus;
  accessBlocked: boolean;
};

export type AccountingMembershipAction =
  | { type: "pause"; note?: string | null }
  | { type: "reactivate"; extendedUntil?: string | null; note?: string | null }
  | { type: "extend"; extendedUntil: string; note?: string | null }
  | { type: "end"; note?: string | null; blockReason?: string | null }
  | { type: "block"; blockReason: string; note?: string | null }
  | { type: "unlock"; note?: string | null }
  | {
      type: "set_payment_status";
      paymentStatus: PaymentStatus;
      note?: string | null;
    }
  | { type: "set_payment_note"; paymentNote: string }
  | { type: "set_accounting_note"; accountingNote: string }
  | { type: "set_role"; role: MembershipRole; note?: string | null };

export type MembershipSnapshot = Pick<
  Membership,
  | "role"
  | "status"
  | "paymentStatus"
  | "paymentNote"
  | "accountingNote"
  | "accessBlocked"
  | "blockReason"
  | "startedAt"
  | "endsAt"
  | "extendedUntil"
>;

export function toMembershipSnapshot(
  membership: Membership,
): MembershipSnapshot {
  return {
    role: membership.role,
    status: membership.status,
    paymentStatus: membership.paymentStatus,
    paymentNote: membership.paymentNote,
    accountingNote: membership.accountingNote,
    accessBlocked: membership.accessBlocked,
    blockReason: membership.blockReason,
    startedAt: membership.startedAt,
    endsAt: membership.endsAt,
    extendedUntil: membership.extendedUntil,
  };
}

export function formatUserDisplayName(
  user: Pick<User, "email"> & { profile: UserProfile | null },
): string {
  if (user.profile) {
    const name = `${user.profile.firstName} ${user.profile.lastName}`.trim();

    if (name) {
      return name;
    }
  }

  return user.email;
}
