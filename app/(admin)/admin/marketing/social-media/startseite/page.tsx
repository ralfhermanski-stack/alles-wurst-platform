import AdminSocialHomepageSelection from "@/components/admin/social-media/AdminSocialHomepageSelection";
import AdminSocialHomepagePreview from "@/components/admin/social-media/AdminSocialHomepagePreview";

export const metadata = {
  title: "Social Media Startseite",
};

export default function AdminSocialHomepagePage() {
  return (
    <div className="space-y-8">
      <AdminSocialHomepageSelection />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdminSocialHomepagePreview />
      </div>
    </div>
  );
}
