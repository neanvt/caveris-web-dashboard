import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { DashboardContent } from "./dashboard-content";

export default async function SuperAdminDashboard() {
  return (
    <SuperAdminLayout>
      <DashboardContent />
    </SuperAdminLayout>
  );
}
