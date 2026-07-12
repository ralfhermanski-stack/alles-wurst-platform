/**
 * @file social-media-setup-service.ts
 * @purpose Einrichtungsstatus für Social-Media-Assistent.
 */

import type { SocialMediaPlatform } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  checkSocialMediaEnvironment,
  isCronSecretConfigured,
} from "./social-media-env-check";
import {
  SOCIAL_MEDIA_CRON_AUTH_HEADER,
  SOCIAL_MEDIA_CRON_METHOD,
  SOCIAL_MEDIA_CRON_ROUTE,
} from "./social-media-cron-auth";
import { getSocialCredential } from "./social-media-sync-service";
import { testYouTubeConnection } from "./social-media-youtube-test";

import type {
  PlatformSetupStatus,
  SetupSectionId,
  SetupSectionResult,
  SetupSectionStatus,
  SocialMediaSetupOverview,
} from "./social-media-types";

export type {
  PlatformSetupStatus,
  SetupSectionId,
  SetupSectionResult,
  SetupSectionStatus,
  SocialMediaSetupOverview,
} from "./social-media-types";

const PLATFORMS: SocialMediaPlatform[] = [
  "TIKTOK",
  "INSTAGRAM",
  "FACEBOOK",
  "YOUTUBE",
];

function isChannelConfigured(channel: {
  name: string;
  profileUrl: string | null;
  handle: string | null;
  active: boolean;
  isTestData: boolean;
}): boolean {
  if (channel.isTestData) {
    return false;
  }

  return Boolean(channel.name.trim() && (channel.profileUrl?.trim() || channel.handle?.trim()));
}

async function getPlatformStatuses(): Promise<PlatformSetupStatus[]> {
  const channels = await prisma.socialMediaChannel.findMany({
    where: { isTestData: false },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return PLATFORMS.map((platform) => {
    const channel = channels.find((entry) => entry.platform === platform) ?? null;

    return {
      platform,
      configured: channel ? isChannelConfigured(channel) : false,
      active: channel?.active ?? false,
      channelId: channel?.id ?? null,
      channelName: channel?.name ?? null,
    };
  });
}

async function evaluateChannelsSection(): Promise<SetupSectionResult> {
  const platforms = await getPlatformStatuses();
  const configuredCount = platforms.filter((entry) => entry.configured).length;

  let status: SetupSectionStatus = "not_configured";
  let message = "Es wurden noch keine Social-Media-Kanäle eingerichtet.";

  if (configuredCount > 0 && configuredCount < PLATFORMS.length) {
    status = "partial";
    message = `${configuredCount} von ${PLATFORMS.length} Plattformen sind eingerichtet.`;
  } else if (configuredCount === PLATFORMS.length) {
    status = "ready";
    message = "Alle vier Plattformen sind als Kanäle angelegt.";
  }

  return {
    id: "channels",
    status,
    message,
    adminHref: "/admin/marketing/social-media/kanaele",
    details: { configuredCount, platforms },
  };
}

async function evaluateYouTubeSection(): Promise<SetupSectionResult> {
  const youtubeChannel = await prisma.socialMediaChannel.findFirst({
    where: { platform: "YOUTUBE", isTestData: false },
    orderBy: { displayOrder: "asc" },
  });

  if (!youtubeChannel) {
    return {
      id: "youtube",
      status: "not_configured",
      message: "Es wurde noch kein YouTube-Kanal angelegt.",
      adminHref: "/admin/marketing/social-media/schnittstellen",
    };
  }

  const apiKey =
    (await getSocialCredential(youtubeChannel.id, "api_key")) ??
    process.env.YOUTUBE_API_KEY?.trim() ??
    null;

  const hasChannelId = Boolean(youtubeChannel.externalChannelId?.trim());

  if (!apiKey && !hasChannelId) {
    return {
      id: "youtube",
      status: "not_configured",
      message: "YouTube API-Key und Kanal-ID fehlen noch.",
      adminHref: "/admin/marketing/social-media/schnittstellen",
      details: {
        channelId: youtubeChannel.id,
        apiKeyPresent: false,
        channelIdPresent: false,
      },
    };
  }

  if (!apiKey || !hasChannelId) {
    return {
      id: "youtube",
      status: "partial",
      message: apiKey
        ? "Die YouTube-Kanal-ID wurde noch nicht eingerichtet."
        : "Der YouTube-API-Schlüssel wurde noch nicht eingerichtet.",
      adminHref: "/admin/marketing/social-media/schnittstellen",
      details: {
        channelId: youtubeChannel.id,
        apiKeyPresent: Boolean(apiKey),
        channelIdPresent: hasChannelId,
        connectionStatus: youtubeChannel.connectionStatus,
      },
    };
  }

  if (youtubeChannel.connectionStatus === "ERROR") {
    return {
      id: "youtube",
      status: "error",
      message:
        youtubeChannel.lastErrorMessage ??
        "Die YouTube-Verbindung meldet einen Fehler.",
      adminHref: "/admin/marketing/social-media/schnittstellen",
      details: {
        channelId: youtubeChannel.id,
        connectionStatus: youtubeChannel.connectionStatus,
        lastErrorAt: youtubeChannel.lastErrorAt?.toISOString() ?? null,
      },
    };
  }

  if (youtubeChannel.connectionStatus === "CONNECTED") {
    return {
      id: "youtube",
      status: "test_passed",
      message: "YouTube-Verbindung ist eingerichtet und wurde erfolgreich getestet.",
      adminHref: "/admin/marketing/social-media/schnittstellen",
      details: {
        channelId: youtubeChannel.id,
        channelName: youtubeChannel.publicName ?? youtubeChannel.name,
        lastSyncedAt: youtubeChannel.lastSyncedAt?.toISOString() ?? null,
      },
    };
  }

  return {
    id: "youtube",
    status: "partial",
    message: "YouTube-Zugangsdaten sind hinterlegt, Verbindungstest steht noch aus.",
    adminHref: "/admin/marketing/social-media/schnittstellen",
    details: {
      channelId: youtubeChannel.id,
      connectionStatus: youtubeChannel.connectionStatus,
    },
  };
}

async function evaluateManualPostsSection(): Promise<SetupSectionResult> {
  const [manualChannels, manualPosts] = await Promise.all([
    prisma.socialMediaChannel.count({
      where: {
        isTestData: false,
        integrationMode: "MANUAL",
        active: true,
      },
    }),
    prisma.socialMediaPost.count({
      where: {
        isTestData: false,
        sourceType: "MANUAL",
        active: true,
      },
    }),
  ]);

  if (manualChannels === 0) {
    return {
      id: "manual_posts",
      status: "not_configured",
      message: "Keine aktiven Kanäle im manuellen Modus vorhanden.",
      adminHref: "/admin/marketing/social-media/beitraege",
    };
  }

  if (manualPosts === 0) {
    return {
      id: "manual_posts",
      status: "partial",
      message:
        "Manuelle Kanäle sind vorhanden, aber noch keine aktiven manuellen Beiträge.",
      adminHref: "/admin/marketing/social-media/beitraege",
      details: { manualChannels, manualPosts },
    };
  }

  return {
    id: "manual_posts",
    status: "ready",
    message: `${manualPosts} aktive manuelle Beiträge sind vorhanden.`,
    adminHref: "/admin/marketing/social-media/beitraege",
    details: { manualChannels, manualPosts },
  };
}

async function evaluateSyncSection(): Promise<SetupSectionResult> {
  const lastSuccess = await prisma.socialMediaSyncLog.findFirst({
    where: { status: "SUCCESS" },
    orderBy: { startedAt: "desc" },
  });

  const lastFailure = await prisma.socialMediaSyncLog.findFirst({
    where: { status: "FAILED" },
    orderBy: { startedAt: "desc" },
  });

  if (!lastSuccess) {
    return {
      id: "sync",
      status: "not_configured",
      message: "Es wurde noch keine erfolgreiche Synchronisierung protokolliert.",
      adminHref: "/admin/marketing/social-media/protokoll",
      details: {
        lastFailureAt: lastFailure?.startedAt.toISOString() ?? null,
        lastFailureMessage: lastFailure?.errorMessage ?? null,
      },
    };
  }

  if (lastFailure && lastFailure.startedAt > lastSuccess.startedAt) {
    return {
      id: "sync",
      status: "error",
      message: "Die letzte Synchronisierung ist fehlgeschlagen.",
      adminHref: "/admin/marketing/social-media/protokoll",
      details: {
        lastSuccessAt: lastSuccess.startedAt.toISOString(),
        lastFailureAt: lastFailure.startedAt.toISOString(),
        lastFailureMessage: lastFailure.errorMessage,
      },
    };
  }

  const importedPosts = await prisma.socialMediaPost.count({
    where: { sourceType: "API", isTestData: false, active: true },
  });

  return {
    id: "sync",
    status: "ready",
    message: "Die Synchronisierung wurde mindestens einmal erfolgreich ausgeführt.",
    adminHref: "/admin/marketing/social-media/protokoll",
    details: {
      lastSuccessAt: lastSuccess.startedAt.toISOString(),
      importedPosts,
      triggeredBy: lastSuccess.triggeredBy,
    },
  };
}

async function evaluateHomepageSection(): Promise<SetupSectionResult> {
  const visibleChannels = await prisma.socialMediaChannel.count({
    where: {
      active: true,
      showOnHomepage: true,
      isTestData: false,
    },
  });

  if (visibleChannels === 0) {
    return {
      id: "homepage",
      status: "not_configured",
      message: "Keine Kanäle für die Startseiten-Anzeige aktiviert.",
      adminHref: "/admin/marketing/social-media/startseite",
      details: { visibleChannels },
    };
  }

  return {
    id: "homepage",
    status: "ready",
    message: `${visibleChannels} Kanäle sind für die Startseite vorgesehen.`,
    adminHref: "/admin/marketing/social-media/startseite",
    details: { visibleChannels },
  };
}

async function evaluateCronSection(): Promise<SetupSectionResult> {
  const envChecks = checkSocialMediaEnvironment();
  const cronCheck = envChecks.find(
    (entry) => entry.name === "SOCIAL_MEDIA_CRON_SECRET",
  );

  if (!cronCheck || cronCheck.status === "missing") {
    return {
      id: "cron",
      status: "not_configured",
      message: "Das Cron-Secret fehlt oder ist nicht gesetzt.",
      adminHref: "/admin/marketing/social-media/cronjob",
    };
  }

  if (cronCheck.status === "invalid" || cronCheck.status === "weak") {
    return {
      id: "cron",
      status: "error",
      message: cronCheck.message,
      adminHref: "/admin/marketing/social-media/cronjob",
    };
  }

  const lastCron = await prisma.socialMediaSyncLog.findFirst({
    where: { triggeredBy: "cron" },
    orderBy: { startedAt: "desc" },
  });

  if (!lastCron) {
    return {
      id: "cron",
      status: "partial",
      message: "Cron-Secret ist gesetzt, aber noch kein Cron-Lauf protokolliert.",
      adminHref: "/admin/marketing/social-media/cronjob",
    };
  }

  if (lastCron.status === "FAILED") {
    return {
      id: "cron",
      status: "error",
      message: "Der letzte Cron-Lauf ist fehlgeschlagen.",
      adminHref: "/admin/marketing/social-media/cronjob",
      details: { lastCronAt: lastCron.startedAt.toISOString() },
    };
  }

  return {
    id: "cron",
    status: "ready",
    message: "Cronjob ist konfiguriert und wurde bereits ausgeführt.",
    adminHref: "/admin/marketing/social-media/cronjob",
    details: { lastCronAt: lastCron.startedAt.toISOString() },
  };
}

async function evaluateFunctionTestSection(): Promise<SetupSectionResult> {
  const sections = await Promise.all([
    evaluateChannelsSection(),
    evaluateYouTubeSection(),
    evaluateManualPostsSection(),
    evaluateSyncSection(),
    evaluateHomepageSection(),
    evaluateCronSection(),
  ]);

  const hasError = sections.some((section) => section.status === "error");
  const allReady = sections.every(
    (section) =>
      section.status === "ready" || section.status === "test_passed",
  );

  if (hasError) {
    return {
      id: "function_test",
      status: "error",
      message: "Mindestens ein Bereich meldet Fehler.",
      adminHref: "/admin/marketing/social-media/einrichtung",
      details: { sections: sections.map((section) => section.status) },
    };
  }

  if (allReady) {
    return {
      id: "function_test",
      status: "test_passed",
      message: "Alle Einrichtungsbereiche sind vollständig eingerichtet.",
      adminHref: "/admin/marketing/social-media/einrichtung",
    };
  }

  return {
    id: "function_test",
    status: "partial",
    message: "Einrichtung ist teilweise abgeschlossen — weitere Schritte erforderlich.",
    adminHref: "/admin/marketing/social-media/einrichtung",
    details: { sections: sections.map((section) => section.status) },
  };
}

export async function getSocialMediaSetupOverview(): Promise<SocialMediaSetupOverview> {
  const [
    channels,
    youtube,
    manualPosts,
    sync,
    homepage,
    cron,
    functionTest,
    platforms,
    environment,
  ] = await Promise.all([
    evaluateChannelsSection(),
    evaluateYouTubeSection(),
    evaluateManualPostsSection(),
    evaluateSyncSection(),
    evaluateHomepageSection(),
    evaluateCronSection(),
    evaluateFunctionTestSection(),
    getPlatformStatuses(),
    Promise.resolve(checkSocialMediaEnvironment()),
  ]);

  return {
    sections: [channels, youtube, manualPosts, sync, homepage, cron, functionTest],
    platforms,
    environment,
    cron: {
      route: SOCIAL_MEDIA_CRON_ROUTE,
      method: SOCIAL_MEDIA_CRON_METHOD,
      authHeader: SOCIAL_MEDIA_CRON_AUTH_HEADER,
      secretConfigured: isCronSecretConfigured(),
    },
  };
}

export async function checkSetupSection(
  sectionId: SetupSectionId,
  options?: { youtubeChannelId?: string },
): Promise<SetupSectionResult> {
  if (sectionId === "youtube" && options?.youtubeChannelId) {
    const testResult = await testYouTubeConnection(options.youtubeChannelId);

    return {
      id: "youtube",
      status: testResult.success ? "test_passed" : "error",
      message: testResult.message,
      adminHref: "/admin/marketing/social-media/schnittstellen",
      details: {
        ...testResult,
        apiKey: undefined,
      },
    };
  }

  switch (sectionId) {
    case "channels":
      return evaluateChannelsSection();
    case "youtube":
      return evaluateYouTubeSection();
    case "manual_posts":
      return evaluateManualPostsSection();
    case "sync":
      return evaluateSyncSection();
    case "homepage":
      return evaluateHomepageSection();
    case "cron":
      return evaluateCronSection();
    case "function_test":
      return evaluateFunctionTestSection();
    default:
      return {
        id: sectionId,
        status: "error",
        message: "Unbekannter Prüfbereich.",
        adminHref: "/admin/marketing/social-media/einrichtung",
      };
  }
}
