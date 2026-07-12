/**
 * @file course-group-types.ts
 * @purpose Typen für Kursgruppen und Untergruppen.
 */

export type CourseGroupRef = {
  id: string;
  name: string;
  slug: string;
};

export type CourseSubgroupRef = {
  id: string;
  name: string;
  slug: string;
  courseGroupId: string;
};

export type CourseGroupRecord = CourseGroupRef & {
  shortDescription: string | null;
  hasImage: boolean;
  imageFileName: string | null;
  sortOrder: number;
  isActive: boolean;
  subgroupCount: number;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CourseSubgroupRecord = CourseSubgroupRef & {
  shortDescription: string | null;
  hasImage: boolean;
  imageFileName: string | null;
  sortOrder: number;
  isActive: boolean;
  courseCount: number;
  groupName: string;
  groupSlug: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicCourseGroupCard = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  hasImage: boolean;
  sortOrder: number;
  subgroups: Array<{
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    hasImage: boolean;
    sortOrder: number;
  }>;
};

export type CreateCourseGroupInput = {
  name: string;
  slug?: string;
  shortDescription?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateCourseGroupInput = Partial<CreateCourseGroupInput>;

export type CreateCourseSubgroupInput = {
  courseGroupId: string;
  name: string;
  slug?: string;
  shortDescription?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateCourseSubgroupInput = Partial<
  Omit<CreateCourseSubgroupInput, "courseGroupId">
> & {
  courseGroupId?: string;
};

export type CourseGroupAssignment = {
  courseGroupId: string | null;
  courseSubgroupId: string | null;
  group: CourseGroupRef | null;
  subgroup: CourseSubgroupRef | null;
};
