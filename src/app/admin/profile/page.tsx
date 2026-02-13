import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ProfileContent } from "./profile-content";

export const dynamic = 'force-dynamic';

export default async function AdminProfile() {
  return (
    <AdminLayout>
      <ProfileContent />
    </AdminLayout>
  );
}
