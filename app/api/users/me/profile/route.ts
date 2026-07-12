import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  jsonFromAuthResult,
  parseJsonBody,
  getNullableStringField,
  getStringField,
} from "@/lib/auth/auth-api-utils";
import { userFailure, userSuccess } from "@/lib/users/user-errors";
import type { UserProfileInput } from "@/lib/users/user-types";

function mapPrismaToInput(profile: {
  salutation: string | null;
  publicName: string | null;
  avatarUrl: string | null;
  avatarFileName: string | null;
  bio: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string | null;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  stateRegion: string | null;
  country: string;
}): UserProfileInput {
  return {
    salutation: profile.salutation ?? null,
    publicName: profile.publicName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    avatarFileName: profile.avatarFileName ?? null,
    bio: profile.bio ?? null,
    firstName: profile.firstName,
    lastName: profile.lastName,
    company: profile.company ?? null,
    phone: profile.phone ?? null,
    address: {
      street: profile.street,
      houseNumber: profile.houseNumber,
      addressLine2: profile.addressLine2 ?? null,
      postalCode: profile.postalCode,
      city: profile.city,
      stateRegion: profile.stateRegion ?? null,
      country: profile.country ?? "DE",
    },
  };
}

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return jsonFromAuthResult(
      userFailure({
        code: "NOT_FOUND",
        message: "Profil nicht gefunden.",
      }),
    );
  }

  return jsonFromAuthResult(userSuccess(mapPrismaToInput(profile)));
}

export async function PATCH(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Anmeldung erforderlich.",
      }),
    );
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const firstName = getStringField(body, "firstName")?.trim();
  const lastName = getStringField(body, "lastName")?.trim();
  const salutation = getNullableStringField(body, "salutation");
  const company = getNullableStringField(body, "company");
  const phone = getNullableStringField(body, "phone");

  const publicNameRaw =
    getNullableStringField(body, "publicName") ??
    getNullableStringField(body, "username");

  const avatarUrlRaw = getNullableStringField(body, "avatarUrl");
  const bioRaw = getNullableStringField(body, "bio");

  const addressRaw = body.address;

  if (
    !firstName ||
    !lastName ||
    typeof addressRaw !== "object" ||
    addressRaw === null ||
    Array.isArray(addressRaw)
  ) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Pflichtfelder fehlen: Vorname, Nachname und Adresse.",
      }),
    );
  }

  const addressObj = addressRaw as Record<string, unknown>;

  const street = getStringField(addressObj, "street")?.trim();
  const houseNumber = getStringField(addressObj, "houseNumber")?.trim();
  const postalCode = getStringField(addressObj, "postalCode")?.trim();
  const city = getStringField(addressObj, "city")?.trim();

  const addressLine2 = getNullableStringField(addressObj, "addressLine2");
  const stateRegion = getNullableStringField(addressObj, "stateRegion");
  const country = getNullableStringField(addressObj, "country");

  if (!street || !houseNumber || !postalCode || !city) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Adresse ist unvollständig.",
      }),
    );
  }

  const PUBLIC_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
  const MAX_BIO_LENGTH = 300;

  const publicName =
    publicNameRaw === undefined
      ? undefined
      : publicNameRaw === null
        ? null
        : publicNameRaw.trim();

  if (publicName !== undefined && publicName !== null) {
    if (publicName.length < 3 || publicName.length > 30) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message:
            "Der öffentliche Anzeigename muss zwischen 3 und 30 Zeichen lang sein.",
        }),
      );
    }

    if (!PUBLIC_NAME_REGEX.test(publicName)) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message:
            "Der öffentliche Anzeigename darf nur Buchstaben, Zahlen und Unterstrich enthalten.",
        }),
      );
    }

    const existing = await prisma.userProfile.findUnique({
      where: { publicName },
      select: { userId: true },
    });

    if (existing && existing.userId !== userId) {
      return jsonFromAuthResult(
        userFailure({
          code: "CONFLICT",
          message: "Dieser Anzeigename ist bereits vergeben.",
        }),
      );
    }
  }

  const avatarUrl =
    avatarUrlRaw === undefined
      ? undefined
      : avatarUrlRaw === null
        ? null
        : avatarUrlRaw.trim();

  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (avatarUrl.length > 2048) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message: "Avatar-URL ist zu lang.",
        }),
      );
    }

    if (avatarUrl.includes(" ")) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message: "Avatar-URL enthält ungültige Zeichen.",
        }),
      );
    }

    const ok =
      avatarUrl.startsWith("http://") ||
      avatarUrl.startsWith("https://") ||
      avatarUrl.startsWith("/api/users/") ||
      avatarUrl.startsWith("/");

    if (!ok) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message:
            "Avatar-URL muss mit http(s):// oder / beginnen.",
        }),
      );
    }

    // Hochgeladene Avatare werden nur über den Upload-Endpunkt gesetzt.
    if (avatarUrl.startsWith("/api/users/")) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message:
            "Profilbilder bitte über den Avatar-Upload hochladen, nicht als URL eintragen.",
        }),
      );
    }
  }

  const bio =
    bioRaw === undefined
      ? undefined
      : bioRaw === null
        ? null
        : bioRaw.trim();

  if (bio !== undefined && bio !== null && bio.length > MAX_BIO_LENGTH) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: `Bio ist zu lang (max. ${MAX_BIO_LENGTH} Zeichen).`,
      }),
    );
  }

  try {
    const nextData: Parameters<typeof prisma.userProfile.update>[0]["data"] =
      {
        salutation,
        firstName,
        lastName,
        company,
        phone,
        street,
        houseNumber,
        addressLine2,
        postalCode,
        city,
        stateRegion,
        country: (country?.trim() || "DE") as string,
      };

    if (publicName !== undefined) {
      nextData.publicName = publicName;
    }

    if (avatarUrl !== undefined) {
      nextData.avatarUrl = avatarUrl;

      // Externe URL oder Entfernen — hochgeladenes Bild zurücksetzen.
      if (avatarUrl === null || !avatarUrl.startsWith("/api/users/")) {
        nextData.avatarStorageKey = null;
        nextData.avatarFileName = null;
      }
    }

    if (bio !== undefined) {
      nextData.bio = bio;
    }

    const updated = await prisma.userProfile.update({
      where: { userId },
      data: nextData,
    });

    return jsonFromAuthResult(userSuccess(mapPrismaToInput(updated)));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonFromAuthResult(
        userFailure({
          code: "CONFLICT",
          message: "Dieser Anzeigename ist bereits vergeben.",
        }),
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return jsonFromAuthResult(
        userFailure({
          code: "NOT_FOUND",
          message: "Profil nicht gefunden.",
        }),
      );
    }

    console.error("Profil PATCH fehlgeschlagen:", error);

    return jsonFromAuthResult(
      userFailure({
        code: "INTERNAL_ERROR",
        message: "Profil konnte nicht gespeichert werden.",
      }),
    );
  }
}

