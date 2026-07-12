/**
 * @file share-types.ts
 */

import type { ShareContentType, ShareStatus } from "@prisma/client";

export type ShareListItem = {
  id: string;
  shareToken: string;
  contentType: ShareContentType;
  title: string;
  status: ShareStatus;
  isPublic: boolean;
  linkOnly: boolean;
  viewCount: number;
  whatsappShares: number;
  facebookShares: number;
  linkedinShares: number;
  twitterShares: number;
  emailShares: number;
  linkCopies: number;
  totalShares: number;
  shareUrl: string;
  createdAt: string;
  revokedAt: string | null;
  certificateId: string | null;
  recipeId: string | null;
};

export type PublicCertificateShareView = {
  contentType: "CERTIFICATE" | "DIPLOMA";
  title: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string | null;
  certificateNumber: string | null;
  verificationStatus: "valid" | "revoked" | "invalid";
  verificationUrl: string | null;
  shareToken: string;
};

export type PublicRecipeShareView = {
  contentType: "RECIPE";
  title: string;
  description: string | null;
  category: string | null;
  authorName: string;
  createdAt: string;
  imageUrl: string | null;
  ingredients: string[] | null;
  instructions: string | null;
  shareToken: string;
};

export type ShareEventType =
  | "view"
  | "whatsapp"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "email"
  | "link_copy";

export type AdminShareListItem = ShareListItem & {
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string;
  adminNote: string | null;
};
