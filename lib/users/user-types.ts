/**
 * @file user-types.ts
 * @purpose Domain-Typen für User, Profil und Mitgliedschaft (Schritt 12).
 */

import type {
  MembershipRole as PrismaMembershipRole,
  MembershipStatus,
  PaymentStatus,
  User,
  UserProfile,
  Membership,
} from "@prisma/client";

export type {
  PrismaMembershipRole,
  MembershipStatus,
  PaymentStatus,
  User,
  UserProfile,
  Membership,
};

/** Vollständige Adresse für Registrierung und Profil */
export type UserAddressInput = {
  street: string;
  houseNumber: string;
  addressLine2?: string | null;
  postalCode: string;
  city: string;
  stateRegion?: string | null;
  country?: string;
};

/** Profildaten bei Registrierung (später) */
export type UserProfileInput = {
  salutation?: string | null;
  /**
   * Öffentlich sichtbarer Anzeigename (Forum, Bewertungen, etc.).
   * Klarname bleibt privat.
   */
  publicName?: string | null;
  avatarUrl?: string | null;
  avatarFileName?: string | null;
  bio?: string | null;
  firstName: string;
  lastName: string;
  company?: string | null;
  phone?: string | null;
  address: UserAddressInput;
};

/** Nutzer inkl. Profil und Mitgliedschaft — für spätere Session-Auflösung */
export type UserWithRelations = User & {
  profile: UserProfile | null;
  membership: Membership | null;
};

/** Öffentliche Nutzer-Zusammenfassung (ohne Passwort) */
export type UserSummary = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  profile: UserProfile | null;
  membership: Membership | null;
};

/** Mitgliedschafts-Datensatz für Buchhaltung (später) */
export type MembershipRecord = Membership;

/** Eingabe für Nutzeranlage bei Registrierung (später) */
export type CreateUserInput = {
  email: string;
  passwordHash?: string | null;
  profile: UserProfileInput;
  /** Optional: bestehende localStorage-userId beim ersten Login verknüpfen */
  linkRecipeUserId?: string | null;
};

/** Eingabe für Buchhaltungs-Korrekturen (später) */
export type UpdateMembershipInput = {
  role?: PrismaMembershipRole;
  status?: MembershipStatus;
  paymentStatus?: PaymentStatus;
  paymentNote?: string | null;
  accountingNote?: string | null;
  accessBlocked?: boolean;
  blockReason?: string | null;
  startedAt?: Date | null;
  endsAt?: Date | null;
  extendedUntil?: Date | null;
};
