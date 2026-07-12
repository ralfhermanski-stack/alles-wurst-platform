import AdminSocialSetupWizard from "@/components/admin/social-media/AdminSocialSetupWizard";
import AdminSystemStatusCard from "@/components/admin/social-media/AdminSystemStatusCard";

export default function AdminSocialSetupPage() {
  return (
    <div className="space-y-8">
      <AdminSystemStatusCard />
      <AdminSocialSetupWizard />
    </div>
  );
}
