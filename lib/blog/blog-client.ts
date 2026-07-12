/**
 * @file blog-client.ts
 * @purpose Client für Blog-Admin-APIs.
 */

import { adminFetch, type AdminApiResponse } from "@/lib/admin/admin-fetch";
import type {
  BlogAdminPostDetail,
  BlogCategoryEntry,
  BlogPostSummary,
  BlogQualityReport,
  BlogSeoAnalysisResult,
  BlogTagEntry,
  BlogTopicEntry,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "./blog-types";

export async function listAdminBlogPostsApi(filters?: {
  status?: string;
  categoryId?: string;
  topicId?: string;
  query?: string;
  staleOnly?: boolean;
}): Promise<AdminApiResponse<BlogPostSummary[]>> {
  const params = new URLSearchParams();

  if (filters?.status) params.set("status", filters.status);
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.topicId) params.set("topicId", filters.topicId);
  if (filters?.query) params.set("query", filters.query);
  if (filters?.staleOnly) params.set("staleOnly", "1");

  const query = params.toString();
  return adminFetch<BlogPostSummary[]>(`/api/admin/blog/posts${query ? `?${query}` : ""}`);
}

export async function getAdminBlogPostApi(
  postId: string,
): Promise<AdminApiResponse<BlogAdminPostDetail>> {
  return adminFetch<BlogAdminPostDetail>(`/api/admin/blog/posts/${postId}`);
}

export async function createBlogPostApi(
  input: CreateBlogPostInput,
): Promise<AdminApiResponse<BlogAdminPostDetail>> {
  return adminFetch<BlogAdminPostDetail>("/api/admin/blog/posts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBlogPostApi(
  postId: string,
  input: UpdateBlogPostInput,
): Promise<AdminApiResponse<BlogAdminPostDetail>> {
  return adminFetch<BlogAdminPostDetail>(`/api/admin/blog/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function publishBlogPostApi(
  postId: string,
): Promise<AdminApiResponse<BlogAdminPostDetail>> {
  return adminFetch<BlogAdminPostDetail>(`/api/admin/blog/posts/${postId}/publish`, {
    method: "POST",
  });
}

export async function deleteBlogPostApi(
  postId: string,
): Promise<AdminApiResponse<{ id: string }>> {
  return adminFetch<{ id: string }>(`/api/admin/blog/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function getBlogQualityReportApi(
  postId: string,
): Promise<AdminApiResponse<BlogQualityReport>> {
  return adminFetch<BlogQualityReport>(`/api/admin/blog/posts/${postId}/quality`);
}

export async function getBlogLinkSuggestionsApi(
  postId: string,
): Promise<AdminApiResponse<{ label: string; url: string; reason: string }[]>> {
  return adminFetch(`/api/admin/blog/posts/${postId}/link-suggestions`);
}

export async function uploadBlogCoverApi(
  postId: string,
  file: File,
): Promise<AdminApiResponse<BlogAdminPostDetail>> {
  const formData = new FormData();
  formData.set("file", file);

  return adminFetch<BlogAdminPostDetail>(`/api/admin/blog/posts/${postId}/cover`, {
    method: "POST",
    body: formData,
  });
}

export async function listBlogCategoriesApi(): Promise<AdminApiResponse<BlogCategoryEntry[]>> {
  return adminFetch<BlogCategoryEntry[]>("/api/admin/blog/categories");
}

export async function createBlogCategoryApi(input: {
  name: string;
  slug?: string;
  description?: string | null;
}): Promise<AdminApiResponse<BlogCategoryEntry>> {
  return adminFetch<BlogCategoryEntry>("/api/admin/blog/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listBlogTagsApi(): Promise<AdminApiResponse<BlogTagEntry[]>> {
  return adminFetch<BlogTagEntry[]>("/api/admin/blog/tags");
}

export async function upsertBlogTagApi(name: string): Promise<AdminApiResponse<BlogTagEntry>> {
  return adminFetch<BlogTagEntry>("/api/admin/blog/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function listBlogTopicsApi(): Promise<AdminApiResponse<BlogTopicEntry[]>> {
  return adminFetch<BlogTopicEntry[]>("/api/admin/blog/topics");
}

export async function analyzeBlogSeoApi(
  postId: string,
): Promise<AdminApiResponse<BlogSeoAnalysisResult>> {
  return adminFetch<BlogSeoAnalysisResult>(`/api/admin/blog/posts/${postId}/seo-analyze`, {
    method: "POST",
  });
}

export async function applyBlogSeoApi(
  postId: string,
  draft?: BlogSeoAnalysisResult,
): Promise<AdminApiResponse<BlogAdminPostDetail>> {
  return adminFetch<BlogAdminPostDetail>(`/api/admin/blog/posts/${postId}/seo-apply`, {
    method: "POST",
    body: JSON.stringify(draft ? { draft } : {}),
  });
}

export async function validateBlogSchemaApi(
  postId: string,
): Promise<AdminApiResponse<{ valid: boolean; schema: Record<string, unknown> | null; message: string }>> {
  return adminFetch(`/api/admin/blog/posts/${postId}/schema-validate`);
}
