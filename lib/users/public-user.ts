/**
 * @file public-user.ts
 * @purpose Zentrale Regeln für öffentliche Nutzeranzeige.
 */

type PublicNameProfile = {
  publicName?: string | null;
  firstName?: string | null;
  avatarUrl?: string | null;
  // lastName ist bewusst NICHT Teil der öffentlichen Logik.
};

type PublicUserInput = {
  profile?: PublicNameProfile | null;
};

function sanitizePublicName(name: string): string {
  return name.trim();
}

const PUBLIC_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Öffentlicher Anzeigename:
 * - Wenn `publicName` vorhanden -> nutzen
 * - sonst `firstName`
 * - sonst "Wurstfreund"
 * Niemals automatisch Vorname + Nachname.
 */
export function getPublicUserName(user: PublicUserInput): string {
  const profile = user.profile;
  const publicName = profile?.publicName
    ? (() => {
        const next = sanitizePublicName(profile.publicName as string);

        if (
          next.length < 3 ||
          next.length > 30 ||
          !PUBLIC_NAME_REGEX.test(next)
        ) {
          return "";
        }

        return next;
      })()
    : "";

  if (publicName) {
    return publicName;
  }

  const firstName = profile?.firstName
    ? sanitizePublicName(profile.firstName)
    : "";

  if (firstName) {
    return firstName;
  }

  return "Wurstfreund";
}

export function getPublicAvatarUrl(user: PublicUserInput): string | null {
  const avatarUrl = user.profile?.avatarUrl?.trim();

  return avatarUrl ? avatarUrl : null;
}

/**
 * Initialen aus einem bereits aufgelösten öffentlichen Label (z. B. Review-Snapshot).
 */
export function getInitialsFromLabel(label: string): string {
  const trimmed = label.trim();

  if (!trimmed) {
    return "";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Initialen für Avatar-Fallback aus öffentlichem Namen.
 */
export function getPublicAvatarInitials(user: PublicUserInput): string {
  return getInitialsFromLabel(getPublicUserName(user));
}

