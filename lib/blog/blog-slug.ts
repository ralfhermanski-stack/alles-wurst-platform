/**
 * @file blog-slug.ts
 * @purpose Slug-Generierung für Blogartikel.
 */

export function slugifyBlogText(value: string, maxLength = 80): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return "";
  }

  return slug.length > maxLength ? slug.slice(0, maxLength).replace(/-+$/, "") : slug;
}

export async function ensureUniqueBlogSlug(
  baseSlug: string,
  isTaken: (slug: string) => Promise<boolean>,
  excludePostId?: string,
): Promise<string> {
  let candidate = baseSlug;
  let counter = 2;

  while (await isTaken(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;

    if (counter > 100) {
      candidate = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  void excludePostId;
  return candidate;
}
