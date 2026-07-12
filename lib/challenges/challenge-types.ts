/**
 * @file challenge-types.ts
 * @purpose TypeScript-Typen für Community Challenges.
 */

import type {
  ChallengeSubmissionStatus,
  ChallengeVotingMode,
  CommunityChallengeStatus,
} from "@prisma/client";

export const CHALLENGE_STATUS_LABELS: Record<CommunityChallengeStatus, string> = {
  DRAFT: "Entwurf",
  SCHEDULED: "Geplant",
  ACTIVE: "Aktiv",
  VOTING: "Abstimmung",
  COMPLETED: "Abgeschlossen",
  ARCHIVED: "Archiviert",
};

export const CHALLENGE_VOTING_MODE_LABELS: Record<ChallengeVotingMode, string> = {
  ADMIN_ONLY: "Nur Admin",
  JURY: "Jury",
  COMMUNITY: "Community",
  MIXED: "Gemischt",
};

export const CHALLENGE_SUBMISSION_STATUS_LABELS: Record<
  ChallengeSubmissionStatus,
  string
> = {
  DRAFT: "Entwurf",
  SUBMITTED: "Eingereicht",
  UNDER_REVIEW: "In Prüfung",
  APPROVED: "Freigegeben",
  REJECTED: "Abgelehnt",
  WITHDRAWN: "Zurückgezogen",
  WINNER: "Gewinner",
};

/** Unterstützte Teilnahme-Rollen in der eligibilityConfig */
export type ChallengeEligibilityRole =
  | "registered"
  | "wurstclub"
  | "meisterclub";

/**
 * JSON-Form der eligibilityConfig-Spalte.
 * Leer `{}` = alle registrierten Nutzer.
 */
export type ChallengeEligibilityConfig = {
  /** Mindestens eine dieser Mitgliedsstufen erfüllt die Rolle */
  roles?: ChallengeEligibilityRole[];
  /** Kursbasierte Teilnahme: Zugriff auf mindestens einen Kurs */
  courseIds?: string[];
  /** Bei mehreren Kursen: alle erforderlich (Standard: mindestens einer) */
  requireAllCourses?: boolean;
};

/** Feld- und Upload-Regeln in der submissionConfig */
export type ChallengeSubmissionFieldConfig = {
  recipeRequired?: boolean;
  videoAllowed?: boolean;
  videoRequired?: boolean;
  maxImages?: number;
  maxImageBytes?: number;
  minTitleLength?: number;
  maxTitleLength?: number;
  minDescriptionLength?: number;
  maxDescriptionLength?: number;
  requirePublicConsent?: boolean;
  requireMediaRightsConsent?: boolean;
};

/**
 * JSON-Form der submissionConfig-Spalte.
 */
export type ChallengeSubmissionConfig = {
  fields?: ChallengeSubmissionFieldConfig;
};

export type ChallengeMediaEntry = {
  id: string;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
  mediaType: string;
  displayOrder: number;
};

export type ChallengeEntry = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string;
  task: string;
  coverImageUrl: string | null;
  startAt: string;
  endAt: string;
  submissionDeadline: string;
  votingStartAt: string | null;
  votingEndAt: string | null;
  status: CommunityChallengeStatus;
  eligibilityConfig: ChallengeEligibilityConfig;
  participationRules: string | null;
  submissionConfig: ChallengeSubmissionConfig;
  votingMode: ChallengeVotingMode;
  winnerCount: number;
  prizeDescription: string | null;
  showOnHomepage: boolean;
  showInMemberDashboard: boolean;
  popupEnabled: boolean;
  popupStartAt: string | null;
  popupEndAt: string | null;
  popupRemindAfterDays: number;
  notificationsEnabled: boolean;
  forumId: string | null;
  forumThreadId: string | null;
  createdById: string | null;
  publishedById: string | null;
  publishedAt: string | null;
  isTestData: boolean;
  createdAt: string;
  updatedAt: string;
  submissionCount?: number;
  approvedSubmissionCount?: number;
};

export type ChallengeSubmissionEntry = {
  id: string;
  challengeId: string;
  userId: string;
  title: string;
  description: string;
  recipeContent: string | null;
  videoUrl: string | null;
  status: ChallengeSubmissionStatus;
  publicConsent: boolean;
  mediaRightsConsent: boolean;
  mediaRightsConsentAt: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  rejectionReason: string | null;
  isWinner: boolean;
  winnerRank: number | null;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  media: ChallengeMediaEntry[];
};

export type ChallengeSubmissionPreview = {
  id: string;
  title: string;
  description: string;
  displayName: string;
  avatarUrl: string | null;
  previewImageUrl: string | null;
  submittedAt: string | null;
};

export type HomepageChallengeData = {
  challenge: ChallengeEntry | null;
  approvedSubmissions: ChallengeSubmissionPreview[];
  participantCount: number;
  approvedCount: number;
};

export type UpsertChallengeInput = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  description: string;
  task: string;
  coverImageUrl?: string | null;
  startAt: string;
  endAt: string;
  submissionDeadline: string;
  votingStartAt?: string | null;
  votingEndAt?: string | null;
  status?: CommunityChallengeStatus;
  eligibilityConfig?: ChallengeEligibilityConfig;
  participationRules?: string | null;
  submissionConfig?: ChallengeSubmissionConfig;
  votingMode?: ChallengeVotingMode;
  winnerCount?: number;
  prizeDescription?: string | null;
  showOnHomepage?: boolean;
  showInMemberDashboard?: boolean;
  popupEnabled?: boolean;
  popupStartAt?: string | null;
  popupEndAt?: string | null;
  popupRemindAfterDays?: number;
  notificationsEnabled?: boolean;
  forumId?: string | null;
  forumThreadId?: string | null;
  createdById?: string | null;
};

export type SaveSubmissionDraftInput = {
  title: string;
  description: string;
  recipeContent?: string | null;
  videoUrl?: string | null;
  publicConsent?: boolean;
  mediaRightsConsent?: boolean;
  newImages?: Array<{
    fileName: string;
    bytes: Uint8Array;
    mimeType: string;
  }>;
  removeMediaIds?: string[];
};

export type ChallengeModerationAction = "approve" | "reject" | "under_review";

export type ChallengePopupAction = "SEEN" | "REMIND_LATER" | "DISMISSED";

export type ChallengeEligibilityResult = {
  eligible: boolean;
  reason?: string;
};

export type AdminChallengeSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: CommunityChallengeStatus;
  startAt: string;
  endAt: string;
  submissionDeadline: string;
  votingMode: ChallengeVotingMode;
  winnerCount: number;
  showOnHomepage: boolean;
  submissionCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminChallengeDetail = AdminChallengeSummary & {
  description: string;
  task: string;
  coverImageUrl: string | null;
  votingStartAt: string | null;
  votingEndAt: string | null;
  eligibilityConfig: Record<string, unknown>;
  participationRules: string | null;
  submissionConfig: Record<string, unknown>;
  prizeDescription: string | null;
  showInMemberDashboard: boolean;
  popupEnabled: boolean;
  popupStartAt: string | null;
  popupEndAt: string | null;
  popupRemindAfterDays: number;
  notificationsEnabled: boolean;
  forumId: string | null;
  forumThreadId: string | null;
  createdById: string | null;
  publishedById: string | null;
};

export type AdminChallengeSubmission = {
  id: string;
  challengeId: string;
  userId: string;
  userDisplayName: string;
  title: string;
  description: string;
  recipeContent: string | null;
  videoUrl: string | null;
  status: ChallengeSubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isWinner: boolean;
  winnerRank: number | null;
  voteCount: number;
  mediaCount: number;
  createdAt: string;
};

export type ModerateSubmissionInput = {
  status: ChallengeSubmissionStatus;
  rejectionReason?: string | null;
  isWinner?: boolean;
  winnerRank?: number | null;
};
