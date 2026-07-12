/**
 * @file register-body.ts
 * @purpose Request-Body-Parsing für die Registrierungs-API.
 */

import type { RegisterInput } from "./auth-types";

function readString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = obj[key];

  return typeof value === "string" ? value : undefined;
}

function readNullableString(
  obj: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = obj[key];

  if (value === null) {
    return null;
  }

  return typeof value === "string" ? value : undefined;
}

/**
 * Parst den Registrierungs-Body in ein typisiertes RegisterInput.
 */
export function parseRegisterBody(
  body: Record<string, unknown>,
): RegisterInput | null {
  const email = readString(body, "email");
  const password = readString(body, "password");
  const recipeUserId = readString(body, "recipeUserId");
  const profileRaw = body.profile;

  if (!email || !password) {
    return null;
  }

  if (
    typeof profileRaw !== "object" ||
    profileRaw === null ||
    Array.isArray(profileRaw)
  ) {
    return null;
  }

  const profileObj = profileRaw as Record<string, unknown>;
  const firstName = readString(profileObj, "firstName");
  const lastName = readString(profileObj, "lastName");

  if (!firstName || !lastName) {
    return null;
  }

  const addressRaw = profileObj.address;

  if (
    typeof addressRaw !== "object" ||
    addressRaw === null ||
    Array.isArray(addressRaw)
  ) {
    return null;
  }

  const addressObj = addressRaw as Record<string, unknown>;
  const street = readString(addressObj, "street");
  const houseNumber = readString(addressObj, "houseNumber");
  const postalCode = readString(addressObj, "postalCode");
  const city = readString(addressObj, "city");

  if (!street || !houseNumber || !postalCode || !city) {
    return null;
  }

  return {
    email,
    password,
    recipeUserId: recipeUserId ?? null,
    profile: {
      salutation: readNullableString(profileObj, "salutation"),
      firstName,
      lastName,
      company: readNullableString(profileObj, "company"),
      phone: readNullableString(profileObj, "phone"),
      address: {
        street,
        houseNumber,
        addressLine2: readNullableString(addressObj, "addressLine2"),
        postalCode,
        city,
        stateRegion: readNullableString(addressObj, "stateRegion"),
        country: readString(addressObj, "country"),
      },
    },
  };
}
