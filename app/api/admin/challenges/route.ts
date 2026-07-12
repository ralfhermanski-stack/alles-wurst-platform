import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createChallenge,
  listAdminChallenges,
} from "@/lib/challenges/challenge-service";
import type {
  ChallengeEligibilityConfig,
  ChallengeSubmissionConfig,
  UpsertChallengeInput,
} from "@/lib/challenges/challenge-types";
import type { CommunityChallengeStatus } from "@prisma/client";

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

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | CommunityChallengeStatus
    | "all"
    | null;
  const query = url.searchParams.get("q")?.trim().toLowerCase();

  let challenges = await listAdminChallenges();

  if (status && status !== "all") {
    challenges = challenges.filter((entry) => entry.status === status);
  }

  if (query) {
    challenges = challenges.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.slug.toLowerCase().includes(query),
    );
  }

  return jsonFromAuthResult({ success: true, data: challenges });
}

export async function POST(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const body = (await request.json()) as Record<string, unknown>;
  const result = await createChallenge({
    ...parseUpsertBody(body),
    createdById: access.data.userId,
  });

  return jsonFromAuthResult(result);
}
