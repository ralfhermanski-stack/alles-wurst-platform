import { adminGuardResponse, jsonSuccess } from "@/lib/admin/admin-api-utils";
import { listSuspiciousUsers } from "@/lib/security/security-admin-service";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const data = await listSuspiciousUsers({ page });

  return jsonSuccess(data);
}
