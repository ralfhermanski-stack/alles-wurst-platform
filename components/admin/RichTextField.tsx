"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, type ReactNode } from "react";

import {
  labelClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";
import {
  normalizeRichBodyOutput,
  prepareEditorContent,
} from "@/lib/content/rich-body-utils";

type RichTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  helpText?: string;
  placeholder?: string;
  minHeight?: string;
};

type ToolbarButtonProps = {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

function ToolbarButton({ title, active, disabled, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-aw-gold/60 bg-aw-gold/15 text-aw-gold"
          : "border-aw-border bg-aw-surface text-aw-cream hover:border-aw-gold/50"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function RichTextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  helpText,
  placeholder = "Text eingeben …",
  minHeight = "min-h-[420px]",
}: RichTextFieldProps) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-aw-gold underline hover:text-aw-cream",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: prepareEditorContent(value),
    editorProps: {
      attributes: {
        id,
        class: `rich-text-editor__content ProseMirror focus:outline-none ${minHeight}`,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(normalizeRichBodyOutput(currentEditor.getHTML()));
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = normalizeRichBodyOutput(editor.getHTML());
    const next = normalizeRichBodyOutput(prepareEditorContent(value));

    if (current !== next) {
      editor.commands.setContent(next || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  function setLink(): void {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link-URL eingeben:", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!mounted || !editor) {
    return (
      <div>
        <label className={labelClassName} htmlFor={id}>
          {label}
        </label>
        {helpText && <p className="mt-1 text-xs text-aw-muted">{helpText}</p>}
        <div className={`mt-2 rounded-lg border border-aw-border bg-aw-bg/40 p-4 text-sm text-aw-muted ${minHeight}`}>
          Editor wird geladen …
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className={labelClassName} htmlFor={id}>
        {label}
      </label>

      {helpText && <p className="mt-1 text-xs text-aw-muted">{helpText}</p>}

      <div className="rich-text-editor mt-2 overflow-hidden rounded-lg border border-aw-border bg-aw-bg">
        <div className="flex flex-wrap gap-1 border-b border-aw-border bg-aw-surface/60 p-2">
          <ToolbarButton
            title="Fett"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>F</strong>
          </ToolbarButton>
          <ToolbarButton
            title="Kursiv"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>K</em>
          </ToolbarButton>
          <ToolbarButton
            title="Unterstrichen"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolbarButton>

          <span className="mx-1 w-px self-stretch bg-aw-border" aria-hidden />

          <ToolbarButton
            title="Überschrift (groß)"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            title="Überschrift (klein)"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </ToolbarButton>

          <span className="mx-1 w-px self-stretch bg-aw-border" aria-hidden />

          <ToolbarButton
            title="Aufzählung"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            •
          </ToolbarButton>
          <ToolbarButton
            title="Nummerierte Liste"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </ToolbarButton>
          <ToolbarButton
            title="Zitat"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            „
          </ToolbarButton>
          <ToolbarButton
            title="Link"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            Link
          </ToolbarButton>

          <span className="mx-1 w-px self-stretch bg-aw-border" aria-hidden />

          <ToolbarButton
            title="Rückgängig"
            disabled={!editor.can().chain().focus().undo().run()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            ↶
          </ToolbarButton>
          <ToolbarButton
            title="Wiederholen"
            disabled={!editor.can().chain().focus().redo().run()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            ↷
          </ToolbarButton>
        </div>

        <EditorContent editor={editor} className="px-4 py-3" />
      </div>

      <p className="mt-1 text-xs text-aw-muted">
        Wie in Word: Text formatieren, aus Word/Google Docs einfügen — die Formatierung bleibt erhalten.
      </p>
    </div>
  );
}
