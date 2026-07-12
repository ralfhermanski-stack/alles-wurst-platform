/**
 * @file auth-types.ts
 * @purpose Typen für Registrierung, Login und Session.
 */

import type { UserProfileInput } from "@/lib/users/user-types";
import type { MembershipRole as AppMembershipRole } from "@/lib/membership/membership-rules";
import type { UserSystemRole } from "@prisma/client";

export type AuthMembershipSummary = {
  role: AppMembershipRole;
  status: string;
  paymentStatus: string;
  accessBlocked: boolean;
};

/** Öffentliche Session-Daten (ohne Passwort) */
export type AuthSessionUser = {
  id: string;
  email: string;
  displayName: string;
  systemRole: UserSystemRole;
  maintenanceBypass: boolean;
  emailVerifiedAt: string | null;
  profile: {
    firstName: string;
    lastName: string;
    salutation: string | null;
    publicName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    city: string;
    country: string;
  } | null;
  membership: AuthMembershipSummary | null;
};

export type RegisterInput = {
  email: string;
  password: string;
  profile: UserProfileInput;
  recipeUserId?: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
  recipeUserId?: string | null;
};

export type AuthLinkRecipesResult = {
  updatedCount: number;
};
