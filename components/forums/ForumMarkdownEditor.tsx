"use client";

import { useRef, useState } from "react";

import Markdown from "@/components/ui/Markdown";
import { FORUM_SMILEY_PICKER } from "@/lib/forums/forum-smilies";
import { inputClassName } from "@/components/tools/recipe-generator/recipe-form-classes";

type ToolbarAction = {
  label: string;
  title: string;
  apply: (selected: string) => string;
};

const TOOLBAR: ToolbarAction[] = [
  {
    label: "F",
    title: "Fett",
    apply: (selected) => `**${selected || "fett"}**`,
  },
  {
    label: "K",
    title: "Kursiv",
    apply: (selected) => `*${selected || "kursiv"}*`,
  },
  {
    label: "•",
    title: "Aufzählung",
    apply: (selected) => {
      const lines = (selected || "Punkt").split("\n");
      return lines.map((line) => `- ${line}`).join("\n");
    },
  },
  {
    label: "1.",
    title: "Nummerierte Liste",
    apply: (selected) => {
      const lines = (selected || "Punkt").split("\n");
      return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
    },
  },
  {
    label: "URL",
    title: "Link",
    apply: (selected) => `[${selected || "Linktext"}](https://)`,
  },
];

type ForumMarkdownEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
};

/**
 * Leichter Markdown-Editor für Foren: Toolbar, Smilies, Vorschau.
 */
export default function ForumMarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}: ForumMarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSmilies, setShowSmilies] = useState(false);

  function insertAtCursor(text: string): void {
    const textarea = textareaRef.current;

    if (!textarea) {
      onChange(value + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);

    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function applyAction(action: ToolbarAction): void {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const text = action.apply(selected);
    const next = value.slice(0, start) + text + value.slice(end);

    onChange(next);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + text.length);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {TOOLBAR.map((action) => (
            <button
              key={action.title}
              type="button"
              title={action.title}
              disabled={disabled || showPreview}
              className="rounded border border-aw-border bg-aw-surface px-2 py-0.5 text-xs font-semibold text-aw-cream hover:border-aw-gold/50 disabled:opacity-40"
              onClick={() => applyAction(action)}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            title="Smilies"
            disabled={disabled || showPreview}
            className="rounded border border-aw-border bg-aw-surface px-2 py-0.5 text-xs text-aw-cream hover:border-aw-gold/50 disabled:opacity-40"
            onClick={() => setShowSmilies((prev) => !prev)}
            aria-expanded={showSmilies}
          >
            🙂
          </button>
        </div>
        <button
          type="button"
          className="text-xs text-aw-gold hover:text-aw-cream"
          disabled={disabled}
          onClick={() => {
            setShowPreview((prev) => !prev);
            setShowSmilies(false);
          }}
        >
          {showPreview ? "Bearbeiten" : "Vorschau"}
        </button>
      </div>

      {showSmilies && !showPreview && (
        <div className="mt-1.5 flex flex-wrap gap-1 rounded border border-aw-border bg-aw-bg/40 p-1.5">
          {FORUM_SMILEY_PICKER.map((smiley) => (
            <button
              key={smiley.code}
              type="button"
              title={`${smiley.label} (${smiley.code})`}
              disabled={disabled}
              className="rounded px-1.5 py-0.5 text-base hover:bg-aw-surface"
              onClick={() => {
                insertAtCursor(smiley.code);
                setShowSmilies(false);
              }}
            >
              <span aria-hidden="true">{smiley.emoji}</span>
            </button>
          ))}
        </div>
      )}

      {showPreview ? (
        <div className="mt-2 min-h-20 rounded-lg border border-aw-border bg-aw-bg/40 p-3">
          {value.trim() ? (
            <Markdown content={value} variant="forum" />
          ) : (
            <p className="text-sm text-aw-muted">Keine Vorschau – noch kein Text.</p>
          )}
        </div>
      ) : (
        <textarea
          id={id}
          ref={textareaRef}
          className={`${inputClassName} mt-2 min-h-20 w-full text-sm`}
          placeholder={placeholder}
          value={value}
          rows={rows}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      <p className="mt-1 text-[11px] text-aw-muted">
        Formatierung: **fett**, *kursiv*, - Liste, [Link](https://…) · Smilies: :) :D ;)
      </p>
    </div>
  );
}
