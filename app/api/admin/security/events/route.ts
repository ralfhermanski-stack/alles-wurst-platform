import { adminGuardResponse, jsonSuccess } from "@/lib/admin/admin-api-utils";
import { listSecurityEvents } from "@/lib/security/security-admin-service";
import type { SecurityEventType, SecurityRiskLevel } from "@prisma/client";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const eventType = url.searchParams.get("eventType") as SecurityEventType | null;
  const riskLevel = url.searchParams.get("riskLevel") as SecurityRiskLevel | null;
  const ipAddress = url.searchParams.get("ipAddress");

  const data = await listSecurityEvents({
    page,
    eventType: eventType ?? undefined,
    riskLevel: riskLevel ?? undefined,
    ipAddress: ipAddress ?? undefined,
  });

  return jsonSuccess(data);
}
