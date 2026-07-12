/**
 * @file auth-action-types.ts
 * @purpose Gemeinsame Typen für E-Mail-Verifikation und Passwort-Reset.
 */

export type AuthActionResult = {
  message: string;
  /** Nur im Entwicklungsmodus — direkter Aktionslink */
  devActionLink?: string;
};

export type RegisterApiData = {
  user: import("./auth-types").AuthSessionUser;
  devVerificationLink?: string;
};
