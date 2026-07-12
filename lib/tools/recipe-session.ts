/**
 * @file recipe-session.ts
 * @purpose Temporäre Nutzer-ID für den Rezeptgenerator (bis Auth existiert).
 * @responsibility UUID in localStorage bereitstellen — nur Browser, kein Server.
 * @usage Importiert von Rezeptgenerator-UI-Komponenten.
 */

const STORAGE_KEY = "alles-wurst-recipe-user-id";

/**
 * Liefert eine stabile Nutzer-UUID für API-Aufrufe.
 * Wird beim ersten Besuch generiert und in localStorage gespeichert.
 */
export function getRecipeUserId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, newId);

  return newId;
}

/**
 * Liest die gespeicherte Nutzer-ID ohne neue zu erzeugen.
 */
export function getStoredRecipeUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Setzt die Nutzer-ID nach Registrierung/Login (echtes Konto).
 */
export function setRecipeUserId(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, userId);
}

/**
 * Entfernt die lokale Nutzer-ID (z. B. nach Logout).
 * Beim nächsten Aufruf von getRecipeUserId() wird eine neue anonyme ID erzeugt.
 */
export function clearRecipeUserId(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
