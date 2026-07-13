"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import RichTextField from "@/components/admin/RichTextField";
import AdminBlogSeoAiPanel from "@/components/admin/blog/AdminBlogSeoAiPanel";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import {
  createBlogCategoryApi,
  createBlogPostApi,
  getAdminBlogPostApi,
  getBlogLinkSuggestionsApi,
  getBlogQualityReportApi,
  listBlogCategoriesApi,
  listBlogTagsApi,
  listBlogTopicsApi,
  publishBlogPostApi,
  updateBlogPostApi,
  uploadBlogCoverApi,
  upsertBlogTagApi,
} from "@/lib/blog/blog-client";
import {
  BLOG_SEARCH_INTENT_LABELS,
  BLOG_STATUS_LABELS,
  type BlogAdminPostDetail,
  type BlogCategoryEntry,
  type BlogFaqItem,
  type BlogTagEntry,
  type BlogTopicEntry,
} from "@/lib/blog/blog-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type TabId = "content" | "seo-ai" | "keywords" | "extras" | "links" | "quality";

type AdminBlogEditorProps = {
  postId?: string;
};

function compressImageFile(file: File, maxWidth = 1600): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.type === "image/webp") {
      resolve(file);
      return;
    }

    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(file);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
        },
        "image/webp",
        0.85,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht gelesen werden."));
    };

    image.src = url;
  });
}

export default function AdminBlogEditor({ postId }: AdminBlogEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("content");
  const [post, setPost] = useState<BlogAdminPostDetail | null>(null);
  const [categories, setCategories] = useState<BlogCategoryEntry[]>([]);
  const [tags, setTags] = useState<BlogTagEntry[]>([]);
  const [topics, setTopics] = useState<BlogTopicEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [linkSuggestions, setLinkSuggestions] = useState<
    { label: string; url: string; reason: string }[]
  >([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    summary: "",
    body: "",
    status: "draft" as BlogAdminPostDetail["status"],
    categoryId: "",
    focusKeyword: "",
    secondaryKeywords: "",
    longtailKeywords: "",
    keywordNotes: "",
    searchIntent: "" as BlogAdminPostDetail["searchIntent"] | "",
    questionsToAnswer: "",
    seoTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    coverAltText: "",
    ogTitle: "",
    ogDescription: "",
    twitterTitle: "",
    twitterDescription: "",
    robotsIndex: true,
    robotsFollow: true,
    reviewedByName: "Ralf Hermanski, Fleischermeister",
    expertNote: "",
    sourcesNote: "",
    disclaimerNote:
      "Diese Inhalte dienen der allgemeinen Information und ersetzen keine individuelle Lebensmittelkontrolle oder Rechtsberatung.",
    scheduledAt: "",
    tagIds: [] as string[],
    topicIds: [] as string[],
    primaryTopicId: "",
    faqItems: [] as BlogFaqItem[],
    definitionBoxes: [] as { term: string; definition: string }[],
    internalLinks: [] as { label: string; url: string }[],
    relatedPostIds: "",
    linkedCourseIds: "",
    ctaShowCourse: false,
    ctaShowRecipe: false,
    ctaShowWorkshop: false,
    ctaShowMembership: false,
    ctaShowNewsletter: true,
  });

  useEffect(() => {
    void (async () => {
      const [categoriesRes, tagsRes, topicsRes] = await Promise.all([
        listBlogCategoriesApi(),
        listBlogTagsApi(),
        listBlogTopicsApi(),
      ]);

      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (tagsRes.success) setTags(tagsRes.data);
      if (topicsRes.success) setTopics(topicsRes.data);

      if (!postId) {
        setLoading(false);
        return;
      }

      const response = await getAdminBlogPostApi(postId);
      setLoading(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      applyPost(response.data);
    })();
  }, [postId]);

  function applyPost(data: BlogAdminPostDetail) {
    setPost(data);
    setForm({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? "",
      summary: data.summary ?? "",
      body: data.body,
      status: data.status,
      categoryId: data.categoryId ?? "",
      focusKeyword: data.focusKeyword ?? "",
      secondaryKeywords: data.secondaryKeywords.join(", "),
      longtailKeywords: data.longtailKeywords.join(", "),
      keywordNotes: data.keywordNotes ?? "",
      searchIntent: data.searchIntent ?? "",
      questionsToAnswer: data.questionsToAnswer.join("\n"),
      seoTitle: data.seoTitle ?? "",
      metaDescription: data.metaDescription ?? "",
      canonicalUrl: data.canonicalUrl ?? "",
      coverAltText: data.coverAltText ?? "",
      ogTitle: data.ogTitle ?? "",
      ogDescription: data.ogDescription ?? "",
      twitterTitle: data.twitterTitle ?? "",
      twitterDescription: data.twitterDescription ?? "",
      robotsIndex: data.robotsIndex,
      robotsFollow: data.robotsFollow,
      reviewedByName: data.reviewedByName ?? "Ralf Hermanski, Fleischermeister",
      expertNote: data.expertNote ?? "",
      sourcesNote: data.sourcesNote ?? "",
      disclaimerNote: data.disclaimerNote ?? "",
      scheduledAt: data.scheduledAt?.slice(0, 16) ?? "",
      tagIds: data.tagIds,
      topicIds: data.topicIds,
      primaryTopicId: data.primaryTopicId ?? "",
      faqItems: data.faqItems,
      definitionBoxes: data.definitionBoxes,
      internalLinks: data.internalLinks,
      relatedPostIds: data.relatedPostIds.join(", "),
      linkedCourseIds: data.linkedCourseIds.join(", "),
      ctaShowCourse: data.ctaConfig.showCourse ?? false,
      ctaShowRecipe: data.ctaConfig.showRecipe ?? false,
      ctaShowWorkshop: data.ctaConfig.showWorkshop ?? false,
      ctaShowMembership: data.ctaConfig.showMembership ?? false,
      ctaShowNewsletter: data.ctaConfig.showNewsletter ?? true,
    });
  }

  function buildPayload() {
    return {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      summary: form.summary || null,
      body: form.body,
      status: form.status,
      categoryId: form.categoryId || null,
      focusKeyword: form.focusKeyword || null,
      secondaryKeywords: form.secondaryKeywords
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      longtailKeywords: form.longtailKeywords
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      keywordNotes: form.keywordNotes || null,
      searchIntent: form.searchIntent || null,
      questionsToAnswer: form.questionsToAnswer
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      seoTitle: form.seoTitle || null,
      metaDescription: form.metaDescription || null,
      canonicalUrl: form.canonicalUrl || null,
      coverAltText: form.coverAltText || null,
      ogTitle: form.ogTitle || null,
      ogDescription: form.ogDescription || null,
      twitterTitle: form.twitterTitle || null,
      twitterDescription: form.twitterDescription || null,
      robotsIndex: form.robotsIndex,
      robotsFollow: form.robotsFollow,
      reviewedByName: form.reviewedByName || null,
      expertNote: form.expertNote || null,
      sourcesNote: form.sourcesNote || null,
      disclaimerNote: form.disclaimerNote || null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      tagIds: form.tagIds,
      topicIds: form.topicIds,
      primaryTopicId: form.primaryTopicId || null,
      faqItems: form.faqItems,
      definitionBoxes: form.definitionBoxes,
      internalLinks: form.internalLinks,
      relatedPostIds: form.relatedPostIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      linkedCourseIds: form.linkedCourseIds
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      ctaConfig: {
        showCourse: form.ctaShowCourse,
        showRecipe: form.ctaShowRecipe,
        showWorkshop: form.ctaShowWorkshop,
        showMembership: form.ctaShowMembership,
        showNewsletter: form.ctaShowNewsletter,
      },
    };
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = buildPayload();
    const response = postId
      ? await updateBlogPostApi(postId, payload)
      : await createBlogPostApi({
          title: payload.title,
          slug: payload.slug,
          excerpt: payload.excerpt,
          summary: payload.summary,
          body: payload.body,
          categoryId: payload.categoryId,
          focusKeyword: payload.focusKeyword,
          tagIds: payload.tagIds,
          topicIds: payload.topicIds,
          primaryTopicId: payload.primaryTopicId,
        });

    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    if (!postId) {
      router.replace(`/admin/magazin/${response.data.id}`);
      return;
    }

    applyPost(response.data);
  }

  async function handlePublish() {
    if (!postId) {
      await handleSave();
    }

    const id = postId ?? post?.id;

    if (!id) {
      return;
    }

    setSaving(true);
    const response = await publishBlogPostApi(id);
    setSaving(false);

    if (!response.success) {
      setError(response.error.message);
      setTab("quality");
      return;
    }

    applyPost(response.data);
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const id = postId ?? post?.id;

    if (!file || !id) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const compressed = await compressImageFile(file);
      const response = await uploadBlogCoverApi(id, compressed);
      setSaving(false);

      if (!response.success) {
        setError(response.error.message);
        return;
      }

      applyPost(response.data);
    } catch (uploadError) {
      setSaving(false);
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen.");
    }
  }

  async function loadQuality() {
    const id = postId ?? post?.id;

    if (!id) {
      return;
    }

    const response = await getBlogQualityReportApi(id);

    if (response.success && post) {
      setPost({ ...post, qualityReport: response.data });
    }
  }

  async function loadLinkSuggestions() {
    const id = postId ?? post?.id;

    if (!id) {
      return;
    }

    const response = await getBlogLinkSuggestionsApi(id);

    if (response.success) {
      setLinkSuggestions(response.data);
    }
  }

  async function handleAddTag() {
    if (!newTag.trim()) {
      return;
    }

    const response = await upsertBlogTagApi(newTag.trim());

    if (!response.success) {
      setError(response.error.message);
      return;
    }

    setTags((current) => {
      const exists = current.some((tag) => tag.id === response.data.id);
      return exists ? current : [...current, response.data];
    });

    setForm((current) => ({
      ...current,
      tagIds: [...new Set([...current.tagIds, response.data.id])],
    }));
    setNewTag("");
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "content", label: "Inhalt" },
    { id: "seo-ai", label: "SEO & KI" },
    { id: "keywords", label: "Keywords (Erweitert)" },
    { id: "extras", label: "Extras" },
    { id: "links", label: "Verlinkung" },
    { id: "quality", label: "Qualität" },
  ];

  if (loading) {
    return <p className="px-4 py-8 text-sm text-aw-muted">Artikel wird geladen …</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/magazin" className="text-sm text-aw-gold hover:text-aw-cream">
            ← Zur Übersicht
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-aw-cream">
            {postId ? "Artikel bearbeiten" : "Neuer Artikel"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(postId ?? post?.id) && (
            <a
              href={`/magazin/${form.slug || "vorschau"}?preview=${postId ?? post?.id}`}
              target="_blank"
              rel="noreferrer"
              className={secondaryButtonClassName}
            >
              Vorschau
            </a>
          )}
          <button type="button" className={secondaryButtonClassName} disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Speichert …" : "Entwurf speichern"}
          </button>
          <button type="button" className={primaryButtonClassName} disabled={saving} onClick={() => void handlePublish()}>
            Veröffentlichen
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-aw-border pb-3">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => {
              setTab(entry.id);
              if (entry.id === "quality") void loadQuality();
              if (entry.id === "links") void loadLinkSuggestions();
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              tab === entry.id
                ? "bg-aw-gold/15 text-aw-gold ring-1 ring-aw-gold/30"
                : "text-aw-muted hover:bg-aw-surface-2 hover:text-aw-cream"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {tab === "content" && (
        <div className="mt-6 space-y-5">
          <div>
            <label className={labelClassName}>Titel</label>
            <input className={inputClassName} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>URL-Slug</label>
            <input className={inputClassName} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Kurzbeschreibung (Excerpt)</label>
            <textarea className={inputClassName} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Zusammenfassung am Artikelanfang (KI-freundlich)</label>
            <textarea className={inputClassName} rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <RichTextField
            id="blog-body"
            label="Haupttext"
            value={form.body}
            onChange={(body) => setForm({ ...form, body })}
            helpText="Formatierung wie in Word — Text markieren und Toolbar nutzen oder aus Word/Google Docs einfügen."
            minHeight="min-h-[420px]"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName}>Kategorie</label>
              <select className={inputClassName} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">— wählen —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClassName}>Status</label>
              <select className={inputClassName} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
                {Object.entries(BLOG_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClassName}>Geplanter Veröffentlichungszeitpunkt</label>
            <input type="datetime-local" className={inputClassName} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value, status: e.target.value ? "scheduled" : form.status })} />
          </div>
          <div>
            <label className={labelClassName}>Beitragsbild</label>
            <div className="mb-3 max-w-md overflow-hidden rounded-lg border border-aw-border">
              <BlogCoverImage
                src={post?.coverUrl ?? null}
                alt={form.coverAltText || form.title}
                aspectClassName="aspect-[16/9]"
              />
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void handleCoverUpload(event)} />
            <p className="mt-1 text-xs text-aw-muted">JPEG/PNG/WebP, max. 5 MB — wird clientseitig als WebP komprimiert.</p>
          </div>
          <div>
            <label className={labelClassName}>Alt-Text Beitragsbild</label>
            <input className={inputClassName} value={form.coverAltText} onChange={(e) => setForm({ ...form, coverAltText: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Themencluster</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {topics.map((topic) => (
                <label key={topic.id} className="flex items-center gap-2 text-sm text-aw-cream">
                  <input
                    type="checkbox"
                    checked={form.topicIds.includes(topic.id)}
                    onChange={(event) => {
                      const topicIds = event.target.checked
                        ? [...form.topicIds, topic.id]
                        : form.topicIds.filter((id) => id !== topic.id);
                      setForm({ ...form, topicIds });
                    }}
                  />
                  {topic.name}
                  <input
                    type="radio"
                    name="primaryTopic"
                    checked={form.primaryTopicId === topic.id}
                    onChange={() => setForm({ ...form, primaryTopicId: topic.id, topicIds: [...new Set([...form.topicIds, topic.id])] })}
                  />
                  <span className="text-xs text-aw-muted">Haupt</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClassName}>Schlagwörter</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-1 rounded-full border border-aw-border px-3 py-1 text-sm text-aw-cream">
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={(event) => {
                      const tagIds = event.target.checked
                        ? [...form.tagIds, tag.id]
                        : form.tagIds.filter((id) => id !== tag.id);
                      setForm({ ...form, tagIds });
                    }}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className={inputClassName} placeholder="Neues Schlagwort" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
              <button type="button" className={secondaryButtonClassName} onClick={() => void handleAddTag()}>Hinzufügen</button>
            </div>
          </div>
        </div>
      )}

      {tab === "seo-ai" && (
        <AdminBlogSeoAiPanel
          postId={postId}
          post={post}
          form={form}
          setForm={setForm}
          categories={categories}
          tags={tags}
          coverUrl={post?.coverUrl ?? null}
          title={form.title}
          onPostUpdated={applyPost}
          onError={setError}
        />
      )}

      {tab === "keywords" && (
        <div className="mt-6 space-y-5">
          <div>
            <label className={labelClassName}>Longtail-Keywords (kommagetrennt)</label>
            <input className={inputClassName} value={form.longtailKeywords} onChange={(e) => setForm({ ...form, longtailKeywords: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Suchintention</label>
            <select className={inputClassName} value={form.searchIntent ?? ""} onChange={(e) => setForm({ ...form, searchIntent: (e.target.value || null) as typeof form.searchIntent })}>
              <option value="">— wählen —</option>
              {Object.entries(BLOG_SEARCH_INTENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName}>Fragen, die der Artikel beantworten soll (eine pro Zeile)</label>
            <textarea className={inputClassName} rows={4} value={form.questionsToAnswer} onChange={(e) => setForm({ ...form, questionsToAnswer: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Keyword-Notizen (intern)</label>
            <textarea className={inputClassName} rows={3} value={form.keywordNotes} onChange={(e) => setForm({ ...form, keywordNotes: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Geprüft von</label>
            <input className={inputClassName} value={form.reviewedByName} onChange={(e) => setForm({ ...form, reviewedByName: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Expertenhinweis</label>
            <textarea className={inputClassName} rows={2} value={form.expertNote} onChange={(e) => setForm({ ...form, expertNote: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Quellen / Hinweise</label>
            <textarea className={inputClassName} rows={3} value={form.sourcesNote} onChange={(e) => setForm({ ...form, sourcesNote: e.target.value })} />
          </div>
          <div>
            <label className={labelClassName}>Rechtlicher Hinweis</label>
            <textarea className={inputClassName} rows={2} value={form.disclaimerNote} onChange={(e) => setForm({ ...form, disclaimerNote: e.target.value })} />
          </div>
        </div>
      )}

      {tab === "extras" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-aw-border p-4">
            <p className="text-sm font-semibold text-aw-cream">Erklärboxen / Definitionen</p>
            {form.definitionBoxes.map((box, index) => (
              <div key={index} className="mt-3 grid gap-2">
                <input className={inputClassName} placeholder="Begriff" value={box.term} onChange={(e) => {
                  const definitionBoxes = [...form.definitionBoxes];
                  definitionBoxes[index] = { ...box, term: e.target.value };
                  setForm({ ...form, definitionBoxes });
                }} />
                <textarea className={inputClassName} rows={2} placeholder="Erklärung" value={box.definition} onChange={(e) => {
                  const definitionBoxes = [...form.definitionBoxes];
                  definitionBoxes[index] = { ...box, definition: e.target.value };
                  setForm({ ...form, definitionBoxes });
                }} />
              </div>
            ))}
            <button type="button" className={`${secondaryButtonClassName} mt-3`} onClick={() => setForm({ ...form, definitionBoxes: [...form.definitionBoxes, { term: "", definition: "" }] })}>
              Erklärbox hinzufügen
            </button>
          </div>
          <div className="rounded-xl border border-aw-border p-4">
            <p className="text-sm font-semibold text-aw-cream">CTA-Boxen im Artikel</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ["ctaShowCourse", "Passender Kurs"],
                ["ctaShowRecipe", "Passendes Rezept"],
                ["ctaShowWorkshop", "Werkzeug aus der Werkstatt"],
                ["ctaShowMembership", "Mitglied werden"],
                ["ctaShowNewsletter", "Newsletter abonnieren"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-aw-cream">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className={labelClassName}>Verknüpfte Kurs-IDs (kommagetrennt)</label>
              <input className={inputClassName} value={form.linkedCourseIds} onChange={(e) => setForm({ ...form, linkedCourseIds: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {tab === "links" && (
        <div className="mt-6 space-y-4">
          {form.internalLinks.map((link, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-2">
              <input className={inputClassName} placeholder="Linktext" value={link.label} onChange={(e) => {
                const internalLinks = [...form.internalLinks];
                internalLinks[index] = { ...link, label: e.target.value };
                setForm({ ...form, internalLinks });
              }} />
              <input className={inputClassName} placeholder="/magazin/..." value={link.url} onChange={(e) => {
                const internalLinks = [...form.internalLinks];
                internalLinks[index] = { ...link, url: e.target.value };
                setForm({ ...form, internalLinks });
              }} />
            </div>
          ))}
          <button type="button" className={secondaryButtonClassName} onClick={() => setForm({ ...form, internalLinks: [...form.internalLinks, { label: "", url: "" }] })}>
            Internen Link hinzufügen
          </button>
          {linkSuggestions.length > 0 && (
            <div className="rounded-xl border border-aw-border p-4">
              <p className="text-sm font-semibold text-aw-cream">Linkvorschläge</p>
              <ul className="mt-2 space-y-2 text-sm text-aw-muted">
                {linkSuggestions.map((suggestion) => (
                  <li key={suggestion.url}>
                    <button
                      type="button"
                      className="text-left text-aw-gold hover:text-aw-cream"
                      onClick={() => setForm({
                        ...form,
                        internalLinks: [...form.internalLinks, { label: suggestion.label, url: suggestion.url }],
                      })}
                    >
                      {suggestion.label}
                    </button>
                    {" — "}
                    {suggestion.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label className={labelClassName}>Verwandte Artikel (Artikel-IDs, kommagetrennt)</label>
            <input className={inputClassName} value={form.relatedPostIds} onChange={(e) => setForm({ ...form, relatedPostIds: e.target.value })} />
            <p className="mt-1 text-xs text-aw-muted">Nur interne Artikel-UUIDs — keine URLs. Für Seitenlinks den Tab „Links“ nutzen.</p>
          </div>
        </div>
      )}

      {tab === "quality" && (
        <div className="mt-6 space-y-4">
          <button type="button" className={secondaryButtonClassName} onClick={() => void loadQuality()}>
            Qualität prüfen
          </button>
          {post?.qualityReport && (
            <div className="rounded-xl border border-aw-border p-5">
              <p className="text-sm text-aw-muted">
                SEO-Score: <span className="font-semibold text-aw-cream">{post.qualityReport.seoScore}/100</span>
                {" · "}
                Lesbarkeit: {post.qualityReport.readabilityLevel}
                {" · "}
                Veröffentlichung: {post.qualityReport.canPublish ? "möglich" : "blockiert"}
              </p>
              <ul className="mt-4 space-y-2">
                {post.qualityReport.issues.map((issue) => (
                  <li
                    key={issue.code}
                    className={`text-sm ${
                      issue.severity === "error"
                        ? "text-red-300"
                        : issue.severity === "warning"
                          ? "text-amber-300"
                          : "text-aw-muted"
                    }`}
                  >
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
