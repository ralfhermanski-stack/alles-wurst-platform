"use client";

import { useRef, useState } from "react";

import Markdown from "@/components/ui/Markdown";
import {
  inputClassName,
  labelClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

type MarkdownFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  helpText?: string;
  placeholder?: string;
  minHeight?: string;
};

type ToolbarAction = {
  label: string;
  title: string;
  apply: (selected: string) => { text: string; cursorOffset?: number };
};

const TOOLBAR: ToolbarAction[] = [
  {
    label: "F",
    title: "Fett",
    apply: (selected) => ({ text: `**${selected || "fett"}**` }),
  },
  {
    label: "K",
    title: "Kursiv",
    apply: (selected) => ({ text: `*${selected || "kursiv"}*` }),
  },
  {
    label: "H",
    title: "Überschrift",
    apply: (selected) => ({ text: `## ${selected || "Überschrift"}` }),
  },
  {
    label: "•",
    title: "Aufzählung",
    apply: (selected) => {
      const lines = (selected || "Punkt").split("\n");
      return { text: lines.map((line) => `- ${line}`).join("\n") };
    },
  },
  {
    label: "1.",
    title: "Nummerierte Liste",
    apply: (selected) => {
      const lines = (selected || "Punkt").split("\n");
      return { text: lines.map((line, index) => `${index + 1}. ${line}`).join("\n") };
    },
  },
  {
    label: "URL",
    title: "Link",
    apply: (selected) => ({
      text: `[${selected || "Linktext"}](https://)`,
    }),
  },
];

export default function MarkdownField({
  id,
  label,
  value,
  onChange,
  onBlur,
  helpText,
  placeholder,
  minHeight = "min-h-32",
}: MarkdownFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  function applyAction(action: ToolbarAction): void {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const { text } = action.apply(selected);
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
        <label className={labelClassName} htmlFor={id}>
          {label}
        </label>
        <button
          type="button"
          className="text-xs text-aw-gold hover:text-aw-cream"
          onClick={() => setShowPreview((prev) => !prev)}
        >
          {showPreview ? "Bearbeiten" : "Vorschau"}
        </button>
      </div>

      {helpText && <p className="mt-1 text-xs text-aw-muted">{helpText}</p>}

      {showPreview ? (
        <div className="mt-2 min-h-32 rounded-lg border border-aw-border bg-aw-bg/40 p-3">
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="text-sm text-aw-muted">Keine Vorschau – noch kein Text.</p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap gap-1">
            {TOOLBAR.map((action) => (
              <button
                key={action.title}
                type="button"
                title={action.title}
                className="rounded-md border border-aw-border bg-aw-surface px-2 py-1 text-xs font-semibold text-aw-cream hover:border-aw-gold/50"
                onClick={() => applyAction(action)}
              >
                {action.label}
              </button>
            ))}
          </div>
          <textarea
            id={id}
            ref={textareaRef}
            className={`${inputClassName} mt-2 ${minHeight} font-mono text-sm`}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
          <p className="mt-1 text-xs text-aw-muted">
            Markdown: **fett**, *kursiv*, ## Überschrift, - Liste,
            [Link](https://…)
          </p>
        </>
      )}
    </div>
  );
}
