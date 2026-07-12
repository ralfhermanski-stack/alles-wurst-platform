import PlatformText from "./PlatformText";

type EditableTextProps = Omit<
  React.ComponentProps<typeof PlatformText>,
  "elementType"
> & {
  elementType?: "text" | "heading" | "subheading" | "message";
};

export default function EditableText({
  elementType = "text",
  as = "p",
  ...props
}: EditableTextProps) {
  return <PlatformText elementType={elementType} as={as} {...props} />;
}
