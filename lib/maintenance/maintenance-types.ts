/**
 * @file maintenance-types.ts
 * @purpose Typen für den Plattform-Wartungsmodus.
 */

export type MaintenanceHttpStatus = "503" | "200";

export type MaintenanceSettingsData = {
  enabled: boolean;
  title: string;
  text: string;
  showLogo: boolean;
  backgroundUrl: string | null;
  logoUrl: string | null;
  countdownEnabled: boolean;
  endDate: string | null;
  httpStatus: MaintenanceHttpStatus;
  newsletterEnabled: boolean;
  updatedAt: string;
};

export type MaintenanceStatusResponse = {
  enabled: boolean;
  httpStatus: MaintenanceHttpStatus;
};

export type UpdateMaintenanceSettingsInput = Partial<{
  enabled: boolean;
  title: string;
  text: string;
  showLogo: boolean;
  countdownEnabled: boolean;
  endDate: string | null;
  httpStatus: MaintenanceHttpStatus;
  newsletterEnabled: boolean;
}>;

export const DEFAULT_MAINTENANCE_TEXT = `🔧 Wir arbeiten für euch an Verbesserungen

Aktuell überarbeiten wir unsere Plattform,
erstellen neue Inhalte und verbessern bestehende Funktionen.

Wir sind bald wieder für euch da.

Vielen Dank für eure Geduld.

Euer Alles-Wurst-Team`;
