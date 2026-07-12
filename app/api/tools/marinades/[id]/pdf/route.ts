/**
 * @file app/api/tools/marinades/[id]/pdf/route.ts
 * @routes GET  — geschützter PDF-Download
 *         POST — PDF serverseitig erzeugen
 */

import {
  buildRecipeMembershipContext,
  resolveRecipeUserId,
} from "@/lib/auth/recipe-request-auth";
import {
  generateMarinadePdf,
  getMarinadePdfForDownload,
} from "@/lib/tools/marinade-service";
import {
  jsonFromServiceResult,
  jsonSuccess,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { getStringField } from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const userId = await resolveRecipeUserId(request);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Nutzer-ID ist erforderlich.",
      }),
    );
  }

  const membership = await buildRecipeMembershipContext(request, userId);
  const result = await getMarinadePdfForDownload(id, userId, membership);

  if (!result.success) {
    return jsonFromServiceResult(result);
  }

  return new Response(Buffer.from(result.data.bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(result.data.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  const userId = await resolveRecipeUserId(request, body);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Feld userId ist erforderlich.",
      }),
    );
  }

  const creatorName = body ? getStringField(body, "creatorName") : null;

  if (!creatorName) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "creatorName ist erforderlich.",
      }),
    );
  }

  const membership = await buildRecipeMembershipContext(request, userId, body);
  const result = await generateMarinadePdf(
    id,
    userId,
    membership,
    creatorName,
  );

  if (result.success) {
    return jsonSuccess(result.data);
  }

  return jsonFromServiceResult(result);
}
