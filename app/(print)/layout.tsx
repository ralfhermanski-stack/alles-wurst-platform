/**
 * Minimales Layout für Druck-/Exportseiten ohne Marketing-Header und Footer.
 */
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
