import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { AdminsContent } from "./admins-content";

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  return (
    <SuperAdminLayout>
      <AdminsContent />
    </SuperAdminLayout>
  );
}
