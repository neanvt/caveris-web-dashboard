import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ProfileContent } from "./profile-content";

export default async function AdminProfile() {
  return (
    <AdminLayout>
      <ProfileContent />
    </AdminLayout>
  );
}
