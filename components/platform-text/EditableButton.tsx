import PlatformText from "./PlatformText";

type EditableButtonProps = Omit<
  React.ComponentProps<typeof PlatformText>,
  "elementType" | "as"
>;

export default function EditableButton(props: EditableButtonProps) {
  return <PlatformText elementType="button" as="span" {...props} />;
}
