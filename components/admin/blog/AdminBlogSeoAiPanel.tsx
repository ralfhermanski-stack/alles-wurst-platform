"use client";

import { useState } from "react";

import {
  analyzeBlogSeoApi,
  applyBlogSeoApi,
  validateBlogSchemaApi,
} from "@/lib/blog/blog-client";
import type {
  BlogAdminPostDetail,
  BlogCategoryEntry,
  BlogFaqItem,
  BlogSeoAnalysisResult,
  BlogTagEntry,
} from "@/lib/blog/blog-types";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export type BlogSeoFormState = {
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  focusKeyword: string;
  secondaryKeywords: string;
  summary: string;
  excerpt: string;
  coverAltText: string;
  categoryId: string;
  tagIds: string[];
  faqItems: BlogFaqItem[];
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
};

type AdminBlogSeoAiPanelProps<T extends BlogSeoFormState> = {
  postId: string | undefined;
  post: BlogAdminPostDetail | null;
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  categories: BlogCategoryEntry[];
  tags: BlogTagEntry[];
  coverUrl: string | null;
  title: string;
  onPostUpdated: (post: BlogAdminPostDetail) => void;
  onError: (message: string) => void;
};

function draftToFormPatch(draft: BlogSeoAnalysisResult): Partial<BlogSeoFormState> {
  return {
    seoTitle: draft.seoTitle,
    metaDescription: draft.metaDescription,
    focusKeyword: draft.focusKeyword,
    secondaryKeywords: draft.seoKeywords.join(", "),
    summary: draft.aiSummary,
    coverAltText: draft.imageAltText,
    faqItems: draft.faqItems,
    ogTitle: draft.ogTitle,
    ogDescription: draft.ogDescription,
    twitterTitle: draft.twitterTitle,
    twitterDescription: draft.twitterDescription,
  };
}

export default function AdminBlogSeoAiPanel<T extends BlogSeoFormState>({
  postId,
  post,
  form,
  setForm,
  categories,
  tags,
  coverUrl,
  title,
  onPostUpdated,
  onError,
}: AdminBlogSeoAiPanelProps<T>) {
  const [draft, setDraft] = useState<BlogSeoAnalysisResult | null>(
    post?.seoAnalysisDraft ?? null,
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [schemaMessage, setSchemaMessage] = useState<string | null>(null);
  const [schemaValid, setSchemaValid] = useState<boolean | null>(null);

  const id = postId ?? post?.id;
  const displayDraft = !manualMode ? draft : null;
  const seoScore = post?.seoScore ?? draft?.seoScore ?? null;
  const readabilityScore = post?.readabilityScore ?? draft?.readabilityScore ?? null;
  const lastAnalysis = post?.lastSeoAnalysisAt ?? draft?.analyzedAt ?? null;

  const ogPreviewTitle = form.ogTitle || displayDraft?.ogTitle || form.seoTitle || title;
  const ogPreviewDescription =
    form.ogDescription || displayDraft?.ogDescription || form.metaDescription;

  const schemaPreview = draft?.schemaJson ?? null;
  const liveSchemaPreview =
    post?.schemaJson && Object.keys(post.schemaJson).length > 0 ? post.schemaJson : null;

  async function handleAnalyze() {
    if (!id) {
      onError("Bitte den Artikel zuerst speichern.");
      return;
    }

    setAnalyzing(true);
    setSchemaMessage(null);
    setSchemaValid(null);

    const response = await analyzeBlogSeoApi(id);
    setAnalyzing(false);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    setDraft(response.data);
    setManualMode(false);
  }

  async function handleApply() {
    if (!id || !draft) {
      onError("Keine Analyse-Vorschläge vorhanden.");
      return;
    }

    setApplying(true);

    const response = await applyBlogSeoApi(id, draft);
    setApplying(false);

    if (!response.success) {
      onError(response.error.message);
      return;
    }

    setForm((current) => ({ ...current, ...draftToFormPatch(draft) }));
    setDraft(response.data.seoAnalysisDraft ?? null);
    onPostUpdated(response.data);
  }

  async function handleSchemaValidate() {
    if (!id) {
      return;
    }

    const response = await validateBlogSchemaApi(id);
    if (!response.success) {
      onError(response.error.message);
      return;
    }

    setSchemaValid(response.data.valid);
    setSchemaMessage(response.data.message);
  }

  function suggestedCategoryLabel(): string | null {
    if (draft?.suggestedCategoryNames?.length) {
      return draft.suggestedCategoryNames.join(", ");
    }

    return null;
  }

  const suggestedTags = draft?.suggestedTags ?? post?.seoTagsSuggested ?? [];
  const linkSuggestions = post?.internalLinkSuggestions ?? draft?.internalLinkSuggestions ?? [];

  return (
    <div className="mt-6 space-y-6">
      {draft && (
        <p className="rounded-xl border border-aw-gold/30 bg-aw-gold/5 px-4 py-3 text-sm text-aw-cream">
          KI-Vorschläge liegen vor. Sie werden erst nach Klick auf „Vorschläge übernehmen“ live
          geschaltet — nichts wird automatisch veröffentlicht.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryButtonClassName}
          disabled={analyzing || !id}
          onClick={() => void handleAnalyze()}
        >
          {analyzing ? "Analysiert …" : "SEO & KI analysieren"}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={applying || !draft || !id}
          onClick={() => void handleApply()}
        >
          {applying ? "Übernimmt …" : "Vorschläge übernehmen"}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={() => setManualMode((value) => !value)}
        >
          {manualMode ? "Entwurf anzeigen" : "Manuell bearbeiten"}
        </button>
        <button
          type="button"
          className={secondaryButtonClassName}
          disabled={!id}
          onClick={() => void handleSchemaValidate()}
        >
          Schema prüfen
        </button>
      </div>

      {(seoScore !== null || readabilityScore !== null || lastAnalysis) && (
        <p className="text-sm text-aw-muted">
          {seoScore !== null && (
            <>
              SEO-Score: <span className="font-semibold text-aw-cream">{seoScore}/100</span>
            </>
          )}
          {readabilityScore !== null && (
            <>
              {" · "}
              Lesbarkeit: <span className="font-semibold text-aw-cream">{readabilityScore}/100</span>
            </>
          )}
          {lastAnalysis && (
            <>
              {" · "}
              Letzte Analyse: {new Date(lastAnalysis).toLocaleString("de-DE")}
            </>
          )}
          {draft?.source && (
            <>
              {" · "}
              Quelle: {draft.source === "ai" ? "KI" : "Fallback"}
            </>
          )}
        </p>
      )}

      {draft?.warnings && draft.warnings.length > 0 && (
        <ul className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          {draft.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {schemaMessage && (
        <p className={`text-sm ${schemaValid ? "text-emerald-300" : "text-amber-300"}`}>
          {schemaMessage}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className={labelClassName}>
              SEO-Titel ({form.seoTitle.length}/60)
            </label>
            <input
              className={inputClassName}
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            />
            {displayDraft && displayDraft.seoTitle !== form.seoTitle && (
              <p className="mt-1 text-xs text-aw-gold">Vorschlag: {displayDraft.seoTitle}</p>
            )}
          </div>
          <div>
            <label className={labelClassName}>
              Meta Description ({form.metaDescription.length}/160)
            </label>
            <textarea
              className={inputClassName}
              rows={3}
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Fokus-Keyword</label>
            <input
              className={inputClassName}
              value={form.focusKeyword}
              onChange={(e) => setForm({ ...form, focusKeyword: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Keywords (kommagetrennt)</label>
            <input
              className={inputClassName}
              value={form.secondaryKeywords}
              onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>KI-Zusammenfassung (Artikelanfang)</label>
            <textarea
              className={inputClassName}
              rows={3}
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Bild-Alt-Text</label>
            <input
              className={inputClassName}
              value={form.coverAltText}
              onChange={(e) => setForm({ ...form, coverAltText: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Canonical URL</label>
            <input
              className={inputClassName}
              value={form.canonicalUrl}
              onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
              placeholder="https://alles-wurst.de/magazin/..."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="checkbox"
                checked={form.robotsIndex}
                onChange={(e) => setForm({ ...form, robotsIndex: e.target.checked })}
              />
              index
            </label>
            <label className="flex items-center gap-2 text-sm text-aw-cream">
              <input
                type="checkbox"
                checked={form.robotsFollow}
                onChange={(e) => setForm({ ...form, robotsFollow: e.target.checked })}
              />
              follow
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClassName}>Kategorie</label>
            <select
              className={inputClassName}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">— wählen —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {suggestedCategoryLabel() && (
              <p className="mt-1 text-xs text-aw-gold">
                KI-Vorschlag: {suggestedCategoryLabel()}
              </p>
            )}
          </div>

          {suggestedTags.length > 0 && (
            <div className="rounded-xl border border-aw-border p-3">
              <p className="text-sm font-semibold text-aw-cream">Tag-Vorschläge</p>
              <p className="mt-1 text-sm text-aw-muted">{suggestedTags.join(", ")}</p>
            </div>
          )}

          <div>
            <label className={labelClassName}>OpenGraph-Titel</label>
            <input
              className={inputClassName}
              value={form.ogTitle}
              onChange={(e) => setForm({ ...form, ogTitle: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>OpenGraph-Beschreibung</label>
            <textarea
              className={inputClassName}
              rows={2}
              value={form.ogDescription}
              onChange={(e) => setForm({ ...form, ogDescription: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Twitter/X-Titel</label>
            <input
              className={inputClassName}
              value={form.twitterTitle}
              onChange={(e) => setForm({ ...form, twitterTitle: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClassName}>Twitter/X-Beschreibung</label>
            <textarea
              className={inputClassName}
              rows={2}
              value={form.twitterDescription}
              onChange={(e) => setForm({ ...form, twitterDescription: e.target.value })}
            />
          </div>

          <div className="rounded-xl border border-aw-border p-4">
            <p className="text-sm font-semibold text-aw-cream">OpenGraph-Vorschau</p>
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="mt-2 aspect-[1.91/1] w-full rounded-lg object-cover"
              />
            )}
            <p className="mt-2 text-xs uppercase text-aw-muted">alles-wurst.de</p>
            <p className="font-semibold text-aw-cream">{ogPreviewTitle}</p>
            <p className="text-sm text-aw-muted">{ogPreviewDescription}</p>
          </div>
        </div>
      </div>

      <div>
        <p className={labelClassName}>FAQ</p>
        <div className="space-y-3">
          {form.faqItems.map((item, index) => (
            <div key={index} className="rounded-xl border border-aw-border p-4">
              <input
                className={`${inputClassName} mb-2`}
                placeholder="Frage"
                value={item.question}
                onChange={(e) => {
                  const faqItems = [...form.faqItems];
                  faqItems[index] = { ...item, question: e.target.value };
                  setForm({ ...form, faqItems });
                }}
              />
              <textarea
                className={inputClassName}
                rows={2}
                placeholder="Antwort"
                value={item.answer}
                onChange={(e) => {
                  const faqItems = [...form.faqItems];
                  faqItems[index] = { ...item, answer: e.target.value };
                  setForm({ ...form, faqItems });
                }}
              />
              <button
                type="button"
                className="mt-2 text-xs text-red-300"
                onClick={() =>
                  setForm({
                    ...form,
                    faqItems: form.faqItems.filter((_, i) => i !== index),
                  })
                }
              >
                Entfernen
              </button>
            </div>
          ))}
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() =>
              setForm({
                ...form,
                faqItems: [...form.faqItems, { question: "", answer: "" }],
              })
            }
          >
            FAQ-Eintrag hinzufügen
          </button>
        </div>
      </div>

      {linkSuggestions.length > 0 && (
        <div className="rounded-xl border border-aw-border p-4">
          <p className="text-sm font-semibold text-aw-cream">Interne Link-Vorschläge</p>
          <ul className="mt-2 space-y-1 text-sm text-aw-muted">
            {linkSuggestions.map((link) => (
              <li key={link.url}>
                <span className="text-aw-gold">{link.label}</span> — {link.url}
                {link.reason ? ` (${link.reason})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className={labelClassName}>Schema.org JSON-LD (Vorschlag)</p>
        <pre className="max-h-72 overflow-auto rounded-xl border border-aw-border bg-aw-surface-2 p-4 text-xs text-aw-muted">
          {schemaPreview ? JSON.stringify(schemaPreview, null, 2) : "Noch kein Schema-Vorschlag."}
        </pre>
      </div>

      {liveSchemaPreview ? (
        <div>
          <p className={labelClassName}>Schema.org JSON-LD (freigegeben / live)</p>
          <pre className="max-h-72 overflow-auto rounded-xl border border-emerald-500/30 bg-aw-surface-2 p-4 text-xs text-aw-muted">
            {JSON.stringify(liveSchemaPreview, null, 2)}
          </pre>
        </div>
      ) : null}

      <div className="rounded-xl border border-aw-border p-4 text-sm text-aw-muted">
        <p className="font-semibold text-aw-cream">Schlagwörter (aktuell)</p>
        <p className="mt-1">
          {form.tagIds
            .map((tagId) => tags.find((tag) => tag.id === tagId)?.name)
            .filter(Boolean)
            .join(", ") || "Keine Schlagwörter gewählt"}
        </p>
      </div>
    </div>
  );
}
