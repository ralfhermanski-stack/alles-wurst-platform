import PageStructuredData from "@/components/seo/PageStructuredData";
import { getPageSeoByRouteKey } from "@/lib/page-seo/page-seo-service";

type PageSeoJsonLdProps = {
  routeKey: string;
};

export default async function PageSeoJsonLd({ routeKey }: PageSeoJsonLdProps) {
  const seo = await getPageSeoByRouteKey(routeKey);

  return <PageStructuredData seo={seo} />;
}
