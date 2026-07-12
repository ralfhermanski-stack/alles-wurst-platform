/**
 * @file recipe-errors.ts
 * @purpose Strukturierte Fehlertypen für die Rezept-API und den Recipe-Service.
 * @responsibility Einheitliche Fehlercodes und HTTP-Status-Zuordnung — keine rohen Prisma-Fehler nach außen.
 * @usage Importiert von `recipe-service.ts` und API-Routen.
 */

/** Bekannte Fehlercodes der Rezept-Schicht */
export type RecipeErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

/** Strukturierter Fehler für Service- und API-Antworten */
export type RecipeServiceError = {
  code: RecipeErrorCode;
  message: string;
  /** Optionale Detailfelder, z. B. Validierungs-Hinweise */
  details?: Record<string, string>;
};

/** Erfolgreiches Service-Ergebnis */
export type RecipeServiceSuccess<T> = {
  success: true;
  data: T;
};

/** Fehlgeschlagenes Service-Ergebnis */
export type RecipeServiceFailure = {
  success: false;
  error: RecipeServiceError;
};

/** Discriminated Union für alle Service-Rückgaben */
export type RecipeServiceResult<T> =
  | RecipeServiceSuccess<T>
  | RecipeServiceFailure;

/**
 * Erzeugt ein erfolgreiches Service-Ergebnis.
 *
 * @param data - Nutzdaten der Operation
 */
export function recipeSuccess<T>(data: T): RecipeServiceSuccess<T> {
  return { success: true, data };
}

/**
 * Erzeugt ein fehlgeschlagenes Service-Ergebnis.
 *
 * @param error - Strukturierter Fehler
 */
export function recipeFailure(error: RecipeServiceError): RecipeServiceFailure {
  return { success: false, error };
}

/**
 * Mappt einen Fehlercode auf den passenden HTTP-Status.
 *
 * @param code - Interner Fehlercode
 */
export function recipeErrorToStatus(code: RecipeErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "INTERNAL_ERROR":
      return 500;
  }
}
