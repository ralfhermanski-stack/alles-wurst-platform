import PlatformText from "./PlatformText";

type EditableLinkProps = Omit<
  React.ComponentProps<typeof PlatformText>,
  "elementType" | "as"
>;

export default function EditableLink(props: EditableLinkProps) {
  return <PlatformText elementType="link" as="span" {...props} />;
}
