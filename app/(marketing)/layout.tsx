import Header from "@/components/marketing/Header";
import Footer from "@/components/marketing/Footer";
import PageEditorPreviewBeacon from "@/components/page-editor/PageEditorPreviewBeacon";

/**
 * Öffentliches Marketing-Layout.
 * Umschließt Startseite und alle öffentlichen Seiten mit Header + Footer.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageEditorPreviewBeacon />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
