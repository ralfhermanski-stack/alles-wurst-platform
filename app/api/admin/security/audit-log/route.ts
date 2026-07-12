import { adminGuardResponse, jsonSuccess } from "@/lib/admin/admin-api-utils";
import { listSecurityAuditLogs } from "@/lib/security/security-admin-service";
import type { SecurityAuditAction } from "@prisma/client";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const action = url.searchParams.get("action") as SecurityAuditAction | null;

  const data = await listSecurityAuditLogs({
    page,
    action: action ?? undefined,
  });

  return jsonSuccess(data);
}
