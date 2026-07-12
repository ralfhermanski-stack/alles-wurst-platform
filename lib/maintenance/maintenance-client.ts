/**
 * @file maintenance-client.ts
 * @purpose Client für Wartungsmodus-Admin-API.
 */

import { adminFetch, type AdminApiResponse } from "@/lib/admin/admin-fetch";
import type { MaintenanceSettingsData } from "./maintenance-types";

export type MaintenanceAdminData = {
  settings: MaintenanceSettingsData;
  signups: { email: string; createdAt: string }[];
};

export async function getMaintenanceAdminApi(): Promise<
  AdminApiResponse<MaintenanceAdminData>
> {
  return adminFetch<MaintenanceAdminData>("/api/admin/maintenance");
}

export async function updateMaintenanceAdminApi(
  input: Partial<MaintenanceSettingsData>,
): Promise<AdminApiResponse<MaintenanceSettingsData>> {
  return adminFetch<MaintenanceSettingsData>("/api/admin/maintenance", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export type MaintenanceImageKind = "logo" | "background";

export async function uploadMaintenanceImageApi(
  kind: MaintenanceImageKind,
  file: File,
): Promise<AdminApiResponse<MaintenanceSettingsData>> {
  const formData = new FormData();
  formData.set("file", file);

  return adminFetch<MaintenanceSettingsData>(`/api/admin/maintenance/images/${kind}`, {
    method: "POST",
    body: formData,
  });
}

export async function removeMaintenanceImageApi(
  kind: MaintenanceImageKind,
): Promise<AdminApiResponse<MaintenanceSettingsData>> {
  return adminFetch<MaintenanceSettingsData>(`/api/admin/maintenance/images/${kind}`, {
    method: "DELETE",
  });
}
