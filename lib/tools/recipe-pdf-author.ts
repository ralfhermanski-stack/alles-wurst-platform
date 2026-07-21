/**
 * @file recipe-pdf-author.ts
 * @purpose Anzeigename für Rezept-PDFs aus dem Nutzerprofil ableiten.
 */

export type RecipePdfAuthorDisplay = "publicName" | "firstName" | "fullName";

export const RECIPE_PDF_AUTHOR_DISPLAY_LABELS: Record<
  RecipePdfAuthorDisplay,
  string
> = {
  publicName: "Benutzername aus dem Profil",
  firstName: "Vorname",
  fullName: "Vorname und Nachname",
};

export type RecipePdfAuthorProfile = {
  publicName: string | null;
  firstName: string;
  lastName: string;
};

const AUTHOR_DISPLAY_VALUES: RecipePdfAuthorDisplay[] = [
  "publicName",
  "firstName",
  "fullName",
];

/**
 * Parst einen Query-Parameter für die Autoren-Anzeige.
 */
export function parseRecipePdfAuthorDisplay(
  value: string | null | undefined,
): RecipePdfAuthorDisplay | null {
  if (!value) {
    return null;
  }

  return AUTHOR_DISPLAY_VALUES.includes(value as RecipePdfAuthorDisplay)
    ? (value as RecipePdfAuthorDisplay)
    : null;
}

/**
 * Leitet den Anzeigenamen für das PDF aus Profil und Wahl ab.
 */
export function resolveRecipePdfAuthorName(
  profile: RecipePdfAuthorProfile,
  display: RecipePdfAuthorDisplay,
): string {
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  const publicName = profile.publicName?.trim() ?? "";

  switch (display) {
    case "publicName":
      if (publicName) {
        return publicName;
      }
      return firstName || "Wurstfreund";
    case "firstName":
      return firstName || publicName || "Wurstfreund";
    case "fullName": {
      const full = [firstName, lastName].filter(Boolean).join(" ").trim();
      return full || publicName || firstName || "Wurstfreund";
    }
    default:
      return firstName || publicName || "Wurstfreund";
  }
}

/**
 * Vorschau-Texte für die Auswahl im Export-Dialog.
 */
export function buildRecipePdfAuthorPreview(
  profile: RecipePdfAuthorProfile,
): Record<RecipePdfAuthorDisplay, string> {
  return {
    publicName: resolveRecipePdfAuthorName(profile, "publicName"),
    firstName: resolveRecipePdfAuthorName(profile, "firstName"),
    fullName: resolveRecipePdfAuthorName(profile, "fullName"),
  };
}
