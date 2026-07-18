import RichTextContent from "@/components/ui/RichTextContent";

type ForumPostSignatureProps = {
  html: string;
};

export default function ForumPostSignature({ html }: ForumPostSignatureProps) {
  return (
    <aside className="mt-3 border-t border-aw-border/50 pt-2">
      <RichTextContent
        content={html}
        className="text-xs leading-relaxed text-aw-muted"
      />
    </aside>
  );
}
