/**
 * @file user-service.ts
 * @purpose Service-Grundlage für Nutzer und Profile (Schritt 12).
 * @responsibility CRUD-Vorbereitung — noch ohne Registrierung, Login oder API-Routen.
 */

import { prisma, refreshPrismaClient } from "@/lib/db/prisma";

import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "./user-errors";
import type {
  CreateUserInput,
  UserSummary,
  UserWithRelations,
} from "./user-types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateCreateUserInput(input: CreateUserInput): string | null {
  const email = normalizeEmail(input.email);

  if (!email || !email.includes("@")) {
    return "Bitte eine gültige E-Mail-Adresse angeben.";
  }

  if (!input.profile.firstName.trim()) {
    return "Vorname ist erforderlich.";
  }

  if (!input.profile.lastName.trim()) {
    return "Nachname ist erforderlich.";
  }

  const { address } = input.profile;

  if (!address.street.trim()) {
    return "Straße ist erforderlich.";
  }

  if (!address.houseNumber.trim()) {
    return "Hausnummer ist erforderlich.";
  }

  if (!address.postalCode.trim()) {
    return "Postleitzahl ist erforderlich.";
  }

  if (!address.city.trim()) {
    return "Ort ist erforderlich.";
  }

  return null;
}

function toUserSummary(user: UserWithRelations): UserSummary {
  return {
    id: user.id,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    profile: user.profile,
    membership: user.membership,
  };
}

const userWithRelationsInclude = {
  profile: true,
  membership: true,
} as const;

async function queryUserWithRelations(
  where: { id: string } | { email: string; deletedAt: null },
): Promise<UserWithRelations | null> {
  let user = await prisma.user.findFirst({
    where,
    include: userWithRelationsInclude,
  });

  if (user && user.systemRole === undefined) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[user-service] systemRole fehlt im Prisma-Ergebnis — Client wird erneuert.",
      );
    }

    await refreshPrismaClient();

    user = await prisma.user.findFirst({
      where,
      include: userWithRelationsInclude,
    });
  }

  return user;
}

/**
 * Sucht einen Nutzer anhand der ID (ohne gelöschte).
 */
export async function findUserById(
  id: string,
): Promise<UserServiceResult<UserWithRelations | null>> {
  try {
    const user = await queryUserWithRelations({ id, deletedAt: null });

    return userSuccess(user);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Nutzer konnte nicht geladen werden.",
    });
  }
}

/**
 * Sucht einen Nutzer anhand der E-Mail (nur aktive Konten).
 */
export async function findUserByEmail(
  email: string,
): Promise<UserServiceResult<UserWithRelations | null>> {
  try {
    const user = await queryUserWithRelations({
      email: normalizeEmail(email),
      deletedAt: null,
    });

    return userSuccess(user);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Nutzer konnte nicht geladen werden.",
    });
  }
}

/**
 * Sucht einen Nutzer für Login — inkl. gesperrter/deaktivierter Konten.
 */
export async function findUserByEmailForAuth(
  email: string,
): Promise<UserServiceResult<UserWithRelations | null>> {
  try {
    let user = await prisma.user.findFirst({
      where: { email: normalizeEmail(email) },
      include: userWithRelationsInclude,
    });

    if (user && user.systemRole === undefined) {
      await refreshPrismaClient();

      user = await prisma.user.findFirst({
        where: { email: normalizeEmail(email) },
        include: userWithRelationsInclude,
      });
    }

    return userSuccess(user);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Nutzer konnte nicht geladen werden.",
    });
  }
}

/**
 * Legt Nutzer, Profil und Standard-Mitgliedschaft an.
 * Für spätere Registrierung — noch nicht über UI/API erreichbar.
 */
export async function createUserWithProfile(
  input: CreateUserInput,
): Promise<UserServiceResult<UserSummary>> {
  const validationError = validateCreateUserInput(input);

  if (validationError) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: validationError,
    });
  }

  const email = normalizeEmail(input.email);
  const profile = input.profile;
  const { address } = profile;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return userFailure({
        code: "CONFLICT",
        message: "Diese E-Mail-Adresse ist bereits registriert.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: input.passwordHash ?? null,
        profile: {
          create: {
            salutation: profile.salutation?.trim() || null,
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            company: profile.company?.trim() || null,
            street: address.street.trim(),
            houseNumber: address.houseNumber.trim(),
            addressLine2: address.addressLine2?.trim() || null,
            postalCode: address.postalCode.trim(),
            city: address.city.trim(),
            stateRegion: address.stateRegion?.trim() || null,
            country: address.country?.trim() || "DE",
            phone: profile.phone?.trim() || null,
          },
        },
        membership: {
          create: {
            role: "registered",
            status: "none",
            paymentStatus: "none",
          },
        },
      },
      include: userWithRelationsInclude,
    });

    return userSuccess(toUserSummary(user));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Nutzer konnte nicht angelegt werden.",
    });
  }
}

/**
 * Verknüpft bestehende Rezepte einer localStorage-userId mit einem registrierten Nutzer.
 * Wird nach Registrierung/Login aufgerufen — Rezept-FK bleibt vorerst ohne DB-Constraint.
 */
export async function linkRecipesToUser(
  recipeUserId: string,
  registeredUserId: string,
): Promise<UserServiceResult<{ updatedCount: number }>> {
  if (!recipeUserId.trim() || !registeredUserId.trim()) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültige Nutzer-IDs für die Verknüpfung.",
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id: registeredUserId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Registrierter Nutzer wurde nicht gefunden.",
      });
    }

    const result = await prisma.recipe.updateMany({
      where: {
        userId: recipeUserId,
        deletedAt: null,
      },
      data: {
        userId: registeredUserId,
      },
    });

    return userSuccess({ updatedCount: result.count });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Rezepte konnten nicht verknüpft werden.",
    });
  }
}
