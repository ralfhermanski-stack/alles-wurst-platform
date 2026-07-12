/**
 * @file page-editor-types.ts
 */

export type EditablePageCategory =
  | "public"
  | "member"
  | "user"
  | "auth"
  | "courses"
  | "recipes"
  | "community"
  | "legal"
  | "system"
  | "emails";

export type EditableElementType =
  | "text"
  | "heading"
  | "subheading"
  | "button"
  | "link"
  | "rich"
  | "seo_title"
  | "seo_description"
  | "image"
  | "form_label"
  | "message";

export type EditablePageDefinition = {
  id: string;
  name: string;
  path: string;
  category: EditablePageCategory;
  priority: 1 | 2 | 3;
  /** Textschlüssel, die auf dieser Seite bearbeitbar sind */
  textKeys: Array<{
    key: string;
    label: string;
    elementType: EditableElementType;
  }>;
};

export type EditablePageListItem = {
  id: string;
  name: string;
  path: string;
  category: EditablePageCategory;
  categoryLabel: string;
  enabled: boolean;
  editableCount: number;
  hardcodedCount: number;
  draftCount: number;
  lastEditedAt: string | null;
  lastEditedBy: string | null;
  status: "standard" | "draft" | "published";
};

export type PageEditorSessionPayload = {
  sessionId: string;
  userId: string;
  pageId: string;
  expiresAt: number;
};

export type PageEditorElementPayload = {
  textKey: string;
  label: string;
  elementType: EditableElementType;
  value: string;
  draftValue: string | null;
  publishedValue: string;
  defaultValue: string;
  status: string;
  maxLength: number | null;
  allowRichText: boolean;
  pagePath: string | null;
  category: string;
};

export const EDITABLE_PAGE_CATEGORY_LABELS: Record<EditablePageCategory, string> = {
  public: "Öffentlich",
  member: "Mitgliederbereich",
  user: "Benutzerbereich",
  auth: "Authentifizierung",
  courses: "Kurse",
  recipes: "Rezepte",
  community: "Community",
  legal: "Rechtliches",
  system: "Systemseiten",
  emails: "E-Mails",
};

export type ViewportMode = "desktop" | "tablet" | "mobile";

export type PreviewRole =
  | "guest"
  | "registered"
  | "wurstclub"
  | "meisterclub"
  | "course_participant";
