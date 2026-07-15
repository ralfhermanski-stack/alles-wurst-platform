import RichTextContent from "@/components/ui/RichTextContent";

type ForumPostSignatureProps = {
  html: string;
};

export default function ForumPostSignature({ html }: ForumPostSignatureProps) {
  return (
    <aside className="mt-4 border-t border-aw-border/60 pt-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-aw-muted">
        Signatur
      </p>
      <RichTextContent
        content={html}
        className="text-sm leading-relaxed text-aw-muted"
      />
    </aside>
  );
}
