import WorkshopProductCard from "@/components/werkstatt/WorkshopProductCard";
import {
  getAffiliateDisclosureText,
  listProductRecommendationsForCourse,
  listProductRecommendationsForRecipe,
} from "@/lib/product-recommendations/product-recommendation-service";

type RecommendedProductsSectionProps = {
  courseId?: string;
  recipeId?: string;
  title?: string;
};

export default async function RecommendedProductsSection({
  courseId,
  recipeId,
  title = "Empfohlene Ausrüstung",
}: RecommendedProductsSectionProps) {
  const products = courseId
    ? await listProductRecommendationsForCourse(courseId)
    : recipeId
      ? await listProductRecommendationsForRecipe(recipeId)
      : [];

  if (products.length === 0) {
    return null;
  }

  const disclosure = await getAffiliateDisclosureText();

  return (
    <section className="mt-10 rounded-xl border border-aw-border bg-aw-surface p-6">
      <h2 className="font-display text-xl font-bold text-aw-cream">{title}</h2>
      <p className="mt-1 text-sm text-aw-muted">
        Passende Werkzeuge und Zutaten für dieses Rezept bzw. diesen Kurs.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <WorkshopProductCard key={product.id} product={product} disclosure={disclosure} />
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-aw-muted">{disclosure}</p>
    </section>
  );
}
