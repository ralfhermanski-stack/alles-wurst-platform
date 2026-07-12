import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  getChallengeById,
  updateChallenge,
} from "@/lib/challenges/challenge-service";
import type {
  ChallengeEligibilityConfig,
  ChallengeSubmissionConfig,
  UpsertChallengeInput,
} from "@/lib/challenges/challenge-types";

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

function parseUpsertBody(
  body: Record<string, unknown>,
): UpsertChallengeInput {
  return {
    title: String(body.title ?? ""),
    slug: typeof body.slug === "string" ? body.slug : undefined,
    excerpt: typeof body.excerpt === "string" ? body.excerpt : null,
    description: String(body.description ?? ""),
    task: String(body.task ?? ""),
    coverImageUrl:
      typeof body.coverImageUrl === "string" ? body.coverImageUrl : null,
    startAt: String(body.startAt ?? ""),
    endAt: String(body.endAt ?? ""),
    submissionDeadline: String(body.submissionDeadline ?? ""),
    votingStartAt:
      typeof body.votingStartAt === "string" ? body.votingStartAt : null,
    votingEndAt:
      typeof body.votingEndAt === "string" ? body.votingEndAt : null,
    status:
      body.status === "DRAFT" ||
      body.status === "SCHEDULED" ||
      body.status === "ACTIVE" ||
      body.status === "VOTING" ||
      body.status === "COMPLETED" ||
      body.status === "ARCHIVED"
        ? body.status
        : undefined,
    votingMode:
      body.votingMode === "ADMIN_ONLY" ||
      body.votingMode === "JURY" ||
      body.votingMode === "COMMUNITY" ||
      body.votingMode === "MIXED"
        ? body.votingMode
        : undefined,
    winnerCount:
      typeof body.winnerCount === "number" ? body.winnerCount : undefined,
    prizeDescription:
      typeof body.prizeDescription === "string" ? body.prizeDescription : null,
    showOnHomepage:
      typeof body.showOnHomepage === "boolean" ? body.showOnHomepage : undefined,
    showInMemberDashboard:
      typeof body.showInMemberDashboard === "boolean"
        ? body.showInMemberDashboard
        : undefined,
    popupEnabled:
      typeof body.popupEnabled === "boolean" ? body.popupEnabled : undefined,
    popupStartAt:
      typeof body.popupStartAt === "string" ? body.popupStartAt : null,
    popupEndAt: typeof body.popupEndAt === "string" ? body.popupEndAt : null,
    popupRemindAfterDays:
      typeof body.popupRemindAfterDays === "number"
        ? body.popupRemindAfterDays
        : undefined,
    notificationsEnabled:
      typeof body.notificationsEnabled === "boolean"
        ? body.notificationsEnabled
        : undefined,
    participationRules:
      typeof body.participationRules === "string"
        ? body.participationRules
        : null,
    eligibilityConfig:
      typeof body.eligibilityConfig === "object" && body.eligibilityConfig !== null
        ? (body.eligibilityConfig as ChallengeEligibilityConfig)
        : undefined,
    submissionConfig:
      typeof body.submissionConfig === "object" && body.submissionConfig !== null
        ? (body.submissionConfig as ChallengeSubmissionConfig)
        : undefined,
    forumId:
      body.forumId === null
        ? null
        : typeof body.forumId === "string"
          ? body.forumId
          : undefined,
  };
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { challengeId } = await context.params;
  const result = await getChallengeById(challengeId);

  return jsonFromAuthResult(result);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { challengeId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const result = await updateChallenge(challengeId, parseUpsertBody(body));

  return jsonFromAuthResult(result);
}
