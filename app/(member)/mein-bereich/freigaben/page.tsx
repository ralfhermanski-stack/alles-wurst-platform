import MyPublicSharesPanel from "@/components/sharing/MyPublicSharesPanel";

export default function MySharesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-aw-cream">Meine Freigaben</h1>
      <p className="mt-2 text-sm text-aw-muted">
        Verwalte deine öffentlichen Zertifikate, Urkunden und Rezepte.
      </p>
      <div className="mt-8">
        <MyPublicSharesPanel />
      </div>
    </div>
  );
}
