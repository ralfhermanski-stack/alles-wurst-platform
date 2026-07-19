/**
 * @file social-media-types.ts
 */

import type {
  SocialMediaConnectionStatus,
  SocialMediaIntegrationMode,
  SocialMediaPlatform,
  SocialMediaPostSource,
  SocialMediaPostType,
  SocialMediaSyncStatus,
  SocialMediaTagSource,
} from "@prisma/client";

export type SocialMediaChannelEntry = {
  id: string;
  platform: SocialMediaPlatform;
  name: string;
  publicName: string | null;
  handle: string | null;
  profileUrl: string | null;
  externalChannelId: string | null;
  description: string | null;
  icon: string | null;
  coverImageUrl: string | null;
  active: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  integrationMode: SocialMediaIntegrationMode;
  connectionStatus: SocialMediaConnectionStatus;
  ctaLabel: string | null;
  ctaUrl: string | null;
  followerCount: number | null;
  followerCountUpdatedAt: string | null;
  showFollowerCount: boolean;
  channelKeywords: string[];
  tagSource: SocialMediaTagSource;
  manualTags: string[];
  featuredPostId: string | null;
  lastSyncedAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  syncIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type SocialMediaPostEntry = {
  id: string;
  channelId: string;
  externalId: string | null;
  sourceType: SocialMediaPostSource;
  postType: SocialMediaPostType;
  title: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  localThumbnailUrl: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  tags: string[];
  publishedAt: string | null;
  active: boolean;
  featured: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  isManualLocked: boolean;
  isUnavailable: boolean;
};

export type HomepageSocialCard = {
  id: string;
  platform: SocialMediaPlatform;
  icon: string;
  name: string;
  publicName: string;
  description: string;
  profileUrl: string;
  latestPostUrl: string | null;
  followerCount: number | null;
  showFollowerCount: boolean;
  coverImageUrl: string | null;
  tags: string[];
  /** Echte Vorschaubilder (Sync/Cover) — sonst bewusstes CTA ohne Fake-Feed. */
  hasMediaPreviews: boolean;
  previewItems: Array<{ label: string; thumbnailUrl: string | null }>;
  accent: string;
  ctaLabel: string;
};

export type SocialMediaSyncLogEntry = {
  id: string;
  channelId: string | null;
  platform: SocialMediaPlatform | null;
  status: SocialMediaSyncStatus;
  startedAt: string;
  finishedAt: string | null;
  foundCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  triggeredBy: string;
};

export type ImportedSocialPost = {
  externalId: string;
  postType: SocialMediaPostType;
  title: string | null;
  content: string | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  permalink: string | null;
  tags: string[];
  publishedAt: Date | null;
  rawMetadata?: Record<string, unknown>;
};

export const PLATFORM_ICONS: Record<SocialMediaPlatform, string> = {
  TIKTOK: "tiktok",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
};

/** Brand-aligned Gradients (kein Plattform-Lila/Pink als Startseiten-Look). */
export const PLATFORM_ACCENTS: Record<SocialMediaPlatform, string> = {
  TIKTOK: "from-aw-gold/20 via-aw-brown/35",
  INSTAGRAM: "from-aw-gold/25 via-aw-brown/40",
  FACEBOOK: "from-aw-brown/35 via-aw-gold/15",
  YOUTUBE: "from-aw-gold/20 via-aw-brown/45",
};

export const SOCIAL_PLATFORM_LABELS: Record<SocialMediaPlatform, string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
};

export const SOCIAL_INTEGRATION_MODE_LABELS: Record<
  SocialMediaIntegrationMode,
  string
> = {
  API: "API-Sync",
  EMBED: "Einbettung",
  MANUAL: "Manuell",
  DISABLED: "Deaktiviert",
};

export const SOCIAL_CONNECTION_STATUS_LABELS: Record<
  SocialMediaConnectionStatus,
  string
> = {
  NOT_CONFIGURED: "Nicht konfiguriert",
  CONNECTED: "Verbunden",
  TOKEN_EXPIRED: "Token abgelaufen",
  ERROR: "Fehler",
  DISABLED: "Deaktiviert",
};

export const SOCIAL_SYNC_STATUS_LABELS: Record<SocialMediaSyncStatus, string> = {
  RUNNING: "Läuft",
  SUCCESS: "Erfolgreich",
  WARNING: "Warnung",
  FAILED: "Fehlgeschlagen",
};

export const ALLOWED_SOCIAL_DOMAINS = [
  "tiktok.com",
  "www.tiktok.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
];

export type SetupSectionStatus =
  | "not_configured"
  | "partial"
  | "ready"
  | "error"
  | "test_passed";

export type SetupSectionId =
  | "channels"
  | "youtube"
  | "manual_posts"
  | "sync"
  | "homepage"
  | "cron"
  | "function_test";

export type SetupSectionResult = {
  id: SetupSectionId;
  status: SetupSectionStatus;
  message: string;
  adminHref: string;
  details?: Record<string, unknown>;
};

export type PlatformSetupStatus = {
  platform: SocialMediaPlatform;
  configured: boolean;
  active: boolean;
  channelId: string | null;
  channelName: string | null;
};

export type SocialMediaSetupOverview = {
  sections: SetupSectionResult[];
  platforms: PlatformSetupStatus[];
  environment: Array<{
    name: string;
    label: string;
    status: string;
    message: string;
    recommended?: string;
  }>;
  cron: {
    route: string;
    method: string;
    authHeader: string;
    secretConfigured: boolean;
  };
};

export type SystemHealthTone = "green" | "yellow" | "red" | "gray";

export type CronDiagnostics = {
  secretConfigured: boolean;
  endpoint: string;
  method: string;
  authHeader: string;
  lastCronAt: string | null;
  lastCronSuccessAt: string | null;
  lastCronFailureAt: string | null;
  lastCronFailureMessage: string | null;
  syncedChannelsLastRun: number;
  nextExpectedRunAt: string | null;
  staleWarning: boolean;
  recommendedSchedule: string;
  exampleCall: string;
};

export type CombinedSystemStatus = {
  socialMedia: {
    tone: SystemHealthTone;
    activeChannels: number;
    visibleChannels: number;
    manualPosts: number;
    importedPosts: number;
    youtubeConnected: boolean;
    youtubeChannelName: string | null;
    lastSyncAt: string | null;
    lastErrorAt: string | null;
    lastErrorMessage: string | null;
    cronConfigured: boolean;
    lastCronAt: string | null;
    lastCronSuccessAt: string | null;
    cronEndpoint: string;
    cronMethod: string;
    cronAuthHeader: string;
  };
  challenges: {
    tone: SystemHealthTone;
    activeChallengeTitle: string | null;
    plannedChallengeCount: number;
    openSubmissions: number;
    approvedSubmissions: number;
    popupActive: boolean;
    notificationsActive: boolean;
  };
  environment: SocialMediaSetupOverview["environment"];
};
