import { NextResponse } from "next/server";

import {
  getMaintenanceCache,
  MAINTENANCE_CACHE_MS,
  setMaintenanceCache,
} from "@/lib/maintenance/maintenance-cache";
import { getMaintenanceSettings } from "@/lib/maintenance/maintenance-service";

export async function GET(): Promise<Response> {
  const cached = getMaintenanceCache();

  if (cached) {
    return NextResponse.json(
      { enabled: cached.enabled, httpStatus: cached.httpStatus },
      {
        headers: {
          "Cache-Control": `public, max-age=${Math.floor(MAINTENANCE_CACHE_MS / 1000)}`,
        },
      },
    );
  }

  const settings = await getMaintenanceSettings();

  setMaintenanceCache(settings.enabled, settings.httpStatus);

  return NextResponse.json(
    { enabled: settings.enabled, httpStatus: settings.httpStatus },
    {
      headers: {
        "Cache-Control": `public, max-age=${Math.floor(MAINTENANCE_CACHE_MS / 1000)}`,
      },
    },
  );
}
