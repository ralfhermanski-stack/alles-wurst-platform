import PlatformText from "./PlatformText";

type EditableRichTextProps = Omit<
  React.ComponentProps<typeof PlatformText>,
  "elementType" | "as"
>;

export default function EditableRichText(props: EditableRichTextProps) {
  return <PlatformText elementType="rich" as="div" {...props} />;
}
