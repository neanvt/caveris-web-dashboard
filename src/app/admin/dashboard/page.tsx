import { AdminLayout } from "@/components/admin/layout-wrapper";
import { AdminDashboardContent } from "./dashboard-content";

export default async function AdminDashboard() {
  return (
    <AdminLayout>
      <AdminDashboardContent />
    </AdminLayout>
  );
}
