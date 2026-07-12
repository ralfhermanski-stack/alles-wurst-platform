import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  getProductRecommendationSettings,
  listPartnerPrograms,
  upsertPartnerProgram,
  updateProductRecommendationSettings,
} from "@/lib/product-recommendations/partner-program-service";
import type { UpsertPartnerProgramInput } from "@/lib/product-recommendations/product-recommendation-types";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const programs = await listPartnerPrograms(true);
  const settings = await getProductRecommendationSettings();
  return NextResponse.json({ success: true, data: { programs, settings } });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const body = (await request.json()) as UpsertPartnerProgramInput & { id?: string };
  const program = await upsertPartnerProgram(body, body.id);

  return NextResponse.json({ success: true, data: program });
}

export async function PATCH(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const body = (await request.json()) as {
    affiliateDisclosureText?: string;
    defaultAmazonProgramId?: string | null;
  };

  const settings = await updateProductRecommendationSettings(body);
  return NextResponse.json({ success: true, data: settings });
}
