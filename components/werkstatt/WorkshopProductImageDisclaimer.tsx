export const WORKSHOP_PRODUCT_IMAGE_DISCLAIMER =
  "Bild zur Illustration (Platzhalter). Das verlinkte Produkt kann abweichen.";

type WorkshopProductImageDisclaimerProps = {
  className?: string;
  as?: "p" | "figcaption";
};

export default function WorkshopProductImageDisclaimer({
  className = "",
  as: Tag = "p",
}: WorkshopProductImageDisclaimerProps) {
  return (
    <Tag className={`text-xs leading-5 text-aw-muted ${className}`.trim()}>
      {WORKSHOP_PRODUCT_IMAGE_DISCLAIMER}
    </Tag>
  );
}
