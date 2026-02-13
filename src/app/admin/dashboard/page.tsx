import { AdminLayout } from "@/components/admin/layout-wrapper";
import { AdminDashboardContent } from "./dashboard-content";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  return (
    <AdminLayout>
      <AdminDashboardContent />
    </AdminLayout>
  );
}
