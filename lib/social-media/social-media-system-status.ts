/**
 * @file social-media-system-status.ts
 */

import { prisma } from "@/lib/db/prisma";

import { checkSocialMediaEnvironment, isCronSecretConfigured } from "./social-media-env-check";
import {
  SOCIAL_MEDIA_CRON_AUTH_HEADER,
  SOCIAL_MEDIA_CRON_METHOD,
  SOCIAL_MEDIA_CRON_ROUTE,
} from "./social-media-cron-auth";
import { getSocialCredential } from "./social-media-sync-service";
import type {
  CombinedSystemStatus,
  CronDiagnostics,
  SystemHealthTone,
} from "./social-media-types";

export type {
  CombinedSystemStatus,
  CronDiagnostics,
  SystemHealthTone,
} from "./social-media-types";

type SocialMediaSystemStatus = CombinedSystemStatus["socialMedia"];
type ChallengeSystemStatus = CombinedSystemStatus["challenges"];

const CRON_STALE_HOURS = 6;

function hoursSince(date: Date | null): number | null {
  if (!date) {
    return null;
  }

  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

export async function getSocialMediaSystemStatus(): Promise<SocialMediaSystemStatus> {
  const [
    activeChannels,
    visibleChannels,
    manualPosts,
    importedPosts,
    youtubeChannel,
    lastSuccessLog,
    lastErrorChannel,
    lastCron,
    lastCronSuccess,
  ] = await Promise.all([
    prisma.socialMediaChannel.count({ where: { active: true, isTestData: false } }),
    prisma.socialMediaChannel.count({
      where: { active: true, showOnHomepage: true, isTestData: false },
    }),
    prisma.socialMediaPost.count({
      where: { sourceType: "MANUAL", active: true, isTestData: false },
    }),
    prisma.socialMediaPost.count({
      where: { sourceType: "API", active: true, isTestData: false },
    }),
    prisma.socialMediaChannel.findFirst({
      where: { platform: "YOUTUBE", isTestData: false },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.socialMediaSyncLog.findFirst({
      where: { status: "SUCCESS" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.socialMediaChannel.findFirst({
      where: { lastErrorAt: { not: null }, isTestData: false },
      orderBy: { lastErrorAt: "desc" },
    }),
    prisma.socialMediaSyncLog.findFirst({
      where: { triggeredBy: "cron" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.socialMediaSyncLog.findFirst({
      where: { triggeredBy: "cron", status: "SUCCESS" },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  let youtubeConnected = false;

  if (youtubeChannel) {
    const apiKey =
      (await getSocialCredential(youtubeChannel.id, "api_key")) ??
      process.env.YOUTUBE_API_KEY?.trim() ??
      null;

    youtubeConnected =
      youtubeChannel.connectionStatus === "CONNECTED" &&
      Boolean(apiKey) &&
      Boolean(youtubeChannel.externalChannelId?.trim());
  }

  const cronConfigured = isCronSecretConfigured();
  const lastSyncHours = hoursSince(lastSuccessLog?.startedAt ?? null);
  const lastCronHours = hoursSince(lastCron?.startedAt ?? null);

  let tone: SystemHealthTone = "gray";

  if (activeChannels === 0) {
    tone = "gray";
  } else if (
    lastErrorChannel &&
    (!lastSuccessLog ||
      (lastErrorChannel.lastErrorAt &&
        lastSuccessLog.startedAt < lastErrorChannel.lastErrorAt))
  ) {
    tone = "red";
  } else if (
    !cronConfigured ||
    visibleChannels === 0 ||
    (lastCronHours !== null && lastCronHours > CRON_STALE_HOURS) ||
    (lastSyncHours !== null && lastSyncHours > CRON_STALE_HOURS * 2)
  ) {
    tone = "yellow";
  } else {
    tone = "green";
  }

  return {
    tone,
    activeChannels,
    visibleChannels,
    manualPosts,
    importedPosts,
    youtubeConnected,
    youtubeChannelName: youtubeChannel?.publicName ?? youtubeChannel?.name ?? null,
    lastSyncAt: lastSuccessLog?.startedAt.toISOString() ?? null,
    lastErrorAt: lastErrorChannel?.lastErrorAt?.toISOString() ?? null,
    lastErrorMessage: lastErrorChannel?.lastErrorMessage ?? null,
    cronConfigured,
    lastCronAt: lastCron?.startedAt.toISOString() ?? null,
    lastCronSuccessAt: lastCronSuccess?.startedAt.toISOString() ?? null,
    cronEndpoint: SOCIAL_MEDIA_CRON_ROUTE,
    cronMethod: SOCIAL_MEDIA_CRON_METHOD,
    cronAuthHeader: SOCIAL_MEDIA_CRON_AUTH_HEADER,
  };
}

export async function getChallengeSystemStatus(): Promise<ChallengeSystemStatus> {
  const now = new Date();

  const [
    activeChallenge,
    plannedChallengeCount,
    openSubmissions,
    approvedSubmissions,
  ] = await Promise.all([
    prisma.communityChallenge.findFirst({
      where: {
        isTestData: false,
        status: { in: ["ACTIVE", "VOTING"] },
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: { startAt: "desc" },
    }),
    prisma.communityChallenge.count({
      where: {
        isTestData: false,
        status: { in: ["DRAFT", "SCHEDULED"] },
      },
    }),
    prisma.challengeSubmission.count({
      where: {
        isTestData: false,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
    }),
    prisma.challengeSubmission.count({
      where: { isTestData: false, status: "APPROVED" },
    }),
  ]);

  let tone: SystemHealthTone = "gray";

  if (activeChallenge) {
    tone = openSubmissions > 0 ? "yellow" : "green";
  } else if (plannedChallengeCount > 0) {
    tone = "yellow";
  }

  return {
    tone,
    activeChallengeTitle: activeChallenge?.title ?? null,
    plannedChallengeCount,
    openSubmissions,
    approvedSubmissions,
    popupActive: activeChallenge?.popupEnabled ?? false,
    notificationsActive: activeChallenge?.notificationsEnabled ?? false,
  };
}

export async function getCombinedSystemStatus(): Promise<CombinedSystemStatus> {
  const [socialMedia, challenges, environment] = await Promise.all([
    getSocialMediaSystemStatus(),
    getChallengeSystemStatus(),
    Promise.resolve(checkSocialMediaEnvironment()),
  ]);

  return { socialMedia, challenges, environment };
}

export async function getCronDiagnostics(): Promise<CronDiagnostics> {
  const [lastCron, lastSuccess, lastFailure, apiChannels] = await Promise.all([
    prisma.socialMediaSyncLog.findFirst({
      where: { triggeredBy: "cron" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.socialMediaSyncLog.findFirst({
      where: { triggeredBy: "cron", status: "SUCCESS" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.socialMediaSyncLog.findFirst({
      where: { triggeredBy: "cron", status: "FAILED" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.socialMediaChannel.findMany({
      where: {
        active: true,
        integrationMode: "API",
        isTestData: false,
      },
      select: { syncIntervalMinutes: true },
    }),
  ]);

  const minInterval =
    apiChannels.length > 0
      ? Math.min(...apiChannels.map((channel) => channel.syncIntervalMinutes))
      : 120;

  const baseTime = lastCron?.startedAt ?? new Date();
  const nextExpectedRunAt = new Date(
    baseTime.getTime() + minInterval * 60 * 1000,
  ).toISOString();

  const staleHours = hoursSince(lastCron?.startedAt ?? null);

  return {
    secretConfigured: isCronSecretConfigured(),
    endpoint: SOCIAL_MEDIA_CRON_ROUTE,
    method: SOCIAL_MEDIA_CRON_METHOD,
    authHeader: SOCIAL_MEDIA_CRON_AUTH_HEADER,
    lastCronAt: lastCron?.startedAt.toISOString() ?? null,
    lastCronSuccessAt: lastSuccess?.startedAt.toISOString() ?? null,
    lastCronFailureAt: lastFailure?.startedAt.toISOString() ?? null,
    lastCronFailureMessage: lastFailure?.errorMessage ?? null,
    syncedChannelsLastRun: lastSuccess
      ? lastSuccess.createdCount + lastSuccess.updatedCount
      : 0,
    nextExpectedRunAt: apiChannels.length > 0 ? nextExpectedRunAt : null,
    staleWarning: staleHours !== null && staleHours > CRON_STALE_HOURS,
    recommendedSchedule: "Alle 2 Stunden (0 */2 * * *)",
    exampleCall: `curl -X POST https://<ihre-domain>${SOCIAL_MEDIA_CRON_ROUTE} -H "${SOCIAL_MEDIA_CRON_AUTH_HEADER.replace("<SOCIAL_MEDIA_CRON_SECRET>", "<IHR_SECRET>")}"`,
  };
}
