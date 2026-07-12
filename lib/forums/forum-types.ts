/**
 * @file forum-types.ts
 * @purpose Typen für Foren, Threads und Beiträge.
 */

import type {
  ForumPurpose,
  ForumReadAccess,
  ForumType,
  MembershipRole,
} from "@prisma/client";

import type { ForumPermissionKind } from "./forum-permission-kinds";

export type ForumEntry = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  forumType: ForumType;
  forumPurpose: ForumPurpose;
  readAccess: ForumReadAccess;
  writeEnabled: boolean;
  requiredMembershipRole: MembershipRole | null;
  courseId: string | null;
  courseTitle: string | null;
  isActive: boolean;
  sortOrder: number;
  threadCount: number;
  postCount: number;
  readRuleLabel: string;
  writeRuleLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminForumEntry = ForumEntry & {
  visibilityHint: string;
  permissionKind: ForumPermissionKind;
};

export type AdminForumCourseOption = {
  id: string;
  title: string;
  courseType: string;
};

export type CourseForumGroup = {
  courseForums: ForumEntry[];
  globalMiniCourseForums: ForumEntry[];
  globalMiniCourseForumsEnabled: boolean;
};

export type ForumThreadEntry = {
  id: string;
  title: string;
  slug: string;
  body: string;
  isLocked: boolean;
  author: ForumAuthorEntry;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ForumPostEntry = {
  id: string;
  body: string;
  author: ForumAuthorEntry;
  createdAt: string;
  updatedAt: string;
};

export type ForumAuthorEntry = {
  displayName: string;
  avatarUrl: string | null;
  roleBadge: string | null;
};

export type ForumThreadDetail = ForumThreadEntry & {
  posts: ForumPostEntry[];
  canWrite: boolean;
  canModerate: boolean;
};

export type CreateForumInput = {
  title: string;
  slug?: string;
  description?: string | null;
  permissionKind?: ForumPermissionKind;
  forumType?: ForumType;
  forumPurpose?: ForumPurpose;
  readAccess?: ForumReadAccess;
  writeEnabled?: boolean;
  requiredMembershipRole?: MembershipRole | null;
  courseId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateForumInput = Partial<Omit<CreateForumInput, "forumType">> & {
  forumType?: ForumType;
  permissionKind?: ForumPermissionKind;
};

export type CreateForumThreadInput = {
  title: string;
  body: string;
};

export type CreateForumPostInput = {
  body: string;
};

export type CommunityForumEntry = ForumEntry & {
  lastActivityAt: string | null;
  lastActivitySummary: string | null;
};

export type CommunityActivityEntry = {
  id: string;
  type: "thread" | "reply";
  forumSlug: string;
  forumTitle: string;
  threadSlug: string;
  threadTitle: string;
  authorDisplayName: string;
  summary: string;
  createdAt: string;
};

export type CommunityOverview = {
  forums: CommunityForumEntry[];
  activity: CommunityActivityEntry[];
};
