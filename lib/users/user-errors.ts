/**
 * @file user-errors.ts
 * @purpose Strukturierte Fehlertypen für User- und Mitgliedschafts-Services.
 */

/** Bekannte Fehlercodes der User-Schicht */
export type UserErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_ERROR";

/** Strukturierter Fehler für Service- und API-Antworten */
export type UserServiceError = {
  code: UserErrorCode;
  message: string;
  details?: Record<string, string>;
};

export type UserServiceSuccess<T> = {
  success: true;
  data: T;
};

export type UserServiceFailure = {
  success: false;
  error: UserServiceError;
};

export type UserServiceResult<T> =
  | UserServiceSuccess<T>
  | UserServiceFailure;

export function userSuccess<T>(data: T): UserServiceSuccess<T> {
  return { success: true, data };
}

export function userFailure(error: UserServiceError): UserServiceFailure {
  return { success: false, error };
}

export function userErrorToStatus(code: UserErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "INTERNAL_ERROR":
      return 500;
  }
}
