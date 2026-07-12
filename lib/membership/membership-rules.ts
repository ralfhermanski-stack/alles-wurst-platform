/**
 * @file membership-rules.ts
 * @purpose Zentrale Mitgliedschafts- und Rollenregeln für Rezeptgenerator und Rezeptdatenbank.
 * @responsibility Fähigkeiten, Limits und Sperrhinweise — ohne echte Auth oder Zahlungslogik.
 * @usage Importiert von API-Routen, Services und UI-Komponenten.
 */

// =============================================================================
// Rollen & Kontext
// =============================================================================

/** Mitgliedschafts- und Systemrollen (Prototyp bis echte Auth) */
export type MembershipRole =
  | "guest"
  | "registered"
  | "wurstclub"
  | "meisterclub"
  | "accounting"
  | "admin";

/** Verbraucher-Stufen (ohne Personalrollen) */
export type ConsumerMembershipRole = Exclude<
  MembershipRole,
  "accounting" | "admin"
>;

/** Personalrollen mit Sonderrechten */
export type StaffRole = Extract<MembershipRole, "accounting" | "admin">;

/** Fähigkeiten im Rezept- und Club-Bereich */
export type MembershipCapability =
  | "recipe.own.list"
  | "recipe.own.create"
  | "recipe.database.read"
  | "recipe.database.copy"
  | "recipe.analysis"
  | "marinade.use"
  | "marinade.save"
  | "marinade.pdf"
  | "accounting.user.search"
  | "accounting.payment.view"
  | "accounting.membership.pause"
  | "accounting.membership.reactivate"
  | "accounting.membership.extend"
  | "accounting.membership.end"
  | "accounting.payment.note"
  | "accounting.internal.note"
  | "accounting.access.lock"
  | "accounting.access.unlock"
  | "admin.recipes"
  | "admin.settings"
  | "admin.categories";

/** Zugriffskontext eines Nutzers (Prototyp: aus Header + userId) */
export type MembershipAccessContext = {
  userId: string | null;
  role: MembershipRole;
  /** Manuell gesperrter Rezept-/Club-Zugriff (z. B. durch Buchhaltung) */
  accessBlocked: boolean;
};

/** Ergebnis einer Zugriffsprüfung */
export type MembershipCheckResult =
  | { allowed: true }
  | { allowed: false; message: string; capability: MembershipCapability };

// =============================================================================
// Konstanten
// =============================================================================

/** Alle gültigen Rollen */
export const MEMBERSHIP_ROLES: readonly MembershipRole[] = [
  "guest",
  "registered",
  "wurstclub",
  "meisterclub",
  "accounting",
  "admin",
] as const;

/** Max. eigene Rezepte — `null` = unbegrenzt, `0` = nicht erlaubt */
export const RECIPE_OWN_LIMITS: Record<MembershipRole, number | null> = {
  guest: 0,
  registered: 3,
  wurstclub: null,
  meisterclub: null,
  accounting: null,
  admin: null,
};

/** Standardrolle nach „Anmeldung“ (Prototyp mit localStorage-userId) */
export const DEFAULT_MEMBERSHIP_ROLE: MembershipRole = "registered";

// =============================================================================
// Hilfsfunktionen
// =============================================================================

/**
 * Prüft, ob ein String eine gültige Mitgliedschaftsrolle ist.
 */
export function isMembershipRole(value: string): value is MembershipRole {
  return (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

/**
 * Personalrolle (Buchhaltung oder Admin)?
 */
export function isStaffRole(role: MembershipRole): role is StaffRole {
  return role === "accounting" || role === "admin";
}

/**
 * Erzeugt einen Zugriffskontext aus Rolle und userId.
 */
export function createMembershipContext(
  role: MembershipRole,
  userId: string | null,
  accessBlocked = false,
): MembershipAccessContext {
  return { role, userId: userId?.trim() || null, accessBlocked };
}

/**
 * Nutzer gilt als „eingeloggt“ (Prototyp: userId vorhanden und nicht Gast).
 */
export function isLoggedInUser(context: MembershipAccessContext): boolean {
  return Boolean(context.userId) && context.role !== "guest";
}

// =============================================================================
// Fähigkeits-Matrix
// =============================================================================

const ROLE_CAPABILITIES: Record<MembershipRole, ReadonlySet<MembershipCapability>> =
  {
    guest: new Set(),
    registered: new Set([
      "recipe.own.list",
      "recipe.own.create",
      "recipe.database.read",
      "recipe.database.copy",
      "marinade.use",
    ]),
    wurstclub: new Set([
      "recipe.own.list",
      "recipe.own.create",
      "recipe.database.read",
      "recipe.database.copy",
      "marinade.use",
      "marinade.save",
      "marinade.pdf",
    ]),
    meisterclub: new Set([
      "recipe.own.list",
      "recipe.own.create",
      "recipe.database.read",
      "recipe.database.copy",
      "recipe.analysis",
      "marinade.use",
      "marinade.save",
      "marinade.pdf",
    ]),
    accounting: new Set([
      "accounting.user.search",
      "accounting.payment.view",
      "accounting.membership.pause",
      "accounting.membership.reactivate",
      "accounting.membership.extend",
      "accounting.membership.end",
      "accounting.payment.note",
      "accounting.internal.note",
      "accounting.access.lock",
      "accounting.access.unlock",
    ]),
    admin: new Set([
      "recipe.own.list",
      "recipe.own.create",
      "recipe.database.read",
      "recipe.database.copy",
      "recipe.analysis",
      "marinade.use",
      "marinade.save",
      "marinade.pdf",
      "admin.recipes",
      "admin.settings",
      "admin.categories",
    ]),
  };

/** Buchhaltung darf NICHT (explizite Negativliste) */
export const ACCOUNTING_FORBIDDEN_CAPABILITIES: readonly MembershipCapability[] =
  [
    "admin.recipes",
    "admin.settings",
    "admin.categories",
    "recipe.analysis",
  ] as const;

/**
 * Prüft, ob eine Rolle eine Fähigkeit grundsätzlich besitzt.
 */
export function roleHasCapability(
  role: MembershipRole,
  capability: MembershipCapability,
): boolean {
  if (role === "accounting") {
    return (
      ROLE_CAPABILITIES.accounting.has(capability) &&
      !ACCOUNTING_FORBIDDEN_CAPABILITIES.includes(capability)
    );
  }

  return ROLE_CAPABILITIES[role].has(capability);
}

// =============================================================================
// Deutsche Sperrhinweise
// =============================================================================

export const MEMBERSHIP_BLOCK_MESSAGES: Record<
  MembershipCapability,
  string
> = {
  "recipe.own.list":
    "Eigene Rezepte sind erst nach Registrierung verfügbar. Bitte melde dich an oder werde Mitglied.",
  "recipe.own.create":
    "Eigene Rezepte können in deiner Stufe nicht angelegt werden.",
  "recipe.database.read":
    "Die Rezeptdatenbank ist für registrierte Mitglieder und Club-Stufen vorgesehen.",
  "recipe.database.copy":
    "Zum Kopieren in eigene Rezepte ist eine Anmeldung erforderlich.",
  "recipe.analysis":
    "Die Meisteranalyse ist der Meisterclub-Stufe vorbehalten (in Vorbereitung).",
  "marinade.use":
    "Der Marinaden-Generator ist für angemeldete Mitglieder verfügbar.",
  "marinade.save":
    "Marinaden speichern ist ab Wurst Club / Meisterclub verfügbar.",
  "marinade.pdf":
    "PDF-Download für Marinaden ist ab Wurst Club / Meisterclub verfügbar.",
  "accounting.user.search":
    "Diese Funktion ist der Buchhaltung vorbehalten.",
  "accounting.payment.view":
    "Zahlungsstatus einsehen — nur für Buchhaltung.",
  "accounting.membership.pause":
    "Mitgliedschaft pausieren — nur für Buchhaltung.",
  "accounting.membership.reactivate":
    "Mitgliedschaft reaktivieren — nur für Buchhaltung.",
  "accounting.membership.extend":
    "Mitgliedschaft verlängern — nur für Buchhaltung.",
  "accounting.membership.end":
    "Mitgliedschaft beenden — nur für Buchhaltung.",
  "accounting.payment.note":
    "Zahlungsnotiz — nur für Buchhaltung.",
  "accounting.internal.note":
    "Interner Vermerk — nur für Buchhaltung.",
  "accounting.access.lock":
    "Zugriff sperren — nur für Buchhaltung.",
  "accounting.access.unlock":
    "Zugriff freigeben — nur für Buchhaltung.",
  "admin.recipes":
    "Rezept-Administration — nur für Administratoren.",
  "admin.settings":
    "Globale Einstellungen — nur für Administratoren.",
  "admin.categories":
    "Kategorieverwaltung — nur für Administratoren.",
};

export const MEMBERSHIP_LIMIT_MESSAGE_REGISTERED =
  "Du hast das Limit von 3 eigenen Rezepten in der Basis-Registrierung erreicht. Upgrade auf Wurst Club für unbegrenzte Rezepte.";

export const MEMBERSHIP_ACCESS_BLOCKED_MESSAGE =
  "Dein Rezept- und Club-Zugriff wurde vorübergehend gesperrt. Bitte wende dich an den Support oder die Buchhaltung.";

export const MEMBERSHIP_GUEST_MESSAGE =
  "Als Gast kannst du keine eigenen Rezepte speichern. Registriere dich kostenlos oder werde Club-Mitglied.";

// =============================================================================
// Zugriffsprüfungen
// =============================================================================

/**
 * Prüft eine Fähigkeit inkl. Sperre und Login-Status.
 */
export function checkMembershipCapability(
  context: MembershipAccessContext,
  capability: MembershipCapability,
): MembershipCheckResult {
  if (context.accessBlocked && capability.startsWith("recipe.")) {
    return {
      allowed: false,
      capability,
      message: MEMBERSHIP_ACCESS_BLOCKED_MESSAGE,
    };
  }

  if (
    capability === "recipe.database.copy" &&
    !isLoggedInUser(context)
  ) {
    return {
      allowed: false,
      capability,
      message: MEMBERSHIP_BLOCK_MESSAGES["recipe.database.copy"],
    };
  }

  if (
    (capability === "recipe.own.list" ||
      capability === "recipe.own.create") &&
    context.role === "guest"
  ) {
    return {
      allowed: false,
      capability,
      message: MEMBERSHIP_GUEST_MESSAGE,
    };
  }

  if (
    (capability === "recipe.database.read" ||
      capability === "recipe.database.copy") &&
    !roleHasCapability(context.role, capability)
  ) {
    return {
      allowed: false,
      capability,
      message: MEMBERSHIP_BLOCK_MESSAGES[capability],
    };
  }

  if (!roleHasCapability(context.role, capability)) {
    return {
      allowed: false,
      capability,
      message: MEMBERSHIP_BLOCK_MESSAGES[capability],
    };
  }

  return { allowed: true };
}

/**
 * Liefert das Rezept-Limit für die Rolle (`null` = unbegrenzt).
 */
export function getRecipeOwnLimit(role: MembershipRole): number | null {
  if (role === "admin") {
    return null;
  }

  return RECIPE_OWN_LIMITS[role];
}

/**
 * Prüft, ob ein weiteres eigenes Rezept angelegt werden darf.
 */
export function canCreateOwnRecipe(
  context: MembershipAccessContext,
  currentRecipeCount: number,
): MembershipCheckResult {
  const capabilityCheck = checkMembershipCapability(
    context,
    "recipe.own.create",
  );

  if (!capabilityCheck.allowed) {
    return capabilityCheck;
  }

  if (context.role === "admin") {
    return { allowed: true };
  }

  const limit = getRecipeOwnLimit(context.role);

  if (limit === null) {
    return { allowed: true };
  }

  if (currentRecipeCount >= limit) {
    if (context.role === "registered") {
      return {
        allowed: false,
        capability: "recipe.own.create",
        message: MEMBERSHIP_LIMIT_MESSAGE_REGISTERED,
      };
    }

    return {
      allowed: false,
      capability: "recipe.own.create",
      message: MEMBERSHIP_BLOCK_MESSAGES["recipe.own.create"],
    };
  }

  return { allowed: true };
}

/**
 * Meisteranalyse — vorbereitet, noch nicht aktiv in der UI.
 */
export function isRecipeAnalysisEnabled(): boolean {
  return false;
}

export function canUseRecipeAnalysis(
  context: MembershipAccessContext,
): MembershipCheckResult {
  if (!roleHasCapability(context.role, "recipe.analysis")) {
    return {
      allowed: false,
      capability: "recipe.analysis",
      message: MEMBERSHIP_BLOCK_MESSAGES["recipe.analysis"],
    };
  }

  if (!isRecipeAnalysisEnabled()) {
    return {
      allowed: false,
      capability: "recipe.analysis",
      message:
        "Die Meisteranalyse wird für Meisterclub-Mitglieder vorbereitet und ist noch nicht freigeschaltet.",
    };
  }

  return { allowed: true };
}

/**
 * Kurzinfo zum Rezept-Limit für die UI.
 */
export function formatRecipeLimitHint(
  role: MembershipRole,
  currentCount: number,
): string | null {
  const limit = getRecipeOwnLimit(role);

  if (limit === null || role === "guest" || role === "accounting") {
    return null;
  }

  return `${currentCount} von ${limit} Rezepten (Basis-Registrierung)`;
}
